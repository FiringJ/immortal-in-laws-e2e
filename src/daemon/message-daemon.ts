require('../../setup-env.js');

import express from 'express';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';
import {
  AgentExecutor,
  getDefaultAgent,
  normalizeAgent,
  parseAgentDirective,
  type TaskRecord,
  type TaskRequest,
} from './agent-executor';
import { notifyTaskResult } from './feishu-notifier';

type TaskListQuery = {
  status?: string;
  limit?: string;
};

const PLAN_ONLY_RETRY_MAX = Math.max(0, parseInt(process.env.DAEMON_PLAN_ONLY_RETRY_MAX || '0', 10) || 0);
const FEISHU_EVENT_DEDUP_WINDOW_MS = Math.max(
  30_000,
  parseInt(process.env.DAEMON_FEISHU_EVENT_DEDUP_WINDOW_MS || '600000', 10) || 600_000,
);

function generateTaskId(): string {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveTaskCwd(input: Partial<TaskRequest>, parsedTask: string): string {
  if (input.cwd) {
    return path.resolve(input.cwd);
  }

  const trackerRoot = path.resolve(process.env.DAEMON_WORKSPACE_ROOT || process.cwd());
  const appRootRaw = process.env.APP_REPO_PATH;
  const appRoot = appRootRaw ? path.resolve(appRootRaw) : undefined;
  const hasAppRoot = Boolean(appRoot && fs.existsSync(appRoot));

  if (input.source === 'feishu') {
    const mode = (process.env.DAEMON_FEISHU_DEFAULT_CWD || 'app').trim().toLowerCase();

    if (mode === 'tracker' || mode === 'e2e') {
      return trackerRoot;
    }

    if (mode === 'auto') {
      const lower = parsedTask.toLowerCase();
      const trackerHints = ['daemon', 'e2e', 'webhook', 'launchctl', 'ngrok', 'notifier', 'message-daemon'];
      const shouldUseTracker = trackerHints.some((token) => lower.includes(token));
      if (shouldUseTracker || !hasAppRoot) {
        return trackerRoot;
      }
      return appRoot as string;
    }

    if (hasAppRoot) {
      return appRoot as string;
    }
    return trackerRoot;
  }

  return trackerRoot;
}

function normalizeTaskRequest(input: Partial<TaskRequest>): TaskRequest {
  const parsed = parseAgentDirective(String(input.task || ''));
  const agent = normalizeAgent(input.agent) || parsed.agent || getDefaultAgent();
  const cwd = resolveTaskCwd(input, parsed.task);

  return {
    task: parsed.task,
    source: input.source || 'http',
    userId: input.userId,
    metadata: input.metadata,
    agent,
    cwd,
    addDirs: input.addDirs,
    timeoutMs: input.timeoutMs,
    model: input.model,
  };
}

function toTaskSummary(task: TaskRecord): Record<string, unknown> {
  return {
    id: task.id,
    task: task.task,
    source: task.source,
    userId: task.userId,
    agent: task.agent,
    cwd: task.cwd,
    status: task.status,
    createdAt: task.createdAt,
    startedAt: task.startedAt,
    completedAt: task.completedAt,
    durationMs: task.durationMs,
    exitCode: task.exitCode,
    signal: task.signal,
    error: task.error,
    stdoutPath: task.stdoutPath,
    stderrPath: task.stderrPath,
    summaryPath: task.summaryPath,
    summary: task.summary,
  };
}

function isPlanOnlySummary(summary: string): boolean {
  const text = summary.trim();
  if (!text) {
    return true;
  }

  const strongPlanPrefixes = [
    /^我接下来会/,
    /^接下来会/,
    /^下一步会/,
    /^我会先/,
    /^先从/,
  ];
  if (strongPlanPrefixes.some((pattern) => pattern.test(text))) {
    return true;
  }

  const planPatterns = [
    '接下来会',
    '下一步会',
    '我会先',
    '先从',
    '然后会',
    '下一步',
    '计划',
    '后续',
    'I will',
    'next I will',
    'next step',
  ];
  const donePatterns = [
    '已完成',
    '已修复',
    '已验证',
    '验证通过',
    '结论：',
    '结论是',
    '根因：',
    '根因是',
    '确认存在',
    '确认不存在',
    '问题存在',
    '问题不存在',
    '最终结论',
    'final conclusion',
    'root cause:',
    'verified',
    'resolved',
  ];
  const blockerPatterns = [
    '阻塞',
    '无法继续',
    '缺少权限',
    '缺少数据',
    'hard blocker',
    'blocked by',
  ];

  const hasPlanSignal = planPatterns.some((token) => text.includes(token));
  const hasDoneSignal = donePatterns.some((token) => text.includes(token));
  const hasBlockerSignal = blockerPatterns.some((token) => text.includes(token));

  if (hasPlanSignal && hasBlockerSignal && !hasDoneSignal) {
    return false;
  }

  return hasPlanSignal && !hasDoneSignal;
}

function buildForceFinalAnswerTask(taskText: string): string {
  return `${taskText}

【强制收敛要求】
你上一次输出只有计划/下一步，没有最终结论。
本次必须直接给出：
1) 是否存在该问题（明确结论）；
2) 根因定位（文件/接口/条件分支）；
3) 可执行修复方案（必要时给代码修改点）；
4) 验证步骤与预期结果。
禁止只写“接下来会/下一步会/我会先…”这类计划语句后结束。`;
}

/**
 * Daemon：消息接收 + 执行器
 *
 * 职责：
 * 1. 接收 HTTP / 飞书任务
 * 2. 入队并自动串行执行
 * 3. 通过 codex / claude / cursor-agent CLI 驱动本地 agent
 * 4. 暴露任务状态与日志查询接口
 */
export class Daemon {
  private readonly app: express.Application;
  private readonly port: number;
  private readonly executor: AgentExecutor;
  private readonly tasks: TaskRecord[];
  private readonly seenFeishuEventKeys: Map<string, number>;
  private server?: Server;
  private isProcessing: boolean;
  private stopping: boolean;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.executor = new AgentExecutor();
    this.tasks = [];
    this.seenFeishuEventKeys = new Map();
    this.isProcessing = false;
    this.stopping = false;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private isDuplicateFeishuEvent(eventKey: string): boolean {
    const now = Date.now();
    for (const [key, ts] of this.seenFeishuEventKeys.entries()) {
      if (now - ts > FEISHU_EVENT_DEDUP_WINDOW_MS) {
        this.seenFeishuEventKeys.delete(key);
      }
    }

    if (this.seenFeishuEventKeys.has(eventKey)) {
      return true;
    }

    this.seenFeishuEventKeys.set(eventKey, now);
    return false;
  }

  private get queuedTasks(): TaskRecord[] {
    return this.tasks.filter((task) => task.status === 'queued');
  }

  private get runningTask(): TaskRecord | undefined {
    return this.tasks.find((task) => task.status === 'running');
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: this.stopping ? 'stopping' : 'ok',
        uptime: process.uptime(),
        queueSize: this.queuedTasks.length,
        totalTasks: this.tasks.length,
        runningTaskId: this.runningTask?.id || null,
        defaultAgent: getDefaultAgent(),
        installedAgents: this.executor.getInstalledAgents(),
        timestamp: new Date().toISOString(),
      });
    });

    this.app.post('/task', async (req, res) => {
      try {
        const request = normalizeTaskRequest(req.body || {});

        if (!request.task) {
          return res.status(400).json({
            success: false,
            error: '缺少 task 字段',
          });
        }

        const record: TaskRecord = {
          ...request,
          id: generateTaskId(),
          status: 'queued',
          createdAt: new Date().toISOString(),
        };

        console.log('\n========================================');
        console.log('📨 收到新任务');
        console.log('========================================');
        console.log(`任务 ID: ${record.id}`);
        console.log(`任务: ${record.task}`);
        console.log(`来源: ${record.source || 'unknown'}`);
        console.log(`Agent: ${record.agent}`);
        console.log(`目录: ${record.cwd}`);
        console.log('');

        this.tasks.push(record);
        void this.processQueue();

        return res.status(202).json({
          success: true,
          message: '任务已加入队列并等待执行',
          queueSize: this.queuedTasks.length,
          task: toTaskSummary(record),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('接收任务失败:', error);
        return res.status(500).json({
          success: false,
          error: message,
        });
      }
    });

    // 兼容旧消费者：仅预览下一个任务，不再 claim/shift。
    this.app.get('/task/next', (req, res) => {
      const task = this.queuedTasks[0] || this.runningTask;

      if (!task) {
        return res.json({
          success: false,
          message: '队列为空',
        });
      }

      return res.json({
        success: true,
        deprecated: true,
        message: 'Daemon 已切换为自动执行模式，此接口只返回预览。',
        task: toTaskSummary(task),
      });
    });

    this.app.get('/queue', (req, res) => {
      const queued = this.queuedTasks;
      res.json({
        success: true,
        queueSize: queued.length,
        runningTask: this.runningTask ? toTaskSummary(this.runningTask) : null,
        tasks: queued.map((task, index) => ({
          index,
          ...toTaskSummary(task),
        })),
      });
    });

    this.app.get('/tasks', (req, res) => {
      const query = req.query as TaskListQuery;
      const status = query.status;
      const limit = Math.max(1, Math.min(100, parseInt(query.limit || '20', 10) || 20));
      const filtered = status
        ? this.tasks.filter((task) => task.status === status)
        : this.tasks;

      res.json({
        success: true,
        total: filtered.length,
        tasks: filtered
          .slice()
          .reverse()
          .slice(0, limit)
          .map((task) => toTaskSummary(task)),
      });
    });

    this.app.get('/tasks/:id', (req, res) => {
      const task = this.tasks.find((item) => item.id === req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          error: '任务不存在',
        });
      }

      return res.json({
        success: true,
        task: toTaskSummary(task),
      });
    });

    this.app.post('/feishu/webhook', async (req, res) => {
      try {
        const event = req.body;

        if (event.type === 'url_verification') {
          return res.json({ challenge: event.challenge });
        }

        if (event.header?.event_type === 'im.message.receive_v1') {
          const message = event.event?.message;
          const content = JSON.parse(message?.content || '{}');
          const text = String(content.text || '').trim();
          const eventId = String(event.header?.event_id || event.event_id || '');
          const appId = String(event.header?.app_id || event.app_id || '');
          const messageId = String(message?.message_id || '');
          const chatId = String(message?.chat_id || '');
          const dedupKey = eventId || messageId;

          if (dedupKey && this.isDuplicateFeishuEvent(dedupKey)) {
            console.log(`[Daemon] 忽略重复飞书事件: ${dedupKey}`);
            return res.json({ success: true, duplicate: true });
          }

          if (!text) {
            return res.json({ success: true });
          }

          console.log('\n========================================');
          console.log('📨 收到飞书消息');
          console.log('========================================');
          console.log(`原始内容: ${text}`);
          if (appId) {
            console.log(`App ID: ${appId}`);
          }
          if (eventId) {
            console.log(`event_id: ${eventId}`);
          }
          if (messageId) {
            console.log(`message_id: ${messageId}`);
          }
          if (chatId) {
            console.log(`chat_id: ${chatId}`);
          }
          console.log('');

          const request = normalizeTaskRequest({
            task: text,
            source: 'feishu',
            userId: event.event?.sender?.sender_id?.user_id,
            metadata: event,
          });

          const record: TaskRecord = {
            ...request,
            id: generateTaskId(),
            status: 'queued',
            createdAt: new Date().toISOString(),
          };

          this.tasks.push(record);
          void this.processQueue();

          return res.json({
            success: true,
            taskId: record.id,
            agent: record.agent,
          });
        }

        return res.json({ success: true });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('处理飞书事件失败:', error);
        return res.status(500).json({
          success: false,
          error: message,
        });
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.stopping) {
      return;
    }

    this.isProcessing = true;

    try {
      while (!this.stopping) {
        const task = this.queuedTasks[0];
        if (!task) {
          return;
        }

        await this.runTask(task);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runTask(task: TaskRecord): Promise<void> {
    task.status = 'running';
    task.startedAt = new Date().toISOString();

    console.log('\n========================================');
    console.log('🤖 开始执行任务');
    console.log('========================================');
    console.log(`任务 ID: ${task.id}`);
    console.log(`Agent: ${task.agent}`);
    console.log(`目录: ${task.cwd}`);
    console.log(`任务: ${task.task}`);
    console.log('');

    try {
      let effectiveTask: TaskRecord = { ...task };
      let result = await this.executor.execute(effectiveTask);
      let totalDurationMs = result.durationMs;
      let attempt = 0;

      while (
        attempt < PLAN_ONLY_RETRY_MAX &&
        result.exitCode === 0 &&
        !result.error &&
        isPlanOnlySummary(result.summary || '')
      ) {
        attempt += 1;
        console.warn(`[Daemon] 检测到计划态摘要，触发自动重试 (${attempt}/${PLAN_ONLY_RETRY_MAX})，任务: ${task.id}`);
        effectiveTask = {
          ...task,
          id: `${task.id}-retry-${attempt}`,
          task: buildForceFinalAnswerTask(task.task),
        };
        result = await this.executor.execute(effectiveTask);
        totalDurationMs += result.durationMs;
      }

      task.completedAt = new Date().toISOString();
      task.durationMs = totalDurationMs;
      task.exitCode = result.exitCode;
      task.signal = result.signal;
      task.stdoutPath = result.stdoutPath;
      task.stderrPath = result.stderrPath;
      task.summaryPath = result.summaryPath;
      task.summary = result.summary;
      task.error = result.error;
      task.status = result.exitCode === 0 && !result.error ? 'completed' : 'failed';

      console.log(`[Daemon] 任务 ${task.id} ${task.status === 'completed' ? '完成' : '失败'} (${result.durationMs}ms)`);
      console.log(`[Daemon] 摘要: ${result.summary.split('\n')[0] || '无摘要'}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date().toISOString();
      task.durationMs = task.startedAt
        ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
        : undefined;
      task.status = 'failed';
      task.error = message;
      task.summary = message;
      console.error(`[Daemon] 任务 ${task.id} 执行失败:`, error);
    }

    await this.notifyTaskResult(task);
  }

  private async notifyTaskResult(task: TaskRecord): Promise<void> {
    try {
      await notifyTaskResult(task);
      const hasFeishuChannel = Boolean(
        process.env.FEISHU_WEBHOOK_URL || (process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET),
      );
      if (hasFeishuChannel && (task.source === 'feishu' || process.env.DAEMON_NOTIFY_ALL === 'true')) {
        console.log(`[Daemon] 已回传飞书通知: ${task.id}`);
      }
    } catch (error: unknown) {
      console.error(`[Daemon] 飞书回传失败 (${task.id}):`, error);
    }
  }

  start(): void {
    this.server = this.app.listen(this.port, () => {
      console.log('\n========================================');
      console.log('🚀 Daemon 已启动');
      console.log('========================================');
      console.log(`监听端口: ${this.port}`);
      console.log(`默认 Agent: ${getDefaultAgent()}`);
      console.log(`支持 Agent: ${this.executor.getSupportedAgents().join(', ')}`);
      console.log('');
      console.log('API 端点:');
      console.log(`  健康检查: GET  http://localhost:${this.port}/health`);
      console.log(`  提交任务: POST http://localhost:${this.port}/task`);
      console.log(`  任务队列: GET  http://localhost:${this.port}/queue`);
      console.log(`  最近任务: GET  http://localhost:${this.port}/tasks`);
      console.log(`  任务详情: GET  http://localhost:${this.port}/tasks/:id`);
      console.log(`  飞书回调: POST http://localhost:${this.port}/feishu/webhook`);
      console.log('');
      console.log('使用方式:');
      console.log('  1. 提交任务到 /task 或 /feishu/webhook');
      console.log('  2. Daemon 自动拉起 codex / claude / cursor-agent CLI');
      console.log('  3. 通过 /tasks 查看执行结果和日志路径');
      console.log('');
      console.log('示例:');
      console.log(`  curl -X POST http://localhost:${this.port}/task \\`);
      console.log('    -H "Content-Type: application/json" \\');
      console.log('    -d \'{"task":"修复 settings 页面","agent":"codex"}\'');
      console.log('');
      console.log('  # 飞书消息也支持前缀选 agent：');
      console.log('  /claude 分析 pages/settings/index 页面为什么布局错位');
      console.log('========================================\n');
    });
  }

  stop(): void {
    console.log('\n[Daemon] 正在停止...');
    this.stopping = true;
    this.executor.stopActiveProcess();

    if (!this.server) {
      process.exit(0);
      return;
    }

    this.server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(0);
    }, 5_000).unref();
  }
}

if (require.main === module) {
  const port = parseInt(process.env.DAEMON_PORT || '3000', 10);
  const daemon = new Daemon(port);

  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号');
    daemon.stop();
  });

  process.on('SIGTERM', () => {
    console.log('\n收到 SIGTERM 信号');
    daemon.stop();
  });

  daemon.start();
}

export default Daemon;
