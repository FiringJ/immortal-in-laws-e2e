/**
 * E2E 坐标校准调试工具
 *
 * 用法：npx tsx src/tools/debug-calibrate.ts
 *
 * 功能：
 * 1. 查找模拟器窗口，输出窗口信息
 * 2. 截图并标记关键坐标点
 * 3. 依次将鼠标移动到预设位置（窗口四角、中心、tabBar 区域）
 * 4. 在每个位置截图，验证鼠标是否准确落在预期位置
 * 5. 对比截图像素尺寸 vs 逻辑尺寸，检测 Retina 缩放比
 */

import { mouse, Point, getWindows } from '@nut-tree/nut-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');

function ensureDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface SimWindow {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

async function findSimulatorWindow(): Promise<SimWindow> {
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

  if (!output) throw new Error('找不到模拟器窗口，请先分离模拟器');

  const [id, x, y, width, height, ...nameParts] = output.split(',');
  return {
    id: parseInt(id), name: nameParts.join(','),
    x: parseInt(x), y: parseInt(y),
    width: parseInt(width), height: parseInt(height),
  };
}

// __CONTINUE_HERE__

function screenshot(win: SimWindow, label: string): string {
  ensureDir();
  const filePath = path.join(SCREENSHOT_DIR, `debug_calibrate_${label}.png`);
  execSync(`screencapture -x -o -l${win.id} ${filePath}`);
  return filePath;
}

function getImageSize(filePath: string): { pixelWidth: number; pixelHeight: number } {
  const output = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}"`, { encoding: 'utf8' });
  const w = parseInt(output.match(/pixelWidth:\s*(\d+)/)?.[1] || '0');
  const h = parseInt(output.match(/pixelHeight:\s*(\d+)/)?.[1] || '0');
  return { pixelWidth: w, pixelHeight: h };
}

async function main() {
  console.log('=== E2E 坐标校准调试 ===\n');

  // 1. 查找窗口
  const win = await findSimulatorWindow();
  console.log(`📱 模拟器窗口:`);
  console.log(`   名称: ${win.name}`);
  console.log(`   ID: ${win.id}`);
  console.log(`   位置: (${win.x}, ${win.y})`);
  console.log(`   逻辑尺寸: ${win.width}x${win.height}`);

  // 2. 截图并检查 Retina 缩放
  const imgPath = screenshot(win, '01_initial');
  const imgSize = getImageSize(imgPath);
  const scaleX = imgSize.pixelWidth / win.width;
  const scaleY = imgSize.pixelHeight / win.height;
  console.log(`\n📸 截图像素: ${imgSize.pixelWidth}x${imgSize.pixelHeight}`);
  console.log(`   Retina 缩放: ${scaleX}x (水平), ${scaleY}x (垂直)`);

  if (scaleX !== scaleY) {
    console.warn('   ⚠️ 水平和垂直缩放不一致！');
  }

  // 3. 检查 nut.js 窗口信息
  console.log('\n🔍 nut.js 窗口信息:');
  const windows = await getWindows();
  for (const w of windows) {
    const title = await w.title;
    if (/模拟器/i.test(title)) {
      const region = await w.region;
      console.log(`   nut.js: "${title}" at (${region.left}, ${region.top}) size ${region.width}x${region.height}`);
      console.log(`   CoreGraphics vs nut.js 偏移: dx=${win.x - region.left}, dy=${win.y - region.top}`);
      console.log(`   尺寸差异: dw=${win.width - region.width}, dh=${win.height - region.height}`);
    }
  }

  // 4. 坐标校准测试
  mouse.config.autoDelayMs = 50;
  mouse.config.mouseSpeed = 1500;

  const testPoints = [
    { name: '左上角', x: 5, y: 5 },
    { name: '右上角', x: win.width - 5, y: 5 },
    { name: '中心', x: Math.round(win.width / 2), y: Math.round(win.height / 2) },
    { name: '首页Tab', x: Math.round(win.width * 0.17), y: win.height - 30 },
    { name: '消息Tab', x: Math.round(win.width * 0.5), y: win.height - 30 },
    { name: '我的Tab', x: Math.round(win.width * 0.83), y: win.height - 30 },
    { name: '卡片区域(y=500)', x: Math.round(win.width / 2), y: 500 },
    { name: '左下角', x: 5, y: win.height - 5 },
    { name: '右下角', x: win.width - 5, y: win.height - 5 },
  ];

  console.log('\n🎯 坐标校准测试（观察鼠标位置是否准确）:\n');

  for (let i = 0; i < testPoints.length; i++) {
    const p = testPoints[i];
    const sx = win.x + p.x;
    const sy = win.y + p.y;
    console.log(`   [${i + 1}/${testPoints.length}] ${p.name}: 逻辑(${p.x},${p.y}) → 屏幕(${sx},${sy})`);
    await mouse.setPosition(new Point(sx, sy));
    await new Promise(r => setTimeout(r, 1500));
    screenshot(win, `02_point_${String(i + 1).padStart(2, '0')}_${p.name}`);
  }

  console.log('\n✅ 校准完成！截图保存在 screenshots/debug_calibrate_*.png');
  console.log('   请检查鼠标是否准确落在每个预期位置。');
  console.log('   如果有偏移，记录偏移量用于修正 viewportOffset。');
}

main().catch(err => {
  console.error('❌ 校准失败:', err.message);
  process.exit(1);
});
