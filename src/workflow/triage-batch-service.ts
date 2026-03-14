import fs from 'fs';
import path from 'path';
import { generateTaskId } from '../daemon/task-utils';
import type { TaskRecord } from '../daemon/agent-executor';
import type {
  WorkflowItem,
  WorkflowItemDetail,
  WorkflowTriageBatchEntry,
  WorkflowTriageBatchRun,
  WorkflowTriageBatchSummary,
  WorkflowTriageStatus,
} from './types';

type WorkflowTriageValidation = {
  ok: boolean;
  reason?: string;
  readiness: 'ready' | 'needs_human';
};

type WorkflowTriageBatchServiceOptions = {
  storageRoot: string;
  listItems: () => WorkflowItem[];
  getItemDetail: (id: string) => WorkflowItemDetail;
  triggerRunTriage: (itemId: string, note: string) => WorkflowItemDetail;
  validateTriage: (itemId: string) => WorkflowTriageValidation;
  log?: (message: string) => void;
};

const INDEX_FILE = 'index.json';
const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function nowIso(): string {
  return new Date().toISOString();
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function summarizeRun(run: WorkflowTriageBatchRun): WorkflowTriageBatchSummary {
  return {
    id: run.id,
    status: run.status,
    createdAt: run.createdAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    candidateCount: run.candidateCount,
    readyCount: run.readyCount,
    needsHumanCount: run.needsHumanCount,
    failedCount: run.failedCount,
    skippedCount: run.skippedCount,
    failedReason: run.failedReason,
    currentEntryItemId: run.currentEntryItemId,
  };
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

function buildEntry(item: WorkflowItem, status: WorkflowTriageBatchEntry['status'], reason?: string): WorkflowTriageBatchEntry {
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

export class WorkflowTriageBatchService {
  private readonly storageRoot: string;
  private readonly indexPath: string;
  private readonly listItems: WorkflowTriageBatchServiceOptions['listItems'];
  private readonly getItemDetail: WorkflowTriageBatchServiceOptions['getItemDetail'];
  private readonly triggerRunTriage: WorkflowTriageBatchServiceOptions['triggerRunTriage'];
  private readonly validateTriage: WorkflowTriageBatchServiceOptions['validateTriage'];
  private readonly log: (message: string) => void;
  private readonly runs: Map<string, WorkflowTriageBatchRun>;

  constructor(options: WorkflowTriageBatchServiceOptions) {
    this.storageRoot = path.resolve(options.storageRoot);
    this.indexPath = path.join(this.storageRoot, INDEX_FILE);
    this.listItems = options.listItems;
    this.getItemDetail = options.getItemDetail;
    this.triggerRunTriage = options.triggerRunTriage;
    this.validateTriage = options.validateTriage;
    this.log = options.log || ((message: string) => console.log(message));
    this.runs = new Map();

    ensureDir(this.storageRoot);
    this.loadRuns();
    this.recoverRunningBatches();
    this.writeIndex();
  }

  createDefaultBatch(): WorkflowTriageBatchRun {
    const active = this.getActiveRun();
    if (active) {
      throw new Error(`已有进行中的 triage 批次: ${active.id}`);
    }

    const entries = sortItemsForBatch(this.listItems()).map((item) => {
      const reason = this.getSkipReason(item);
      return reason ? buildEntry(item, 'skipped', reason) : buildEntry(item, 'pending');
    });

    const run: WorkflowTriageBatchRun = {
      version: 1,
      id: generateTaskId('triage-batch'),
      status: 'running',
      createdAt: nowIso(),
      candidateCount: entries.filter((entry) => entry.status === 'pending').length,
      readyCount: 0,
      needsHumanCount: 0,
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
      return clone(run);
    }

    this.startNextEntry(run);
    this.persistRun(run);
    this.writeIndex();
    return clone(run);
  }

  listBatches(limit = 10): {
    activeBatchId?: string;
    runs: WorkflowTriageBatchSummary[];
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

  getBatch(id: string): WorkflowTriageBatchRun {
    const run = this.runs.get(id);
    if (!run) {
      throw new Error(`triage batch 不存在: ${id}`);
    }
    return clone(run);
  }

  handleTaskUpdate(task: TaskRecord): void {
    if (task.workflowPhase !== 'triaging' || !task.workflowItemId) {
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
      entry.reason = task.error || task.summary || 'triage task failed';
      active.failedCount += 1;
      active.currentEntryItemId = undefined;
      this.startNextEntry(active);
      this.persistRun(active);
      this.writeIndex();
      return;
    }

    const validation = this.validateTriage(entry.itemId);
    if (!validation.ok) {
      entry.status = 'failed';
      entry.reason = validation.reason || 'triage validation failed';
      active.failedCount += 1;
      active.currentEntryItemId = undefined;
      this.startNextEntry(active);
      this.persistRun(active);
      this.writeIndex();
      return;
    }

    entry.status = validation.readiness;
    entry.triageStatus = validation.readiness;
    if (validation.readiness === 'ready') {
      active.readyCount += 1;
    } else {
      active.needsHumanCount += 1;
    }
    active.currentEntryItemId = undefined;
    this.startNextEntry(active);
    this.persistRun(active);
    this.writeIndex();
  }

  private getSkipReason(item: WorkflowItem): string | undefined {
    if (item.source !== 'feishu') {
      return 'non-feishu source';
    }
    if (item.kind !== 'bug') {
      return 'non-bug item';
    }
    if (item.stage !== 'intake') {
      return `stage ${item.stage} is not intake`;
    }
    if (item.triage?.status === 'ready') {
      return 'triage already ready';
    }
    if (item.triage?.status === 'running') {
      return 'triage already running';
    }
    return undefined;
  }

  private startNextEntry(run: WorkflowTriageBatchRun): void {
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
      const detail = this.triggerRunTriage(next.itemId, `batch ${run.id}`);
      const latestRun = detail.latestPhaseRun || detail.item.phaseRuns[detail.item.phaseRuns.length - 1];
      next.status = 'running';
      next.startedAt = nowIso();
      next.taskId = latestRun?.taskId;
    } catch (error) {
      next.status = 'failed';
      next.startedAt = nowIso();
      next.completedAt = nowIso();
      next.reason = error instanceof Error ? error.message : String(error);
      run.failedCount += 1;
      run.currentEntryItemId = undefined;
      this.startNextEntry(run);
    }
  }

  private getActiveRun(): WorkflowTriageBatchRun | undefined {
    return [...this.runs.values()].find((run) => run.status === 'running');
  }

  private loadRuns(): void {
    if (!fs.existsSync(this.storageRoot)) {
      return;
    }
    fs.readdirSync(this.storageRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== INDEX_FILE)
      .forEach((entry) => {
        const filePath = path.join(this.storageRoot, entry.name);
        try {
          const run = JSON.parse(fs.readFileSync(filePath, 'utf8')) as WorkflowTriageBatchRun;
          this.runs.set(run.id, run);
        } catch (error) {
          this.log(`[TriageBatch] 读取批次失败: ${filePath} ${String(error)}`);
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
      run.failedReason = 'daemon restarted during active triage batch';
      if (run.currentEntryItemId) {
        const entry = run.entries.find((candidate) => candidate.itemId === run.currentEntryItemId);
        if (entry && entry.status === 'running') {
          entry.status = 'failed';
          entry.reason = 'daemon restarted during active triage batch';
          entry.completedAt = nowIso();
          run.failedCount += 1;
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

  private persistRun(run: WorkflowTriageBatchRun): void {
    ensureDir(this.storageRoot);
    fs.writeFileSync(path.join(this.storageRoot, `${run.id}.json`), JSON.stringify(run, null, 2), 'utf8');
  }

  private writeIndex(): void {
    const runs = [...this.runs.values()]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .map((run) => summarizeRun(run));
    fs.writeFileSync(this.indexPath, JSON.stringify({
      version: 1,
      updatedAt: nowIso(),
      runs,
    }, null, 2), 'utf8');
  }
}
