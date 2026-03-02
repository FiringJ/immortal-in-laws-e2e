/**
 * MiniProgramDevice - 纯 Computer Use 方案
 *
 * 完全不依赖 miniprogram-automator 的 API
 * 所有操作通过 nut.js + macOS 原生命令在 OS 层面完成：
 * - 截图：macOS screencapture -l<windowid> 截取分离的模拟器窗口（不怕遮挡）
 * - 点击：nut.js mouse.setPosition() + mouse.leftClick()
 * - 键盘：nut.js keyboard.type()
 * - 滚动：nut.js mouse.scrollDown() / mouse.scrollUp()
 *
 * 前提：微信开发者工具的模拟器窗口需分离为独立窗口。
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midsceneDevice = require('@midscene/core/device');
const {
  AbstractInterface,
  defineActionTap,
  defineActionInput,
  defineActionScroll,
} = midsceneDevice as {
  AbstractInterface: any;
  defineActionTap: (call: (param: any) => Promise<void>) => any;
  defineActionInput: (call: (param: any) => Promise<void>) => any;
  defineActionScroll: (call: (param: any) => Promise<void>) => any;
};

type Size = { width: number; height: number };
type DeviceAction = any;

import {
  mouse, Point, keyboard, Button,
} from '@nut-tree/nut-js';

export interface DeviceConfig {
  /** 模拟器窗口内小程序视口的偏移（窗口标题栏 + 设备信息栏） */
  viewportOffset: { x: number; y: number };
}

const DEFAULT_CONFIG: DeviceConfig = {
  // screencapture -l 截取完整窗口，Midscene 模型输出的坐标已包含标题栏
  // 所以偏移量为 0，直接用窗口左上角作为原点
  viewportOffset: { x: 0, y: 0 },
};

/** 匹配分离的模拟器窗口名称 */
const SIMULATOR_TITLE = /模拟器/;

interface SimulatorWindow {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MiniProgramDevice extends (AbstractInterface as any) {
  interfaceType = 'wechat-miniprogram';
  private config: DeviceConfig;
  private cachedWindow: SimulatorWindow | null = null;

  constructor(config?: Partial<DeviceConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    mouse.config.autoDelayMs = 50;
    mouse.config.mouseSpeed = 2000;
  }

  /**
   * 通过 CoreGraphics API 查找分离的模拟器窗口
   * 返回 CGWindowID + 窗口位置/尺寸
   */
  private async findSimulatorWindow(): Promise<SimulatorWindow> {
    if (this.cachedWindow) return this.cachedWindow;

    const { execSync } = require('child_process');
    const output = execSync(`swift -e '
import CoreGraphics
let list = CGWindowListCopyWindowInfo(.optionOnScreenOnly, kCGNullWindowID) as! [[String: Any]]
for w in list {
  let name = w["kCGWindowName"] as? String ?? ""
  if name.contains("模拟器") {
    let id = w["kCGWindowNumber"] as? Int ?? 0
    let b = w["kCGWindowBounds"] as? [String: Any] ?? [:]
    let x = b["X"] as? Int ?? 0
    let y = b["Y"] as? Int ?? 0
    let width = b["Width"] as? Int ?? 0
    let height = b["Height"] as? Int ?? 0
    print("\\(id),\\(x),\\(y),\\(width),\\(height),\\(name)")
    break
  }
}
'`, { encoding: 'utf8', timeout: 5000 }).trim();

    if (!output) {
      throw new Error(
        '找不到分离的模拟器窗口。请在微信开发者工具中将模拟器分离为独立窗口：\n' +
        '  模拟器标题栏右键 → 分离窗口，或拖拽模拟器标签页出来'
      );
    }

    const [id, x, y, width, height, ...nameParts] = output.split(',');
    this.cachedWindow = {
      id: parseInt(id),
      name: nameParts.join(','),
      x: parseInt(x),
      y: parseInt(y),
      width: parseInt(width),
      height: parseInt(height),
    };

    console.log(
      `[Device] 找到模拟器窗口: "${this.cachedWindow.name}" ` +
      `id=${this.cachedWindow.id} at (${this.cachedWindow.x},${this.cachedWindow.y}) ` +
      `size ${this.cachedWindow.width}x${this.cachedWindow.height}`
    );

    return this.cachedWindow;
  }

  /** 小程序内坐标 → 屏幕绝对坐标 */
  private async toScreen(x: number, y: number): Promise<{ sx: number; sy: number }> {
    const win = await this.findSimulatorWindow();
    return {
      sx: Math.round(win.x + this.config.viewportOffset.x + x),
      sy: Math.round(win.y + this.config.viewportOffset.y + y),
    };
  }

  private hasActivated = false;

  /** 将模拟器窗口激活到前台（仅首次） */
  private bringToFront(): void {
    if (this.hasActivated) return;
    this.hasActivated = true;

    const { execSync } = require('child_process');
    try {
      execSync(`osascript -e '
        tell application "System Events"
          set frontmost of process "wechatdevtools" to true
        end tell
      '`, { timeout: 3000 });
    } catch {
      console.warn('[Device] 无法自动激活窗口，请手动将模拟器置于前台');
    }
  }

