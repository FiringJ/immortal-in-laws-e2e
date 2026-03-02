require('../../setup-env.js');

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

type PageStatus = 'completed' | 'pending' | 'skipped' | 'blocked';
type MarkResult = 'completed' | 'failed' | 'blocked' | 'pending' | 'reset' | 'skipped';

type RestorationPage = {
  route: string;
  figmaName: string;
  nodeId: string;
  wxssPath: string;
  status: PageStatus;
  notes?: string;
  lastAttemptAt?: string;
  consecutiveFailures?: number;
  lastBlocker?: string;
  blockedAt?: string;
};

type RestorationStatusFile = {
  generatedFrom?: string;
  updatedAt?: string;
  workflow?: string[];
  statuses?: Record<string, string>;
  pages: RestorationPage[];
};

type CliArgs = {
  route: string;
  result: MarkResult;
  blocker?: string;
  notes?: string;
  dryRun: boolean;
};

const STATUS_FILE = '/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml';
const FAILURE_THRESHOLD = 2;

function parseArgs(argv: string[]): CliArgs {
  const args: Partial<CliArgs> = {
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--route') {
      args.route = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--result') {
      args.result = argv[i + 1] as MarkResult;
      i += 1;
      continue;
    }

    if (arg === '--blocker') {
      args.blocker = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--notes') {
      args.notes = argv[i + 1];
      i += 1;
      continue;
    }

    if (arg === '--dry-run') {
      args.dryRun = true;
    }
  }

  if (!args.route) {
    throw new Error('Missing --route');
  }

  if (!args.result) {
    throw new Error('Missing --result');
  }

  return args as CliArgs;
}

function loadStatusFile(): RestorationStatusFile {
  const raw = fs.readFileSync(STATUS_FILE, 'utf8');
  return yaml.load(raw) as RestorationStatusFile;
}

function saveStatusFile(data: RestorationStatusFile) {
  const dumped = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
  });
  fs.writeFileSync(STATUS_FILE, dumped);
}

function clearFailureState(page: RestorationPage) {
  page.consecutiveFailures = 0;
  delete page.lastBlocker;
  delete page.blockedAt;
}

function applyNotes(page: RestorationPage, notes?: string) {
  if (notes) {
    page.notes = notes;
  }
}

function markPage(page: RestorationPage, args: CliArgs, now: string) {
  page.lastAttemptAt = now;

  switch (args.result) {
    case 'completed':
      page.status = 'completed';
      clearFailureState(page);
      applyNotes(page, args.notes);
      return;

    case 'skipped':
      page.status = 'skipped';
      clearFailureState(page);
      applyNotes(page, args.notes);
      return;

    case 'reset':
      page.status = 'pending';
      clearFailureState(page);
      applyNotes(page, args.notes);
      return;

    case 'pending':
      page.status = 'pending';
      delete page.blockedAt;
      applyNotes(page, args.notes);
      return;

    case 'blocked':
      page.status = 'blocked';
      page.consecutiveFailures = Math.max(page.consecutiveFailures ?? 0, FAILURE_THRESHOLD);
      if (args.blocker) {
        page.lastBlocker = args.blocker;
      }
      page.blockedAt = now;
      applyNotes(page, args.notes);
      return;

    case 'failed': {
      const blocker = args.blocker ?? 'unspecified blocker';
      const isSameBlocker = page.lastBlocker === blocker;
      const previousFailures = page.consecutiveFailures ?? 0;
      const nextFailures = isSameBlocker ? previousFailures + 1 : 1;

      page.lastBlocker = blocker;
      page.consecutiveFailures = nextFailures;
      applyNotes(page, args.notes);

      if (nextFailures >= FAILURE_THRESHOLD) {
        page.status = 'blocked';
        page.blockedAt = now;
      } else {
        page.status = 'pending';
        delete page.blockedAt;
      }
      return;
    }

    default:
      throw new Error(`Unsupported result: ${String(args.result)}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const statusFile = loadStatusFile();
  const page = statusFile.pages.find((item) => item.route === args.route);

  if (!page) {
    throw new Error(`Unknown route: ${args.route}`);
  }

  const now = new Date().toISOString();
  const workingCopy = JSON.parse(JSON.stringify(statusFile)) as RestorationStatusFile;
  const workingPage = workingCopy.pages.find((item) => item.route === args.route);

  if (!workingPage) {
    throw new Error(`Unknown route in working copy: ${args.route}`);
  }

  markPage(workingPage, args, now);
  workingCopy.updatedAt = now.slice(0, 10);

  if (!args.dryRun) {
    saveStatusFile(workingCopy);
  }

  console.log(JSON.stringify({
    statusFile: STATUS_FILE,
    route: workingPage.route,
    result: args.result,
    dryRun: args.dryRun,
    page: workingPage,
  }, null, 2));
}

main();
