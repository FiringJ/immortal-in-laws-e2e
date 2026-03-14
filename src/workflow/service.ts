import fs from 'fs';
import path from 'path';
import { getDefaultAgent, parseAgentDirective, type TaskRecord, type TaskRequest } from '../daemon/agent-executor';
import { generateTaskId, resolveTaskCwd } from '../daemon/task-utils';
import type { FeishuDefectIssue } from '../tools/feishu/feishu-defect-source';
import { WorkflowPlanBatchService } from './plan-batch-service';
import { WorkflowTriageBatchService } from './triage-batch-service';
import { buildWorkflowTaskRequest } from './prompts';
import {
  ACTION_LABELS,
  BOARD_COLUMN_LABELS,
  STAGE_LABELS,
  type WorkflowAction,
  type WorkflowActionInput,
  type WorkflowApprovalRecord,
  type WorkflowArtifactKey,
  type WorkflowBoardColumn,
  type WorkflowBoardColumnKey,
  type WorkflowBoardStatus,
  type WorkflowCreateInput,
  type WorkflowExternalSourceMeta,
  type WorkflowIndexFile,
  type WorkflowIndexRecord,
  type WorkflowItem,
  type WorkflowItemDetail,
  type WorkflowItemSummary,
  type WorkflowKind,
  type WorkflowPhase,
  type WorkflowPlanBatchRun,
  type WorkflowPlanBatchSummary,
  type WorkflowTriageBatchRun,
  type WorkflowTriageBatchSummary,
  type WorkflowTriageState,
  type WorkflowPhaseRun,
  type WorkflowSource,
  type WorkflowStage,
} from './types';
import { renderWorkbenchHtml } from './workbench';

type WorkflowBoardQuery = {
  kind?: string;
  source?: string;
  status?: string;
  limit?: string;
};

type WorkflowListQuery = {
  kind?: string;
  source?: string;
  stage?: string;
  status?: string;
  limit?: string;
};

type FeishuWorkflowParseResult =
  | {
      matched: true;
      kind: WorkflowKind;
      rawInput: string;
      preferredAgent?: TaskRequest['agent'];
    }
  | {
      matched: false;
      usage: string;
    };

type WorkflowServiceOptions = {
  trackerRoot?: string;
  storageRoot?: string;
  scheduleTask: (request: TaskRequest) => TaskRecord;
  log?: (message: string) => void;
};

