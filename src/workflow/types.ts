import type { AgentKind, TaskStatus } from '../daemon/agent-executor';

export const WORKFLOW_KINDS = ['requirement', 'bug'] as const;
export type WorkflowKind = (typeof WORKFLOW_KINDS)[number];

export const WORKFLOW_STAGES = [
  'intake',
  'triaging',
  'planning',
  'awaiting_plan_approval',
  'reproducing',
  'awaiting_fix_approval',
  'executing',
  'verifying',
  'awaiting_close_approval',
  'writing_back',
  'completed',
  'blocked',
] as const;
export type WorkflowStage = (typeof WORKFLOW_STAGES)[number];

export const WORKFLOW_ACTIONS = [
  'run_triage',
  'generate_plan',
  'approve_plan',
  'request_plan_changes',
  'run_reproduction',
  'approve_fix_plan',
  'run_execution',
  'run_verification',
  'approve_close',
  'block',
  'reopen',
] as const;
export type WorkflowAction = (typeof WORKFLOW_ACTIONS)[number];

export const WORKFLOW_PHASES = [
  'triaging',
  'planning',
  'reproducing',
  'executing',
  'verifying',
  'writing_back',
] as const;
export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

export const WORKFLOW_ARTIFACT_KEYS = [
  'triage',
  'plan',
  'reproduction',
  'verification',
  'writeback',
] as const;
export type WorkflowArtifactKey = (typeof WORKFLOW_ARTIFACT_KEYS)[number];

export type WorkflowSource = 'manual' | 'feishu';
export type WorkflowBoardStatus = 'all' | 'active' | 'blocked' | 'completed';
export type WorkflowPlanBatchStatus = 'running' | 'completed' | 'failed';
export type WorkflowPlanBatchEntryStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
export type WorkflowTriageStatus = 'pending' | 'running' | 'ready' | 'needs_human' | 'failed';
export type WorkflowTriageSourceQuality = 'high' | 'medium' | 'low';
export type WorkflowTriageBatchStatus = 'running' | 'completed' | 'failed';
export type WorkflowTriageBatchEntryStatus = 'pending' | 'running' | 'ready' | 'needs_human' | 'failed' | 'skipped';

export type WorkflowArtifactPaths = Record<WorkflowArtifactKey, string>;

export type WorkflowPhaseRun = {
  id: string;
  phase: WorkflowPhase;
  status: TaskStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  triggeredBy: string;
  note?: string;
  taskId?: string;
  summary?: string;
  stdoutPath?: string;
  stderrPath?: string;
  summaryPath?: string;
  artifactPath?: string;
  error?: string;
};

export type WorkflowApprovalRecord = {
  action: WorkflowAction;
  actor: string;
  note?: string;
  at: string;
  fromStage: WorkflowStage;
  toStage: WorkflowStage;
};

export type WorkflowSourceContext = {
  userId?: string;
  messageId?: string;
  chatId?: string;
};

export type WorkflowSourceAttachment = {
  name: string;
  path?: string;
  url?: string;
  contentType?: string;
};

export type WorkflowExternalSourceMeta = {
  kind: 'feishu-defect';
  externalIssueId: string;
  externalRowHash?: string;
  sourceUrl: string;
  externalStatus?: string;
  reporter?: string;
  assignee?: string;
  parentRecord?: string;
  feedbackDate?: string;
  notes?: string;
  review?: string;
  attachments: WorkflowSourceAttachment[];
  syncedAt: string;
};

export type WorkflowTriageState = {
  status: WorkflowTriageStatus;
  sourceQuality?: WorkflowTriageSourceQuality;
  nextAction?: 'generate_plan' | 'manual_triage';
  normalizedTitle?: string;
  summary?: string;
  updatedAt: string;
};

export type WorkflowItem = {
  version: 1;
  id: string;
  kind: WorkflowKind;
  title: string;
  source: WorkflowSource;
  rawInput: string;
  acceptanceCriteria?: string;
  preferredAgent?: AgentKind;
  cwd: string;
  priority: string;
  stage: WorkflowStage;
  createdAt: string;
  updatedAt: string;
  approvals: WorkflowApprovalRecord[];
  phaseRuns: WorkflowPhaseRun[];
  artifactPaths: WorkflowArtifactPaths;
  linkedDaemonTaskIds: string[];
  blocker?: string;
  sourceContext?: WorkflowSourceContext;
  sourceMeta?: WorkflowExternalSourceMeta;
  triage?: WorkflowTriageState;
};

export type WorkflowIndexRecord = {
  id: string;
  kind: WorkflowKind;
  title: string;
  source: WorkflowSource;
  stage: WorkflowStage;
  priority: string;
  updatedAt: string;
};

export type WorkflowIndexFile = {
  version: 1;
  updatedAt: string;
  items: WorkflowIndexRecord[];
};

