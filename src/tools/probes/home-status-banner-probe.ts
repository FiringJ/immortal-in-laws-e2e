require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const HOME_TAB_POINT = { x: 64, y: 794 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('home_status_banner_probe');

  await e2e.act('如果当前页面左上角有返回箭头，则点击它回到上一页；如果当前页面已经是首页，则保持当前页面不变');
  await sleep(1000);
  await ctx.device.tapAt(HOME_TAB_POINT.x, HOME_TAB_POINT.y);
  await sleep(1400);

  await e2e.assert('当前页面是首页，页面顶部有“神仙亲家”标题');
  await sleep(1200);
  await e2e.screenshot('home_top');
  await e2e.assert('当前页面底部固定横幅显示“订单未支付”和“去支付”，且不显示绿色的“您未开启每日推荐服务”横幅和“去开启”按钮');
  await e2e.screenshot('home_status_banner');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
