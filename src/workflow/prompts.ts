import path from 'path';
import type { TaskRequest } from '../daemon/agent-executor';
import { deriveTriageHints } from './triage-hints';
import type { WorkflowItem, WorkflowPhase } from './types';

type BuildWorkflowTaskInput = {
  item: WorkflowItem;
  phase: WorkflowPhase;
  trackerRoot: string;
};

function buildSharedContext(item: WorkflowItem, trackerRoot: string): string[] {
  const sections = [
    `Workflow item ID: ${item.id}`,
    `Workflow kind: ${item.kind}`,
    `Workflow title: ${item.title}`,
    `Source: ${item.source}`,
    `Working directory for implementation: ${item.cwd}`,
    `Tracker repository root: ${trackerRoot}`,
    `Primary artifact directory: ${path.dirname(item.artifactPaths.plan)}`,
    `Raw input:\n${item.rawInput}`,
  ];

  if (item.acceptanceCriteria) {
    sections.push(`Acceptance criteria:\n${item.acceptanceCriteria}`);
  }

  return sections;
}

function buildPlanningPrompt(item: WorkflowItem, trackerRoot: string): string {
  const artifactPath = item.artifactPaths.plan;
  const headingHint = item.kind === 'requirement'
    ? [
      '# Plan',
      '## Goal',
      '## Scope',
      '## Impact',
      '## Steps',
      '## Validation',
      '## Rollback',
    ].join('\n')
    : [
      '# Plan',
      '## Problem',
      '## Impact',
      '## Reproduction Hypothesis',
      '## Evidence To Collect',
      '## Initial Fix Direction',
    ].join('\n');

  const sections = [
    'You are generating the planning artifact for a workflow item.',
    ...buildSharedContext(item, trackerRoot),
  ];

  if (item.kind === 'bug' && item.triage?.status) {
    sections.push(
      `Read the triage artifact first:\n${item.artifactPaths.triage}`,
      `Current triage verdict: ${item.triage.status}`,
    );
  }

  sections.push(
    `Write the plan to this absolute path:\n${artifactPath}`,
    `Use this exact heading structure:\n${headingHint}`,
    'Do not edit product code in this phase.',
    'You may inspect repository files, docs, and scripts.',
    'Before finishing, ensure the artifact file exists and summarize the plan in your final answer.',
  );

  return sections.join('\n\n');
}

function buildTriagePrompt(item: WorkflowItem, trackerRoot: string): string {
  const hints = deriveTriageHints(item);
  const sections = [
    'You are in the triage, cleaning, and context-enrichment phase for a workflow item.',
    ...buildSharedContext(item, trackerRoot),
    `Write the triage artifact to:\n${item.artifactPaths.triage}`,
    [
      'The triage artifact must start with this exact structure:',
      '# Triage',
      '- readiness: ready|needs_human',
      '- source_quality: high|medium|low',
      '- next_action: generate_plan|manual_triage',
      '- normalized_title: <cleaned title>',
      '## Cleaned Problem',
      '## Source Quality',
      '## Product Context',
      '## Technical Context',
      '## Missing Context',
      '## Likely Surfaces',
      '## Recommended Next Action',
    ].join('\n'),
    'Do not edit product code in this phase.',
    'Your job is to clean the defect wording, attach concrete repository context, and judge whether this item is safe to enter plan generation.',
    'Mark readiness=needs_human when the source wording is too weak, the issue is only a待测点 / verification note, the evidence is missing, or the bug is really a module-not-implemented / PM clarification item.',
    'Only mark readiness=ready when the cleaned brief is strong enough for a follow-up plan to proceed without guessing core facts.',
  ];

  if (item.sourceMeta?.attachments?.length) {
    sections.push(`Attached local evidence paths:\n${item.sourceMeta.attachments.map((attachment) => `- ${attachment.path || attachment.name}`).join('\n')}`);
  }

  if (hints.moduleLabel) {
    sections.push(`Likely module: ${hints.moduleLabel}`);
  }
  if (hints.routeHints.length) {
    sections.push(`Likely route hints:\n${hints.routeHints.map((hint) => `- ${hint}`).join('\n')}`);
  }
  if (hints.serviceHints.length) {
    sections.push(`Likely service hints:\n${hints.serviceHints.map((hint) => `- ${hint}`).join('\n')}`);
  }
  if (hints.docHints.length) {
    sections.push(`Docs/context to inspect first:\n${hints.docHints.map((hint) => `- ${hint}`).join('\n')}`);
  }

  sections.push('Before finishing, ensure triage.md exists and summarize the readiness verdict in your final answer.');
  return sections.join('\n\n');
}

