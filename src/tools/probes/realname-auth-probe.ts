require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function backToTabPage(e2e: ReturnType<Awaited<ReturnType<typeof initE2E>>['observable']>) {
  for (let i = 0; i < 2; i += 1) {
    await e2e.act('如果当前页面左上角有返回箭头，并且当前页面没有底部导航栏，则点击左上角返回箭头回到上一页；如果当前页面已经有底部导航栏，则保持当前页面不变');
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

  const e2e = ctx.observable('realname_auth_probe');

  await backToTabPage(e2e);
  await enterProfile(ctx);
  await e2e.assert('当前页面是“我的”页面，页面中存在实名认证入口');

  await e2e.act('点击“实名认证”入口，进入实名认证页面');
  await sleep(2200);

  await e2e.assert('当前页面是实名认证页面，页面内出现“实名认证”标题，并且可见认证相关内容（如实名认证的好处、认证方式、真实姓名或身份证号等）');
  await e2e.screenshot('realname_auth_page_after_fix');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
