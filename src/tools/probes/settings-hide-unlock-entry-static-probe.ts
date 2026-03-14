import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_WXML = path.join(APP_ROOT, 'pages/settings/index.wxml');

const wxml = fs.readFileSync(SETTINGS_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['设置页移除无门槛联系入口文案', !/无门槛联系/.test(wxml)],
  ['设置页移除无门槛联系跳转路径', !/\/pages\/settings-unlock\/index/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-hide-unlock-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings hide unlock entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-hide-unlock-entry-static-probe] PASS all checks');
