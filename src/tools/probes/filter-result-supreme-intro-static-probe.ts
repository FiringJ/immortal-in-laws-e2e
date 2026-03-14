import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const FILTER_RESULT_WXML = path.join(APP_ROOT, 'pages/filter-result/index.wxml');
const GUEST_CARD_WXML = path.join(APP_ROOT, 'components/guest-card/index.wxml');
const GUEST_CARD_WXSS = path.join(APP_ROOT, 'components/guest-card/index.wxss');

const filterResultWxml = fs.readFileSync(FILTER_RESULT_WXML, 'utf8');
const guestCardWxml = fs.readFileSync(GUEST_CARD_WXML, 'utf8');
const guestCardWxss = fs.readFileSync(GUEST_CARD_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '精准搜索结果页使用 filter-result 场景的 guest-card',
    /<guest-card[\s\S]*scene="\{\{isMemberView \? 'default' : 'filter-result'\}\}"/.test(filterResultWxml),
  ],
  [
    'filter-result 卡片主区域渲染相亲介绍字段',
    /card-main-filter-result[\s\S]*card-note card-note-filter-result[\s\S]*guest\.matchmakingNote/.test(guestCardWxml),
  ],
  [
    '相亲介绍文案保留两行截断样式，避免破版',
    /\.card-note-filter-result[\s\S]*line-height:\s*1\.45;/.test(guestCardWxss)
      && /\.card-note[\s\S]*-webkit-line-clamp:\s*2;/.test(guestCardWxss),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[filter-result-supreme-intro-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`filter result supreme intro static probe failed: ${failed.length} checks missing`);
}

console.log('[filter-result-supreme-intro-static-probe] PASS all checks');
