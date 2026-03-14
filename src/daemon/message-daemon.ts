require('../../setup-env.js');

import express from 'express';
import type { Server } from 'http';
import path from 'path';
import { AgentExecutor, getDefaultAgent, type TaskRecord, type TaskRequest } from './agent-executor';
import {
  buildForceFinalAnswerTask,
  generateTaskId,
  isPlanOnlySummary,
  normalizeTaskRequest,
  toTaskSummary,
  type TaskListQuery,
} from './task-utils';
import { notifyTaskResult, sendFeishuText } from './feishu-notifier';
import { WorkflowService } from '../workflow/service';
import { syncFeishuDefectSource } from '../tools/feishu/feishu-defect-source';

const PLAN_ONLY_RETRY_MAX = Math.max(0, parseInt(process.env.DAEMON_PLAN_ONLY_RETRY_MAX || '0', 10) || 0);
const FEISHU_EVENT_DEDUP_WINDOW_MS = Math.max(
  30_000,
  parseInt(process.env.DAEMON_FEISHU_EVENT_DEDUP_WINDOW_MS || '600000', 10) || 600_000,
);

type WorkflowListQuery = {
  kind?: string;
  source?: string;
  stage?: string;
  status?: string;
  limit?: string;
};

export class Daemon {
  private readonly app: express.Application;
  private readonly port: number;
  private readonly executor: AgentExecutor;
  private readonly tasks: TaskRecord[];
  private readonly workflowService: WorkflowService;
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
    this.workflowService = new WorkflowService({
      trackerRoot: path.resolve(process.env.DAEMON_WORKSPACE_ROOT || process.cwd()),
      scheduleTask: (request) => this.enqueueTask(request),
      log: (message) => console.log(message),
    });

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
        workflowItems: this.workflowService.listItems({ limit: '500' }).length,
        activeTriageBatchId: this.workflowService.listTriageBatches(1).activeBatchId || null,
        activePlanBatchId: this.workflowService.listPlanBatches(1).activeBatchId || null,
        timestamp: new Date().toISOString(),
      });
    });

    this.app.post('/task', async (req, res) => {
      try {
        const record = this.enqueueTask(req.body || {});
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

    this.app.get('/workbench', (req, res) => {
      res.type('html').send(this.workflowService.renderWorkbench());
    });

    this.app.post('/workflow/items', (req, res) => {
      try {
        const item = this.workflowService.createItem({
          ...req.body,
          source: 'manual',
        });
        return res.status(201).json({
          success: true,
          item,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/board', (req, res) => {
      return res.json({
        success: true,
        ...this.workflowService.getBoard(req.query as WorkflowListQuery),
      });
    });

    this.app.get('/workflow/items', (req, res) => {
      const query = req.query as WorkflowListQuery;
      const items = this.workflowService.listItems(query);
      return res.json({
        success: true,
        total: items.length,
        items,
      });
    });

    this.app.get('/workflow/items/:id', (req, res) => {
      try {
        return res.json({
          success: true,
          ...this.workflowService.getItemDetail(req.params.id),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(404).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/items/:id/source-attachments/:index', (req, res) => {
      try {
        const attachmentIndex = Math.max(0, parseInt(req.params.index, 10) || 0);
        const filePath = this.workflowService.getSourceAttachmentPath(req.params.id, attachmentIndex);
        if (!filePath) {
          return res.status(404).json({
            success: false,
            error: '附件不存在',
          });
        }
        return res.sendFile(filePath);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(404).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.post('/workflow/items/:id/actions', (req, res) => {
      try {
        const item = this.workflowService.handleAction(req.params.id, req.body || {});
        return res.json({
          success: true,
          item,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.post('/workflow/triage-batches', (req, res) => {
      try {
        const batch = this.workflowService.createDefaultBugTriageBatch();
        return res.status(201).json({
          success: true,
          batch,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/triage-batches', (req, res) => {
      try {
        const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;
        return res.json({
          success: true,
          ...this.workflowService.listTriageBatches(limit),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/triage-batches/:id', (req, res) => {
      try {
        return res.json({
          success: true,
          batch: this.workflowService.getTriageBatch(req.params.id),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(404).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.post('/workflow/plan-batches', (req, res) => {
      try {
        const batch = this.workflowService.createDefaultBugPlanBatch();
        return res.status(201).json({
          success: true,
          batch,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/plan-batches', (req, res) => {
      try {
        const limit = typeof req.query.limit === 'string' ? req.query.limit : undefined;
        return res.json({
          success: true,
          ...this.workflowService.listPlanBatches(limit),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(400).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.get('/workflow/plan-batches/:id', (req, res) => {
      try {
        return res.json({
          success: true,
          batch: this.workflowService.getPlanBatch(req.params.id),
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return res.status(404).json({
          success: false,
          error: message,
        });
      }
    });

    this.app.post('/workflow/sources/feishu-defects/sync', async (req, res) => {
      try {
        const syncResult = await syncFeishuDefectSource({
          sourceUrl: req.body?.sourceUrl,
          targetSection: req.body?.section,
          trackerRoot: path.resolve(process.env.DAEMON_WORKSPACE_ROOT || process.cwd()),
        });
        const importResult = this.workflowService.syncFeishuDefectItems(syncResult.defects);
        return res.json({
          success: true,
          sync: syncResult,
          import: importResult,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[Daemon] 同步飞书缺陷失败:', error);
        return res.status(500).json({
          success: false,
          error: message,
        });
      }
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
          const userId = event.event?.sender?.sender_id?.user_id;
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

          const parsed = this.workflowService.parseFeishuCommand(text);
          if (!parsed.matched) {
            await this.replyFeishuMessage({ messageId, chatId }, parsed.usage, 'workflow-usage');
            return res.json({
              success: true,
              ignored: true,
              reason: 'missing workflow prefix',
            });
          }

          const item = this.workflowService.createItem({
            kind: parsed.kind,
            title: parsed.rawInput.split('\n')[0] || parsed.rawInput,
            rawInput: parsed.rawInput,
            preferredAgent: parsed.preferredAgent,
            source: 'feishu',
            sourceContext: {
              userId,
              messageId,
              chatId,
            },
          });

          await this.replyFeishuMessage(
            { messageId, chatId },
            [
              `已创建${parsed.kind === 'bug' ? ' Bug ' : '需求 '}工作项`,
              `标题: ${item.title}`,
              `ID: ${item.id}`,
              `当前阶段: ${item.stage}`,
              `工作台: http://localhost:${this.port}/workbench`,
            ].join('\n'),
            `workflow-item-${item.id}`,
          );

          return res.json({
            success: true,
            workflowItemId: item.id,
            stage: item.stage,
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

  private enqueueTask(input: Partial<TaskRequest>): TaskRecord {
    const request = normalizeTaskRequest(input);

    if (!request.task) {
      throw new Error('缺少 task 字段');
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
    console.log(`任务: ${record.task.split('\n')[0]}`);
    console.log(`来源: ${record.source || 'unknown'}`);
    console.log(`Agent: ${record.agent}`);
    console.log(`目录: ${record.cwd}`);
    if (record.workflowItemId) {
      console.log(`Workflow Item: ${record.workflowItemId} / ${record.workflowPhase}`);
    }
    console.log('');

    this.tasks.push(record);
    void this.processQueue();
    return record;
  }

  private async replyFeishuMessage(
    context: {
      messageId?: string;
      chatId?: string;
    },
    text: string,
    uuidPrefix: string,
  ): Promise<void> {
    try {
      await sendFeishuText(context, text, uuidPrefix);
    } catch (error) {
      console.error('[Daemon] 飞书即时回复失败:', error);
    }
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
    this.workflowService.handleTaskUpdate(task);

    console.log('\n========================================');
    console.log('🤖 开始执行任务');
    console.log('========================================');
    console.log(`任务 ID: ${task.id}`);
    console.log(`Agent: ${task.agent}`);
    console.log(`目录: ${task.cwd}`);
    console.log(`任务: ${task.task.split('\n')[0]}`);
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

    this.workflowService.handleTaskUpdate(task);
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
      console.log(`  工作台:   GET  http://localhost:${this.port}/workbench`);
      console.log(`  提交任务: POST http://localhost:${this.port}/task`);
      console.log(`  工作流:   POST http://localhost:${this.port}/workflow/items`);
      console.log(`  批量Triage: POST http://localhost:${this.port}/workflow/triage-batches`);
      console.log(`  批量计划: POST http://localhost:${this.port}/workflow/plan-batches`);
      console.log(`  缺陷同步: POST http://localhost:${this.port}/workflow/sources/feishu-defects/sync`);
      console.log(`  队列预览: GET  http://localhost:${this.port}/queue`);
      console.log(`  最近任务: GET  http://localhost:${this.port}/tasks`);
      console.log(`  飞书回调: POST http://localhost:${this.port}/feishu/webhook`);
      console.log('');
      console.log('使用方式:');
      console.log('  1. 调试任务继续走 /task');
      console.log('  2. 正式需求与 bug 流程走 /workbench 或飞书 /req /bug');
      console.log('  3. workflow phase 仍复用现有 daemon 串行执行器');
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
