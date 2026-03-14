require('../../../setup-env.js');

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

type QueueCommand = 'next' | 'mark';
type IssueResult = 'completed' | 'failed' | 'blocked' | 'pending' | 'reset';

type IssueRow = {
  section: string;
  [key: string]: string;
};

type QueueIssue = {
  issueId: string;
  rowHash: string;
  section: string;
  priority: string;
  status: string;
  reporter: string;
  assignee: string;
  feedbackTime: number;
  feedbackDate: string;
  parentRecord: string;
  description: string;
  notes: string;
  sourceUrl: string;
};

type QueueStateItem = {
  issueId: string;
  result: 'completed' | 'pending' | 'blocked';
  rowHash?: string;
  consecutiveFailures: number;
  lastBlocker?: string;
  lastAttemptAt?: string;
  blockedAt?: string;
  completedAt?: string;
  notes?: string;
};

type QueueState = {
  version: 1;
  updatedAt: string;
  sourceUrl?: string;
  items: Record<string, QueueStateItem>;
};

type NextSummary = {
  generatedAt: string;
  sourceUrl: string;
  targetSection: string;
  totalOpenCount: number;
  actionableCount: number;
  blockedCount: number;
  locallyCompletedCount: number;
  nextIssue: QueueIssue | null;
  topIssues: QueueIssue[];
  stateFile: string;
  snapshotFile: string;
};

type NextArgs = {
  command: 'next';
  sourceUrl: string;
  targetSection: string;
  tsvFile?: string;
  outDir: string;
  stateFile: string;
  snapshotFile: string;
  json: boolean;
  top: number;
};

type MarkArgs = {
  command: 'mark';
  stateFile: string;
  issueId: string;
  result: IssueResult;
  blocker?: string;
  notes?: string;
  rowHash?: string;
  dryRun: boolean;
};

const CLOSED_STATUSES = new Set(['验收通过', '已关闭', '关闭', '已解决', '完成']);
const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
const STATUS_ORDER: Record<string, number> = {
  验收未通过: 0,
  修复中: 1,
  新增: 2,
  待验收: 3,
};
const FAILURE_THRESHOLD = 2;
const DEFAULT_SOURCE_URL = 'https://gcncs1osaunb.feishu.cn/wiki/PlLrwARUNixHOXkpflxcPTi9nLh?table=tblSdvRVaxTpHlRY&view=vewLgt4u2h';
const DEFAULT_TARGET_SECTION = '漏洞跟踪记录';
const DEFAULT_OUT_DIR = 'agent-memory/defect-reports';
const DEFAULT_STATE_FILE = 'agent-memory/defect-reports/feishu-defect-queue-state.json';
const DEFAULT_SNAPSHOT_FILE = 'agent-memory/defect-reports/feishu-defect-queue-latest.json';

function getArgValue(flag: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function normalizeText(value: string): string {
  return value.replace(/\r/g, '').trim();
}

function parseDate(feedbackMs: string): number {
  const value = Number(feedbackMs);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatDate(feedbackMs: string): string {
  const ms = parseDate(feedbackMs);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(ms));
}

function toIssueRows(raw: string): IssueRow[] {
  const lines = raw.replace(/\r/g, '').split('\n');
  const rows: IssueRow[] = [];
  let section = '';
  let headers: string[] | null = null;
  let pending: string[] | null = null;

  const flushPending = () => {
    if (!headers || !pending) return;
    const row: IssueRow = { section };
    headers.forEach((header, index) => {
      row[header] = pending?.[index] ?? '';
    });
    const hasValue = headers.some((header) => (row[header] || '').trim().length > 0);
    if (hasValue) rows.push(row);
    pending = null;
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushPending();
      headers = null;
      section = line.slice(3).trim();
      continue;
    }

    if (line.includes('\t') && line.includes('问题描述') && line.includes('优先级') && line.includes('当前状态')) {
      flushPending();
      headers = line.split('\t');
      continue;
    }

    if (!headers) continue;
    if (!line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length >= headers.length) {
      flushPending();
      pending = parts.slice(0, headers.length);
      if (parts.length > headers.length && pending.length > 0) {
        pending[headers.length - 1] = `${pending[headers.length - 1]}\t${parts.slice(headers.length).join('\t')}`;
      }
      continue;
    }

    if (pending) {
      const last = headers.length - 1;
      const current = pending[last] || '';
      pending[last] = current ? `${current}\n${line}` : line;
    }
  }

  flushPending();
  return rows;
}

function isDefect(row: IssueRow): boolean {
  const issueType = normalizeText(row['类型'] || '');
  return /bug|缺陷/i.test(issueType);
}

