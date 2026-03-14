require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function backToTabPage(e2e: ReturnType<Awaited<ReturnType<typeof initE2E>>['observable']>) {
  for (let i = 0; i < 3; i += 1) {
    await e2e.act('如果当前页面左上角有返回箭头并且当前页面没有底部tab导航栏，则点击返回箭头；如果已有底部tab导航栏则保持当前页面不变');
    await sleep(1000);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('profile_other_functions_probe');

  await backToTabPage(e2e);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(500);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(3200);
  await ctx.device.scroll('down', 2);
  await sleep(1200);

  await e2e.assert('当前页面是“我的”页，其他功能区域完整显示两行入口，包含“邀请好友”“相亲红豆”“实名认证”“通知状态”“账号切换”“设置”，且不包含“联系管家”“防骗指南”');
  await e2e.screenshot('profile_other_functions_state');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
