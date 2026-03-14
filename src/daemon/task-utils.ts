import fs from 'fs';
import path from 'path';
import {
  getDefaultAgent,
  normalizeAgent,
  parseAgentDirective,
  type TaskRecord,
  type TaskRequest,
} from './agent-executor';

export type TaskListQuery = {
  status?: string;
  limit?: string;
};

export function generateTaskId(prefix?: string): string {
  const core = `${new Date().toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`;
  return prefix ? `${prefix}-${core}` : core;
}

export function resolveTaskCwd(input: Partial<TaskRequest>, parsedTask: string): string {
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

export function normalizeTaskRequest(input: Partial<TaskRequest>): TaskRequest {
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
    workflowItemId: input.workflowItemId,
    workflowPhase: input.workflowPhase,
  };
}

export function toTaskSummary(task: TaskRecord): Record<string, unknown> {
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
    workflowItemId: task.workflowItemId,
    workflowPhase: task.workflowPhase,
  };
}

export function isPlanOnlySummary(summary: string): boolean {
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

export function buildForceFinalAnswerTask(taskText: string): string {
  return `${taskText}

【强制收敛要求】
你上一次输出只有计划/下一步，没有最终结论。
本次必须直接给出：
1) 是否存在该问题（明确结论）；
2) 根因定位（文件/接口/条件分支）；
3) 可执行修复方案（必要时给代码修改点）；
4) 验证步骤与预期结果。
禁止只写“接下来会/下一步会/我会先...”这类计划语句后结束。`;
}
