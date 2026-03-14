import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PAGE_WXML = path.join(APP_ROOT, 'pages/member-center/index.wxml');
const HERO_WXML = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxml');
const HERO_WXSS = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxss');

const pageWxml = fs.readFileSync(PAGE_WXML, 'utf8');
const heroWxml = fs.readFileSync(HERO_WXML, 'utf8');
const heroWxss = fs.readFileSync(HERO_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员中心页将 recentTips 传入顶部 hero 组件',
    /member-center-hero[\s\S]*recent-tips="\{\{recentTips\}\}"/.test(pageWxml),
  ],
  [
    '顶部弹幕容器使用固定定位样式类并绑定通顶偏移',
    /class="member-tips member-tips-sticky"[\s\S]*style="top: \{\{navTopPadding\}\}px;"/.test(heroWxml),
  ],
  [
    '弹幕固定样式使用 fixed 定位且有左右边距',
    /\.member-tips-sticky\s*\{[\s\S]*position:\s*fixed[\s\S]*left:\s*24rpx[\s\S]*right:\s*24rpx/.test(heroWxss),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[member-center-sticky-barrage-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member center sticky barrage static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-sticky-barrage-static-probe] PASS all checks');
