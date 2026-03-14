import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HERO_WXML = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxml');
const HERO_WXSS = path.join(APP_ROOT, 'components/pages/member-center/member-center-hero/index.wxss');

const heroWxml = fs.readFileSync(HERO_WXML, 'utf8');
const heroWxss = fs.readFileSync(HERO_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['会员页弹幕节点绑定顶部偏移', /member-tips member-tips-sticky[\s\S]*style=\"top: \{\{navTopPadding\}\}px;\"/.test(heroWxml)],
  ['会员页弹幕改为 fixed 固定层', /\.member-tips-sticky\s*\{[\s\S]*position:\s*fixed;/.test(heroWxss)],
  ['会员页弹幕固定层包含左右边距约束', /\.member-tips-sticky\s*\{[\s\S]*left:\s*24rpx;[\s\S]*right:\s*24rpx;/.test(heroWxss)],
  ['会员页 Hero 内容预留弹幕占位', /\.member-hero-content\s*\{[\s\S]*padding-top:\s*90rpx;/.test(heroWxss)],
  ['会员页弹幕滚动动画仍保留', /\.tips-marquee\.is-marquee[\s\S]*animation-name:\s*tipsMarquee;/.test(heroWxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[member-center-marquee-fixed-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`member center marquee fixed static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-marquee-fixed-static-probe] PASS all checks');
