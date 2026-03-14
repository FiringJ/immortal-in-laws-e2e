import { ChildProcess, spawn, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export type AgentKind = 'codex' | 'claude' | 'cursor-agent';
export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed';

export type TaskRequest = {
  task: string;
  source?: string;
  userId?: string;
  metadata?: unknown;
  agent?: AgentKind;
  cwd?: string;
  addDirs?: string[];
  timeoutMs?: number;
  model?: string;
  workflowItemId?: string;
  workflowPhase?: string;
};

export type TaskRecord = TaskRequest & {
  id: string;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  error?: string;
  stdoutPath?: string;
  stderrPath?: string;
  summaryPath?: string;
  summary?: string;
};

export type ExecutionResult = {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  durationMs: number;
  stdoutPath: string;
  stderrPath: string;
  summaryPath?: string;
  summary: string;
  error?: string;
};

type AgentDefinition = {
  name: AgentKind;
  envVar: string;
  defaultBinary: string;
  buildArgs: (input: {
    task: TaskRecord;
    prompt: string;
    summaryPath: string;
  }) => string[];
};

const DEFAULT_TIMEOUT_MS = parseInt(
  process.env.DAEMON_TASK_TIMEOUT_MS || '',
  10,
) || 45 * 60 * 1000;

const OUTPUT_TAIL_LIMIT = 12_000;

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

function trimTail(current: string, chunk: string): string {
  const merged = current + chunk;
  if (merged.length <= OUTPUT_TAIL_LIMIT) {
    return merged;
  }
  return merged.slice(merged.length - OUTPUT_TAIL_LIMIT);
}

function splitCsv(value?: string): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAdditionalDirs(task: TaskRecord): string[] {
  const fromTask = task.addDirs || [];
  const fromEnv = splitCsv(process.env.DAEMON_ADD_DIRS);
  const appRepo = process.env.APP_REPO_PATH ? [process.env.APP_REPO_PATH] : [];
  const merged = [...fromTask, ...fromEnv, ...appRepo]
    .map((dir) => path.resolve(dir))
    .filter((dir) => fs.existsSync(dir));

  return Array.from(new Set(merged)).filter((dir) => dir !== task.cwd);
}

function buildAutomationPrompt(task: TaskRecord): string {
  const extraDirs = getAdditionalDirs(task);
  const extraDirText = extraDirs.length > 0
    ? extraDirs.join(', ')
    : 'none';

  const sections = [
    'You are running inside a non-interactive automation daemon.',
    `Task ID: ${task.id}`,
    `Source: ${task.source || 'unknown'}`,
    `Requested agent: ${task.agent || getDefaultAgent()}`,
    `Working directory: ${task.cwd}`,
    `Additional accessible directories: ${extraDirText}`,
    'Execute the task directly in the workspace when appropriate.',
    'Do not stop after giving only a plan or next-step statement.',
    'Before finishing, provide concrete findings and actionable fixes (or clearly state hard blockers with evidence).',
    'Before finishing, summarize the outcome, changed files, commands run, and verification status.',
    `User task:\n${task.task}`,
  ];

  if (task.userId) {
    sections.splice(2, 0, `User ID: ${task.userId}`);
  }

  if (task.workflowItemId) {
    sections.splice(3, 0, `Workflow item ID: ${task.workflowItemId}`);
  }

  if (task.workflowPhase) {
    sections.splice(4, 0, `Workflow phase: ${task.workflowPhase}`);
  }

  return sections.join('\n\n');
}

function getExtraArgs(agent: AgentKind): string[] {
  switch (agent) {
    case 'codex':
      return splitCsv(process.env.DAEMON_CODEX_EXTRA_ARGS);
    case 'claude':
      return splitCsv(process.env.DAEMON_CLAUDE_EXTRA_ARGS);
    case 'cursor-agent':
      return splitCsv(process.env.DAEMON_CURSOR_EXTRA_ARGS);
    default:
      return [];
  }
}

function readSummary(summaryPath: string, stdoutTail: string, stderrTail: string): string {
  if (fs.existsSync(summaryPath)) {
    const content = normalizeWhitespace(fs.readFileSync(summaryPath, 'utf8'));
    if (content) {
      return content;
    }
  }

  const combined = normalizeWhitespace([stdoutTail, stderrTail].filter(Boolean).join('\n'));
  if (!combined) {
    return 'Agent finished without producing any output.';
  }

  return combined
    .split('\n')
    .slice(-20)
    .join('\n');
}

function buildCodexArgs(input: {
  task: TaskRecord;
  prompt: string;
  summaryPath: string;
}): string[] {
  const args = [
    'exec',
    '--color',
    'never',
    '--cd',
    input.task.cwd || process.cwd(),
    '--skip-git-repo-check',
    '--output-last-message',
    input.summaryPath,
  ];

  for (const dir of getAdditionalDirs(input.task)) {
    args.push('--add-dir', dir);
  }

  if (input.task.model) {
    args.push('--model', input.task.model);
  }

  args.push(
    process.env.DAEMON_CODEX_APPROVAL_MODE === 'full-auto'
      ? '--full-auto'
      : '--dangerously-bypass-approvals-and-sandbox',
  );

  args.push(...getExtraArgs('codex'));
  args.push(input.prompt);
  return args;
}

function buildClaudeArgs(input: {
  task: TaskRecord;
  prompt: string;
  summaryPath: string;
}): string[] {
  const args = [
    '-p',
    '--output-format',
    'text',
    '--permission-mode',
    process.env.DAEMON_CLAUDE_PERMISSION_MODE || 'bypassPermissions',
  ];

  for (const dir of getAdditionalDirs(input.task)) {
    args.push('--add-dir', dir);
  }

  if (input.task.model) {
    args.push('--model', input.task.model);
  }

  args.push(...getExtraArgs('claude'));
  args.push(input.prompt);
  return args;
}

function buildCursorArgs(input: {
  task: TaskRecord;
  prompt: string;
  summaryPath: string;
}): string[] {
  const args = [
    '-p',
    '--output-format',
    'text',
  ];

  if (process.env.DAEMON_CURSOR_FORCE !== 'false') {
    args.push('--force');
  }

  if (input.task.model) {
    args.push('--model', input.task.model);
  }

  args.push(...getExtraArgs('cursor-agent'));
  args.push(input.prompt);
  return args;
}

const AGENTS: Record<AgentKind, AgentDefinition> = {
  codex: {
    name: 'codex',
    envVar: 'CODEX_BIN',
    defaultBinary: 'codex',
    buildArgs: buildCodexArgs,
  },
  claude: {
    name: 'claude',
    envVar: 'CLAUDE_BIN',
    defaultBinary: 'claude',
    buildArgs: buildClaudeArgs,
  },
  'cursor-agent': {
    name: 'cursor-agent',
    envVar: 'CURSOR_AGENT_BIN',
    defaultBinary: 'cursor-agent',
    buildArgs: buildCursorArgs,
  },
};

export function getDefaultAgent(): AgentKind {
  return normalizeAgent(process.env.DAEMON_DEFAULT_AGENT) || 'codex';
}

export function normalizeAgent(value?: string | null): AgentKind | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === 'codex') {
    return 'codex';
  }
  if (normalized === 'claude') {
    return 'claude';
  }
  if (normalized === 'cursor' || normalized === 'cursor-agent' || normalized === 'cursor_agent') {
    return 'cursor-agent';
  }

  return undefined;
}

