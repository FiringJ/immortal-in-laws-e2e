require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function backToTabPage(e2e: ReturnType<Awaited<ReturnType<typeof initE2E>>['observable']>) {
  for (let i = 0; i < 3; i += 1) {
    await e2e.act('如果当前页面左上角有返回箭头，并且页面底部没有tab导航栏，则点击左上角返回箭头；如果已经有tab导航栏，则保持当前页面不变');
    await sleep(1000);
  }
}

async function enterProfile(ctx: Awaited<ReturnType<typeof initE2E>>) {
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(500);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(3200);
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('member_center_expired_probe');

  await backToTabPage(e2e);
  await enterProfile(ctx);
  await e2e.assert('当前页面是我的页面，页面中上部有会员横幅区域');
  await e2e.act('点击会员横幅区域，或点击横幅里的“去开通/去升级/查看特权”按钮，进入会员中心页面');
  await sleep(2600);
  await e2e.assert('当前页面是会员中心，顶部可以看到“黄金会员”和“至尊会员”tab');
  await e2e.act('点击顶部“黄金会员”tab，确保已选中');
  await sleep(1600);
  await e2e.assert('当前页面展示黄金会员价格档位卡片，以及会员权益信息模块');
  await e2e.screenshot('member_center_gold_state_probe');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
