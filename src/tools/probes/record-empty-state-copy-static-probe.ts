import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页提供分场景缺省文案解析函数', /resolveEmptyStateText\(\)\s*\{[\s\S]*RecordType\.VIEW[\s\S]*RecordType\.FAVORITE[\s\S]*RecordType\.UNLOCK/.test(ts)],
  ['记录页加载时写入 emptyStateText', /const emptyStateText = this\.resolveEmptyStateText\(\)[\s\S]*emptyStateText,/.test(ts)],
  ['记录页空状态组件使用动态缺省文案', /<empty-state[\s\S]*text=\"\{\{emptyStateText\}\}\"/.test(wxml)],
  ['我解锁 tab 仍保留专用缺省页', /wx:if=\"\{\{!loading && recordList\.length === 0 && recordType === 'unlock' && direction === 'me_to_other'\}\}\"/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-empty-state-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record empty state copy static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-empty-state-copy-static-probe] PASS all checks');
