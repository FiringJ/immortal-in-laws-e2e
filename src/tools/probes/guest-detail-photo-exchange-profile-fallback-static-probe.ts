import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');

const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '交换照片读取本方照片时先走 profile 预览缓存',
    /async getSelfExchangePhotoUrl\(\): Promise<string>[\s\S]*await userStore\.refreshProfile\(\)/.test(guestDetailTs),
  ],
  [
    '预览无照片时会兜底刷新 profile detail',
    /if\s*\(!photoUrl\)\s*\{[\s\S]*await userStore\.refreshProfileDetail\(\)/.test(guestDetailTs),
  ],
  [
    '兜底逻辑包含 detail 刷新失败日志，避免静默失败',
    /refresh profile detail for photo exchange error/.test(guestDetailTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[guest-detail-photo-exchange-profile-fallback-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`guest detail photo exchange profile fallback static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-detail-photo-exchange-profile-fallback-static-probe] PASS all checks');
