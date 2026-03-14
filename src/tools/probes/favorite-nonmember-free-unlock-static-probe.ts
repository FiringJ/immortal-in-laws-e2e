import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');

const ts = fs.readFileSync(TS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['我收藏的场景识别', /isMyFavoriteTab\s*=\s*this\.data\.recordType\s*===\s*RecordType\.FAVORITE[\s\S]*RecordDirection\.ME_TO_OTHER/.test(ts)],
  ['读取剩余免费解锁次数', /memberStore\.getRemainingUnlockCount\(\)/.test(ts)],
  ['非会员有免费次数可弹解锁确认', /canUnlockInFavoriteTab\s*=\s*memberStore\.isMember\(\)\s*\|\|\s*remainingUnlockCount\s*>\s*0/.test(ts)],
  ['免费次数提示文案包含剩余次数', /您有\$\{remainingUnlockCount\}次免费解锁机会，可解锁并查看对方号码/.test(ts)],
  ['立即解锁确认后调用解锁接口', /onConfirmContactUnlock\(\)[\s\S]*unlockContact\(guestId,\s*0\)/.test(ts)],
  ['解锁后回写剩余次数', /result\.remainingQuota[\s\S]*memberStore\.updateRemainingUnlockCount/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-nonmember-free-unlock-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite non-member free unlock static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-nonmember-free-unlock-static-probe] PASS all checks');
