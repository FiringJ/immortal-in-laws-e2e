import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { WorkflowService } from '../workflow/service';
import type { TaskRecord, TaskRequest } from '../daemon/agent-executor';

function createTempTrackerRoot(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'workflow-service-'));
  fs.mkdirSync(path.join(root, 'agent-memory'), { recursive: true });
  fs.writeFileSync(path.join(root, 'agent-memory/project-knowledge.md'), '# Project Knowledge\n', 'utf8');
  fs.writeFileSync(path.join(root, 'agent-memory/known-issues.md'), '# Known Issues\n', 'utf8');
  fs.writeFileSync(path.join(root, 'agent-memory/user-feedback-ledger.md'), '# Feedback Ledger\n', 'utf8');
  return root;
}

function createScheduler() {
  const scheduled: TaskRecord[] = [];

  return {
    scheduled,
    scheduleTask(request: TaskRequest): TaskRecord {
      const task: TaskRecord = {
        ...request,
        id: `task-${scheduled.length + 1}`,
        status: 'queued',
        createdAt: new Date().toISOString(),
      };
      scheduled.push(task);
      return task;
    },
  };
}

function completeTask(
  service: WorkflowService,
  task: TaskRecord,
  summary: string,
  status: 'completed' | 'failed' = 'completed',
): void {
  const startedAt = new Date().toISOString();
  service.handleTaskUpdate({
    ...task,
    status: 'running',
    startedAt,
  });
  service.handleTaskUpdate({
    ...task,
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    summary,
    stdoutPath: '/tmp/stdout.log',
    stderrPath: '/tmp/stderr.log',
    summaryPath: '/tmp/summary.txt',
    error: status === 'failed' ? summary : undefined,
  });
}

function createFeishuBug(
  service: WorkflowService,
  trackerRoot: string,
  input: {
    title: string;
    priority: string;
    status?: string;
    stage?: 'intake' | 'awaiting_plan_approval';
    source?: 'feishu' | 'manual';
  },
) {
  const item = service.createItem({
    kind: 'bug',
    title: input.title,
    rawInput: input.title,
    source: input.source || 'feishu',
    priority: input.priority,
    cwd: trackerRoot,
    sourceMeta: input.source === 'manual' ? undefined : {
      kind: 'feishu-defect',
      externalIssueId: `ext-${input.title}`,
      sourceUrl: 'https://example.feishu.cn/wiki/bug',
      externalStatus: input.status,
      feedbackDate: '2026-03-14',
      attachments: [],
      syncedAt: new Date().toISOString(),
    },
  });

  if (input.stage === 'awaiting_plan_approval') {
    const internal = (service as any).items.get(item.id);
    internal.stage = 'awaiting_plan_approval';
    internal.updatedAt = new Date().toISOString();
    (service as any).persistItem(internal);
  }

  return service.getItemDetail(item.id).item;
}

function writeValidBugPlan(itemId: string, trackerRoot: string): void {
  const planPath = path.join(trackerRoot, 'agent-memory/workflows/items', itemId, 'plan.md');
  fs.writeFileSync(planPath, [
    '# Plan',
    '',
    '## Problem',
    'problem',
    '',
    '## Impact',
    'impact',
    '',
    '## Reproduction Hypothesis',
    'hypothesis',
    '',
    '## Evidence To Collect',
    'evidence',
    '',
    '## Initial Fix Direction',
    'fix direction',
    '',
  ].join('\n'), 'utf8');
}

function writeValidTriage(itemId: string, trackerRoot: string, readiness: 'ready' | 'needs_human' = 'ready'): void {
  const triagePath = path.join(trackerRoot, 'agent-memory/workflows/items', itemId, 'triage.md');
  fs.writeFileSync(triagePath, [
    '# Triage',
    `- readiness: ${readiness}`,
    `- source_quality: ${readiness === 'ready' ? 'high' : 'low'}`,
    `- next_action: ${readiness === 'ready' ? 'generate_plan' : 'manual_triage'}`,
    '- normalized_title: cleaned title',
    '',
    '## Cleaned Problem',
    'cleaned problem',
    '',
    '## Source Quality',
    'source quality',
    '',
    '## Product Context',
    'product context',
    '',
    '## Technical Context',
    'technical context',
    '',
    '## Missing Context',
    'missing context',
    '',
    '## Likely Surfaces',
    'surfaces',
    '',
    '## Recommended Next Action',
    'next action',
    '',
  ].join('\n'), 'utf8');
}

function markItemTriageReady(service: WorkflowService, itemId: string): void {
  const internal = (service as any).items.get(itemId);
  internal.triage = {
    status: 'ready',
    sourceQuality: 'high',
    nextAction: 'generate_plan',
    normalizedTitle: internal.title,
    summary: 'ready',
    updatedAt: new Date().toISOString(),
  };
  (service as any).persistItem(internal);
}

