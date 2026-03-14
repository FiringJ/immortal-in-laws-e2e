import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');
const JSON_FILE = path.join(APP_ROOT, 'pages/message-record/index.json');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');
const json = fs.readFileSync(JSON_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['我收藏的会员场景识别', /isMyFavoriteTab\s*=\s*this\.data\.recordType\s*===\s*RecordType\.FAVORITE[\s\S]*RecordDirection\.ME_TO_OTHER/.test(ts)],
  ['联系对方先弹免费解锁确认', /showContactUnlockConfirm:\s*true/.test(ts)],
  ['确认后toast并跳私信', /onConfirmContactUnlock\(\)[\s\S]*成功解锁联系方式[\s\S]*\/pages\/chat\/index\?guestId=\$\{guestId\}/.test(ts)],
  ['页面挂载解锁确认弹窗', /show="\{\{showContactUnlockConfirm\}\}"[\s\S]*confirmText="立即解锁"/.test(wxml)],
  ['页面注册confirm-modal组件', /"confirm-modal"\s*:\s*"\/components\/confirm-modal\/index"/.test(json)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-member-unlock-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite member unlock static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-member-unlock-static-probe] PASS all checks');
