import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页底部前缀默认值存在', /bottomPrefixText:\s*'最近有'/.test(ts)],
  ['记录页收藏我场景切换为“共有”前缀', /const bottomPrefixText = this\.data\.recordType === RecordType\.FAVORITE \? '共有' : '最近有';/.test(ts)],
  ['记录页底部文案渲染使用动态前缀', /<text class=\"bottom-text\">\{\{bottomPrefixText\}\}<\/text>/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-favorite-other-bottom-prefix-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record favorite other bottom prefix static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-favorite-other-bottom-prefix-static-probe] PASS all checks');
