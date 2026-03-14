import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const HISTORY_TS = path.join(APP_ROOT, 'pages/history/index.ts');
const HISTORY_WXML = path.join(APP_ROOT, 'pages/history/index.wxml');

const historyTs = fs.readFileSync(HISTORY_TS, 'utf8');
const historyWxml = fs.readFileSync(HISTORY_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '历史推荐左上角文案绑定为实时日期标签',
    /<view class="history-tab active">\{\{selectedDateLabel\}\}<\/view>/.test(historyWxml),
  ],
  [
    '历史推荐页提供月日格式化方法',
    /formatSelectedDateLabel\(selectedDate: string\): string[\s\S]*\$\{date\.getMonth\(\) \+ 1\}月\$\{date\.getDate\(\)\}日/.test(historyTs),
  ],
  [
    '日期切换时会同步更新 selectedDateLabel',
    /onDateChange[\s\S]*selectedDateLabel:\s*this\.formatSelectedDateLabel\(selectedDate\)/.test(historyTs),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[history-recommend-date-label-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`history recommend date label static probe failed: ${failed.length} checks missing`);
}

console.log('[history-recommend-date-label-static-probe] PASS all checks');
