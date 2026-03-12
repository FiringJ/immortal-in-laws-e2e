require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const POINTS = {
  backArrow: { x: 40, y: 108 },
  homeTab: { x: 62, y: 813 },
  firstCard: { x: 188, y: 560 },
  reportBtn: { x: 91, y: 606 },
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function tap(
  device: Awaited<ReturnType<typeof initE2E>>['device'],
  point: { x: number; y: number },
  label: string,
) {
  console.log(`[probe] tap ${label} @ (${point.x}, ${point.y})`);
  await device.tapAt(point.x, point.y);
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('guest_detail_report_modal_probe');

  for (let i = 0; i < 3; i++) {
    await tap(ctx.device, POINTS.backArrow, `back-arrow-${i + 1}`);
    await sleep(450);
  }

  await tap(ctx.device, POINTS.homeTab, 'home-tab');
  await sleep(700);
  await tap(ctx.device, POINTS.homeTab, 'home-tab-again');
  await sleep(900);

  await tap(ctx.device, POINTS.firstCard, 'first-card');
  await sleep(1700);

  for (let i = 0; i < 7; i++) {
    await ctx.device.scroll('down', 3);
    await sleep(280);
  }

  await sleep(500);
  await e2e.screenshot('guest_detail_before_report_modal');

  await e2e.act('点击“举报”按钮');
  await sleep(1200);
  await e2e.screenshot('guest_detail_report_modal_after_ui_fix');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