test('requirement workflow runs through plan, execution, verification, and writeback', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const item = service.createItem({
    kind: 'requirement',
    title: '优化消息记录页工作流',
    rawInput: '把消息记录页的需求流接入新的 workflow 面板',
    acceptanceCriteria: '看板可创建需求并完成闭环',
    cwd: trackerRoot,
  });

  assert.equal(item.stage, 'intake');

  service.handleAction(item.id, { action: 'generate_plan', actor: 'test' });
  completeTask(service, scheduler.scheduled[0], 'Plan generated');
  assert.equal(service.getItemDetail(item.id).item.stage, 'awaiting_plan_approval');
  assert.match(service.getItemDetail(item.id).artifacts.find((artifact) => artifact.key === 'plan')?.content || '', /# Plan/);

  service.handleAction(item.id, { action: 'approve_plan', actor: 'test' });
  service.handleAction(item.id, { action: 'run_execution', actor: 'test' });
  completeTask(service, scheduler.scheduled[1], 'Implemented requirement');
  assert.equal(service.getItemDetail(item.id).item.stage, 'verifying');

  service.handleAction(item.id, { action: 'run_verification', actor: 'test' });
  completeTask(service, scheduler.scheduled[2], '验证通过');
  assert.equal(service.getItemDetail(item.id).item.stage, 'awaiting_close_approval');
  assert.ok(fs.existsSync(path.join(trackerRoot, 'agent-memory/workflows/items', item.id, 'verification.md')));

  service.handleAction(item.id, { action: 'approve_close', actor: 'test' });
  completeTask(service, scheduler.scheduled[3], 'Writeback completed');

  const detail = service.getItemDetail(item.id);
  assert.equal(detail.item.stage, 'completed');
  assert.ok(fs.existsSync(path.join(trackerRoot, 'agent-memory/workflows/items', item.id, 'writeback.md')));
  assert.match(fs.readFileSync(path.join(trackerRoot, 'agent-memory/project-knowledge.md'), 'utf8'), new RegExp(item.id));
  assert.match(fs.readFileSync(path.join(trackerRoot, 'agent-memory/user-feedback-ledger.md'), 'utf8'), new RegExp(item.id));
});

test('bug workflow requires reproduction before fix approval and writes known issues', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const parsed = service.parseFeishuCommand('/bug /claude 聊天页发送图片后预览错位');
  assert.equal(parsed.matched, true);
  if (!parsed.matched) {
    throw new Error('expected bug command to match');
  }

  const item = service.createItem({
    kind: parsed.kind,
    title: '聊天页发送图片后预览错位',
    rawInput: parsed.rawInput,
    preferredAgent: parsed.preferredAgent,
    source: 'feishu',
    cwd: trackerRoot,
  });

  service.handleAction(item.id, { action: 'generate_plan', actor: 'test' });
  completeTask(service, scheduler.scheduled[0], 'Bug plan generated');
  service.handleAction(item.id, { action: 'approve_plan', actor: 'test' });

  assert.throws(() => service.handleAction(item.id, { action: 'run_execution', actor: 'test' }));

  service.handleAction(item.id, { action: 'run_reproduction', actor: 'test' });
  completeTask(service, scheduler.scheduled[1], '定位完成，根因明确');
  assert.equal(service.getItemDetail(item.id).item.stage, 'awaiting_fix_approval');
  assert.ok(fs.existsSync(path.join(trackerRoot, 'agent-memory/workflows/items', item.id, 'reproduction.md')));

  service.handleAction(item.id, { action: 'approve_fix_plan', actor: 'test' });
  service.handleAction(item.id, { action: 'run_execution', actor: 'test' });
  completeTask(service, scheduler.scheduled[2], 'Bug fixed');

  service.handleAction(item.id, { action: 'run_verification', actor: 'test' });
  completeTask(service, scheduler.scheduled[3], '验证通过');

  service.handleAction(item.id, { action: 'approve_close', actor: 'test' });
  completeTask(service, scheduler.scheduled[4], 'Writeback completed');

  const detail = service.getItemDetail(item.id);
  assert.equal(detail.item.stage, 'completed');
  assert.match(fs.readFileSync(path.join(trackerRoot, 'agent-memory/known-issues.md'), 'utf8'), new RegExp(item.id));
});

