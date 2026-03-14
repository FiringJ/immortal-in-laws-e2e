import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/guest-detail/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/guest-detail/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['会员点击交换照片走统一解锁提示弹窗', /openUnlockPrompt\('chat',\s*true,\s*remaining,\s*\{\s*vipText:\s*'您是会员，可免费解锁'/.test(ts)],
  ['会员交换照片解锁成功后回到交换照片确认弹窗', /_pendingUnlockOnSuccess\s*=\s*\(\)\s*=>\s*\{\s*this\.openPhotoExchangeConfirmModal\(guest\);/.test(ts)],
  ['交换照片权限弹窗保留非会员剩余次数文案', /`还可免费解锁\$\{Math\.max\(0, remaining\)\}个家长`/.test(ts)],
  ['交换照片权限弹窗确认后直接解锁不再二次弹 generic 提示', /onConfirmPhotoExchangePermissionModal\([\s\S]*skipConfirm:\s*true/.test(ts)],
  ['统一解锁提示弹窗按钮文案为“立即解锁”', /onConfirmUnlockPrompt">立即解锁</.test(wxml)],
  ['交换照片权限弹窗正文仍使用动态提示字段', /photoExchangePermissionTip/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[guest-detail-photo-exchange-member-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`guest detail photo exchange member copy static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-detail-photo-exchange-member-copy-static-probe] PASS all checks');
