/**
 * E2E 测试共享 setup — 纯 Computer Use 方案
 * 不依赖 miniprogram-automator，只用 nut.js + Midscene Agent
 */

import { Agent } from '@midscene/core';
import { MiniProgramDevice } from './miniprogram-device';
import type { DeviceConfig } from './miniprogram-device';
import { ObservableE2E } from './e2e-helpers';

export interface E2EContext {
  agent: Agent;
  device: MiniProgramDevice;
  skipE2E: boolean;
  /** 创建可观测的测试运行器 */
  observable: (testName: string) => ObservableE2E;
}

/**
 * 初始化 E2E 测试环境
 * 1. 创建 MiniProgramDevice（nut.js）
 * 2. 验证能找到微信开发者工具窗口
 * 3. 验证能截图
 * 4. 创建 Midscene Agent
 */
export async function initE2E(config?: Partial<DeviceConfig>): Promise<E2EContext> {
  let skipE2E = false;
  const device = new MiniProgramDevice(config);
  let agent!: Agent;

  try {
    // 验证：能找到开发者工具窗口并截图
    console.log('[E2E] 🔍 查找微信开发者工具窗口...');
    const screenshot = await device.screenshotBase64();
    if (!screenshot || screenshot.length < 100) {
      throw new Error('截图数据异常');
    }
    console.log(`[E2E] ✅ 截图成功 (${Math.round(screenshot.length / 1024)}KB)`);

    agent = new Agent(device);
    console.log('[E2E] ✅ Agent 初始化完成，开始测试');
  } catch (err: unknown) {
    skipE2E = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[E2E] ❌ 初始化失败: ${msg}\n` +
      '请确认：\n' +
      '  1) 微信开发者工具已打开并加载了项目\n' +
      '  2) 模拟器已分离为独立窗口（标题栏右键 → 分离窗口）\n' +
      '  3) 模拟器窗口可见（不能最小化）\n' +
      '  4) macOS 系统偏好设置 → 隐私与安全 → 辅助功能 已授权终端/IDE'
    );
  }

  return {
    agent,
    device,
    skipE2E,
    observable: (testName: string) => new ObservableE2E(agent, device, testName),
  };
}