test('restart recovery blocks items that were mid-phase', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const item = service.createItem({
    kind: 'requirement',
    title: '恢复场景',
    rawInput: '模拟 daemon 重启',
    cwd: trackerRoot,
  });

  service.handleAction(item.id, { action: 'generate_plan', actor: 'test' });
  const recovered = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const detail = recovered.getItemDetail(item.id);
  assert.equal(detail.item.stage, 'blocked');
  assert.match(detail.item.blocker || '', /daemon restarted during active phase/);
});

test('feishu defect sync imports bug items and exposes local attachments', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const attachmentPath = path.join(trackerRoot, 'agent-memory/defect-reports/attachments/bug_x/demo.png');
  fs.mkdirSync(path.dirname(attachmentPath), { recursive: true });
  fs.writeFileSync(attachmentPath, 'png', 'utf8');

  const result = service.syncFeishuDefectItems([{
    issueId: 'bug_test123',
    rowHash: 'hash_a',
    section: '漏洞跟踪记录',
    priority: 'P1',
    status: '新增',
    reporter: 'tester',
    assignee: 'owner',
    feedbackTime: Date.now(),
    feedbackDate: '2026-03-14',
    parentRecord: '设置页',
    description: '通知权限弹窗交互错误',
    notes: '带截图',
    review: '',
    sourceUrl: 'https://example.feishu.cn/wiki/abc?table=tbl',
    recordId: 'rec123',
    attachments: [{
      name: 'demo.png',
      downloadedPath: attachmentPath,
      tmpDownloadUrl: 'https://tmp.example/demo.png',
      contentType: 'image/png',
    }],
  }]);

  assert.equal(result.created, 1);
  const detail = service.getItemDetail(result.itemIds[0]);
  assert.equal(detail.item.kind, 'bug');
  assert.equal(detail.item.sourceMeta?.externalIssueId, 'bug_test123');
  assert.equal(service.getSourceAttachmentPath(detail.item.id, 0), attachmentPath);
  assert.equal(detail.item.triage?.status, 'pending');
});

test('feishu bug requires triage before plan generation', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const item = createFeishuBug(service, trackerRoot, {
    title: 'Need triage first',
    priority: 'P0',
    status: '新增',
  });

  assert.deepEqual(service.getItemDetail(item.id).availableActions, ['run_triage', 'block']);
  assert.throws(() => service.handleAction(item.id, { action: 'generate_plan', actor: 'test' }));

  service.handleAction(item.id, { action: 'run_triage', actor: 'test' });
  writeValidTriage(item.id, trackerRoot, 'ready');
  completeTask(service, scheduler.scheduled[0], 'triage ready');

  const detail = service.getItemDetail(item.id);
  assert.equal(detail.item.stage, 'intake');
  assert.equal(detail.item.triage?.status, 'ready');
  assert.deepEqual(detail.availableActions, ['generate_plan', 'block']);
});

test('triage batch classifies ready and needs_human items', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const readyItem = createFeishuBug(service, trackerRoot, {
    title: 'Ready item',
    priority: 'P0',
    status: '新增',
  });
  const needsHumanItem = createFeishuBug(service, trackerRoot, {
    title: 'Needs human item',
    priority: 'P1',
    status: '新增',
  });

  const batch = service.createDefaultBugTriageBatch();
  assert.equal(batch.candidateCount, 2);
  assert.equal(scheduler.scheduled.length, 1);

  writeValidTriage(readyItem.id, trackerRoot, 'ready');
  completeTask(service, scheduler.scheduled[0], 'triage ready');
  assert.equal(scheduler.scheduled.length, 2);

  writeValidTriage(needsHumanItem.id, trackerRoot, 'needs_human');
  completeTask(service, scheduler.scheduled[1], 'triage needs human');

  const finalBatch = service.getTriageBatch(batch.id);
  assert.equal(finalBatch.status, 'completed');
  assert.equal(finalBatch.readyCount, 1);
  assert.equal(finalBatch.needsHumanCount, 1);
  assert.equal(service.getItemDetail(needsHumanItem.id).item.triage?.status, 'needs_human');
});