export function parseAgentDirective(task: string): {
  agent?: AgentKind;
  task: string;
} {
  const trimmed = task.trim();
  const match = trimmed.match(/^(?:\/)?(codex|claude|cursor(?:-agent)?)\s*[:：-]?\s*(.*)$/i);

  if (!match) {
    return { task: trimmed };
  }

  const agent = normalizeAgent(match[1]);
  const nextTask = match[2]?.trim() || trimmed;
  return {
    agent,
    task: nextTask,
  };
}

export class AgentExecutor {
  private readonly logRoot: string;
  private activeChild?: ChildProcess;

  constructor(logRoot: string = path.resolve(process.cwd(), 'logs/daemon-runs')) {
    this.logRoot = logRoot;
    fs.mkdirSync(this.logRoot, { recursive: true });
  }

  getSupportedAgents(): AgentKind[] {
    return Object.keys(AGENTS) as AgentKind[];
  }

  getInstalledAgents(): Record<AgentKind, boolean> {
    return this.getSupportedAgents().reduce<Record<AgentKind, boolean>>((result, agent) => {
      result[agent] = this.isInstalled(agent);
      return result;
    }, {
      codex: false,
      claude: false,
      'cursor-agent': false,
    });
  }

  isInstalled(agent: AgentKind): boolean {
    const definition = AGENTS[agent];
    const binary = process.env[definition.envVar] || definition.defaultBinary;

    if (binary.includes(path.sep)) {
      return fs.existsSync(binary);
    }

    const outcome = spawnSync('which', [binary], { stdio: 'ignore' });
    return outcome.status === 0;
  }