export type WorkflowItemSummary = {
  id: string;
  kind: WorkflowKind;
  title: string;
  source: WorkflowSource;
  stage: WorkflowStage;
  stageLabel: string;
  priority: string;
  updatedAt: string;
  pendingAction?: WorkflowAction;
  pendingActionLabel?: string;
  lastVerificationSummary?: string;
  latestPhaseRun?: WorkflowPhaseRun;
  isRunning: boolean;
  externalIssueId?: string;
  attachmentCount?: number;
  triageStatus?: WorkflowTriageStatus;
  triageSummary?: string;
};

export type WorkflowBoardColumnKey = 'intake' | 'approvals' | 'active' | 'verification' | 'completed' | 'blocked';

export type WorkflowBoardColumn = {
  key: WorkflowBoardColumnKey;
  label: string;
  items: WorkflowItemSummary[];
};

export type WorkflowPlanBatchFilter = {
  source: 'feishu';
  kind: 'bug';
  priorities: string[];
  externalStatuses: string[];
  stage: 'intake';
};

export type WorkflowPlanBatchEntry = {
  itemId: string;
  title: string;
  priority: string;
  createdAt: string;
  externalIssueId?: string;
  externalStatus?: string;
  status: WorkflowPlanBatchEntryStatus;
  reason?: string;
  startedAt?: string;
  completedAt?: string;
  taskId?: string;
};

export type WorkflowPlanBatchRun = {
  version: 1;
  id: string;
  status: WorkflowPlanBatchStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  filter: WorkflowPlanBatchFilter;
  candidateCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  failedItemId?: string;
  failedReason?: string;
  currentEntryItemId?: string;
  entries: WorkflowPlanBatchEntry[];
};

export type WorkflowPlanBatchSummary = {
  id: string;
  status: WorkflowPlanBatchStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  candidateCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  failedItemId?: string;
  failedReason?: string;
  currentEntryItemId?: string;
};

export type WorkflowTriageBatchEntry = {
  itemId: string;
  title: string;
  priority: string;
  createdAt: string;
  externalIssueId?: string;
  externalStatus?: string;
  status: WorkflowTriageBatchEntryStatus;
  reason?: string;
  startedAt?: string;
  completedAt?: string;
  taskId?: string;
  triageStatus?: WorkflowTriageStatus;
};

export type WorkflowTriageBatchRun = {
  version: 1;
  id: string;
  status: WorkflowTriageBatchStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  candidateCount: number;
  readyCount: number;
  needsHumanCount: number;
  failedCount: number;
  skippedCount: number;
  failedReason?: string;
  currentEntryItemId?: string;
  entries: WorkflowTriageBatchEntry[];
};

export type WorkflowTriageBatchSummary = {
  id: string;
  status: WorkflowTriageBatchStatus;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  candidateCount: number;
  readyCount: number;
  needsHumanCount: number;
  failedCount: number;
  skippedCount: number;
  failedReason?: string;
  currentEntryItemId?: string;
};

export type WorkflowItemDetail = {
  item: WorkflowItem;
  availableActions: WorkflowAction[];
  latestPhaseRun?: WorkflowPhaseRun;
  artifacts: Array<{
    key: WorkflowArtifactKey;
    path: string;
    content: string;
  }>;
};

export type WorkflowCreateInput = {
  kind: WorkflowKind;
  title: string;
  rawInput: string;
  acceptanceCriteria?: string;
  preferredAgent?: AgentKind;
  cwd?: string;
  source?: WorkflowSource;
  priority?: string;
  sourceContext?: WorkflowSourceContext;
  sourceMeta?: WorkflowExternalSourceMeta;
};

export type WorkflowActionInput = {
  action: WorkflowAction;
  actor?: string;
  note?: string;
};

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  intake: '待整理',
  triaging: 'Triage 中',
  planning: '生成 Plan 中',
  awaiting_plan_approval: '待审批 Plan',
  reproducing: '待复现',
  awaiting_fix_approval: '待审批修复',
  executing: '待执行',
  verifying: '待验证',
  awaiting_close_approval: '待关闭审批',
  writing_back: '落盘反哺中',
  completed: '已完成',
  blocked: '已阻塞',
};

export const BOARD_COLUMN_LABELS: Record<WorkflowBoardColumnKey, string> = {
  intake: '待整理',
  approvals: '待审批',
  active: '执行中',
  verification: '待验证',
  completed: '已完成',
  blocked: '已阻塞',
};

export const ACTION_LABELS: Record<WorkflowAction, string> = {
  run_triage: '执行 Triage',
  generate_plan: '生成 Plan',
  approve_plan: '批准 Plan',
  request_plan_changes: '退回修改',
  run_reproduction: '复现并定位',
  approve_fix_plan: '批准修复',
  run_execution: '执行',
  run_verification: '发起验证',
  approve_close: '关闭任务',
  block: '阻塞',
  reopen: '重新打开',
};
