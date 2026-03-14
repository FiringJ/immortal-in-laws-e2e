import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_TS = path.join(APP_ROOT, 'pages/settings/index.ts');
const VERIFIED_TS = path.join(APP_ROOT, 'pages/settings-verified/index.ts');
const VERIFIED_WXML = path.join(APP_ROOT, 'pages/settings-verified/index.wxml');

const settingsTs = fs.readFileSync(SETTINGS_TS, 'utf8');
const verifiedTs = fs.readFileSync(VERIFIED_TS, 'utf8');
const verifiedWxml = fs.readFileSync(VERIFIED_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '设置页实名认证入口改为跳转实名相亲权益页',
    /onVerifiedOnlyTap\(\)\s*\{[\s\S]*\/pages\/settings-verified\/index/.test(settingsTs),
  ],
  ['实名相亲页支持拉取 verified_only 状态', /fetchSettings\(\)/.test(verifiedTs) && /verifiedOnly/.test(verifiedTs)],
  [
    '未实名点击开启时先弹提醒并提供去实名认证',
    /!this\.data\.isRealnameVerified[\s\S]*需要您先完成实名后可开启[\s\S]*去实名认证[\s\S]*\/pages\/realname-auth\/index/.test(verifiedTs),
  ],
  [
    '已实名点击开启时弹确认提醒并可确认开启',
    /温馨提醒[\s\S]*确认开启[\s\S]*暂不开启[\s\S]*updateVerifiedOnlyWithToast\(true, '已开启实名相亲'\)/.test(verifiedTs),
  ],
  ['关闭实名相亲支持直接更新状态', /updateVerifiedOnlyWithToast\(false, '已关闭实名相亲'\)/.test(verifiedTs)],
  ['实名相亲页包含权益介绍文案', /权益介绍/.test(verifiedWxml) && /开启后，只有完成实名认证的家长才能联系您/.test(verifiedWxml)],
  ['实名相亲页包含开启与关闭按钮文案', /开启 实名相亲/.test(verifiedWxml) && /关闭 实名相亲/.test(verifiedWxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-verified-flow-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings verified flow static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-verified-flow-static-probe] PASS all checks');
