require('../../setup-env.js');

import { initE2E } from '../core/e2e-setup';

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToTop(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 10; i++) {
    await device.scroll('up', 3);
    await sleep(180);
  }
}

async function scrollDown(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i++) {
    await device.scroll('down', 3);
    await sleep(280);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('history_probe');

  await e2e.act(
    '如果当前页面不是首页，也不是标题为“历史推荐”的页面，则点击底部导航栏的“首页”Tab回到首页；如果已经在首页或历史推荐页面，则保持当前页面不变'
  );
  await e2e.act(
    '如果当前页面是首页，则点击顶部左上角的“历史推荐”入口；如果当前页面已经是标题为“历史推荐”的页面，则保持当前页面不变'
  );
  await e2e.assert('当前页面是历史推荐页面，页面顶部中间有标题“历史推荐”，下面有“昨日推荐”和“日期筛选”');

  await scrollToTop(ctx.device);
  await sleep(1200);
  await e2e.screenshot('history_top');

  await scrollDown(ctx.device, 4);
  await sleep(1200);
  await e2e.screenshot('history_mid');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
