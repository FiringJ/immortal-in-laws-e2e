import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_WXML = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const recordTs = fs.readFileSync(RECORD_TS, 'utf8');
const recordWxml = fs.readFileSync(RECORD_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '收藏我场景底部前缀文案在逻辑层切换为“共有”',
    /const bottomPrefixText = this\.data\.recordType === RecordType\.FAVORITE \? '共有' : '最近有';/.test(recordTs),
  ],
  [
    '底部文案模板使用 bottomPrefixText 绑定而非硬编码',
    /<text class="bottom-text">\{\{bottomPrefixText\}\}<\/text>/.test(recordWxml) && !/>最近有<\/text>/.test(recordWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-other-bottom-prefix-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite other bottom prefix static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-other-bottom-prefix-static-probe] PASS all checks');
