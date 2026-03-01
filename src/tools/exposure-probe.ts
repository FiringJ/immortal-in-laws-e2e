require('../../setup-env.js');

import { initE2E } from '../core/e2e-setup';

const HOME_TAB_POINT = { x: 64, y: 794 };
const EXPOSURE_CARD_POINT = { x: 248, y: 162 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('exposure_probe');

  await ctx.device.tapAt(HOME_TAB_POINT.x, HOME_TAB_POINT.y);
  await sleep(1400);

  await e2e.assert('当前页面是首页，顶部有“神仙亲家”标题，标题下方有“精准查找”和“超级曝光”两个入口卡片');
  await ctx.device.tapAt(EXPOSURE_CARD_POINT.x, EXPOSURE_CARD_POINT.y);
  await sleep(2800);

  await e2e.assert('当前页面是超级曝光页面，顶部是红色主题的大标题“同城置顶 超级曝光”，页面底部有“299元单次购买”和“至尊会员可免费曝光”两个固定按钮');
  await e2e.screenshot('exposure_top');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
