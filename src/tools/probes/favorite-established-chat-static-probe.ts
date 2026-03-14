import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const helpers = fs.readFileSync(HELPERS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['我收藏的场景识别存在', /isMyFavoriteTab\s*=\s*this\.data\.recordType\s*===\s*RecordType\.FAVORITE[\s\S]*RecordDirection\.ME_TO_OTHER/.test(ts)],
  ['已建立联系判定包含后端 canContact', /hasEstablishedContact\s*=\s*Boolean\(currentRecord\?\.cardGuest\?\.canContact\)/.test(ts)],
  ['已建立联系判定包含本地联系记录', /memberStore\.hasContacted\(String\(guestid\)\)/.test(ts)],
  ['已建立联系判定包含解锁记录', /memberStore\.isUnlocked\(String\(guestid\)\)/.test(ts)],
  ['已建立联系分支直接跳转私信页', /isMyFavoriteTab\s*&&\s*hasEstablishedContact[\s\S]*\/pages\/chat\/index\?guestId=\$\{guestid\}/.test(ts)],
  ['record 卡片 guest 透传 canContact 字段', /canContact\?:\s*boolean/.test(helpers)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-established-chat-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite established chat static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-established-chat-static-probe] PASS all checks');
