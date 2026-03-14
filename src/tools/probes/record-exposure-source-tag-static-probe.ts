import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const USER_TYPES_FILE = path.join(APP_ROOT, 'types/user.ts');
const MEMBER_TYPES_FILE = path.join(APP_ROOT, 'types/member.ts');
const RECORD_SERVICE_FILE = path.join(APP_ROOT, 'services/record.ts');
const RECORD_HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const userTypes = fs.readFileSync(USER_TYPES_FILE, 'utf8');
const memberTypes = fs.readFileSync(MEMBER_TYPES_FILE, 'utf8');
const recordService = fs.readFileSync(RECORD_SERVICE_FILE, 'utf8');
const recordHelpers = fs.readFileSync(RECORD_HELPERS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['收藏记录类型补充 sourceLabel 字段', /interface FavoriteRecord[\s\S]*sourceLabel\?:\s*string/.test(userTypes)],
  ['解锁记录类型补充 sourceLabel 字段', /interface UnlockRecord[\s\S]*sourceLabel\?:\s*string/.test(memberTypes)],
  ['收藏记录映射读取 interaction_info.source_label', /buildFavoriteRecords[\s\S]*sourceLabel:\s*typeof interaction\?\.source_label === 'string'/.test(recordService)],
  ['解锁记录映射读取 interaction_info.source_label', /buildUnlockRecords[\s\S]*sourceLabel:\s*typeof interaction\?\.source_label === 'string'/.test(recordService)],
  ['收藏我/解锁我顶部文案支持“通过超级曝光”来源提醒', /RecordType\.FAVORITE[\s\S]*sourceLabel \? `\$\{sourceLabel\}收藏我`[\s\S]*RecordType\.UNLOCK[\s\S]*sourceLabel \? `\$\{sourceLabel\}解锁我`/.test(recordHelpers)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-exposure-source-tag-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record exposure source tag static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-exposure-source-tag-static-probe] PASS all checks');
