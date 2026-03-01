require('../../setup-env.js');

import { initE2E } from '../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToTop(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 8; i++) {
    await device.scroll('up', 3);
    await sleep(180);
  }
}

async function scrollDown(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i++) {
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
  for (let i = 0; i < 2; i++) {
    await e2e.act('如果当前页面左上角有返回箭头，并且当前页面没有底部导航栏，则点击左上角返回箭头回到上一页；如果当前页面已经有底部导航栏，则保持当前页面不变');
    await sleep(1000);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('profile_flow_probe');

  await backToTabPage(e2e);
  await enterProfile(ctx);
  await e2e.assert('当前页面是我的页面，顶部有绿色“转发资料”按钮，右侧有两个白色浮层操作图标，下方依次有资料卡、会员横幅、“常用功能”和“其他功能”区块');
  await scrollToTop(ctx.device);
  await sleep(1200);
  await e2e.screenshot('profile_top');

  await e2e.act('点击资料卡区域底部左侧的“预览资料”按钮');
  await sleep(2200);
  await e2e.assert('当前页面是标题为“预览资料”的页面，顶部有家长头像卡片，中间有红色的性别和年份主标题，底部固定有绿色“转发”和红色“编辑资料”按钮');
  await scrollToTop(ctx.device);
  await sleep(1000);
  await e2e.screenshot('profile_preview_top');
  await scrollDown(ctx.device, 4);
  await sleep(1000);
  await e2e.screenshot('profile_preview_bottom');

  await e2e.act('点击底部固定栏右侧红色的“编辑资料”按钮');
  await sleep(2200);
  await e2e.assert('当前页面是标题为“相亲资料”的页面，顶部有“孩子照片”上传区，下面依次有“联系方式”“基本信息”“更多信息”“相亲说明”“择偶标准”等白色卡片分组，底部固定有红色“保存”按钮');
  await scrollToTop(ctx.device);
  await sleep(1000);
  await e2e.screenshot('profile_edit_top');
  await scrollDown(ctx.device, 6);
  await sleep(1000);
  await e2e.screenshot('profile_edit_mid');
  await scrollDown(ctx.device, 6);
  await sleep(1000);
  await e2e.screenshot('profile_edit_bottom');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
