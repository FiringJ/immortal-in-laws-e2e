import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HISTORY_TS = path.join(APP_ROOT, 'pages/history/index.ts');
const HISTORY_WXML = path.join(APP_ROOT, 'pages/history/index.wxml');

const historyTs = fs.readFileSync(HISTORY_TS, 'utf8');
const historyWxml = fs.readFileSync(HISTORY_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '历史推荐主列表 guest-card 启用 footer 按钮并绑定点击事件',
    /guest="\{\{item\.guest\}\}"[\s\S]*show-footer="\{\{true\}\}"[\s\S]*bind:cardtap="onGuestCardTap"[\s\S]*bind:contact="onContactTap"/.test(historyWxml),
  ],
  [
    '历史页卡片按钮点击在非至尊场景不会无响应（统一触发 member unlock）',
    /onGuestCardTap[\s\S]*if\s*\(!this\.data\.canView\)\s*\{[\s\S]*showHistoryMemberUnlockModal\(\)/.test(historyTs)
      && /onContactTap[\s\S]*if\s*\(!this\.data\.canView\)\s*\{[\s\S]*showHistoryMemberUnlockModal\(\)/.test(historyTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[history-card-button-response-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`history card button response static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[history-card-button-response-static-probe] PASS all checks');
