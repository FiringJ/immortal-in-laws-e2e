import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');
const RECORD_TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_SERVICE_FILE = path.join(APP_ROOT, 'services/record.ts');

const helpers = fs.readFileSync(HELPERS_FILE, 'utf8');
const recordTs = fs.readFileSync(RECORD_TS_FILE, 'utf8');
const recordService = fs.readFileSync(RECORD_SERVICE_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '解锁记录映射保留 isPinned 字段',
    /buildUnlockRecords[\s\S]*isPinned:\s*Boolean\(item\?\.is_pinned\)/.test(recordService),
  ],
  [
    '我解锁 tab 操作项包含置顶能力且不再出现查看联系方式',
    /RecordType\.UNLOCK && direction === RecordDirection\.ME_TO_OTHER[\s\S]*key:\s*'pin'/.test(helpers)
      && /RecordType\.UNLOCK && direction === RecordDirection\.ME_TO_OTHER[\s\S]*key:\s*'unpin'/.test(helpers)
      && !/RecordType\.UNLOCK && direction === RecordDirection\.ME_TO_OTHER[\s\S]*key:\s*'viewContact'/.test(helpers),
  ],
  [
    '解锁我 tab 操作项同样包含置顶能力',
    /RecordType\.UNLOCK && direction === RecordDirection\.OTHER_TO_ME[\s\S]*key:\s*'pin'/.test(helpers)
      && /RecordType\.UNLOCK && direction === RecordDirection\.OTHER_TO_ME[\s\S]*key:\s*'unpin'/.test(helpers),
  ],
  [
    '记录页 pin/unpin 操作支持解锁记录类型',
    /const canPinRecord = 'favoriteTime' in record \|\| this\.data\.recordType === RecordType\.UNLOCK;/.test(recordTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[unlock-tab-action-sheet-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`unlock tab action sheet static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-tab-action-sheet-static-probe] PASS all checks');
