require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const GOLD_TAB_POINT = { x: 146, y: 123 };
const SUPREME_TAB_POINT = { x: 226, y: 120 };
const GOLD_ANNUAL_PLAN_POINT = { x: 188, y: 312 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToTop(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 14; i++) {
    await device.scroll('up', 3);
    await sleep(180);
  }
}

async function scrollDown(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i++) {
    await device.scroll('down', 3);
    await sleep(350);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('member_center_redo_validation');

  await e2e.act(
    '如果当前页面有“未进行会员认证”和右侧“去开通”按钮，则点击“去开通”；如果当前页面已经有“黄金会员”和“至尊会员”两个tab，则保持当前页面不变'
  );
  await e2e.assert('当前页面是会员中心页面，顶部有"黄金会员"和"至尊会员"两个tab');

  await ctx.device.tapAt(GOLD_TAB_POINT.x, GOLD_TAB_POINT.y);
  await sleep(1600);
  await scrollToTop(ctx.device);
  await sleep(1200);
  await ctx.device.tapAt(GOLD_ANNUAL_PLAN_POINT.x, GOLD_ANNUAL_PLAN_POINT.y);
  await sleep(1000);
  await e2e.screenshot('member_center_gold_redo');

  await ctx.device.tapAt(SUPREME_TAB_POINT.x, SUPREME_TAB_POINT.y);
  await sleep(2200);
  await scrollToTop(ctx.device);
  await sleep(2200);
  await e2e.screenshot('member_center_supreme_redo_top');

  await scrollDown(ctx.device, 5);
  await e2e.screenshot('member_center_supreme_redo_middle');

  await scrollDown(ctx.device, 5);
  await e2e.screenshot('member_center_supreme_redo_bottom');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
