import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/exposure/index.ts');

const ts = fs.readFileSync(TS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['单次购买成功后会主动拉取曝光列表', /onSinglePurchaseTap\(\)[\s\S]*await this\.loadData\(\)[\s\S]*showExposurePurchaseModal:\s*true/.test(ts)],
  ['开启超级曝光成功后会刷新曝光列表', /onToggleExposure\([\s\S]*if \(isEnabled\) \{[\s\S]*await this\.loadData\(\);[\s\S]*\}/.test(ts)],
  ['购买成功弹窗确认后已开启场景也会刷新曝光列表', /onExposurePurchaseModalConfirm\(\)[\s\S]*if \(this\.data\.isExposureEnabled\) \{[\s\S]*await this\.loadData\(\);/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[exposure-single-purchase-refresh-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`exposure single purchase refresh static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[exposure-single-purchase-refresh-static-probe] PASS all checks');
