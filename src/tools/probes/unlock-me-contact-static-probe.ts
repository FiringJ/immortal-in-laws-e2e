import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const text = fs.readFileSync(FILE, 'utf8');

const checks: Array<[string, RegExp]> = [
  ['解锁我tab放行条件', /isUnlockMeTab\s*=\s*isUnlockRecordTab[\s\S]*this\.data\.direction\s*===\s*RecordDirection\.OTHER_TO_ME/],
  ['我解锁tab放行条件', /isMyUnlockTab\s*=\s*isUnlockRecordTab[\s\S]*this\.data\.direction\s*===\s*RecordDirection\.ME_TO_OTHER/],
  ['解锁双tab直达私信页', /if\s*\(isUnlockMeTab\s*\|\|\s*isMyUnlockTab\)\s*\{[\s\S]*\/pages\/chat\/index\?guestId=\$\{guestid\}/],
  ['会员阻断逻辑保留在后续分支', /if\s*\(!memberStore\.isMember\(\)\)/],
];

const failed: string[] = [];
for (const [label, pattern] of checks) {
  if (!pattern.test(text)) {
    failed.push(label);
  }
}

console.log(`[unlock-me-contact-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`unlock me contact static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-me-contact-static-probe] PASS all checks');
