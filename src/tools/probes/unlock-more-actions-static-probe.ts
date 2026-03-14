import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');
const RECORD_PAGE_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_SERVICE_TS = path.join(APP_ROOT, 'services/record.ts');

const helpersTs = fs.readFileSync(HELPERS_TS, 'utf8');
const recordPageTs = fs.readFileSync(RECORD_PAGE_TS, 'utf8');
const recordServiceTs = fs.readFileSync(RECORD_SERVICE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '我解锁 tab 的更多操作包含置顶/取消置顶与重新解锁',
    /type === RecordType\.UNLOCK && direction === RecordDirection\.ME_TO_OTHER[\s\S]*key:\s*'unpin'[\s\S]*key:\s*'pin'[\s\S]*key:\s*'reunlock'/.test(helpersTs),
  ],
  [
    '我解锁 tab 的更多操作不再注入查看联系方式',
    !/type === RecordType\.UNLOCK && direction === RecordDirection\.ME_TO_OTHER[\s\S]*key:\s*'viewContact'/.test(helpersTs),
  ],
  [
    '解锁记录 pin/unpin 操作支持 RecordType.UNLOCK',
    /canPinRecord = 'favoriteTime' in record \|\| this\.data\.recordType === RecordType\.UNLOCK/.test(recordPageTs),
  ],
  [
    '解锁记录映射保留 is_pinned 字段',
    /buildUnlockRecords[\s\S]*isPinned:\s*Boolean\(item\?\.is_pinned\)/.test(recordServiceTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[unlock-more-actions-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`unlock more actions static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-more-actions-static-probe] PASS all checks');
