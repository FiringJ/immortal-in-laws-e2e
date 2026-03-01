#!/usr/bin/env npx tsx
/**
 * E2E Agent MCP Server
 *
 * 将小程序模拟器的视觉决策能力封装为 MCP 工具，供 Cursor Agent 调用：
 * - screenshot: 截取模拟器当前画面
 * - ai_act: 用自然语言指令操作模拟器（视觉定位 + 点击/输入/滚动）
 * - ai_assert: 用自然语言断言当前画面状态
 * - tap: 直接点击模拟器指定坐标
 * - scroll: 滚动模拟器
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { Agent } from '@midscene/core';
import { MiniProgramDevice } from '../core/miniprogram-device';
import * as fs from 'fs';
import * as path from 'path';

// dotenv
try { require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') }); } catch {}

const SCREENSHOT_DIR = path.resolve(__dirname, '../../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

let device: MiniProgramDevice;
let agent: Agent;

async function ensureInit() {
  if (!device) {
    device = new MiniProgramDevice();
    // 验证窗口可用
    const shot = await device.screenshotBase64();
    if (!shot || shot.length < 100) throw new Error('模拟器截图失败');
    agent = new Agent(device);
  }
  return { device, agent };
}

function saveScreenshot(base64: string, label: string): string {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safe = label.replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, '_');
  const filename = `${ts}__mcp__${safe}.png`;
  const filePath = path.join(SCREENSHOT_DIR, filename);
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  fs.writeFileSync(filePath, Buffer.from(raw, 'base64'));
  return filePath;
}

// --- MCP Server ---
const server = new McpServer({
  name: 'e2e-agent',
  version: '1.0.0',
});

// Tool: screenshot
server.tool(
  'screenshot',
  '截取微信小程序模拟器当前画面，返回截图文件路径',
  { label: z.string().optional().describe('截图标签，用于文件命名') },
  async ({ label }) => {
    const { device } = await ensureInit();
    const base64 = await device.screenshotBase64();
    const filePath = saveScreenshot(base64, label || 'screenshot');
    return { content: [{ type: 'text', text: `截图已保存: ${filePath}` }] };
  }
);

// Tool: ai_act
server.tool(
  'ai_act',
  '用自然语言指令操作小程序模拟器（Midscene 视觉 Agent 自动定位元素并执行点击/输入/滚动）',
  { instruction: z.string().describe('自然语言操作指令，如"点击底部导航栏的消息Tab"、"在搜索框输入hello"') },
  async ({ instruction }) => {
    const { agent, device } = await ensureInit();
    const beforePath = saveScreenshot(await device.screenshotBase64(), 'before_act');
    const start = Date.now();
    await agent.aiAct(instruction);
    const elapsed = Date.now() - start;
    // 等待渲染
    await new Promise(r => setTimeout(r, 1000));
    const afterPath = saveScreenshot(await device.screenshotBase64(), 'after_act');
    return {
      content: [{
        type: 'text',
        text: `操作完成 (${elapsed}ms)\n指令: ${instruction}\n操作前截图: ${beforePath}\n操作后截图: ${afterPath}`
      }]
    };
  }
);

// Tool: ai_assert
server.tool(
  'ai_assert',
  '用自然语言断言小程序模拟器当前画面状态（Midscene 视觉 Agent 判断）',
  { assertion: z.string().describe('自然语言断言，如"当前页面是消息列表页"、"页面上显示了系统消息入口"') },
  async ({ assertion }) => {
    const { agent, device } = await ensureInit();
    const shotPath = saveScreenshot(await device.screenshotBase64(), 'assert');
    try {
      await agent.aiAssert(assertion);
      return { content: [{ type: 'text', text: `断言通过: ${assertion}\n截图: ${shotPath}` }] };
    } catch (err: any) {
      return { content: [{ type: 'text', text: `断言失败: ${assertion}\n错误: ${err.message}\n截图: ${shotPath}` }] };
    }
  }
);

// Tool: tap
server.tool(
  'tap',
  '点击模拟器指定坐标（相对于模拟器窗口左上角的逻辑坐标）',
  {
    x: z.number().describe('X 坐标（相对模拟器窗口）'),
    y: z.number().describe('Y 坐标（相对模拟器窗口）'),
  },
  async ({ x, y }) => {
    const { device } = await ensureInit();
    await device.tapAt(x, y);
    await new Promise(r => setTimeout(r, 500));
    const shotPath = saveScreenshot(await device.screenshotBase64(), `tap_${x}_${y}`);
    return { content: [{ type: 'text', text: `已点击 (${x}, ${y})\n截图: ${shotPath}` }] };
  }
);

// Tool: scroll
server.tool(
  'scroll',
  '滚动模拟器画面',
  {
    direction: z.enum(['up', 'down', 'left', 'right']).describe('滚动方向'),
    amount: z.number().min(1).max(3).optional().describe('滚动幅度: 1=小, 2=中, 3=大，默认2'),
  },
  async ({ direction, amount }) => {
    const { device } = await ensureInit();
    await device.scroll(direction, (amount || 2) as 1 | 2 | 3);
    await new Promise(r => setTimeout(r, 500));
    const shotPath = saveScreenshot(await device.screenshotBase64(), `scroll_${direction}`);
    return { content: [{ type: 'text', text: `已滚动 ${direction} (幅度${amount || 2})\n截图: ${shotPath}` }] };
  }
);

// Start
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[E2E MCP] Server started on stdio');
}

main().catch(err => {
  console.error('[E2E MCP] Fatal:', err);
  process.exit(1);
});
