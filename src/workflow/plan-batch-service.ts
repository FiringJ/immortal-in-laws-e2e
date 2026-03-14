import fs from 'fs';
import path from 'path';
import { generateTaskId } from '../daemon/task-utils';
import type { TaskRecord } from '../daemon/agent-executor';
import type {
  WorkflowItem,
  WorkflowItemDetail,
  WorkflowPlanBatchEntry,
  WorkflowPlanBatchFilter,
  WorkflowPlanBatchRun,
  WorkflowPlanBatchSummary,
} from './types';

type WorkflowPlanValidation = {
  ok: boolean;
  reason?: string;
};

type WorkflowPlanBatchServiceOptions = {
  storageRoot: string;
  listItems: () => WorkflowItem[];
  getItemDetail: (id: string) => WorkflowItemDetail;
  triggerGeneratePlan: (itemId: string, note: string) => WorkflowItemDetail;
  blockItem: (itemId: string, reason: string) => WorkflowItemDetail;
  validatePlan: (itemId: string) => WorkflowPlanValidation;
  log?: (message: string) => void;
};

const INDEX_FILE = 'index.json';
const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1 };
const DEFAULT_FILTER: WorkflowPlanBatchFilter = {
  source: 'feishu',
  kind: 'bug',
  priorities: ['P0', 'P1'],
  externalStatuses: ['新增', '待处理'],
  stage: 'intake',
};
const PLAN_BATCH_ACTOR = 'plan-batch';

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function cloneRun<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toFeedbackTime(item: WorkflowItem): number {
  const feedbackDate = item.sourceMeta?.feedbackDate;
  if (!feedbackDate) {
    return 0;
  }
  const timestamp = new Date(feedbackDate).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortItemsForBatch(items: WorkflowItem[]): WorkflowItem[] {
  return [...items].sort((left, right) => {
    const pLeft = PRIORITY_ORDER[left.priority] ?? 99;
    const pRight = PRIORITY_ORDER[right.priority] ?? 99;
    if (pLeft !== pRight) {
      return pLeft - pRight;
    }

    const feedbackLeft = toFeedbackTime(left);
    const feedbackRight = toFeedbackTime(right);
    if (feedbackLeft !== feedbackRight) {
      return feedbackRight - feedbackLeft;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

function buildEntry(item: WorkflowItem, status: WorkflowPlanBatchEntry['status'], reason?: string): WorkflowPlanBatchEntry {
  return {
    itemId: item.id,
    title: item.title,
    priority: item.priority,
    createdAt: item.createdAt,
    externalIssueId: item.sourceMeta?.externalIssueId,
    externalStatus: item.sourceMeta?.externalStatus,
    status,
    reason,
  };
}

function summarizeRun(run: WorkflowPlanBatchRun): WorkflowPlanBatchSummary {
  return {
    id: run.id,
    status: run.status,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    candidateCount: run.candidateCount,
    successCount: run.successCount,
    failedCount: run.failedCount,
    skippedCount: run.skippedCount,
    failedItemId: run.failedItemId,
    failedReason: run.failedReason,
    currentEntryItemId: run.currentEntryItemId,
  };
}

export class WorkflowPlanBatchService {
  private readonly storageRoot: string;
  private readonly indexPath: string;
  private readonly listItems: WorkflowPlanBatchServiceOptions['listItems'];
  private readonly getItemDetail: WorkflowPlanBatchServiceOptions['getItemDetail'];
  private readonly triggerGeneratePlan: WorkflowPlanBatchServiceOptions['triggerGeneratePlan'];
  private readonly blockItem: WorkflowPlanBatchServiceOptions['blockItem'];
  private readonly validatePlan: WorkflowPlanBatchServiceOptions['validatePlan'];
  private readonly log: (message: string) => void;
  private readonly runs: Map<string, WorkflowPlanBatchRun>;

  constructor(options: WorkflowPlanBatchServiceOptions) {
    this.storageRoot = path.resolve(options.storageRoot);
    this.indexPath = path.join(this.storageRoot, INDEX_FILE);
    this.listItems = options.listItems;
    this.getItemDetail = options.getItemDetail;
    this.triggerGeneratePlan = options.triggerGeneratePlan;
    this.blockItem = options.blockItem;
    this.validatePlan = options.validatePlan;
    this.log = options.log || ((message: string) => console.log(message));
    this.runs = new Map();

    ensureDir(this.storageRoot);
    this.loadRuns();
    this.recoverRunningBatches();
    this.writeIndex();
  }

  createDefaultBatch(): WorkflowPlanBatchRun {
    const active = this.getActiveRun();
    if (active) {
      throw new Error(`已有进行中的计划批次: ${active.id}`);
    }

    const items = sortItemsForBatch(this.listItems());
    const entries = items.map((item) => {
      const reason = this.getSkipReason(item);
      return reason ? buildEntry(item, 'skipped', reason) : buildEntry(item, 'pending');
    });

    const run: WorkflowPlanBatchRun = {
      version: 1,
      id: generateTaskId('plan-batch'),
      status: 'running',
      createdAt: nowIso(),
      filter: cloneRun(DEFAULT_FILTER),
      candidateCount: entries.filter((entry) => entry.status === 'pending').length,
      successCount: 0,
      failedCount: 0,
      skippedCount: entries.filter((entry) => entry.status === 'skipped').length,
      entries,
    };

    this.runs.set(run.id, run);

    if (run.candidateCount === 0) {
      run.status = 'completed';
      run.completedAt = nowIso();
      this.persistRun(run);
      this.writeIndex();
      return cloneRun(run);
    }

    this.startNextEntry(run);
    this.persistRun(run);
    this.writeIndex();
    return cloneRun(run);
  }

  listBatches(limit = 10): {
    activeBatchId?: string;
    runs: WorkflowPlanBatchSummary[];
  } {
    const runs = [...this.runs.values()]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, Math.max(1, Math.min(100, limit)))
      .map((run) => summarizeRun(run));

    return {
      activeBatchId: this.getActiveRun()?.id,
      runs,
    };
  }

  getBatch(id: string): WorkflowPlanBatchRun {
    const run = this.runs.get(id);
    if (!run) {
      throw new Error(`plan batch 不存在: ${id}`);
    }
    return cloneRun(run);
  }

  handleTaskUpdate(task: TaskRecord): void {
    if (task.workflowPhase !== 'planning' || !task.workflowItemId) {
      return;
    }

    const active = this.getActiveRun();
    if (!active || active.currentEntryItemId !== task.workflowItemId) {
      return;
    }

    const entry = active.entries.find((candidate) => candidate.itemId === task.workflowItemId);
    if (!entry || entry.status !== 'running') {
      return;
    }

    if (task.status === 'running' || task.status === 'queued') {
      return;
    }

    entry.completedAt = nowIso();

    if (task.status === 'failed') {
      entry.status = 'failed';
      entry.reason = task.error || task.summary || 'planning task failed';
      this.failBatch(active, entry.itemId, entry.reason);
      this.persistRun(active);
      this.writeIndex();
      return;
    }

    const validation = this.validatePlan(entry.itemId);
    if (!validation.ok) {
      entry.status = 'failed';
      entry.reason = validation.reason || 'plan validation failed';
      try {
        this.blockItem(entry.itemId, entry.reason);
      } catch (error) {
        this.log(`[PlanBatch] 标记工作项阻塞失败 (${entry.itemId}): ${String(error)}`);
      }
      this.failBatch(active, entry.itemId, entry.reason);
      this.persistRun(active);
      this.writeIndex();
      return;
    }

    entry.status = 'succeeded';
    entry.reason = undefined;
    active.successCount += 1;
    active.currentEntryItemId = undefined;
    this.startNextEntry(active);
    this.persistRun(active);
    this.writeIndex();
  }

  private getSkipReason(item: WorkflowItem): string | undefined {
    if (item.source !== DEFAULT_FILTER.source) {
      return 'non-feishu source';
    }
    if (item.kind !== DEFAULT_FILTER.kind) {
      return 'non-bug item';
    }
    if (!DEFAULT_FILTER.priorities.includes(item.priority)) {
      return 'priority not in P0/P1';
    }
    if (!item.sourceMeta?.externalStatus) {
      return 'missing external status, requires manual triage';
    }
    if (!DEFAULT_FILTER.externalStatuses.includes(item.sourceMeta.externalStatus)) {
      return `external status ${item.sourceMeta.externalStatus} not eligible`;
    }
    if (item.stage !== DEFAULT_FILTER.stage) {
      return `stage ${item.stage} is not intake`;
    }
    if (item.sourceMeta?.kind === 'feishu-defect' && item.triage?.status !== 'ready') {
      return `triage ${item.triage?.status || 'pending'} not ready`;
    }
    return undefined;
  }

  private startNextEntry(run: WorkflowPlanBatchRun): void {
    const next = run.entries.find((entry) => entry.status === 'pending');
    if (!next) {
      run.status = 'completed';
      run.completedAt = nowIso();
      run.currentEntryItemId = undefined;
      return;
    }

    run.status = 'running';
    run.startedAt = run.startedAt || nowIso();
    run.currentEntryItemId = next.itemId;

    try {
      const detail = this.triggerGeneratePlan(next.itemId, `batch ${run.id}`);
      const latestRun = detail.latestPhaseRun || detail.item.phaseRuns[detail.item.phaseRuns.length - 1];
      next.status = 'running';
      next.startedAt = nowIso();
      next.taskId = latestRun?.taskId;
    } catch (error) {
      next.status = 'failed';
      next.startedAt = nowIso();
      next.completedAt = nowIso();
      next.reason = error instanceof Error ? error.message : String(error);
      this.failBatch(run, next.itemId, next.reason);
    }
  }

  private failBatch(run: WorkflowPlanBatchRun, itemId: string, reason: string): void {
    run.status = 'failed';
    run.completedAt = nowIso();
    run.currentEntryItemId = undefined;
    run.failedCount = 1;
    run.failedItemId = itemId;
    run.failedReason = reason;
  }

  private getActiveRun(): WorkflowPlanBatchRun | undefined {
    return [...this.runs.values()].find((run) => run.status === 'running');
  }

  private loadRuns(): void {
    if (!fs.existsSync(this.storageRoot)) {
      return;
    }

    const entries = fs.readdirSync(this.storageRoot, { withFileTypes: true });
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== INDEX_FILE)
      .forEach((entry) => {
        const filePath = path.join(this.storageRoot, entry.name);
        try {
          const run = JSON.parse(fs.readFileSync(filePath, 'utf8')) as WorkflowPlanBatchRun;
          this.runs.set(run.id, run);
        } catch (error) {
          this.log(`[PlanBatch] 读取批次失败: ${filePath} ${String(error)}`);
        }
      });
  }

  private recoverRunningBatches(): void {
    let mutated = false;
    this.runs.forEach((run) => {
      if (run.status !== 'running') {
        return;
      }

      run.status = 'failed';
      run.completedAt = nowIso();
      run.failedCount = Math.max(1, run.failedCount);
      run.failedReason = 'daemon restarted during active batch';
      if (run.currentEntryItemId) {
        run.failedItemId = run.currentEntryItemId;
        const entry = run.entries.find((candidate) => candidate.itemId === run.currentEntryItemId);
        if (entry && entry.status === 'running') {
          entry.status = 'failed';
          entry.completedAt = nowIso();
          entry.reason = 'daemon restarted during active batch';
        }
      }
      run.currentEntryItemId = undefined;
      this.persistRun(run);
      mutated = true;
    });

    if (mutated) {
      this.writeIndex();
    }
  }

  private persistRun(run: WorkflowPlanBatchRun): void {
    ensureDir(this.storageRoot);
    fs.writeFileSync(path.join(this.storageRoot, `${run.id}.json`), JSON.stringify(run, null, 2), 'utf8');
  }

  private writeIndex(): void {
    const summaries = [...this.runs.values()]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((run) => summarizeRun(run));
    fs.writeFileSync(this.indexPath, JSON.stringify({
      version: 1,
      updatedAt: nowIso(),
      runs: summaries,
    }, null, 2), 'utf8');
  }
}
