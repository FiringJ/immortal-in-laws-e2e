require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };
const PROFILE_SETTINGS_POINT = { x: 294, y: 771 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToTop(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 8; i += 1) {
    await device.scroll('up', 3);
    await sleep(180);
  }
}

async function scrollDown(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i += 1) {
    await device.scroll('down', 3);
    await sleep(260);
  }
}

async function enterProfile(ctx: Awaited<ReturnType<typeof initE2E>>) {
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(500);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(3200);
}

async function backToTabPage(e2e: ReturnType<Awaited<ReturnType<typeof initE2E>>['observable']>) {
  for (let i = 0; i < 2; i += 1) {
    await e2e.act('如果当前页面左上角有返回箭头，并且当前页面没有底部导航栏，则点击左上角返回箭头回到上一页；如果当前页面已经有底部导航栏，则保持当前页面不变');
    await sleep(1000);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('settings_probe');

  await backToTabPage(e2e);
  await enterProfile(ctx);
  await e2e.assert('当前页面是我的页面，页面中下部有“其他功能”区域，其中包含“设置”入口');
  await ctx.device.tapAt(PROFILE_SETTINGS_POINT.x, PROFILE_SETTINGS_POINT.y);
  await sleep(2400);

  await e2e.assert('当前页面是标题为“设置”的页面，页面由多组白色圆角卡片组成，顶部第一组包含个性化推荐、打招呼语、开启实名相亲、红豆、无门槛联系、屏蔽的人、信息真实性承诺和订单记录');
  await scrollToTop(ctx.device);
  await sleep(1200);
  await e2e.screenshot('settings_top');

  await scrollDown(ctx.device, 7);
  await sleep(1200);
  await e2e.assert('当前页面底部可见“申请注销账号”和“申请暂停相亲”卡片，暂停相亲卡片右侧有灰色开关，下面有灰色说明文字');
  await e2e.screenshot('settings_bottom');

  await scrollToTop(ctx.device);
  await sleep(1000);
  await e2e.act('点击“打招呼语”这一行');
  await sleep(1600);
  await e2e.assert('当前页面底部弹出“打招呼语设置”弹层，顶部有标题和关闭按钮，中间有开关和多条招呼语选项，底部有红色保存按钮');
  await e2e.screenshot('settings_greeting_sheet');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