  stopActiveProcess(): void {
    if (!this.activeChild || this.activeChild.killed) {
      return;
    }

    this.activeChild.kill('SIGTERM');
    setTimeout(() => {
      if (this.activeChild && !this.activeChild.killed) {
        this.activeChild.kill('SIGKILL');
      }
    }, 10_000).unref();
  }

  async execute(task: TaskRecord): Promise<ExecutionResult> {
    const agent = normalizeAgent(task.agent) || getDefaultAgent();
    const definition = AGENTS[agent];
    const binary = process.env[definition.envVar] || definition.defaultBinary;
    const cwd = path.resolve(task.cwd || process.cwd());
    const timeoutMs = task.timeoutMs || DEFAULT_TIMEOUT_MS;
    const taskDir = path.join(this.logRoot, task.id);
    const stdoutPath = path.join(taskDir, 'stdout.log');
    const stderrPath = path.join(taskDir, 'stderr.log');
    const summaryPath = path.join(taskDir, 'summary.txt');

    fs.mkdirSync(taskDir, { recursive: true });

    if (!fs.existsSync(cwd)) {
      throw new Error(`Task cwd does not exist: ${cwd}`);
    }

    if (!this.isInstalled(agent)) {
      throw new Error(
        `Agent CLI "${binary}" is not installed or not on PATH. Configure ${definition.envVar} or install ${agent}.`,
      );
    }

    const prompt = buildAutomationPrompt({
      ...task,
      agent,
      cwd,
    });
    const args = definition.buildArgs({
      task: { ...task, agent, cwd },
      prompt,
      summaryPath,
    });

    const stdoutStream = fs.createWriteStream(stdoutPath);
    const stderrStream = fs.createWriteStream(stderrPath);
    let stdoutTail = '';
    let stderrTail = '';
    let didTimeout = false;
    const startedAt = Date.now();

    const result = await new Promise<ExecutionResult>((resolve, reject) => {
      const child = spawn(binary, args, {
        cwd,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.activeChild = child;

      const timeout = setTimeout(() => {
        didTimeout = true;
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL');
          }
        }, 10_000).unref();
      }, timeoutMs);

      child.stdout.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stdoutStream.write(chunk);
        stdoutTail = trimTail(stdoutTail, text);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stderrStream.write(chunk);
        stderrTail = trimTail(stderrTail, text);
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        stdoutStream.end();
        stderrStream.end();
        this.activeChild = undefined;
        reject(error);
      });

      child.on('close', (exitCode, signal) => {
        clearTimeout(timeout);
        stdoutStream.end();
        stderrStream.end();
        this.activeChild = undefined;

        const summary = readSummary(summaryPath, stdoutTail, stderrTail);
        resolve({
          exitCode,
          signal,
          durationMs: Date.now() - startedAt,
          stdoutPath,
          stderrPath,
          summaryPath: fs.existsSync(summaryPath) ? summaryPath : undefined,
          summary,
          error: didTimeout ? `Task exceeded timeout of ${timeoutMs}ms.` : undefined,
        });
      });
    });

    return result;
  }
}
