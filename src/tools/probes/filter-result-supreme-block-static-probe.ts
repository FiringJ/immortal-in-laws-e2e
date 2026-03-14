import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_RESULT_TS = path.join(APP_ROOT, 'pages/filter-result/index.ts');
const MEMBER_CENTER_TS = path.join(APP_ROOT, 'pages/member-center/index.ts');

const filterResultTs = fs.readFileSync(FILTER_RESULT_TS, 'utf8');
const memberCenterTs = fs.readFileSync(MEMBER_CENTER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '筛选结果页统一拼装至尊会员页链接并携带精准搜索场景',
    /buildSupremeMemberCenterUrl\(\)\s*\{[\s\S]*\/pages\/member-center\/index\?tab=supreme&scene=\$\{encodeURIComponent\('精准搜索'\)\}/.test(filterResultTs),
  ],
  [
    '非至尊用户点击嘉宾卡片会直接跳转至尊会员页',
    /onGuestCardTap[\s\S]*if\s*\(!memberStore\.isSupremeMember\(\)\)\s*\{[\s\S]*navigateToSupremeMemberCenter\(\)/.test(filterResultTs),
  ],
  [
    '非至尊用户点击卡片按钮也会直接跳转至尊会员页',
    /onContactTap[\s\S]*if\s*\(!memberStore\.isSupremeMember\(\)\)\s*\{[\s\S]*navigateToSupremeMemberCenter\(\)/.test(filterResultTs),
  ],
  [
    '底部常驻开通按钮复用至尊会员统一跳转方法',
    /onMemberCtaTap\(\)\s*\{[\s\S]*navigateToSupremeMemberCenter\(\)/.test(filterResultTs),
  ],
  [
    '筛选结果阻断弹窗确认后复用至尊会员统一跳转方法',
    /showBlockDialog[\s\S]*if\s*\(res\.confirm\)\s*\{[\s\S]*navigateToSupremeMemberCenter\(\)/.test(filterResultTs),
  ],
  [
    '会员中心将精准搜索场景默认映射为至尊tab',
    /getDefaultTabByScene\(scene\?:\s*string\)/.test(memberCenterTs)
      && /supremeScenes\s*=\s*\[[^\]]*'精准搜索'[^\]]*'精准查找'[^\]]*\]/.test(memberCenterTs)
      && /supremeScenes\.includes\(String\(scene\s*\|\|\s*''\)\)\s*\?\s*'supreme'\s*:\s*'gold'/.test(memberCenterTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-result-supreme-block-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter result supreme block static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-result-supreme-block-static-probe] PASS all checks');