test('plan batch filters only eligible feishu P0/P1 intake bugs', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const eligible = createFeishuBug(service, trackerRoot, {
    title: 'P0 eligible',
    priority: 'P0',
    status: '新增',
  });
  markItemTriageReady(service, eligible.id);
  createFeishuBug(service, trackerRoot, {
    title: 'Needs triage skip',
    priority: 'P1',
    status: '新增',
  });
  createFeishuBug(service, trackerRoot, {
    title: 'P2 skip',
    priority: 'P2',
    status: '新增',
  });
  createFeishuBug(service, trackerRoot, {
    title: 'Done skip',
    priority: 'P1',
    status: '待发版验证',
  });
  createFeishuBug(service, trackerRoot, {
    title: 'Stage skip',
    priority: 'P1',
    status: '新增',
    stage: 'awaiting_plan_approval',
  });
  createFeishuBug(service, trackerRoot, {
    title: 'Manual skip',
    priority: 'P1',
    source: 'manual',
  });
  service.createItem({
    kind: 'bug',
    title: 'Missing status',
    rawInput: 'missing status',
    source: 'feishu',
    priority: 'P1',
    cwd: trackerRoot,
    sourceMeta: {
      kind: 'feishu-defect',
      externalIssueId: 'ext-missing',
      sourceUrl: 'https://example.feishu.cn/wiki/bug',
      attachments: [],
      syncedAt: new Date().toISOString(),
    },
  });

  const batch = service.createDefaultBugPlanBatch();
  assert.equal(batch.candidateCount, 1);
  assert.equal(batch.skippedCount, 6);
  assert.equal(batch.currentEntryItemId, eligible.id);
  assert.equal(scheduler.scheduled.length, 1);

  const detail = service.getPlanBatch(batch.id);
  const skippedReasons = detail.entries.filter((entry) => entry.status === 'skipped').map((entry) => entry.reason);
  assert.ok(skippedReasons.includes('priority not in P0/P1'));
  assert.ok(skippedReasons.includes('non-feishu source'));
  assert.ok(skippedReasons.includes('missing external status, requires manual triage'));
  assert.ok(skippedReasons.some((reason) => String(reason).includes('stage awaiting_plan_approval')));
  assert.ok(skippedReasons.some((reason) => String(reason).includes('triage')));
});

test('plan batch runs eligible bugs serially and completes after valid plans', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const first = createFeishuBug(service, trackerRoot, {
    title: 'First P0',
    priority: 'P0',
    status: '新增',
  });
  markItemTriageReady(service, first.id);
  const second = createFeishuBug(service, trackerRoot, {
    title: 'Second P1',
    priority: 'P1',
    status: '待处理',
  });
  markItemTriageReady(service, second.id);

  const batch = service.createDefaultBugPlanBatch();
  assert.equal(batch.candidateCount, 2);
  assert.equal(scheduler.scheduled.length, 1);

  writeValidBugPlan(first.id, trackerRoot);
  completeTask(service, scheduler.scheduled[0], 'first plan generated');
  assert.equal(service.getItemDetail(first.id).item.stage, 'awaiting_plan_approval');
  assert.equal(service.getPlanBatch(batch.id).status, 'running');
  assert.equal(scheduler.scheduled.length, 2);

  writeValidBugPlan(second.id, trackerRoot);
  completeTask(service, scheduler.scheduled[1], 'second plan generated');

  const finalBatch = service.getPlanBatch(batch.id);
  assert.equal(finalBatch.status, 'completed');
  assert.equal(finalBatch.successCount, 2);
  assert.equal(finalBatch.failedCount, 0);
  assert.equal(service.getItemDetail(second.id).item.stage, 'awaiting_plan_approval');
});

test('plan batch stops on first planning task failure', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const first = createFeishuBug(service, trackerRoot, {
    title: 'First fails',
    priority: 'P0',
    status: '新增',
  });
  markItemTriageReady(service, first.id);
  createFeishuBug(service, trackerRoot, {
    title: 'Second should not start',
    priority: 'P1',
    status: '新增',
  });

  const batch = service.createDefaultBugPlanBatch();
  completeTask(service, scheduler.scheduled[0], 'boom', 'failed');

  const finalBatch = service.getPlanBatch(batch.id);
  assert.equal(finalBatch.status, 'failed');
  assert.equal(finalBatch.failedItemId, first.id);
  assert.equal(scheduler.scheduled.length, 1);
});

test('plan batch fails quality gate when generated plan misses required headings', () => {
  const trackerRoot = createTempTrackerRoot();
  const scheduler = createScheduler();
  const service = new WorkflowService({
    trackerRoot,
    scheduleTask: scheduler.scheduleTask,
  });

  const item = createFeishuBug(service, trackerRoot, {
    title: 'Invalid plan headings',
    priority: 'P0',
    status: '新增',
  });
  markItemTriageReady(service, item.id);

  const batch = service.createDefaultBugPlanBatch();
  const invalidPlanPath = path.join(trackerRoot, 'agent-memory/workflows/items', item.id, 'plan.md');
  fs.writeFileSync(invalidPlanPath, '# Plan\n\n## Problem\nOnly partial headings\n', 'utf8');
  completeTask(service, scheduler.scheduled[0], 'bad plan');

  const finalBatch = service.getPlanBatch(batch.id);
  assert.equal(finalBatch.status, 'failed');
  assert.match(finalBatch.failedReason || '', /missing headings/);
  assert.equal(service.getItemDetail(item.id).item.stage, 'blocked');
});
