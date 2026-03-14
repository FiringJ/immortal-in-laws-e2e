import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_WXML = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const recordTs = fs.readFileSync(RECORD_TS, 'utf8');
const recordWxml = fs.readFileSync(RECORD_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '我看过的顶部开通至尊按钮绑定至尊跳转方法',
    /class="vip-btn[\s\S]*bindtap="onOpenSupremeVip"/.test(recordWxml),
  ],
  [
    '模糊记录区覆盖可点击蒙层并绑定至尊跳转',
    /class="record-list-overlay"[\s\S]*wx:if="\{\{showVipBanner\}\}"[\s\S]*bindtap="onOpenSupremeVip"/.test(recordWxml),
  ],
  [
    '至尊跳转方法直接进入会员中心至尊 tab',
    /onOpenSupremeVip\(\)\s*\{[\s\S]*wx\.navigateTo\(\{[\s\S]*url:\s*'\/pages\/member-center\/index\?tab=supreme'/.test(recordTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[message-record-view-supreme-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`message record view supreme entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[message-record-view-supreme-entry-static-probe] PASS all checks');
