import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_TS = path.join(APP_ROOT, 'pages/settings/index.ts');
const SETTINGS_WXML = path.join(APP_ROOT, 'pages/settings/index.wxml');
const GREETING_TS = path.join(APP_ROOT, 'pages/settings-greeting/index.ts');
const GREETING_WXML = path.join(APP_ROOT, 'pages/settings-greeting/index.wxml');

const settingsTs = fs.readFileSync(SETTINGS_TS, 'utf8');
const settingsWxml = fs.readFileSync(SETTINGS_WXML, 'utf8');
const greetingTs = fs.readFileSync(GREETING_TS, 'utf8');
const greetingWxml = fs.readFileSync(GREETING_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '设置页打招呼语入口改为跳转独立页面',
    /onGreetingTap\(\)\s*\{[\s\S]*wx\.navigateTo\([\s\S]*\/pages\/settings-greeting\/index/.test(settingsTs),
  ],
  ['设置页移除旧的打招呼语底部弹层', !/打招呼语设置/.test(settingsWxml) && !/sheet-mask/.test(settingsWxml)],
  [
    '打招呼语页面同时拉取设置和模板数据',
    /Promise\.all\(\[fetchSettings\(\), fetchGreetingTemplates\(\)\]\)/.test(greetingTs),
  ],
  [
    '打招呼语页面支持开启或关闭功能并持久化',
    /onToggleFeature\(\)[\s\S]*updateGreetingSetting\(nextEnabled, nextEnabled \? templateId : undefined\)/.test(greetingTs),
  ],
  [
    '打招呼语页面支持模板选择并持久化',
    /onSelectTemplate\([\s\S]*updateGreetingSetting\(this\.data\.enabled, templateId\)/.test(greetingTs),
  ],
  ['打招呼语页面文案包含“打招呼列表”', /打招呼列表/.test(greetingWxml)],
  ['打招呼语页面包含开启/关闭功能按钮文案', /关闭此功能/.test(greetingWxml) && /开启此功能/.test(greetingWxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-greeting-page-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings greeting page static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-greeting-page-static-probe] PASS all checks');