const RUNNABLE_STAGES = new Set<WorkflowStage>(['triaging', 'planning', 'reproducing', 'executing', 'verifying', 'writing_back']);
const PHASE_TO_ARTIFACT_KEY: Partial<Record<WorkflowPhase, WorkflowArtifactKey>> = {
  triaging: 'triage',
  planning: 'plan',
  reproducing: 'reproduction',
  verifying: 'verification',
  writing_back: 'writeback',
};
const FEISHU_USAGE_TEXT = '请使用 /req <需求描述> 或 /bug <问题描述> 提交 workflow 任务。';

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readTextIfExists(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function firstMeaningfulLine(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
}

function isWorkflowKind(value: string | undefined): value is WorkflowKind {
  return value === 'requirement' || value === 'bug';
}

function isWorkflowSource(value: string | undefined): value is WorkflowSource {
  return value === 'manual' || value === 'feishu';
}

function isWorkflowStage(value: string | undefined): value is WorkflowStage {
  return Boolean(value && Object.prototype.hasOwnProperty.call(STAGE_LABELS, value));
}

function isWorkflowBoardStatus(value: string | undefined): value is WorkflowBoardStatus {
  return value === 'all' || value === 'active' || value === 'blocked' || value === 'completed';
}

function normalizePriority(input: string | undefined, kind: WorkflowKind): string {
  const raw = (input || '').trim().toUpperCase();
  if (/^P[0-3]$/.test(raw)) {
    return raw;
  }
  return kind === 'bug' ? 'P1' : 'P2';
}

function deriveTitle(rawTitle: string | undefined, rawInput: string): string {
  const title = (rawTitle || '').trim();
  if (title) {
    return title;
  }

  const firstLine = rawInput.split('\n')[0]?.trim() || '未命名工作项';
  return firstLine.slice(0, 80);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

function artifactKeyForPhase(phase: WorkflowPhase): WorkflowArtifactKey | undefined {
  return PHASE_TO_ARTIFACT_KEY[phase];
}

function stageToBoardColumn(stage: WorkflowStage): WorkflowBoardColumnKey {
  if (stage === 'intake' || stage === 'triaging' || stage === 'planning') {
    return 'intake';
  }
  if (stage === 'awaiting_plan_approval' || stage === 'awaiting_fix_approval' || stage === 'awaiting_close_approval') {
    return 'approvals';
  }
  if (stage === 'verifying') {
    return 'verification';
  }
  if (stage === 'completed') {
    return 'completed';
  }
  if (stage === 'blocked') {
    return 'blocked';
  }
  return 'active';
}

function matchesBoardStatus(stage: WorkflowStage, status: WorkflowBoardStatus): boolean {
  if (status === 'all') {
    return true;
  }
  if (status === 'blocked') {
    return stage === 'blocked';
  }
  if (status === 'completed') {
    return stage === 'completed';
  }
  return stage !== 'blocked' && stage !== 'completed';
}

function parseLimit(input: string | undefined, fallback: number): number {
  return Math.max(1, Math.min(200, parseInt(input || String(fallback), 10) || fallback));
}

function stringifyNote(note: string | undefined, fallback: string): string {
  const trimmed = (note || '').trim();
  return trimmed || fallback;
}

function buildFeishuDefectTitle(defect: FeishuDefectIssue): string {
  const prefix = defect.parentRecord ? `${defect.parentRecord}：` : '';
  return `${prefix}${defect.description}`.slice(0, 120);
}

function buildFeishuDefectRawInput(defect: FeishuDefectIssue): string {
  const lines = [
    `飞书缺陷 ID: ${defect.issueId}`,
    `飞书状态: ${defect.status || '未填写'}`,
    `优先级: ${defect.priority || '未标记'}`,
    `反馈日期: ${defect.feedbackDate || '未填写'}`,
    `提报人: ${defect.reporter || '未填写'}`,
    `跟进人: ${defect.assignee || '未填写'}`,
    `父记录: ${defect.parentRecord || '未填写'}`,
    `来源链接: ${defect.sourceUrl}`,
    '',
    '问题描述:',
    defect.description || '未填写',
  ];

  if (defect.notes) {
    lines.push('', '备注说明:', defect.notes);
  }

  if (defect.review) {
    lines.push('', '问题复核:', defect.review);
  }

  if (defect.attachments.length > 0) {
    lines.push('', '截图/附件:');
    defect.attachments.forEach((attachment) => {
      const pathText = attachment.downloadedPath ? ` -> ${attachment.downloadedPath}` : '';
      lines.push(`- ${attachment.name}${pathText}`);
    });
  }

  return lines.join('\n');
}

function buildFeishuSourceMeta(defect: FeishuDefectIssue): WorkflowExternalSourceMeta {
  return {
    kind: 'feishu-defect',
    externalIssueId: defect.issueId,
    externalRowHash: defect.rowHash,
    sourceUrl: defect.sourceUrl,
    externalStatus: defect.status,
    reporter: defect.reporter,
    assignee: defect.assignee,
    parentRecord: defect.parentRecord,
    feedbackDate: defect.feedbackDate,
    notes: defect.notes,
    review: defect.review,
    attachments: defect.attachments.map((attachment) => ({
      name: attachment.name,
      path: attachment.downloadedPath,
      url: attachment.tmpDownloadUrl,
      contentType: attachment.contentType,
    })),
    syncedAt: getCurrentTimestamp(),
  };
}

function createInitialTriageState(source: WorkflowSource, sourceMeta?: WorkflowExternalSourceMeta): WorkflowTriageState | undefined {
  if (source === 'feishu' && sourceMeta?.kind === 'feishu-defect') {
    return {
      status: 'pending',
      updatedAt: getCurrentTimestamp(),
    };
  }
  return undefined;
}

export class WorkflowService {
  private readonly trackerRoot: string;
  private readonly storageRoot: string;
  private readonly itemsRoot: string;
  private readonly indexPath: string;
  private readonly scheduleTask: WorkflowServiceOptions['scheduleTask'];
  private readonly log: (message: string) => void;
  private readonly items: Map<string, WorkflowItem>;
  private readonly planBatchService: WorkflowPlanBatchService;
  private readonly triageBatchService: WorkflowTriageBatchService;

  constructor(options: WorkflowServiceOptions) {
    this.trackerRoot = path.resolve(options.trackerRoot || process.cwd());
    this.storageRoot = path.resolve(options.storageRoot || path.join(this.trackerRoot, 'agent-memory/workflows'));
    this.itemsRoot = path.join(this.storageRoot, 'items');
    this.indexPath = path.join(this.storageRoot, 'index.json');
    this.scheduleTask = options.scheduleTask;
    this.log = options.log || ((message: string) => console.log(message));
    this.items = new Map();

    ensureDir(this.storageRoot);
    ensureDir(this.itemsRoot);
    this.loadItems();
    this.recoverInterruptedItems();
    this.planBatchService = new WorkflowPlanBatchService({
      storageRoot: path.join(this.storageRoot, 'batch-runs'),
      listItems: () => this.getSortedItems(),
      getItemDetail: (id) => this.getItemDetail(id),
      triggerGeneratePlan: (itemId, note) => {
        this.handleAction(itemId, {
          action: 'generate_plan',
          actor: 'plan-batch',
          note,
        });
        return this.getItemDetail(itemId);
      },
      blockItem: (itemId, reason) => {
        this.handleAction(itemId, {
          action: 'block',
          actor: 'plan-batch',
          note: reason,
        });
        return this.getItemDetail(itemId);
      },
      validatePlan: (itemId) => this.validatePlanningResult(itemId),
      log: this.log,
    });
    this.triageBatchService = new WorkflowTriageBatchService({
      storageRoot: path.join(this.storageRoot, 'triage-batch-runs'),
      listItems: () => this.getSortedItems(),
      getItemDetail: (id) => this.getItemDetail(id),
      triggerRunTriage: (itemId, note) => {
        this.handleAction(itemId, {
          action: 'run_triage',
          actor: 'triage-batch',
          note,
        });
        return this.getItemDetail(itemId);
      },
      validateTriage: (itemId) => this.validateTriageResult(itemId),
      log: this.log,
    });
    this.writeIndex();
  }

  renderWorkbench(): string {
    return renderWorkbenchHtml();
  }

  parseFeishuCommand(text: string): FeishuWorkflowParseResult {
    const trimmed = text.trim();
    const match = trimmed.match(/^\/(req|需求|bug)\s+([\s\S]+)$/i);
    if (!match) {
      return {
        matched: false,
        usage: FEISHU_USAGE_TEXT,
      };
    }

    const kind: WorkflowKind = /bug/i.test(match[1]) ? 'bug' : 'requirement';
    const parsed = parseAgentDirective(match[2].trim());

    return {
      matched: true,
      kind,
      rawInput: parsed.task,
      preferredAgent: parsed.agent,
    };
  }

  createItem(input: WorkflowCreateInput): WorkflowItem {
    const source: WorkflowSource = isWorkflowSource(input.source) ? input.source : 'manual';
    const rawInputParsed = parseAgentDirective((input.rawInput || '').trim());
    const rawInput = rawInputParsed.task.trim();
    const kind = input.kind;

    if (!isWorkflowKind(kind)) {
      throw new Error('kind 必须是 requirement 或 bug');
    }
    if (!rawInput) {
      throw new Error('rawInput 不能为空');
    }

    const title = deriveTitle(input.title, rawInput);
    const preferredAgent = input.preferredAgent || rawInputParsed.agent;
    const cwd = input.cwd
      ? path.resolve(input.cwd)
      : resolveTaskCwd({ source: source === 'feishu' ? 'feishu' : 'http', task: rawInput }, rawInput);

    if (!fs.existsSync(cwd)) {
      throw new Error(`工作目录不存在: ${cwd}`);
    }

    const id = generateTaskId('wf');
    const createdAt = getCurrentTimestamp();
    const itemDir = this.getItemDir(id);
    ensureDir(itemDir);

    const item: WorkflowItem = {
      version: 1,
      id,
      kind,
      title,
      source,
      rawInput,
      acceptanceCriteria: input.acceptanceCriteria?.trim() || undefined,
      preferredAgent,
      cwd,
      priority: normalizePriority(input.priority, kind),
      stage: 'intake',
      createdAt,
      updatedAt: createdAt,
      approvals: [],
      phaseRuns: [],
      artifactPaths: {
        triage: path.join(itemDir, 'triage.md'),
        plan: path.join(itemDir, 'plan.md'),
        reproduction: path.join(itemDir, 'reproduction.md'),
        verification: path.join(itemDir, 'verification.md'),
        writeback: path.join(itemDir, 'writeback.md'),
      },
      linkedDaemonTaskIds: [],
      blocker: undefined,
      sourceContext: input.sourceContext,
      sourceMeta: input.sourceMeta,
      triage: input.sourceMeta ? createInitialTriageState(source, input.sourceMeta) : undefined,
    };

    this.items.set(item.id, item);
    this.persistItem(item);
    this.writeIndex();
    return this.cloneItem(item);
  }

  syncFeishuDefectItems(defects: FeishuDefectIssue[]): {
    created: number;
    updated: number;
    skipped: number;
    itemIds: string[];
  } {
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const itemIds: string[] = [];

    defects.forEach((defect) => {
      const existing = this.findByExternalIssueId(defect.issueId);
      if (!existing) {
        const createdItem = this.createItem({
          kind: 'bug',
          title: buildFeishuDefectTitle(defect),
          rawInput: buildFeishuDefectRawInput(defect),
          source: 'feishu',
          priority: defect.priority,
          sourceMeta: buildFeishuSourceMeta(defect),
        });
        created += 1;
        itemIds.push(createdItem.id);
        return;
      }

      const previousRowHash = existing.sourceMeta?.externalRowHash;
      const nextRawInput = buildFeishuDefectRawInput(defect);
      const nextTitle = buildFeishuDefectTitle(defect);
      existing.title = nextTitle;
      existing.rawInput = nextRawInput;
      existing.priority = normalizePriority(defect.priority, 'bug');
      existing.sourceMeta = buildFeishuSourceMeta(defect);
      if (previousRowHash !== defect.rowHash || !existing.triage) {
        existing.triage = createInitialTriageState('feishu', existing.sourceMeta);
      }
      this.touch(existing);
      this.persistItem(existing);
      itemIds.push(existing.id);

      if (previousRowHash === defect.rowHash) {
        skipped += 1;
      } else {
        updated += 1;
      }
    });

    this.writeIndex();
    return { created, updated, skipped, itemIds };
  }

  listItems(query: WorkflowListQuery = {}): WorkflowItemSummary[] {
    const limit = parseLimit(query.limit, 50);
    const kind = isWorkflowKind(query.kind) ? query.kind : undefined;
    const source = isWorkflowSource(query.source) ? query.source : undefined;
    const stage = isWorkflowStage(query.stage) ? query.stage : undefined;
    const status = isWorkflowBoardStatus(query.status) ? query.status : 'all';

    return this.getSortedItems()
      .filter((item) => (!kind || item.kind === kind)
        && (!source || item.source === source)
        && (!stage || item.stage === stage)
        && matchesBoardStatus(item.stage, status))
      .slice(0, limit)
      .map((item) => this.toSummary(item));
  }

  createDefaultBugTriageBatch(): WorkflowTriageBatchRun {
    return this.triageBatchService.createDefaultBatch();
  }

  listTriageBatches(limit?: string | number): {
    activeBatchId?: string;
    runs: WorkflowTriageBatchSummary[];
  } {
    const normalizedLimit = typeof limit === 'number'
      ? limit
      : parseLimit(typeof limit === 'string' ? limit : undefined, 10);
    return this.triageBatchService.listBatches(normalizedLimit);
  }

  getTriageBatch(id: string): WorkflowTriageBatchRun {
    return this.triageBatchService.getBatch(id);
  }

  createDefaultBugPlanBatch(): WorkflowPlanBatchRun {
    return this.planBatchService.createDefaultBatch();
  }

  listPlanBatches(limit?: string | number): {
    activeBatchId?: string;
    runs: WorkflowPlanBatchSummary[];
  } {
    const normalizedLimit = typeof limit === 'number'
      ? limit
      : parseLimit(typeof limit === 'string' ? limit : undefined, 10);
    return this.planBatchService.listBatches(normalizedLimit);
  }

  getPlanBatch(id: string): WorkflowPlanBatchRun {
    return this.planBatchService.getBatch(id);
  }

  getBoard(query: WorkflowBoardQuery = {}): {
    generatedAt: string;
    defaultAgent: string;
    total: number;
    columns: WorkflowBoardColumn[];
  } {
    const summaries = this.listItems({
      ...query,
      limit: query.limit || '1000',
    });
    const grouped = new Map<WorkflowBoardColumnKey, WorkflowItemSummary[]>();

    (Object.keys(BOARD_COLUMN_LABELS) as WorkflowBoardColumnKey[]).forEach((key) => {
      grouped.set(key, []);
    });

    summaries.forEach((summary) => {
      grouped.get(stageToBoardColumn(summary.stage))?.push(summary);
    });

    const columns: WorkflowBoardColumn[] = (Object.keys(BOARD_COLUMN_LABELS) as WorkflowBoardColumnKey[]).map((key) => ({
      key,
      label: BOARD_COLUMN_LABELS[key],
      items: grouped.get(key) || [],
    }));

    return {
      generatedAt: getCurrentTimestamp(),
      defaultAgent: getDefaultAgent(),
      total: summaries.length,
      columns,
    };
  }

  getItemDetail(id: string): WorkflowItemDetail {
    const item = this.requireItem(id);
    const artifacts = (Object.entries(item.artifactPaths) as Array<[WorkflowArtifactKey, string]>).map(([key, artifactPath]) => ({
      key,
      path: artifactPath,
      content: readTextIfExists(artifactPath),
    }));

    return {
      item: this.cloneItem(item),
      availableActions: this.getAvailableActions(item),
      latestPhaseRun: this.getLatestPhaseRun(item),
      artifacts,
    };
  }

  handleAction(id: string, input: WorkflowActionInput): WorkflowItem {
    const item = this.requireItem(id);
    const action = input.action;
    const actor = (input.actor || 'web-ui').trim() || 'web-ui';
    const note = input.note?.trim() || undefined;

    switch (action) {
      case 'run_triage':
        this.assertStage(item, ['intake'], action);
        this.schedulePhase(item, 'triaging', actor, note);
        if (item.triage) {
          item.triage.status = 'running';
          item.triage.updatedAt = getCurrentTimestamp();
        }
        break;
      case 'generate_plan':
        if (item.sourceMeta?.kind === 'feishu-defect' && item.triage?.status !== 'ready') {
          throw new Error('飞书缺陷需先完成 triage，并达到 ready 后才能生成 plan');
        }
        this.assertStage(item, ['intake'], action);
        this.schedulePhase(item, 'planning', actor, note);
        break;
      case 'approve_plan':
        this.assertStage(item, ['awaiting_plan_approval'], action);
        this.recordApproval(item, action, actor, note, item.kind === 'requirement' ? 'executing' : 'reproducing');
        item.stage = item.kind === 'requirement' ? 'executing' : 'reproducing';
        item.blocker = undefined;
        this.touch(item);
        break;
      case 'request_plan_changes':
        this.assertStage(item, ['awaiting_plan_approval', 'awaiting_fix_approval'], action);
        this.recordApproval(item, action, actor, note, item.stage === 'awaiting_plan_approval' ? 'intake' : 'reproducing');
        item.stage = item.stage === 'awaiting_plan_approval' ? 'intake' : 'reproducing';
        item.blocker = note;
        this.touch(item);
        break;
      case 'run_reproduction':
        this.assertStage(item, ['reproducing'], action);
        this.schedulePhase(item, 'reproducing', actor, note);
        break;
      case 'approve_fix_plan':
        this.assertStage(item, ['awaiting_fix_approval'], action);
        this.recordApproval(item, action, actor, note, 'executing');
        item.stage = 'executing';
        item.blocker = undefined;
        this.touch(item);
        break;
      case 'run_execution':
        this.assertStage(item, ['executing'], action);
        this.schedulePhase(item, 'executing', actor, note);
        break;
      case 'run_verification':
        this.assertStage(item, ['verifying'], action);
        this.schedulePhase(item, 'verifying', actor, note);
        break;
      case 'approve_close':
        this.assertStage(item, ['awaiting_close_approval'], action);
        this.recordApproval(item, action, actor, note, 'writing_back');
        this.schedulePhase(item, 'writing_back', actor, note);
        break;
      case 'block':
        this.blockItem(item, stringifyNote(note, 'manually blocked'), actor, false);
        break;
      case 'reopen':
        this.assertStage(item, ['blocked', 'completed'], action);
        this.recordApproval(item, action, actor, note, 'intake');
        item.stage = 'intake';
        item.blocker = undefined;
        this.touch(item);
        break;
      default:
        throw new Error(`不支持的 action: ${String(action)}`);
    }

    this.persistItem(item);
    this.writeIndex();
    return this.cloneItem(item);
  }

  handleTaskUpdate(task: TaskRecord): void {
    if (!task.workflowItemId || !task.workflowPhase) {
      return;
    }

    const item = this.items.get(task.workflowItemId);
    if (!item) {
      return;
    }

    const run = [...item.phaseRuns].reverse().find((phaseRun) => phaseRun.taskId === task.id);
    if (!run) {
      return;
    }

    run.status = task.status;
    run.startedAt = task.startedAt;
    run.completedAt = task.completedAt;
    run.summary = task.summary;
    run.stdoutPath = task.stdoutPath;
    run.stderrPath = task.stderrPath;
    run.summaryPath = task.summaryPath;
    run.error = task.error;
    this.touch(item);

    if (task.status === 'running') {
      this.persistItem(item);
      this.writeIndex();
      this.triageBatchService.handleTaskUpdate(task);
      this.planBatchService.handleTaskUpdate(task);
      return;
    }

    if (task.status === 'failed') {
      if (task.workflowPhase === 'triaging') {
        item.triage = {
          status: 'failed',
          summary: task.error || task.summary,
          updatedAt: getCurrentTimestamp(),
        };
      }
      this.blockItem(item, stringifyNote(task.error || task.summary, `${task.workflowPhase} failed`), 'daemon', true);
      run.status = 'failed';
      this.persistItem(item);
      this.writeIndex();
      this.triageBatchService.handleTaskUpdate(task);
      this.planBatchService.handleTaskUpdate(task);
      return;
    }

    this.handleSuccessfulPhaseCompletion(item, task.workflowPhase as WorkflowPhase, task, run);
    this.persistItem(item);
    this.writeIndex();
    this.triageBatchService.handleTaskUpdate(task);
    this.planBatchService.handleTaskUpdate(task);
  }

  private handleSuccessfulPhaseCompletion(
    item: WorkflowItem,
    phase: WorkflowPhase,
    task: TaskRecord,
    run: WorkflowPhaseRun,
  ): void {
    const artifactKey = artifactKeyForPhase(phase);
    if (artifactKey) {
      this.ensureArtifactExists(item, artifactKey, phase, task);
      run.artifactPath = item.artifactPaths[artifactKey];
    }

    switch (phase) {
      case 'triaging': {
        const triage = this.validateTriageResult(item.id);
        if (!triage.ok) {
          item.triage = {
            status: 'failed',
            summary: triage.reason,
            updatedAt: getCurrentTimestamp(),
          };
          this.blockItem(item, triage.reason || 'triage validation failed', 'daemon', true);
          break;
        }
        item.stage = 'intake';
        item.blocker = undefined;
        item.triage = {
          status: triage.readiness,
          sourceQuality: triage.sourceQuality,
          nextAction: triage.nextAction,
          normalizedTitle: triage.normalizedTitle,
          summary: triage.summary,
          updatedAt: getCurrentTimestamp(),
        };
        if (triage.normalizedTitle) {
          item.title = triage.normalizedTitle;
        }
        break;
      }
      case 'planning':
        item.stage = 'awaiting_plan_approval';
        item.blocker = undefined;
        break;
      case 'reproducing':
        item.stage = 'awaiting_fix_approval';
        item.blocker = undefined;
        break;
      case 'executing':
        item.stage = 'verifying';
        item.blocker = undefined;
        break;
      case 'verifying':
        item.stage = 'awaiting_close_approval';
        item.blocker = undefined;
        break;
      case 'writing_back':
        this.applyKnowledgeWriteback(item, task.summary);
        item.stage = 'completed';
        item.blocker = undefined;
        break;
      default:
        break;
    }

    this.touch(item);
  }

  private applyKnowledgeWriteback(item: WorkflowItem, taskSummary: string | undefined): void {
    const writeback = readTextIfExists(item.artifactPaths.writeback) || taskSummary || `${item.title}\n\n暂无额外总结。`;
    const marker = `<!-- workflow-item:${item.id} -->`;
    const timestamp = getCurrentTimestamp();

    this.appendKnowledgeEntry(
      path.join(this.trackerRoot, 'agent-memory/user-feedback-ledger.md'),
      marker,
      [
        '',
        `## ${timestamp} ${item.title}`,
        marker,
        `- kind: ${item.kind}`,
        `- source: ${item.source}`,
        `- workflowItemId: ${item.id}`,
        `- verification: ${firstMeaningfulLine(readTextIfExists(item.artifactPaths.verification)) || 'n/a'}`,
        `- writebackPath: ${item.artifactPaths.writeback}`,
        '',
        writeback.trim(),
        '',
      ].join('\n'),
    );

    if (item.kind === 'bug') {
      this.appendKnowledgeEntry(
        path.join(this.trackerRoot, 'agent-memory/known-issues.md'),
        marker,
        [
          '',
          `## ${timestamp} ${item.title}`,
          marker,
          `- priority: ${item.priority}`,
          `- workflowItemId: ${item.id}`,
          `- root artifact: ${item.artifactPaths.reproduction}`,
          `- verification artifact: ${item.artifactPaths.verification}`,
          `- summary: ${firstMeaningfulLine(writeback) || firstMeaningfulLine(taskSummary) || item.title}`,
          '',
        ].join('\n'),
      );
    } else {
      this.appendKnowledgeEntry(
        path.join(this.trackerRoot, 'agent-memory/project-knowledge.md'),
        marker,
        [
          '',
          `## ${timestamp} ${item.title}`,
          marker,
          `- workflowItemId: ${item.id}`,
          `- plan artifact: ${item.artifactPaths.plan}`,
          `- verification artifact: ${item.artifactPaths.verification}`,
          `- summary: ${firstMeaningfulLine(writeback) || firstMeaningfulLine(taskSummary) || item.title}`,
          '',
        ].join('\n'),
      );
    }
  }

  private appendKnowledgeEntry(filePath: string, marker: string, block: string): void {
    ensureDir(path.dirname(filePath));
    const current = readTextIfExists(filePath);
    if (current.includes(marker)) {
      return;
    }

    const prefix = current.endsWith('\n') || current.length === 0 ? '' : '\n';
    fs.writeFileSync(filePath, `${current}${prefix}${block}`, 'utf8');
  }

  private ensureArtifactExists(
    item: WorkflowItem,
    artifactKey: WorkflowArtifactKey,
    phase: WorkflowPhase,
    task: TaskRecord,
  ): void {
    const artifactPath = item.artifactPaths[artifactKey];
    if (fs.existsSync(artifactPath) && readTextIfExists(artifactPath).trim()) {
      return;
    }

    const content = this.buildFallbackArtifact(item, artifactKey, phase, task);
    fs.writeFileSync(artifactPath, content, 'utf8');
  }

  private buildFallbackArtifact(
    item: WorkflowItem,
    artifactKey: WorkflowArtifactKey,
    phase: WorkflowPhase,
    task: TaskRecord,
  ): string {
    const headerMap: Record<WorkflowArtifactKey, string[]> = {
      triage: [
        '# Triage',
        '- readiness: needs_human',
        '- source_quality: low',
        '- next_action: manual_triage',
        `- normalized_title: ${item.title}`,
        '',
        '## Cleaned Problem',
        item.rawInput,
        '',
        '## Source Quality',
        'Fallback triage generated by daemon.',
        '',
        '## Product Context',
        'Pending.',
        '',
        '## Technical Context',
        'Pending.',
        '',
        '## Missing Context',
        'Pending.',
        '',
        '## Likely Surfaces',
        'Pending.',
        '',
        '## Recommended Next Action',
        'Manual triage required.',
      ],
      plan: item.kind === 'requirement'
        ? ['# Plan', '', '## Goal', item.title, '', '## Scope', item.rawInput, '', '## Impact', 'Pending detailed impact.', '', '## Steps']
        : ['# Plan', '', '## Problem', item.rawInput, '', '## Impact', 'Pending detailed impact.', '', '## Reproduction Hypothesis', 'Pending.', '', '## Evidence To Collect'],
      reproduction: ['# Reproduction', '', '## Steps', 'Pending.', '', '## Evidence', task.summary || 'See daemon logs.', '', '## Root Cause', 'Pending.', '', '## Fix Plan'],
      verification: ['# Verification', '', '## Checks Run', 'Pending.', '', '## Evidence', task.summary || 'See daemon logs.', '', '## Result', firstMeaningfulLine(task.summary) || 'Pending result.', '', '## Residual Risk'],
      writeback: ['# Writeback', '', '## Outcome', firstMeaningfulLine(task.summary) || item.title, '', '## Evidence', task.summary || 'See workflow artifacts.', '', '## Reusable Knowledge', 'Pending.', '', '## Follow-ups'],
    };

    return [
      ...headerMap[artifactKey],
      '',
      `Generated by daemon fallback at ${getCurrentTimestamp()} during phase ${phase}.`,
      '',
    ].join('\n');
  }

  private schedulePhase(item: WorkflowItem, phase: WorkflowPhase, actor: string, note?: string): void {
    if (this.hasActiveRun(item)) {
      throw new Error('当前阶段已有进行中的 phase run');
    }

    const previousStage = item.stage;
    const previousBlocker = item.blocker;
    item.stage = phase;
    item.blocker = undefined;
    const phaseRun: WorkflowPhaseRun = {
      id: generateTaskId(`phase-${phase}`),
      phase,
      status: 'queued',
      createdAt: getCurrentTimestamp(),
      triggeredBy: actor,
      note,
      artifactPath: artifactKeyForPhase(phase) ? item.artifactPaths[artifactKeyForPhase(phase) as WorkflowArtifactKey] : undefined,
    };
    item.phaseRuns.push(phaseRun);
    this.touch(item);
    this.persistItem(item);

    try {
      const task = this.scheduleTask(buildWorkflowTaskRequest({
        item,
        phase,
        trackerRoot: this.trackerRoot,
      }));

      phaseRun.taskId = task.id;
      phaseRun.status = task.status;
      item.linkedDaemonTaskIds.push(task.id);
      this.touch(item);
    } catch (error) {
      item.phaseRuns = item.phaseRuns.filter((run) => run.id !== phaseRun.id);
      item.stage = previousStage;
      item.blocker = previousBlocker;
      this.touch(item);
      this.persistItem(item);
      throw error;
    }
  }

  private recordApproval(
    item: WorkflowItem,
    action: WorkflowAction,
    actor: string,
    note: string | undefined,
    toStage: WorkflowStage,
  ): WorkflowApprovalRecord {
    const approval: WorkflowApprovalRecord = {
      action,
      actor,
      note,
      at: getCurrentTimestamp(),
      fromStage: item.stage,
      toStage,
    };
    item.approvals.push(approval);
    return approval;
  }

  private blockItem(item: WorkflowItem, blocker: string, actor: string, preserveCurrentStage: boolean): void {
    const fromStage = item.stage;
    item.blocker = blocker;
    item.stage = 'blocked';
    if (!preserveCurrentStage) {
      this.recordApproval(item, 'block', actor, blocker, 'blocked');
    } else {
      item.approvals.push({
        action: 'block',
        actor,
        note: `Blocked from ${fromStage}: ${blocker}`,
        at: getCurrentTimestamp(),
        fromStage,
        toStage: 'blocked',
      });
    }
    this.touch(item);
  }

  private assertStage(item: WorkflowItem, stages: WorkflowStage[], action: WorkflowAction): void {
    if (!stages.includes(item.stage)) {
      throw new Error(`动作 ${action} 不允许在阶段 ${item.stage} 执行`);
    }
  }

  private hasActiveRun(item: WorkflowItem): boolean {
    const latest = this.getLatestPhaseRun(item);
    return Boolean(latest && RUNNABLE_STAGES.has(item.stage) && (latest.status === 'queued' || latest.status === 'running'));
  }

  private getLatestPhaseRun(item: WorkflowItem, phase?: WorkflowPhase): WorkflowPhaseRun | undefined {
    const runs = phase
      ? item.phaseRuns.filter((run) => run.phase === phase)
      : item.phaseRuns;
    return runs[runs.length - 1];
  }

  private getAvailableActions(item: WorkflowItem): WorkflowAction[] {
    const activeRun = this.hasActiveRun(item);
    const needsTriage = item.sourceMeta?.kind === 'feishu-defect';

    switch (item.stage) {
      case 'intake':
        if (needsTriage) {
          if (!item.triage || item.triage.status === 'pending' || item.triage.status === 'needs_human' || item.triage.status === 'failed') {
            return ['run_triage', 'block'];
          }
          if (item.triage.status === 'running') {
            return ['block'];
          }
          if (item.triage.status === 'ready') {
            return ['generate_plan', 'block'];
          }
        }
        return ['generate_plan', 'block'];
      case 'triaging':
        return activeRun ? ['block'] : ['run_triage', 'block'];
      case 'planning':
        return activeRun ? [] : ['block'];
      case 'awaiting_plan_approval':
        return ['approve_plan', 'request_plan_changes', 'block'];
      case 'reproducing':
        return activeRun ? ['block'] : ['run_reproduction', 'block'];
      case 'awaiting_fix_approval':
        return ['approve_fix_plan', 'request_plan_changes', 'block'];
      case 'executing':
        return activeRun ? ['block'] : ['run_execution', 'block'];
      case 'verifying':
        return activeRun ? ['block'] : ['run_verification', 'block'];
      case 'awaiting_close_approval':
        return ['approve_close', 'block'];
      case 'writing_back':
        return [];
      case 'blocked':
        return ['reopen'];
      case 'completed':
        return ['reopen'];
      default:
        return [];
    }
  }

  private toSummary(item: WorkflowItem): WorkflowItemSummary {
    const latestPhaseRun = this.getLatestPhaseRun(item);
    const verificationRun = this.getLatestPhaseRun(item, 'verifying');
    const availableActions = this.getAvailableActions(item);
    const pendingAction = availableActions.find((action) => action !== 'block' && action !== 'reopen');
    return {
      id: item.id,
      kind: item.kind,
      title: item.title,
      source: item.source,
      stage: item.stage,
      stageLabel: STAGE_LABELS[item.stage],
      priority: item.priority,
      updatedAt: item.updatedAt,
      pendingAction,
      pendingActionLabel: pendingAction ? ACTION_LABELS[pendingAction] : undefined,
      lastVerificationSummary: firstMeaningfulLine(verificationRun?.summary) || firstMeaningfulLine(readTextIfExists(item.artifactPaths.verification)),
      latestPhaseRun,
      isRunning: Boolean(latestPhaseRun && (latestPhaseRun.status === 'queued' || latestPhaseRun.status === 'running')),
      externalIssueId: item.sourceMeta?.externalIssueId,
      attachmentCount: item.sourceMeta?.attachments?.length || 0,
      triageStatus: item.triage?.status,
      triageSummary: item.triage?.summary,
    };
  }

  private loadItems(): void {
    if (!fs.existsSync(this.itemsRoot)) {
      return;
    }

    const itemDirs = fs.readdirSync(this.itemsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);

    itemDirs.forEach((itemId) => {
      const itemPath = path.join(this.itemsRoot, itemId, 'item.json');
      if (!fs.existsSync(itemPath)) {
        return;
      }

      try {
        const parsed = JSON.parse(fs.readFileSync(itemPath, 'utf8')) as WorkflowItem;
        const item = this.normalizeLoadedItem(parsed);
        this.items.set(item.id, item);
      } catch (error) {
        this.log(`[WorkflowService] 读取 item 失败: ${itemPath} ${String(error)}`);
      }
    });

    if (this.items.size === 0 && fs.existsSync(this.indexPath)) {
      try {
        const index = JSON.parse(fs.readFileSync(this.indexPath, 'utf8')) as WorkflowIndexFile;
        index.items.forEach((record) => {
          const itemPath = path.join(this.itemsRoot, record.id, 'item.json');
          if (!fs.existsSync(itemPath)) {
            return;
          }
          const parsed = JSON.parse(fs.readFileSync(itemPath, 'utf8')) as WorkflowItem;
          this.items.set(parsed.id, this.normalizeLoadedItem(parsed));
        });
      } catch (error) {
        this.log(`[WorkflowService] 读取 index 失败: ${String(error)}`);
      }
    }
  }

  private normalizeLoadedItem(item: WorkflowItem): WorkflowItem {
    const itemDir = this.getItemDir(item.id);
    return {
      ...item,
      version: 1,
      approvals: Array.isArray(item.approvals) ? item.approvals : [],
      phaseRuns: Array.isArray(item.phaseRuns) ? item.phaseRuns : [],
      linkedDaemonTaskIds: Array.isArray(item.linkedDaemonTaskIds) ? item.linkedDaemonTaskIds : [],
      artifactPaths: {
        triage: item.artifactPaths?.triage || path.join(itemDir, 'triage.md'),
        plan: item.artifactPaths?.plan || path.join(itemDir, 'plan.md'),
        reproduction: item.artifactPaths?.reproduction || path.join(itemDir, 'reproduction.md'),
        verification: item.artifactPaths?.verification || path.join(itemDir, 'verification.md'),
        writeback: item.artifactPaths?.writeback || path.join(itemDir, 'writeback.md'),
      },
      sourceMeta: item.sourceMeta
        ? {
          ...item.sourceMeta,
          attachments: Array.isArray(item.sourceMeta.attachments) ? item.sourceMeta.attachments : [],
        }
        : undefined,
      triage: item.triage || createInitialTriageState(item.source, item.sourceMeta),
    };
  }

  private recoverInterruptedItems(): void {
    let mutated = false;
    this.items.forEach((item) => {
      if (!RUNNABLE_STAGES.has(item.stage)) {
        return;
      }

      const latest = this.getLatestPhaseRun(item);
      if (latest && (latest.status === 'queued' || latest.status === 'running')) {
        latest.status = 'failed';
        latest.completedAt = getCurrentTimestamp();
        latest.error = 'daemon restarted during active phase';
      }
      this.blockItem(item, 'daemon restarted during active phase', 'system', true);
      this.persistItem(item);
      mutated = true;
    });

    if (mutated) {
      this.writeIndex();
    }
  }

  private writeIndex(): void {
    const index: WorkflowIndexFile = {
      version: 1,
      updatedAt: getCurrentTimestamp(),
      items: this.getSortedItems().map((item) => ({
        id: item.id,
        kind: item.kind,
        title: item.title,
        source: item.source,
        stage: item.stage,
        priority: item.priority,
        updatedAt: item.updatedAt,
      }) satisfies WorkflowIndexRecord),
    };

    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf8');
  }

  private getSortedItems(): WorkflowItem[] {
    return [...this.items.values()].sort((left, right) => {
      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
  }

  private getItemDir(id: string): string {
    return path.join(this.itemsRoot, id);
  }

  private findByExternalIssueId(issueId: string): WorkflowItem | undefined {
    return [...this.items.values()].find((item) => item.sourceMeta?.externalIssueId === issueId);
  }

  private requireItem(id: string): WorkflowItem {
    const item = this.items.get(id);
    if (!item) {
      throw new Error(`workflow item 不存在: ${id}`);
    }
    return item;
  }

  private touch(item: WorkflowItem): void {
    item.updatedAt = getCurrentTimestamp();
  }

  private persistItem(item: WorkflowItem): void {
    const itemDir = this.getItemDir(item.id);
    ensureDir(itemDir);
    fs.writeFileSync(path.join(itemDir, 'item.json'), JSON.stringify(item, null, 2), 'utf8');
  }

  private cloneItem(item: WorkflowItem): WorkflowItem {
    return JSON.parse(JSON.stringify(item)) as WorkflowItem;
  }

  getFeishuUsageText(): string {
    return FEISHU_USAGE_TEXT;
  }

  private validatePlanningResult(itemId: string): {
    ok: boolean;
    reason?: string;
  } {
    const detail = this.getItemDetail(itemId);
    if (detail.item.kind !== 'bug') {
      return { ok: true };
    }

    if (detail.item.sourceMeta?.kind === 'feishu-defect' && detail.item.triage?.status !== 'ready') {
      return {
        ok: false,
        reason: 'triage is not ready for planning',
      };
    }

    if (detail.item.stage !== 'awaiting_plan_approval') {
      return {
        ok: false,
        reason: `item stage ${detail.item.stage} is not awaiting_plan_approval`,
      };
    }

    const plan = detail.artifacts.find((artifact) => artifact.key === 'plan')?.content || '';
    if (!plan.trim()) {
      return {
        ok: false,
        reason: 'plan.md is empty',
      };
    }

    const requiredHeadings = [
      '# Plan',
      '## Problem',
      '## Impact',
      '## Reproduction Hypothesis',
      '## Evidence To Collect',
      '## Initial Fix Direction',
    ];

    const missing = requiredHeadings.filter((heading) => !plan.includes(heading));
    if (missing.length > 0) {
      return {
        ok: false,
        reason: `plan.md missing headings: ${missing.join(', ')}`,
      };
    }

    return { ok: true };
  }

  private validateTriageResult(itemId: string): {
    ok: boolean;
    reason?: string;
    readiness: 'ready' | 'needs_human';
    sourceQuality?: 'high' | 'medium' | 'low';
    nextAction?: 'generate_plan' | 'manual_triage';
    normalizedTitle?: string;
    summary?: string;
  } {
    const detail = this.getItemDetail(itemId);
    const triage = detail.artifacts.find((artifact) => artifact.key === 'triage')?.content || '';
    if (!triage.trim()) {
      return {
        ok: false,
        reason: 'triage.md is empty',
        readiness: 'needs_human',
      };
    }

    const requiredHeadings = [
      '# Triage',
      '## Cleaned Problem',
      '## Source Quality',
      '## Product Context',
      '## Technical Context',
      '## Missing Context',
      '## Likely Surfaces',
      '## Recommended Next Action',
    ];
    const missingHeadings = requiredHeadings.filter((heading) => !triage.includes(heading));
    if (missingHeadings.length > 0) {
      return {
        ok: false,
        reason: `triage.md missing headings: ${missingHeadings.join(', ')}`,
        readiness: 'needs_human',
      };
    }

    const readinessMatch = triage.match(/^- readiness:\s*(ready|needs_human)\s*$/m);
    const sourceQualityMatch = triage.match(/^- source_quality:\s*(high|medium|low)\s*$/m);
    const nextActionMatch = triage.match(/^- next_action:\s*(generate_plan|manual_triage)\s*$/m);
    const normalizedTitleMatch = triage.match(/^- normalized_title:\s*(.+)\s*$/m);

    if (!readinessMatch) {
      return {
        ok: false,
        reason: 'triage.md missing readiness field',
        readiness: 'needs_human',
      };
    }
    if (!sourceQualityMatch) {
      return {
        ok: false,
        reason: 'triage.md missing source_quality field',
        readiness: 'needs_human',
      };
    }
    if (!nextActionMatch) {
      return {
        ok: false,
        reason: 'triage.md missing next_action field',
        readiness: 'needs_human',
      };
    }

    const cleanedProblem = triage.match(/## Cleaned Problem\s+([\s\S]*?)\n## Source Quality/m)?.[1];
    return {
      ok: true,
      readiness: readinessMatch[1] as 'ready' | 'needs_human',
      sourceQuality: sourceQualityMatch[1] as 'high' | 'medium' | 'low',
      nextAction: nextActionMatch[1] as 'generate_plan' | 'manual_triage',
      normalizedTitle: normalizedTitleMatch?.[1]?.trim(),
      summary: firstMeaningfulLine(cleanedProblem),
    };
  }

  getSourceAttachmentPath(itemId: string, attachmentIndex: number): string | undefined {
    const item = this.requireItem(itemId);
    const attachment = item.sourceMeta?.attachments?.[attachmentIndex];
    if (!attachment?.path) {
      return undefined;
    }

    const absolute = path.resolve(attachment.path);
    const allowedRoot = path.resolve(path.join(this.trackerRoot, 'agent-memory'));
    if (!absolute.startsWith(allowedRoot)) {
      return undefined;
    }

    return absolute;
  }
}
