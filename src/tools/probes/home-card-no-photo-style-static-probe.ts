import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CARD_TS = path.join(APP_ROOT, 'components/guest-card/index.ts');
const CARD_WXML = path.join(APP_ROOT, 'components/guest-card/index.wxml');
const CARD_WXSS = path.join(APP_ROOT, 'components/guest-card/index.wxss');

const cardTs = fs.readFileSync(CARD_TS, 'utf8');
const cardWxml = fs.readFileSync(CARD_WXML, 'utf8');
const cardWxss = fs.readFileSync(CARD_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '有照片分支保留4个核心字段',
    /if \(hasPhoto\) \{[\s\S]*pushInfo\('现居'[\s\S]*pushInfo\('身高'[\s\S]*pushInfo\('学历'[\s\S]*pushInfo\('职业'/.test(cardTs),
  ],
  [
    '无照片分支保留8字段信息网格',
    /else \{[\s\S]*pushInfo\('现居'[\s\S]*pushInfo\('身高'[\s\S]*pushInfo\('学历'[\s\S]*pushInfo\('收入'[\s\S]*pushInfo\('家乡'[\s\S]*pushInfo\('职业'/.test(cardTs),
  ],
  [
    '模板根据 hasPhoto 切换 no-photo 布局',
    /card-main \{\{hasPhoto \? 'has-photo' : 'no-photo'\}\}/.test(cardWxml),
  ],
  [
    '无照片模板走 info-list-grid',
    /info-list info-list-grid" wx:if="\{\{!hasPhoto\}\}"/.test(cardWxml),
  ],
  [
    '无照片样式为双列网格',
    /\.info-list-grid \{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(cardWxss),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-card-no-photo-style-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home card no-photo style static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-card-no-photo-style-static-probe] PASS all checks');
