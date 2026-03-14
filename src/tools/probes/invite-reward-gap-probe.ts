require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const PROFILE_TAB_POINT = { x: 317, y: 822 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function backToTabPage(e2e: ReturnType<Awaited<ReturnType<typeof initE2E>>['observable']>) {
  for (let i = 0; i < 3; i += 1) {
    await e2e.act('如果当前页面左上角有返回箭头并且页面底部没有tab导航栏，则点击返回箭头；如果已经有tab导航栏则保持当前页面不变');
    await sleep(1000);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('invite_reward_gap_probe');

  await backToTabPage(e2e);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(500);
  await ctx.device.tapAt(PROFILE_TAB_POINT.x, PROFILE_TAB_POINT.y);
  await sleep(3200);

  await e2e.act('点击“其他功能”区域中的“邀请好友”入口');
  await sleep(2200);
  await e2e.assert('当前页面是邀请页，核心内容为“邀请家人帮孩子找对象”和家庭成员头像区，未出现“累计邀请人数/获得现金/去提现”等邀请有奖收益模块');
  await e2e.screenshot('invite_reward_gap_state');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
