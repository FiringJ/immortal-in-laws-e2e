import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_RESULT_TS = path.join(APP_ROOT, 'pages/filter-result/index.ts');
const FILTER_RESULT_WXML = path.join(APP_ROOT, 'pages/filter-result/index.wxml');

const filterResultTs = fs.readFileSync(FILTER_RESULT_TS, 'utf8');
const filterResultWxml = fs.readFileSync(FILTER_RESULT_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '筛选结果页 onShow 会刷新会员状态',
    /async onShow\(\)\s*\{[\s\S]*memberStore\.refreshStatus\(\)/.test(filterResultTs),
  ],
  [
    '筛选结果页维护至尊会员视图与剩余次数文案',
    /isSupremeView:\s*false[\s\S]*supremeSearchButtonText:\s*'点击搜索嘉宾（今日剩1次机会）'/.test(filterResultTs),
  ],
  [
    '筛选结果页使用 quotaLeft 生成至尊按钮文案',
    /buildSupremeSearchButtonText\(quotaLeft:\s*number\)[\s\S]*今日剩\$\{quotaLeft\}次机会/.test(filterResultTs),
  ],
  [
    '筛选结果页支持至尊按钮点击跳转筛选页',
    /onSupremeSearchTap\(\)\s*\{[\s\S]*url:\s*'\/pages\/filter\/index'/.test(filterResultTs),
  ],
  [
    'WXML 对至尊/非至尊底部按钮做条件渲染',
    /member-cta-supreme\" wx:if=\"\{\{isSupremeView\}\}\"[\s\S]*<block wx:else>/.test(filterResultWxml),
  ],
  [
    '至尊按钮文案绑定剩余次数文本',
    /\{\{supremeSearchButtonText\}\}/.test(filterResultWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-result-footer-member-state-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter result footer/member state static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-result-footer-member-state-static-probe] PASS all checks');
