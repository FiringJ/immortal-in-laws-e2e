/**
 * E2E 统一执行引擎 — 纯 Computer Use
 * 读取 cases.yaml 中的自然语言测试用例，动态生成 Jest 测试
 * 不依赖 miniprogram-automator，所有操作通过 nut.js + 视觉 Agent
 *
 * YAML 步骤类型：
 *   - act: "自然语言操作指令"   → 视觉模型决策 + nut.js 执行
 *   - assert: "自然语言断言"    → 视觉模型验证截图
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { initE2E } from '../core/e2e-setup';
import type { E2EContext } from '../core/e2e-setup';
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

// ─── 动态生成测试 ───

describe('E2E 视觉 Agent 测试', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await initE2E();
  }, 30000);

  for (const suite of casesFile.suites) {
    if (!matchesFilter(suite.name, E2E_SUITE)) continue;

    describe(suite.name, () => {
      for (const testCase of suite.cases) {
        if (!matchesFilter(testCase.name, E2E_CASE)) continue;

        // 计算超时：setup + case steps，每步 30s + 30s 缓冲
        const setupSteps = (testCase.setup || suite.setup || []).length;
        const totalSteps = setupSteps + testCase.steps.length;
        const timeout = totalSteps * 30000 + 30000;

        // maxSteps 优先级：case > suite > global
        const maxSteps = testCase.maxSteps ?? suite.maxSteps ?? DEFAULT_MAX_STEPS;

        it(testCase.name, async () => {
          if (ctx.skipE2E) {
            throw new Error('E2E 已跳过：请先确认开发者工具窗口可见');
          }

          // 动态设置当前 case 的 replanningCycleLimit
          ctx.agent.opts.replanningCycleLimit = maxSteps;

          const e2e = ctx.observable(testCase.name);

          // 执行 setup 步骤（case 级优先，否则用 suite 级）
          const setup = testCase.setup || suite.setup;
          if (setup) {
            await runSteps(e2e, setup);
          }

          // 执行 case 步骤
          await runSteps(e2e, testCase.steps);
        }, timeout);
      }
    });
  }
});
