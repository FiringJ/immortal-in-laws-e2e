import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'components/pages/member-center/member-center-supreme-cards/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'components/pages/member-center/member-center-supreme-cards/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['至尊权益点击处理方法', /onBenefitTap\(e: WechatMiniprogram\.TouchEvent\)/.test(ts)],
  ['点击后拉起图片预览', /wx\.previewImage\([\s\S]*urls/.test(ts)],
  ['feature卡片绑定点击事件', /class="supreme-card"[\s\S]*bindtap="onBenefitTap"/.test(wxml)],
  ['major权益绑定点击事件', /class="major-card[\s\S]*bindtap="onBenefitTap"/.test(wxml)],
  ['minor权益绑定点击事件', /class="minor-item[\s\S]*bindtap="onBenefitTap"/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[member-center-supreme-benefit-click-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member center supreme benefit click static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-supreme-benefit-click-static-probe] PASS all checks');
