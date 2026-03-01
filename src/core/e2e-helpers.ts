/**
 * E2E 测试辅助工具 — 纯 Computer Use 方案
 * - 完全不依赖 miniprogram-automator
 * - 截图通过 MiniProgramDevice（macOS screencapture -l 按窗口 ID 截取）
 * - 导航通过 Midscene Agent 的 aiAct（点击 UI 元素）
 * - 每步操作前后自动截图
 * - 带时间戳的结构化日志
 */
import * as fs from 'fs';
import * as path from 'path';
import type { Agent } from '@midscene/core';
import type { MiniProgramDevice } from './miniprogram-device';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');

/** 确保截图目录存在 */
function ensureScreenshotDir(): void {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

/** 生成带时间戳的文件名 */
function screenshotName(testName: string, step: string, suffix: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safe = `${testName}__${step}__${suffix}`.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
  return `${ts}__${safe}.png`;
}

/** 保存 base64 截图到文件 */
function saveScreenshot(base64: string, filename: string): string {
  ensureScreenshotDir();
  const filePath = path.join(SCREENSHOT_DIR, filename);
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(raw, 'base64'));
  return filePath;
}

/** 格式化耗时 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const LOG_PREFIX = '[E2E]';
const STEP_ICON = {
  act: '🖱️',
  assert: '✅',
  screenshot: '📸',
  navigate: '🧭',
  info: 'ℹ️',
  error: '❌',
};

/**
 * 可观测的 E2E 测试运行器
 * 纯 Computer Use — 所有操作通过视觉 Agent + nut.js 完成
 */
export class ObservableE2E {
  private agent: Agent;
  private device: MiniProgramDevice;
  private testName: string;
  private stepIndex: number = 0;

  constructor(agent: Agent, device: MiniProgramDevice, testName: string) {
    this.agent = agent;
    this.device = device;
    this.testName = testName;
  }

  /** 截图并保存 */
  async screenshot(label: string): Promise<string> {
    const base64 = await this.device.screenshotBase64();
    const filename = screenshotName(this.testName, `${this.stepIndex}`, label);
    const filePath = saveScreenshot(base64, filename);
    console.log(`${LOG_PREFIX} ${STEP_ICON.screenshot} 截图已保存: ${path.basename(filePath)}`);
    return filePath;
  }

  /** 执行 aiAct 并记录前后截图和耗时 */
  async act(instruction: string): Promise<void> {
    this.stepIndex++;
    console.log(`\n${LOG_PREFIX} ━━━ Step ${this.stepIndex}: aiAct ━━━`);
    console.log(`${LOG_PREFIX} ${STEP_ICON.act} 指令: "${instruction}"`);

    await this.screenshot('before_act');
    const start = Date.now();

    await this.agent.aiAct(instruction);

    const elapsed = Date.now() - start;
    console.log(`${LOG_PREFIX} ${STEP_ICON.act} 完成 (${formatDuration(elapsed)})`);
    await this.screenshot('after_act');
  }

  /** 执行 aiAssert 并记录截图和耗时 */
  async assert(assertion: string): Promise<void> {
    this.stepIndex++;
    console.log(`\n${LOG_PREFIX} ━━━ Step ${this.stepIndex}: aiAssert ━━━`);
    console.log(`${LOG_PREFIX} ${STEP_ICON.assert} 断言: "${assertion}"`);

    await this.screenshot('before_assert');
    const start = Date.now();

    await this.agent.aiAssert(assertion);

    const elapsed = Date.now() - start;
    console.log(`${LOG_PREFIX} ${STEP_ICON.assert} 通过 (${formatDuration(elapsed)})`);
  }

  /**
   * 导航到指定页面 — 纯 Computer Use
   * 不调用 automator API，而是通过 aiAct 点击 tabBar 或页面内按钮
   */
  async navigateTo(url: string): Promise<void> {
    this.stepIndex++;
    console.log(`\n${LOG_PREFIX} ━━━ Step ${this.stepIndex}: navigate ━━━`);
    console.log(`${LOG_PREFIX} ${STEP_ICON.navigate} 目标: ${url}`);

    // 根据 URL 生成自然语言点击指令
    const instruction = this.urlToClickInstruction(url);
    console.log(`${LOG_PREFIX} ${STEP_ICON.navigate} 转换为点击指令: "${instruction}"`);

    const start = Date.now();
    await this.agent.aiAct(instruction);

    // 等待页面渲染
    await new Promise((r) => setTimeout(r, 1500));

    const elapsed = Date.now() - start;
    await this.screenshot('after_navigate');
    console.log(`${LOG_PREFIX} ${STEP_ICON.navigate} 页面已加载 (${formatDuration(elapsed)})`);
  }

  /** 将页面路径转换为自然语言点击指令 */
  private urlToClickInstruction(url: string): string {
    const pagePath = url.split('?')[0];
    const TAB_MAP: Record<string, string> = {
      '/pages/index/index': '点击底部导航栏的"首页"Tab',
      '/pages/message/index': '点击底部导航栏的"消息"Tab',
      '/pages/profile/index': '点击底部导航栏的"我的"Tab',
    };
    if (TAB_MAP[pagePath]) return TAB_MAP[pagePath];

    // 非 tabBar 页面，返回通用指令
    return `导航到 ${pagePath}`;
  }

  /** 输出信息日志 */
  log(message: string): void {
    console.log(`${LOG_PREFIX} ${STEP_ICON.info} ${message}`);
  }

  /** 输出错误日志 */
  error(message: string): void {
    console.error(`${LOG_PREFIX} ${STEP_ICON.error} ${message}`);
  }
}
