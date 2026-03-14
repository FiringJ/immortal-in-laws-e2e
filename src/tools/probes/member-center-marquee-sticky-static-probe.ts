import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HERO_WXML = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxml');
const HERO_WXSS = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxss');

const heroWxml = fs.readFileSync(HERO_WXML, 'utf8');
const heroWxss = fs.readFileSync(HERO_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员中心弹幕容器绑定吸顶类并使用 navTopPadding 作为 top 偏移',
    /member-tips member-tips-sticky/.test(heroWxml) && /style="top: \{\{navTopPadding\}\}px;"/.test(heroWxml),
  ],
  [
    '弹幕吸顶类启用 sticky 定位',
    /\.member-tips-sticky\s*\{[\s\S]*position:\s*sticky;/.test(heroWxss),
  ],
  [
    '弹幕吸顶层级高于页面正文',
    /\.member-tips-sticky\s*\{[\s\S]*z-index:\s*35;/.test(heroWxss),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[member-center-marquee-sticky-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`member center marquee sticky static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-marquee-sticky-static-probe] PASS all checks');
