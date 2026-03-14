import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HOME_TS = path.join(APP_ROOT, 'pages/index/index.ts');
const HOME_WXML = path.join(APP_ROOT, 'pages/index/index.wxml');

const homeTs = fs.readFileSync(HOME_TS, 'utf8');
const homeWxml = fs.readFileSync(HOME_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首页数据包含解锁确认弹窗状态',
    /showContactUnlockConfirm:\s*false[\s\S]*contactUnlockGuestId:\s*''[\s\S]*contactUnlockHint:\s*''/.test(homeTs),
  ],
  [
    '首页联系对方支持会员或剩余次数走解锁确认',
    /const canUnlock = isMember \|\| remainingCount > 0[\s\S]*showContactUnlockConfirm:\s*true/.test(homeTs),
  ],
  [
    '首页解锁确认文案包含剩余次数提示',
    /您有\$\{remainingCount\}次免费解锁机会，可免费解锁和对方的聊天/.test(homeTs),
  ],
  [
    '首页非会员无次数阻断为联系次数不足弹窗',
    /if \(!isMember && remainingCount <= 0\)[\s\S]*showContactLimitModal:\s*true/.test(homeTs),
  ],
  [
    '首页确认解锁后执行解锁跳转逻辑',
    /async onConfirmContactUnlock\(\)[\s\S]*ensureUnlockedAndNavigate\(guestId\)/.test(homeTs),
  ],
  [
    '首页模板包含立即解锁确认弹窗',
    /show="\{\{showContactUnlockConfirm\}\}"[\s\S]*confirmText="立即解锁"[\s\S]*bind:confirm="onConfirmContactUnlock"/.test(homeWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-contact-unlock-block-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home contact unlock block static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-contact-unlock-block-static-probe] PASS all checks');
