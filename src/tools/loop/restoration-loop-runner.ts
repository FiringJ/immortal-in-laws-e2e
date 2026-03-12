require('../../../setup-env.js');

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type RestorationPage = {
  route: string;
  figmaName: string;
  nodeId: string;
  wxssPath: string;
  status: 'completed' | 'pending' | 'skipped' | 'blocked';
  notes?: string;
  lastAttemptAt?: string;
  consecutiveFailures?: number;
  lastBlocker?: string;
  blockedAt?: string;
};

type RestorationStatusFile = {
  updatedAt?: string;
  workflow?: string[];
  statuses?: Record<string, string>;
  pages: RestorationPage[];
};

type RunnerSummary = {
  generatedAt: string;
  pendingCount: number;
  actionablePendingCount: number;
  blockedCount: number;
  nextPage: RestorationPage | null;
  blockedPages: Array<{
    route: string;
    blocker: string;
  }>;
  appRepo: string;
  trackerRepo: string;
  references: {
    statusFile: string;
    projectKnowledge: string;
    knownIssues: string;
    feedbackLedger: string;
  };
  hints: string[];
};

const TRACKER_REPO = '/Users/firingj/Projects/immortal-in-laws-e2e';
const APP_REPO = '/Users/firingj/Projects/immortal-in-laws';
const STATUS_FILE = path.join(TRACKER_REPO, 'figma/data/figma-restoration-status.yaml');
const PROJECT_KNOWLEDGE = path.join(TRACKER_REPO, 'agent-memory/project-knowledge.md');
const KNOWN_ISSUES = path.join(TRACKER_REPO, 'agent-memory/known-issues.md');
const FEEDBACK_LEDGER = path.join(TRACKER_REPO, 'agent-memory/user-feedback-ledger.md');
const FAILURE_THRESHOLD = 2;

function loadStatusFile(): RestorationStatusFile {
  const raw = fs.readFileSync(STATUS_FILE, 'utf8');
  return yaml.load(raw) as RestorationStatusFile;
}

function isGuardrailBlocked(page: RestorationPage): boolean {
  return page.status === 'blocked'
    || (page.status === 'pending'
      && (page.consecutiveFailures ?? 0) >= FAILURE_THRESHOLD
      && Boolean(page.lastBlocker));
}

function getBlockedReason(page: RestorationPage): string {
  if (page.lastBlocker) {
    return page.lastBlocker;
  }
  if (page.notes) {
    return page.notes;
  }
  return 'unspecified blocker';
}

function buildHints(nextPage: RestorationPage | null): string[] {
  const hints = [
    'Always read status/memory before editing code.',
    'Edit source in the app repo, never generated Mini Program JS by hand.',
    'Run build in immortal-in-laws before trusting simulator output.',
    'Do OS-level validation and save fresh screenshots before changing status.',
    'Record every run outcome with npm run loop:mark so repeated blockers can be guarded automatically.',
  ];

  if (nextPage?.route === 'pages/chat/index') {
    hints.push('Chat page has deterministic probe support in src/tools/probes/chat-probe.ts.');
    hints.push('Chat still has a first-viewport summary-card visual gap; do not mark completed until that is closed.');
  }

  if (nextPage?.route === 'pages/member-center/index') {
    hints.push('Member-center remains pending only for residual visual polish, not price=0 test data.');
  }

  return hints;
}

function buildSummary(): RunnerSummary {
  const status = loadStatusFile();
  const pendingPages = status.pages.filter((page) => page.status === 'pending');
  const blockedPages = status.pages
    .filter((page) => isGuardrailBlocked(page))
    .map((page) => ({
      route: page.route,
      blocker: getBlockedReason(page),
    }));
  const actionablePendingPages = pendingPages.filter((page) => !isGuardrailBlocked(page));
  const nextPage = actionablePendingPages[0] ?? null;

  return {
    generatedAt: new Date().toISOString(),
    pendingCount: pendingPages.length,
    actionablePendingCount: actionablePendingPages.length,
    blockedCount: blockedPages.length,
    nextPage,
    blockedPages,
    appRepo: APP_REPO,
    trackerRepo: TRACKER_REPO,
    references: {
      statusFile: STATUS_FILE,
      projectKnowledge: PROJECT_KNOWLEDGE,
      knownIssues: KNOWN_ISSUES,
      feedbackLedger: FEEDBACK_LEDGER,
    },
    hints: buildHints(nextPage),
  };
}

function formatMarkdown(summary: RunnerSummary): string {
  const lines: string[] = [];
  lines.push('# Ralph Loop Runner');
  lines.push('');
  lines.push(`- generatedAt: ${summary.generatedAt}`);
  lines.push(`- pendingCount: ${summary.pendingCount}`);
  lines.push(`- actionablePendingCount: ${summary.actionablePendingCount}`);
  lines.push(`- blockedCount: ${summary.blockedCount}`);
  lines.push(`- appRepo: ${summary.appRepo}`);
  lines.push(`- trackerRepo: ${summary.trackerRepo}`);
  lines.push('');

  if (summary.nextPage) {
    lines.push('## Next Page');
    lines.push('');
    lines.push(`- route: ${summary.nextPage.route}`);
    lines.push(`- figmaName: ${summary.nextPage.figmaName}`);
    lines.push(`- nodeId: ${summary.nextPage.nodeId}`);
    lines.push(`- wxssPath: ${summary.nextPage.wxssPath}`);
    lines.push(`- notes: ${summary.nextPage.notes || 'n/a'}`);
    lines.push('');
  } else {
    lines.push('## Next Page');
    lines.push('');
    lines.push('- none');
    lines.push('');
  }

  if (summary.blockedPages.length > 0) {
    lines.push('## Blocked Pages');
    lines.push('');
    summary.blockedPages.forEach((page) => {
      lines.push(`- route: ${page.route}`);
      lines.push(`  blocker: ${page.blocker}`);
    });
    lines.push('');
  }

  lines.push('## References');
  lines.push('');
  lines.push(`- statusFile: ${summary.references.statusFile}`);
  lines.push(`- projectKnowledge: ${summary.references.projectKnowledge}`);
  lines.push(`- knownIssues: ${summary.references.knownIssues}`);
  lines.push(`- feedbackLedger: ${summary.references.feedbackLedger}`);
  lines.push('');
  lines.push('## Hints');
  lines.push('');
  summary.hints.forEach((hint) => lines.push(`- ${hint}`));

  return lines.join('\n');
}

function main() {
  const summary = buildSummary();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }
  console.log(formatMarkdown(summary));
}

main();
