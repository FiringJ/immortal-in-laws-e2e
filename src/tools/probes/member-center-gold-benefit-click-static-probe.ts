import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'components/pages/member-center/member-center-benefits/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'components/pages/member-center/member-center-benefits/index.wxml');
const PAGE_WXML_FILE = path.join(APP_ROOT, 'pages/member-center/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');
const pageWxml = fs.readFileSync(PAGE_WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['黄金权益组件声明预览图属性', /previewImages:\s*\{\s*type:\s*Array/.test(ts)],
  ['黄金权益行点击处理方法存在', /onBenefitRowTap\(e: WechatMiniprogram\.TouchEvent\)/.test(ts)],
  ['黄金权益点击后拉起图片预览', /wx\.previewImage\([\s\S]*urls/.test(ts)],
  ['黄金权益行绑定点击事件', /class="benefit-row"[\s\S]*bindtap="onBenefitRowTap"/.test(wxml)],
  ['会员中心页向黄金权益组件传入预览图', /member-center-benefits[\s\S]*preview-images="\{\{benefitPreviewImages\}\}"/.test(pageWxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[member-center-gold-benefit-click-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member center gold benefit click static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-gold-benefit-click-static-probe] PASS all checks');
