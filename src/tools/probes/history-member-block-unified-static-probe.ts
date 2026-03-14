import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HISTORY_TS = path.join(APP_ROOT, 'pages/history/index.ts');
const HISTORY_WXML = path.join(APP_ROOT, 'pages/history/index.wxml');

const historyTs = fs.readFileSync(HISTORY_TS, 'utf8');
const historyWxml = fs.readFileSync(HISTORY_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '历史页卡片点击在非至尊场景统一走 member unlock 弹层',
    /onGuestCardTap[\s\S]*if\s*\(!this\.data\.canView\)\s*\{[\s\S]*this\.showHistoryMemberUnlockModal\(\)/.test(historyTs),
  ],
  [
    '历史页联系按钮在非至尊场景统一走 member unlock 弹层',
    /onContactTap[\s\S]*if\s*\(!this\.data\.canView\)\s*\{[\s\S]*this\.showHistoryMemberUnlockModal\(\)/.test(historyTs),
  ],
  [
    '历史页锁条可点击触发统一阻断弹层',
    /class="history-lock"[\s\S]*bindtap="onHistoryBlockedTap"/.test(historyWxml)
      && /onHistoryBlockedTap\(\)\s*\{[\s\S]*showHistoryMemberUnlockModal\(\)/.test(historyTs),
  ],
  [
    '统一阻断弹层方法写入查看历史推荐 scene',
    /showHistoryMemberUnlockModal\(\)\s*\{[\s\S]*showMemberUnlockModal:\s*true[\s\S]*memberUnlockScene:\s*'查看历史推荐'/.test(historyTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[history-member-block-unified-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`history member block unified static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[history-member-block-unified-static-probe] PASS all checks');
