import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const FILTER_RESULT_TS = path.join(APP_ROOT, 'pages/filter-result/index.ts');
const FILTER_RESULT_WXML = path.join(APP_ROOT, 'pages/filter-result/index.wxml');
const FILTER_RESULT_WXSS = path.join(APP_ROOT, 'pages/filter-result/index.wxss');

const filterResultTs = fs.readFileSync(FILTER_RESULT_TS, 'utf8');
const filterResultWxml = fs.readFileSync(FILTER_RESULT_WXML, 'utf8');
const filterResultWxss = fs.readFileSync(FILTER_RESULT_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '非至尊筛选结果限制首屏数量并注入渐进遮罩元数据',
    /decorateNonSupremeView\(list: Guest\[\]\): FilterResultViewItem\[\][\s\S]*slice\(0,\s*NON_MEMBER_FILTER_LIMIT\)[\s\S]*maskLevel[\s\S]*showLimitHint/.test(filterResultTs),
  ],
  [
    '筛选结果页渲染渐进遮罩和“去开通”引导卡片',
    /result-item-fade result-item-fade-\{\{item\.maskLevel\}\}[\s\S]*result-item-limit[\s\S]*更多嘉宾记录需开通至尊会员后查看[\s\S]*去开通/.test(filterResultWxml),
  ],
  [
    '渐进遮罩存在 light/strong 两档样式',
    /\.result-item-fade-light[\s\S]*\.result-item-fade-strong/.test(filterResultWxss),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[filter-result-progressive-blur-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`filter result progressive blur static probe failed: ${failed.length} checks missing`);
}

console.log('[filter-result-progressive-blur-static-probe] PASS all checks');
