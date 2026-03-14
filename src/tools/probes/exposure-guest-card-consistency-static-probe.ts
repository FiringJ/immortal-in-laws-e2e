import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const EXPOSURE_PAGE_TS = path.join(APP_ROOT, 'pages/exposure/index.ts');
const EXPOSURE_PAGE_WXML = path.join(APP_ROOT, 'pages/exposure/index.wxml');
const EXPOSURE_LIST_WXML = path.join(APP_ROOT, 'components/pages/exposure/exposure-guest-list/index.wxml');

const exposurePageTs = fs.readFileSync(EXPOSURE_PAGE_TS, 'utf8');
const exposurePageWxml = fs.readFileSync(EXPOSURE_PAGE_WXML, 'utf8');
const exposureListWxml = fs.readFileSync(EXPOSURE_LIST_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '超级曝光嘉宾列表复用 guest-card 且绑定详情/联系交互事件',
    /<guest-card[\s\S]*bind:cardtap="onGuestCardTap"[\s\S]*bind:contact="onContactTap"/.test(exposureListWxml),
  ],
  [
    '超级曝光页详情点击仍跳转嘉宾详情并携带 source=1',
    /onGuestCardTap\([\s\S]*\/pages\/guest-detail\/index\?id=\$\{guestid\}&source=1/.test(exposurePageTs),
  ],
  [
    '超级曝光页联系交互含解锁确认弹窗链路',
    /showContactUnlockConfirm[\s\S]*contactUnlockGuestId[\s\S]*contactUnlockHint/.test(exposurePageTs)
      && /bind:confirm="onConfirmContactUnlock"/.test(exposurePageWxml),
  ],
  [
    '超级曝光页联系交互含次数不足弹窗链路',
    /showContactLimitModal/.test(exposurePageTs)
      && /content="联系次数不足"[\s\S]*bind:confirm="onContactLimitConfirm"/.test(exposurePageWxml),
  ],
  [
    '超级曝光页与首页一致：先解锁再跳会话，并使用曝光来源 source=1',
    /ensureUnlockedAndNavigate[\s\S]*unlockContact\(guestId, 1\)[\s\S]*\/pages\/chat\/index\?guestId=\$\{guestId\}/.test(exposurePageTs),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[exposure-guest-card-consistency-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`exposure guest card consistency static probe failed: ${failed.length} checks missing`);
}

console.log('[exposure-guest-card-consistency-static-probe] PASS all checks');