function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.has(normalizeText(status));
}

function buildIssueId(row: IssueRow): string {
  const key = [
    normalizeText(row.section || ''),
    normalizeText(row['问题描述'] || ''),
    normalizeText(row['父记录'] || ''),
    normalizeText(row['提报人'] || ''),
    normalizeText(row['反馈时间'] || ''),
  ].join('|');
  const digest = crypto.createHash('sha1').update(key).digest('hex').slice(0, 12);
  return `bug_${digest}`;
}

function buildRowHash(row: IssueRow): string {
  const key = [
    normalizeText(row['优先级'] || ''),
    normalizeText(row['当前状态'] || ''),
    normalizeText(row['跟进人'] || ''),
    normalizeText(row['问题描述'] || ''),
    normalizeText(row['备注说明'] || ''),
    normalizeText(row['反馈时间'] || ''),
  ].join('|');
  return crypto.createHash('sha1').update(key).digest('hex');
}

function toQueueIssue(row: IssueRow, sourceUrl: string): QueueIssue | null {
  const description = normalizeText(row['问题描述'] || '');
  if (!description) return null;
  const status = normalizeText(row['当前状态'] || '');
  return {
    issueId: buildIssueId(row),
    rowHash: buildRowHash(row),
    section: normalizeText(row.section || ''),
    priority: normalizeText(row['优先级'] || ''),
    status,
    reporter: normalizeText(row['提报人'] || ''),
    assignee: normalizeText(row['跟进人'] || ''),
    feedbackTime: parseDate(row['反馈时间'] || ''),
    feedbackDate: formatDate(row['反馈时间'] || ''),
    parentRecord: normalizeText(row['父记录'] || ''),
    description,
    notes: normalizeText(row['备注说明'] || ''),
    sourceUrl,
  };
}

function sortIssues(issues: QueueIssue[]): QueueIssue[] {
  return [...issues].sort((a, b) => {
    const pA = PRIORITY_ORDER[normalizeText(a.priority).toUpperCase()] ?? 99;
    const pB = PRIORITY_ORDER[normalizeText(b.priority).toUpperCase()] ?? 99;
    if (pA !== pB) return pA - pB;

    if (a.feedbackTime !== b.feedbackTime) {
      return b.feedbackTime - a.feedbackTime;
    }

    const sA = STATUS_ORDER[normalizeText(a.status)] ?? 99;
    const sB = STATUS_ORDER[normalizeText(b.status)] ?? 99;
    if (sA !== sB) return sA - sB;

    return a.issueId.localeCompare(b.issueId, 'en');
  });
}

function parseNextArgs(): NextArgs {
  const sourceUrl = getArgValue('--source-url') || DEFAULT_SOURCE_URL;
  const targetSection = getArgValue('--section') || DEFAULT_TARGET_SECTION;
  const tsvFile = getArgValue('--tsv-file');
  const outDir = path.resolve(process.cwd(), getArgValue('--out-dir') || DEFAULT_OUT_DIR);
  const stateFile = path.resolve(process.cwd(), getArgValue('--state-file') || DEFAULT_STATE_FILE);
  const snapshotFile = path.resolve(process.cwd(), getArgValue('--snapshot-file') || DEFAULT_SNAPSHOT_FILE);
  const topRaw = Number(getArgValue('--top') || '8');
  const top = Number.isFinite(topRaw) && topRaw > 0 ? Math.floor(topRaw) : 8;

  return {
    command: 'next',
    sourceUrl,
    targetSection,
    tsvFile: tsvFile ? path.resolve(process.cwd(), tsvFile) : undefined,
    outDir,
    stateFile,
    snapshotFile,
    json: hasFlag('--json'),
    top,
  };
}

function parseMarkArgs(): MarkArgs {
  const issueId = getArgValue('--issue-id');
  const resultRaw = getArgValue('--result') as IssueResult;
  const result = resultRaw || 'pending';
  const allowed = new Set<IssueResult>(['completed', 'failed', 'blocked', 'pending', 'reset']);
  if (!issueId) {
    throw new Error('Missing --issue-id');
  }
  if (!allowed.has(result)) {
    throw new Error('Invalid --result, expected one of: completed|failed|blocked|pending|reset');
  }
  return {
    command: 'mark',
    issueId,
    result,
    blocker: getArgValue('--blocker') || undefined,
    notes: getArgValue('--notes') || undefined,
    rowHash: getArgValue('--row-hash') || undefined,
    stateFile: path.resolve(process.cwd(), getArgValue('--state-file') || DEFAULT_STATE_FILE),
    dryRun: hasFlag('--dry-run'),
  };
}

