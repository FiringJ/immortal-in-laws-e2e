import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HISTORY_TS = path.join(APP_ROOT, 'pages/history/index.ts');
const HISTORY_WXML = path.join(APP_ROOT, 'pages/history/index.wxml');

const historyTs = fs.readFileSync(HISTORY_TS, 'utf8');
const historyWxml = fs.readFileSync(HISTORY_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '历史页日期筛选默认选中前31天',
    /onLoad\(\)\s*\{[\s\S]*selectedDate = getDateString\(addDays\(today,\s*-31\)\)/.test(historyTs),
  ],
  [
    '历史页日期筛选为单日 date picker（滚筒）',
    /<picker[\s\S]*mode="date"[\s\S]*bindchange="onDateChange"/.test(historyWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[history-date-picker-default-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`history date picker default static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[history-date-picker-default-static-probe] PASS all checks');
