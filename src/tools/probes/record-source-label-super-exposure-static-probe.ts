import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_SERVICE_TS = path.join(APP_ROOT, 'services/record.ts');
const RECORD_HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const recordServiceTs = fs.readFileSync(RECORD_SERVICE_TS, 'utf8');
const recordHelpersTs = fs.readFileSync(RECORD_HELPERS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '收藏记录映射写入 interaction_info.source_label',
    /buildFavoriteRecords[\s\S]*sourceLabel:\s*typeof interaction\?\.source_label === 'string'/.test(recordServiceTs),
  ],
  [
    '解锁记录映射写入 interaction_info.source_label',
    /buildUnlockRecords[\s\S]*sourceLabel:\s*typeof interaction\?\.source_label === 'string'/.test(recordServiceTs),
  ],
  [
    '记录页头部标签支持通过 sourceLabel 拼接收藏我提醒',
    /recordType === RecordType\.FAVORITE[\s\S]*headerTag = sourceLabel \? `\$\{sourceLabel\}收藏我` : '收藏我的'/.test(recordHelpersTs),
  ],
  [
    '记录页头部标签支持通过 sourceLabel 拼接解锁我提醒',
    /recordType === RecordType\.UNLOCK[\s\S]*headerTag = sourceLabel \? `\$\{sourceLabel\}解锁我` : '解锁我'/.test(recordHelpersTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-source-label-super-exposure-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`record source label super exposure static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-source-label-super-exposure-static-probe] PASS all checks');