function parseCommand(): QueueCommand {
  const command = process.argv[2];
  if (command === 'next' || command === 'mark') {
    return command;
  }
  throw new Error(
    'Usage:\n' +
    '  npm run feishu:queue:next -- [--source-url "<url>"] [--section "漏洞跟踪记录"] [--tsv-file <path>] [--json]\n' +
    '  npm run feishu:queue:mark -- --issue-id <id> --result <completed|failed|blocked|pending|reset> [--blocker "..."]',
  );
}

function loadStateFile(stateFile: string): QueueState {
  if (!fs.existsSync(stateFile)) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: {},
    };
  }

  const raw = fs.readFileSync(stateFile, 'utf8');
  const parsed = JSON.parse(raw) as Partial<QueueState>;
  if (!parsed.items || typeof parsed.items !== 'object') {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: {},
    };
  }
  return {
    version: 1,
    updatedAt: parsed.updatedAt || new Date().toISOString(),
    sourceUrl: parsed.sourceUrl,
    items: parsed.items,
  };
}

function saveStateFile(stateFile: string, state: QueueState) {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

function fetchRawTsv(sourceUrl: string): string {
  const childEnv = { ...process.env };
  delete childEnv.FEISHU_APP_ID;
  delete childEnv.FEISHU_APP_SECRET;

  const result = spawnSync(
    'node',
    ['--import', 'tsx', 'src/tools/feishu/feishu-fetch-doc.ts', sourceUrl],
    { cwd: process.cwd(), env: childEnv, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(detail || 'Failed to fetch Feishu defect table');
  }
  return result.stdout || '';
}

function loadRawInput(args: NextArgs): string {
  if (args.tsvFile) {
    if (!fs.existsSync(args.tsvFile)) {
      throw new Error(`--tsv-file not found: ${args.tsvFile}`);
    }
    return fs.readFileSync(args.tsvFile, 'utf8');
  }
  return fetchRawTsv(args.sourceUrl);
}

function dedupeIssues(issues: QueueIssue[]): QueueIssue[] {
  const map = new Map<string, QueueIssue>();
  for (const issue of issues) {
    const existing = map.get(issue.issueId);
    if (!existing) {
      map.set(issue.issueId, issue);
      continue;
    }
    const pickCurrent = issue.feedbackTime >= existing.feedbackTime;
    if (pickCurrent) {
      map.set(issue.issueId, issue);
    }
  }
  return [...map.values()];
}

function buildSummary(args: NextArgs): NextSummary {
  const rawText = loadRawInput(args);
  const rows = toIssueRows(rawText);
  const sectionName = normalizeText(args.targetSection);
  const defects = rows
    .filter((row) => isDefect(row) && normalizeText(row.section || '') === sectionName)
    .map((row) => toQueueIssue(row, args.sourceUrl))
    .filter(Boolean) as QueueIssue[];
  const openDefects = defects.filter((issue) => !isClosedStatus(issue.status));
  const uniqueOpenDefects = sortIssues(dedupeIssues(openDefects));

  const state = loadStateFile(args.stateFile);
  const actionable = uniqueOpenDefects.filter((issue) => {
    const entry = state.items[issue.issueId];
    if (!entry) return true;
    if (entry.result === 'blocked') return false;
    if (entry.result === 'completed' && entry.rowHash === issue.rowHash) return false;
    return true;
  });

  const blockedCount = uniqueOpenDefects.filter((issue) => state.items[issue.issueId]?.result === 'blocked').length;
  const locallyCompletedCount = uniqueOpenDefects.filter((issue) => state.items[issue.issueId]?.result === 'completed').length;
  const nextIssue = actionable[0] ?? null;

  const summary: NextSummary = {
    generatedAt: new Date().toISOString(),
    sourceUrl: args.sourceUrl,
    targetSection: sectionName,
    totalOpenCount: uniqueOpenDefects.length,
    actionableCount: actionable.length,
    blockedCount,
    locallyCompletedCount,
    nextIssue,
    topIssues: actionable.slice(0, args.top),
    stateFile: args.stateFile,
    snapshotFile: args.snapshotFile,
  };

  fs.mkdirSync(args.outDir, { recursive: true });
  fs.writeFileSync(args.snapshotFile, JSON.stringify(summary, null, 2), 'utf8');
  fs.writeFileSync(path.join(args.outDir, 'feishu-defects-latest.tsv'), rawText, 'utf8');
  state.updatedAt = summary.generatedAt;
  state.sourceUrl = args.sourceUrl;
  saveStateFile(args.stateFile, state);
  return summary;
}

function formatSummary(summary: NextSummary): string {
  const lines: string[] = [];
  lines.push('# Feishu Defect Queue');
  lines.push('');
  lines.push(`- generatedAt: ${summary.generatedAt}`);
  lines.push(`- targetSection: ${summary.targetSection}`);
  lines.push(`- totalOpenCount: ${summary.totalOpenCount}`);
  lines.push(`- actionableCount: ${summary.actionableCount}`);
  lines.push(`- blockedCount: ${summary.blockedCount}`);
  lines.push(`- locallyCompletedCount: ${summary.locallyCompletedCount}`);
  lines.push(`- stateFile: ${summary.stateFile}`);
  lines.push(`- snapshotFile: ${summary.snapshotFile}`);
  lines.push('');

  if (summary.nextIssue) {
    lines.push('## Next Issue');
    lines.push('');
    lines.push(`- issueId: ${summary.nextIssue.issueId}`);
    lines.push(`- priority: ${summary.nextIssue.priority || '未标记'}`);
    lines.push(`- status: ${summary.nextIssue.status || '未填写'}`);
    lines.push(`- assignee: ${summary.nextIssue.assignee || '未填写'}`);
    lines.push(`- feedbackDate: ${summary.nextIssue.feedbackDate || '未填写'}`);
    lines.push(`- description: ${summary.nextIssue.description}`);
    if (summary.nextIssue.notes) {
      lines.push(`- notes: ${summary.nextIssue.notes}`);
    }
    lines.push('');
  } else {
    lines.push('## Next Issue');
    lines.push('');
    lines.push('- none');
    lines.push('');
  }

  if (summary.topIssues.length > 0) {
    lines.push('## Top Actionable Issues');
    lines.push('');
    summary.topIssues.forEach((issue, index) => {
      lines.push(`${index + 1}. [${issue.issueId}] ${issue.priority || 'P?'} / ${issue.status || '未填写'} / ${issue.description}`);
    });
  }

  return lines.join('\n');
}

function clearFailureState(entry: QueueStateItem) {
  entry.consecutiveFailures = 0;
  delete entry.lastBlocker;
  delete entry.blockedAt;
}

function applyMark(args: MarkArgs) {
  const state = loadStateFile(args.stateFile);
  const now = new Date().toISOString();
  const entry = state.items[args.issueId] || {
    issueId: args.issueId,
    result: 'pending',
    consecutiveFailures: 0,
  };

  if (args.rowHash) {
    entry.rowHash = args.rowHash;
  }
  entry.lastAttemptAt = now;
  if (args.notes) {
    entry.notes = args.notes;
  }

  if (args.result === 'completed') {
    entry.result = 'completed';
    entry.completedAt = now;
    clearFailureState(entry);
  } else if (args.result === 'reset') {
    entry.result = 'pending';
    delete entry.completedAt;
    clearFailureState(entry);
  } else if (args.result === 'pending') {
    entry.result = 'pending';
    delete entry.completedAt;
    delete entry.blockedAt;
  } else if (args.result === 'blocked') {
    entry.result = 'blocked';
    entry.consecutiveFailures = Math.max(entry.consecutiveFailures, FAILURE_THRESHOLD);
    if (args.blocker) {
      entry.lastBlocker = args.blocker;
    }
    entry.blockedAt = now;
    delete entry.completedAt;
  } else {
    const blocker = args.blocker || 'unspecified blocker';
    const sameBlocker = entry.lastBlocker === blocker;
    entry.consecutiveFailures = sameBlocker ? entry.consecutiveFailures + 1 : 1;
    entry.lastBlocker = blocker;
    delete entry.completedAt;
    if (entry.consecutiveFailures >= FAILURE_THRESHOLD) {
      entry.result = 'blocked';
      entry.blockedAt = now;
    } else {
      entry.result = 'pending';
      delete entry.blockedAt;
    }
  }

  state.items[args.issueId] = entry;
  state.updatedAt = now;

  if (!args.dryRun) {
    saveStateFile(args.stateFile, state);
  }

  const output = {
    stateFile: args.stateFile,
    dryRun: args.dryRun,
    issueId: args.issueId,
    result: args.result,
    entry: state.items[args.issueId],
  };
  console.log(JSON.stringify(output, null, 2));
}

function main() {
  const command = parseCommand();

  if (command === 'next') {
    const args = parseNextArgs();
    const summary = buildSummary(args);
    if (args.json) {
      console.log(JSON.stringify(summary, null, 2));
    } else {
      console.log(formatSummary(summary));
    }
    return;
  }

  const args = parseMarkArgs();
  applyMark(args);
}

main();
