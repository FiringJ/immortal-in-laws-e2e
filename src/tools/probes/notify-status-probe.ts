require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
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

  const e2e = ctx.observable('notify_status_probe');

  await enterProfile(ctx);
  await e2e.assert('当前页面是我的页面，在“其他功能”区域可以看到“通知状态”入口');
  await e2e.act('点击“通知状态”入口');
  await sleep(1800);
  await e2e.assert('当前页面显示“操作教程”弹窗，包含“先打开“开关””和“再打开“允许””两条指引');
  await e2e.screenshot('notify_guide_modal');

  await e2e.act('点击“去开启”按钮');
  await sleep(2600);
  await e2e.assert('若订阅成功则进入“明日通知状态”页面并看到“按次订阅通知”；若失败则看到“开启失败，请重试”弹窗');
  await e2e.screenshot('notify_result_state');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
