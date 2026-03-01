/**
 * E2E 命令式执行器
 * 读取 cases.yaml 中的自然语言测试用例，按顺序执行并输出结果
 *
 * YAML 步骤类型：
 *   - act: "自然语言操作指令"   → 视觉模型决策 + nut.js 执行
 *   - assert: "自然语言断言"    → 视觉模型验证截图
 */

// 加载根目录 .env.local，给 Midscene 提供模型配置。
require('../../setup-env.js');

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { initE2E } from '../core/e2e-setup';
import type { ObservableE2E } from '../core/e2e-helpers';

// ─── 类型定义 ───

interface Step {
  act?: string;
  assert?: string;
}

interface TestCase {
  name: string;
  issue?: string;
  setup?: Step[];
  steps: Step[];
  /** 覆盖默认的 maxSteps（每个 aiAct 的最大重试次数） */
  maxSteps?: number;
}

interface TestSuite {
  name: string;
  setup?: Step[];
  cases: TestCase[];
  /** suite 级默认 maxSteps，可被 case 级覆盖 */
  maxSteps?: number;
}

interface CasesFile {
  /** 全局默认 maxSteps */
  maxSteps?: number;
  suites: TestSuite[];
}

// ─── 加载 YAML ───

const casesPath = path.resolve(__dirname, 'cases.yaml');
const casesFile = yaml.load(fs.readFileSync(casesPath, 'utf8')) as CasesFile;

/** 默认 maxSteps */
const DEFAULT_MAX_STEPS = casesFile.maxSteps ?? 5;

/**
 * 环境变量过滤器（Jest -t 对中文支持不好，用环境变量替代）
 * - E2E_SUITE: 只跑匹配的 suite，如 E2E_SUITE=首页
 * - E2E_CASE:  只跑匹配的 case，如 E2E_CASE=嘉宾列表
 * 支持部分匹配，多个关键词用逗号分隔
 */
const E2E_SUITE = process.env.E2E_SUITE || '';
const E2E_CASE = process.env.E2E_CASE || '';

function matchesFilter(name: string, filter: string): boolean {
  if (!filter) return true;
  return filter.split(',').some((kw) => name.includes(kw.trim()));
}

// ─── 执行步骤 ───

async function runSteps(e2e: ObservableE2E, steps: Step[]): Promise<void> {
  for (const step of steps) {
    if (step.act) {
      await e2e.act(step.act);
    } else if (step.assert) {
      await e2e.assert(step.assert);
    }
  }
}

async function run(): Promise<void> {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E 已跳过：请先确认开发者工具窗口可见');
  }

  let passed = 0;
  let failed = 0;

  for (const suite of casesFile.suites) {
    if (!matchesFilter(suite.name, E2E_SUITE)) continue;

    console.log(`\n[E2E] ===== Suite: ${suite.name} =====`);

    for (const testCase of suite.cases) {
      if (!matchesFilter(testCase.name, E2E_CASE)) continue;

      const maxSteps = testCase.maxSteps ?? suite.maxSteps ?? DEFAULT_MAX_STEPS;
      ctx.agent.opts.replanningCycleLimit = maxSteps;

      console.log(`\n[E2E] >>> Case: ${testCase.name}`);

      try {
        const e2e = ctx.observable(testCase.name);
        const setup = testCase.setup || suite.setup;
        if (setup) await runSteps(e2e, setup);
        await runSteps(e2e, testCase.steps);
        passed++;
        console.log(`[E2E] PASS ${suite.name} / ${testCase.name}`);
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[E2E] FAIL ${suite.name} / ${testCase.name}`);
        console.error(`[E2E] ${message}`);
      }
    }
  }

  console.log(`\n[E2E] Summary: passed=${passed} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  console.error(`[E2E] Fatal: ${message}`);
  process.exit(1);
});
