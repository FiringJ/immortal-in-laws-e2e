import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const HISTORY_TS = path.join(APP_ROOT, 'pages/history/index.ts');
const HISTORY_WXML = path.join(APP_ROOT, 'pages/history/index.wxml');
const HISTORY_WXSS = path.join(APP_ROOT, 'pages/history/index.wxss');

const historyTs = fs.readFileSync(HISTORY_TS, 'utf8');
const historyWxml = fs.readFileSync(HISTORY_WXML, 'utf8');
const historyWxss = fs.readFileSync(HISTORY_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '历史推荐空结果使用定制缺省态并保留取消筛选交互',
    /class="history-empty"[\s\S]*您该日未登录平台，所以无推荐嘉宾哦！[\s\S]*bindtap="onResetDateFilter"/.test(historyWxml),
  ],
  [
    '历史推荐页提供取消筛选处理并重置日期后重新加载',
    /onResetDateFilter\(\)\s*\{[\s\S]*selectedDate:\s*this\.getDefaultHistoryDate\(\)[\s\S]*showDateFilter:\s*false[\s\S]*this\.loadData\(\);[\s\S]*\}/.test(historyTs),
  ],
  [
    '历史推荐空态包含箱子图形和按钮样式以匹配视觉要求',
    /\.history-empty-icon[\s\S]*\.history-empty-box[\s\S]*button\.history-empty-btn:not\(\[size='mini'\]\)/.test(historyWxss),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[history-filter-empty-state-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`history filter empty state static probe failed: ${failed.length} checks missing`);
}

console.log('[history-filter-empty-state-static-probe] PASS all checks');
