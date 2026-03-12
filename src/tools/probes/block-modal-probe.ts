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

  const e2e = ctx.observable('block_modal_probe');

  // 导航到首页
  await e2e.act('如果当前页面不是首页，点击底部导航栏的"首页"标签');
  await sleep(2000);

  // 点击第一个嘉宾卡片进入详情页
  await e2e.act('点击页面中第一个嘉宾卡片');
  await sleep(2500);

  // 确认进入嘉宾详情页
  await e2e.assert('当前页面是相亲资料详情页，顶部有返回按钮和"相亲资料"标题');
  await sleep(500);

  // 滚动到底部找到屏蔽按钮
  for (let i = 0; i < 8; i++) {
    await ctx.device.scroll('down', 3);
    await sleep(200);
  }

  // 点击屏蔽按钮
  await e2e.act('点击页面底部的"屏蔽"按钮或"屏蔽对方"按钮');
  await sleep(1500);

  // 截图屏蔽弹窗
  await e2e.screenshot('block_modal');

  console.log('✅ 屏蔽弹窗截图已保存');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
