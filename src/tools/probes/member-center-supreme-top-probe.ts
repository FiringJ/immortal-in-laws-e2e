require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const SUPREME_TAB_POINT = { x: 226, y: 120 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToTop(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 14; i++) {
    await device.scroll('up', 3);
    await sleep(180);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('member_center_supreme_top_probe');

  await e2e.act('如果当前不在会员中心页面，则点击"会员中心"入口进入会员中心页面；如果已经在会员中心页面，则保持当前页面不变');
  await e2e.assert('当前页面是会员中心页面，顶部有"黄金会员"和"至尊会员"两个tab');

  await ctx.device.tapAt(SUPREME_TAB_POINT.x, SUPREME_TAB_POINT.y);
  await sleep(1200);
  await scrollToTop(ctx.device);
  await e2e.screenshot('member_center_supreme_top_probe');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