  /** 截图 — 用 screencapture -l 截取整个模拟器窗口（不怕遮挡） */
  async screenshotBase64(): Promise<string> {
    this.bringToFront();

    const win = await this.findSimulatorWindow();
    const tmpFile = `/tmp/e2e_screenshot_${Date.now()}.png`;
    const { execSync } = require('child_process');
    execSync(`screencapture -x -o -l${win.id} ${tmpFile}`);

    const fs = require('fs');
    const buf = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile);

    return `data:image/png;base64,${buf.toString('base64')}`;
  }

  async size(): Promise<Size> {
    const win = await this.findSimulatorWindow();
    return { width: win.width, height: win.height };
  }

  async tapAt(x: number, y: number): Promise<void> {
    const { sx, sy } = await this.toScreen(x, y);
    console.log(`[Device] tap (${x},${y}) → screen (${sx},${sy})`);
    await mouse.setPosition(new Point(sx, sy));
    await mouse.leftClick();
  }

  async longPressAt(x: number, y: number, durationMs: number = 900): Promise<void> {
    const { sx, sy } = await this.toScreen(x, y);
    console.log(`[Device] longPress (${x},${y}) ${durationMs}ms → screen (${sx},${sy})`);
    await mouse.setPosition(new Point(sx, sy));
    await mouse.pressButton(Button.LEFT);
    await new Promise((r) => setTimeout(r, durationMs));
    await mouse.releaseButton(Button.LEFT);
  }

  /**
   * 直接滚动（不经过 Midscene aiAct）
   * amount: 1=小幅(4×10), 2=中幅(8×15), 3=大幅(12×20)
   */
  async scroll(direction: 'up' | 'down' | 'left' | 'right', amount: 1 | 2 | 3 = 2): Promise<void> {
    const [distance, scrollAmount] = amount === 1 ? [4, 10] : amount === 2 ? [8, 15] : [12, 20];
    const win = await this.findSimulatorWindow();
    const { sx, sy } = await this.toScreen(win.width / 2, win.height / 2);
    await mouse.setPosition(new Point(sx, sy));
    await new Promise((r) => setTimeout(r, 100));
    for (let i = 0; i < distance; i++) {
      if (direction === 'down') await mouse.scrollDown(scrollAmount);
      else if (direction === 'up') await mouse.scrollUp(scrollAmount);
      else if (direction === 'left') await mouse.scrollLeft(scrollAmount);
      else await mouse.scrollRight(scrollAmount);
      await new Promise((r) => setTimeout(r, 80));
    }
  }

  actionSpace(): DeviceAction[] {
    const self = this;

    return [
      defineActionTap(async (param: any) => {
        const center = param.locate?.center;
        if (!center) throw new Error('tap: missing center coordinates');
        await self.tapAt(center[0], center[1]);
      }),
      defineActionInput(async (param: any) => {
        const center = param.locate?.center;
        if (center) {
          await self.tapAt(center[0], center[1]);
          await new Promise((r) => setTimeout(r, 200));
        }
        await keyboard.type(param.value);
      }),
      defineActionScroll(async (param: any) => {
        const win = await self.findSimulatorWindow();
        const { sx, sy } = await self.toScreen(win.width / 2, win.height / 2);
        await mouse.setPosition(new Point(sx, sy));
        await new Promise((r) => setTimeout(r, 100));

        // 默认 8 次 × 15 单位 ≈ 一屏滚动；原 3×5 滚动过小
        const distance = param.distance ?? 8;
        const scrollAmount = 15;
        const dir = param.direction ?? 'down';
        for (let i = 0; i < distance; i++) {
          if (dir === 'down') {
            await mouse.scrollDown(scrollAmount);
          } else if (dir === 'up') {
            await mouse.scrollUp(scrollAmount);
          } else if (dir === 'left') {
            await mouse.scrollLeft(scrollAmount);
          } else {
            await mouse.scrollRight(scrollAmount);
          }
          await new Promise((r) => setTimeout(r, 80));
        }
      }),
    ];
  }

  /** 清除窗口缓存（窗口移动/重新分离后调用） */
  invalidateWindowCache(): void {
    this.cachedWindow = null;
  }

  /** 校准：鼠标依次移动到模拟器四个角 */
  async calibrate(): Promise<void> {
    const win = await this.findSimulatorWindow();
    const corners = [
      { name: '左上', x: 0, y: 0 },
      { name: '右上', x: win.width, y: 0 },
      { name: '左下', x: 0, y: win.height },
      { name: '右下', x: win.width, y: win.height },
    ];
    for (const c of corners) {
      console.log(`[Calibrate] 移动到${c.name} (${c.x}, ${c.y})`);
      const { sx, sy } = await this.toScreen(c.x, c.y);
      await mouse.setPosition(new Point(sx, sy));
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}
