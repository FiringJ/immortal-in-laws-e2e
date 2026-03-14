import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_TS = path.join(APP_ROOT, 'pages/settings/index.ts');
const SETTINGS_WXML = path.join(APP_ROOT, 'pages/settings/index.wxml');

const ts = fs.readFileSync(SETTINGS_TS, 'utf8');
const wxml = fs.readFileSync(SETTINGS_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['设置页隐藏申请注销账号入口', !/申请注销账号/.test(wxml)],
  ['设置页隐藏申请暂停相亲入口', !/申请暂停相亲/.test(wxml)],
  ['设置页隐藏暂停相亲卡片容器', !/pause-card/.test(wxml)],
  ['设置页移除暂停开关状态字段', !/pauseEnabled/.test(ts)],
  ['设置页移除暂停开关点击处理', !/onPauseToggle/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-hide-cancel-pause-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings hide cancel/pause static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-hide-cancel-pause-static-probe] PASS all checks');
