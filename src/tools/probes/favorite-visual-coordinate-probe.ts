require('../../../setup-env.js');

import * as fs from 'fs';
import * as path from 'path';
import { initE2E } from '../../core/e2e-setup';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../screenshots');

const POINTS = {
  backArrow: { x: 40, y: 108 },
  homeTab: { x: 62, y: 813 },
  firstCard: { x: 188, y: 560 },
  favoriteBtn: { x: 145, y: 808 },
  confirmRemove: { x: 270, y: 525 },
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
}

async function saveShot(
  device: Awaited<ReturnType<typeof initE2E>>['device'],
  name: string,
) {
  ensureDir();
  const base64 = await device.screenshotBase64();
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  const filePath = path.join(SCREENSHOT_DIR, name);
  fs.writeFileSync(filePath, Buffer.from(raw, 'base64'));
  console.log(`[probe] screenshot: ${filePath}`);
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

  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  for (let i = 0; i < 3; i++) {
    await tap(ctx.device, POINTS.backArrow, `back-arrow-${i + 1}`);
    await sleep(450);
  }

  await tap(ctx.device, POINTS.homeTab, 'home-tab');
  await sleep(700);
  await tap(ctx.device, POINTS.homeTab, 'home-tab-again');
  await sleep(900);
  await saveShot(ctx.device, `${ts}__favorite_coord__step0_home.png`);

  await tap(ctx.device, POINTS.firstCard, 'first-card');
  await sleep(1600);
  await saveShot(ctx.device, `${ts}__favorite_coord__step1_detail_initial.png`);

  await tap(ctx.device, POINTS.favoriteBtn, 'favorite-toggle-1');
  await sleep(1000);
  await saveShot(ctx.device, `${ts}__favorite_coord__step2_after_toggle1.png`);

  await tap(ctx.device, POINTS.confirmRemove, 'confirm-remove-attempt-1');
  await sleep(1000);
  await saveShot(ctx.device, `${ts}__favorite_coord__step3_after_confirm1.png`);

  await tap(ctx.device, POINTS.favoriteBtn, 'favorite-toggle-2');
  await sleep(1000);
  await saveShot(ctx.device, `${ts}__favorite_coord__step4_after_toggle2.png`);

  await tap(ctx.device, POINTS.confirmRemove, 'confirm-remove-attempt-2');
  await sleep(1000);
  await saveShot(ctx.device, `${ts}__favorite_coord__step5_after_confirm2.png`);
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