function buildReproductionPrompt(item: WorkflowItem, trackerRoot: string): string {
  return [
    'You are in the bug reproduction and root-cause phase.',
    ...buildSharedContext(item, trackerRoot),
    `Read the approved plan from:\n${item.artifactPaths.plan}`,
    `Write the reproduction artifact to:\n${item.artifactPaths.reproduction}`,
    [
      'The artifact must include these headings:',
      '# Reproduction',
      '## Steps',
      '## Evidence',
      '## Root Cause',
      '## Fix Plan',
    ].join('\n'),
    'Do not apply the final fix in this phase.',
    'You may run probes, inspection commands, screenshots, and other validation tools needed to establish evidence.',
    'Before finishing, ensure the reproduction artifact file exists and give a concise conclusion.',
  ].join('\n\n');
}

function buildExecutionPrompt(item: WorkflowItem, trackerRoot: string): string {
  const sections = [
    'You are in the approved implementation phase for a workflow item.',
    ...buildSharedContext(item, trackerRoot),
    `Read the workflow plan from:\n${item.artifactPaths.plan}`,
  ];

  if (item.kind === 'bug' && item.triage?.status) {
    sections.push(`Read the triage artifact first:\n${item.artifactPaths.triage}`);
  }

  if (item.kind === 'bug') {
    sections.push(`Read the reproduction artifact before changing code:\n${item.artifactPaths.reproduction}`);
  }

  sections.push(
    'Implement the approved work directly in the workspace.',
    'Run targeted checks that prove the implementation is ready for verification.',
    'Do not write verification.md in this phase.',
    'Before finishing, summarize the files changed, commands run, and any residual risk.',
  );

  return sections.join('\n\n');
}

function buildVerificationPrompt(item: WorkflowItem, trackerRoot: string): string {
  const sections = [
    'You are in the verification phase for a workflow item.',
    ...buildSharedContext(item, trackerRoot),
    `Read the plan artifact:\n${item.artifactPaths.plan}`,
  ];

  if (item.kind === 'bug' && item.triage?.status) {
    sections.push(`Read the triage artifact first:\n${item.artifactPaths.triage}`);
  }

  if (item.kind === 'bug') {
    sections.push(`Read the reproduction artifact:\n${item.artifactPaths.reproduction}`);
  }

  sections.push(
    `Write the verification artifact to:\n${item.artifactPaths.verification}`,
    [
      'The verification artifact must include these headings:',
      '# Verification',
      '## Checks Run',
      '## Evidence',
      '## Result',
      '## Residual Risk',
    ].join('\n'),
    'Prefer existing probe scripts and deterministic verification commands when available.',
    'If no page-specific probe exists, fall back to the strongest available screenshot/assertion flow you can run in this repo.',
    'Before finishing, ensure verification.md exists and clearly state whether verification passed.',
  );

  return sections.join('\n\n');
}

function buildWritebackPrompt(item: WorkflowItem, trackerRoot: string): string {
  const sections = [
    'You are in the writeback phase for a completed workflow item.',
    ...buildSharedContext(item, trackerRoot),
    `Read the plan artifact:\n${item.artifactPaths.plan}`,
    `Read the verification artifact:\n${item.artifactPaths.verification}`,
  ];

  if (item.kind === 'bug' && item.triage?.status) {
    sections.push(`Read the triage artifact first:\n${item.artifactPaths.triage}`);
  }

  if (item.kind === 'bug') {
    sections.push(`Read the reproduction artifact:\n${item.artifactPaths.reproduction}`);
  }

  sections.push(
    `Write the final writeback summary to:\n${item.artifactPaths.writeback}`,
    [
      'The writeback artifact must include these headings:',
      '# Writeback',
      '## Outcome',
      '## Evidence',
      '## Reusable Knowledge',
      '## Follow-ups',
    ].join('\n'),
    'Do not append to shared knowledge files yourself in this phase; summarize the reusable knowledge clearly so the daemon can persist it after completion.',
    'Before finishing, ensure writeback.md exists and summarize the key learnings.',
  );

  return sections.join('\n\n');
}

export function buildWorkflowTaskRequest(input: BuildWorkflowTaskInput): TaskRequest {
  const { item, phase, trackerRoot } = input;
  const promptBuilders: Record<WorkflowPhase, (workflowItem: WorkflowItem, root: string) => string> = {
    triaging: buildTriagePrompt,
    planning: buildPlanningPrompt,
    reproducing: buildReproductionPrompt,
    executing: buildExecutionPrompt,
    verifying: buildVerificationPrompt,
    writing_back: buildWritebackPrompt,
  };

  const addDirs = [trackerRoot];
  const appRepo = process.env.APP_REPO_PATH;
  if (appRepo && path.resolve(appRepo) !== path.resolve(item.cwd)) {
    addDirs.push(path.resolve(appRepo));
  }

  return {
    task: promptBuilders[phase](item, trackerRoot),
    source: 'workflow',
    userId: item.sourceContext?.userId,
    agent: item.preferredAgent,
    cwd: item.cwd,
    addDirs,
    metadata: {
      workflowItemId: item.id,
      workflowPhase: phase,
      originalSource: item.source,
    },
    workflowItemId: item.id,
    workflowPhase: phase,
  };
}
