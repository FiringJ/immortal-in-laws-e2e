require('../../setup-env.js');

import { initE2E } from '../core/e2e-setup';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('block_modal_simple');

  // 直接点击首页标签（坐标方式）
  const HOME_TAB = { x: 105, y: 658 };
  await ctx.device.tapAt(HOME_TAB.x, HOME_TAB.y);
  await sleep(2000);

  // 点击第一个嘉宾卡片（大致位置）
  await ctx.device.tapAt(187, 300);
  await sleep(2500);

  // 滚动到底部
  for (let i = 0; i < 10; i++) {
    await ctx.device.scroll('down', 3);
    await sleep(150);
  }
  await sleep(500);

  // 点击屏蔽按钮（底部右侧位置）
  await ctx.device.tapAt(310, 750);
  await sleep(1500);

  // 截图屏蔽弹窗
  await e2e.screenshot('block_modal_after_fix');

  console.log('✅ 屏蔽弹窗截图已保存到: screenshots/block_modal_after_fix.png');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
