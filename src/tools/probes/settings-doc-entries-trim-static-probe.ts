import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_WXML = path.join(APP_ROOT, 'pages/settings/index.wxml');

const wxml = fs.readFileSync(SETTINGS_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['设置页保留用户协议入口', /用户协议/.test(wxml)],
  ['设置页保留隐私政策入口', /隐私政策/.test(wxml)],
  ['设置页移除隐私政策摘要入口', !/隐私政策摘要/.test(wxml)],
  ['设置页移除个人信息收集清单入口', !/个人信息收集清单/.test(wxml)],
  ['设置页移除第三方共享个人信息清单入口', !/第三方共享个人信息清单/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-doc-entries-trim-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings doc entries trim static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-doc-entries-trim-static-probe] PASS all checks');
