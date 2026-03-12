require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('block_modal_verify');

  // 直接点击首页标签
  const HOME_TAB = { x: 105, y: 658 };
  await ctx.device.tapAt(HOME_TAB.x, HOME_TAB.y);
  await sleep(2000);

  // 点击第一个嘉宾卡片
  await ctx.device.tapAt(187, 300);
  await sleep(2500);

  // 滚动到页面最底部
  for (let i = 0; i < 15; i++) {
    await ctx.device.scroll('down', 4);
    await sleep(120);
  }
  await sleep(800);

  // 点击屏蔽按钮（可信度卡片底部右侧）
  // 根据布局，屏蔽按钮应该在右下角区域
  await ctx.device.tapAt(280, 720);
  await sleep(1800);

  // 截图屏蔽弹窗
  await e2e.screenshot('block_modal_optimized');

  console.log('✅ 屏蔽弹窗截图已保存');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
