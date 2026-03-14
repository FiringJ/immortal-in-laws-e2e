import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const STORE_FILE = path.join(APP_ROOT, 'store/messageStore.ts');
const HOME_FILE = path.join(APP_ROOT, 'pages/index/index.ts');
const MESSAGE_FILE = path.join(APP_ROOT, 'pages/message/index.ts');

const storeTs = fs.readFileSync(STORE_FILE, 'utf8');
const homeTs = fs.readFileSync(HOME_FILE, 'utf8');
const messageTs = fs.readFileSync(MESSAGE_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['messageStore 新增实时总数刷新方法', /refreshKingKongTotals\(\)/.test(storeTs)],
  ['实时总数刷新方法会拉取看过我/收藏我/解锁我 total', /fetchViewRecords\(RecordDirection\.OTHER_TO_ME,\s*0,\s*1\)[\s\S]*fetchFavoriteRecords\(RecordDirection\.OTHER_TO_ME,\s*0,\s*1\)[\s\S]*fetchUnlockRecords\(RecordDirection\.OTHER_TO_ME,\s*0,\s*1\)/.test(storeTs)],
  ['首页金刚区刷新会同时拉红点和总数', /refreshKingKongCounts\(\)[\s\S]*Promise\.all\(\[[\s\S]*messageStore\.refreshUnreadCounts\(\)[\s\S]*messageStore\.refreshKingKongTotals\(\)/.test(homeTs)],
  ['消息页金刚区刷新会同时拉红点和总数', /refreshKingKongCounts\(\)[\s\S]*Promise\.all\(\[[\s\S]*messageStore\.refreshUnreadCounts\(\)[\s\S]*messageStore\.refreshKingKongTotals\(\)/.test(messageTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-kingkong-realtime-count-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home kingkong realtime count static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-kingkong-realtime-count-static-probe] PASS all checks');
