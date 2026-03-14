import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const INDEX_TS = path.join(APP_ROOT, 'pages/index/index.ts');
const MESSAGE_TS = path.join(APP_ROOT, 'pages/message/index.ts');

const indexTs = fs.readFileSync(INDEX_TS, 'utf8');
const messageTs = fs.readFileSync(MESSAGE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首页精准查找入口按筛选历史（结果或已保存条件）走结果页',
    /onFilterTap\(\)\s*\{[\s\S]*hasFilterHistory[\s\S]*getFilterResultList\(\)\.length > 0[\s\S]*getFilterRequirements\(\)[\s\S]*\/pages\/filter-result\/index\?from=index/.test(indexTs),
  ],
  [
    '消息页精准查找入口与首页一致按筛选历史跳转结果页',
    /onFilterTap\(\)\s*\{[\s\S]*hasFilterHistory[\s\S]*getFilterResultList\(\)\.length > 0[\s\S]*getFilterRequirements\(\)[\s\S]*\/pages\/filter-result\/index\?from=message/.test(messageTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-entry-history-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter entry history static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-entry-history-static-probe] PASS all checks');
