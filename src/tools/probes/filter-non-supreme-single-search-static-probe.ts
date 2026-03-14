import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_RESULT_TS = path.join(APP_ROOT, 'pages/filter-result/index.ts');
const FILTER_RESULT_WXML = path.join(APP_ROOT, 'pages/filter-result/index.wxml');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');

const filterResultTs = fs.readFileSync(FILTER_RESULT_TS, 'utf8');
const filterResultWxml = fs.readFileSync(FILTER_RESULT_WXML, 'utf8');
const filterTs = fs.readFileSync(FILTER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '搜索结果页仅至尊会员展示“条件设置”入口',
    /summary-right\" wx:if=\"\{\{isSupremeView\}\}\"/.test(filterResultWxml),
  ],
  [
    '结果页点击条件设置前会校验至尊会员身份',
    /onConditionTap\(\)\s*\{[\s\S]*!memberStore\.isSupremeMember\(\)[\s\S]*非至尊会员仅可搜索1次/.test(filterResultTs),
  ],
  [
    '筛选提交时会阻断非至尊重复搜索并回到结果页',
    /onSubmit\(\)\s*\{[\s\S]*!memberStore\.isSupremeMember\(\)\s*&&\s*hasFilterHistory[\s\S]*非至尊会员仅可搜索1次[\s\S]*\/pages\/filter-result\/index/.test(filterTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-non-supreme-single-search-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter non-supreme single search static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-non-supreme-single-search-static-probe] PASS all checks');
