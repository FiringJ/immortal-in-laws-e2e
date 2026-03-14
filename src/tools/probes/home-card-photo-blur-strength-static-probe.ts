import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const GUEST_CARD_WXSS = path.join(APP_ROOT, 'components/guest-card/index.wxss');

const guestCardWxss = fs.readFileSync(GUEST_CARD_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首页嘉宾卡图片高斯模糊强度下调为 12rpx',
    /\.avatar-blur[\s\S]*filter:\s*blur\(12rpx\);[\s\S]*-webkit-filter:\s*blur\(12rpx\);/.test(guestCardWxss),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[home-card-photo-blur-strength-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`home card photo blur strength static probe failed: ${failed.length} checks missing`);
}

console.log('[home-card-photo-blur-strength-static-probe] PASS all checks');
