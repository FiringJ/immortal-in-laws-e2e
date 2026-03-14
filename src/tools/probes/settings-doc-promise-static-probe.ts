import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/settings-doc/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/settings-doc/index.wxml');
const WXSS_FILE = path.join(APP_ROOT, 'pages/settings-doc/index.wxss');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');
const wxss = fs.readFileSync(WXSS_FILE, 'utf8');
const promiseBranch = ts.match(/if \(doc\.actionType === 'promise'\) \{([\s\S]*?)\n\s*return;\n\s*\}/)?.[1] || '';

const checks: Array<[string, boolean]> = [
  ['承诺按钮文案已改为“承诺并确认”', /actionText:\s*'承诺并确认'/.test(ts)],
  ['承诺完成文案已改为“已承诺”', /actionDoneText:\s*'已承诺'/.test(ts)],
  ['承诺分支移除二次确认弹框', promiseBranch.length > 0 && !/wx\.showModal/.test(promiseBranch)],
  ['承诺分支点击后立即 toast“已承诺”', /wx\.showToast\([\s\S]*已承诺/.test(promiseBranch)],
  ['承诺页面包含相亲编号字段', /相亲编号：/.test(wxml)],
  ['承诺页面包含承诺时间字段', /承诺时间：/.test(wxml)],
  ['承诺页面包含承诺状态字段', /承诺状态：/.test(wxml)],
  ['承诺页面包含已承诺水印节点', /promise-watermark/.test(wxml) && /已承诺/.test(wxml)],
  ['承诺页面包含已承诺置灰按钮样式', /\.doc-action\.is-done/.test(wxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-doc-promise-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings doc promise static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-doc-promise-static-probe] PASS all checks');
