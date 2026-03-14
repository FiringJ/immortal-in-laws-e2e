import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const text = fs.readFileSync(FILE, 'utf8');

const checks: Array<[string, RegExp]> = [
  ['详情点击阻断判断变量', /shouldBlockDetailForNonMember\s*=\s*!memberStore\.isMember\(\)/],
  ['阻断条件覆盖收藏我和看过我', /this\.data\.direction\s*===\s*RecordDirection\.OTHER_TO_ME[\s\S]*this\.data\.recordType\s*===\s*RecordType\.VIEW[\s\S]*RecordType\.FAVORITE/],
  ['阻断后弹会员开通弹框', /setData\(\{\s*showMemberUnlockModal:\s*true,\s*memberUnlockScene:\s*'查看全部资料'\s*\}\)/],
  ['底部开通会员条仅非会员展示', /showBottomBar\s*=\s*!memberStore\.isMember\(\)[\s\S]*RecordType\.VIEW[\s\S]*RecordType\.FAVORITE[\s\S]*RecordDirection\.OTHER_TO_ME/],
];

const failed = checks.filter(([, re]) => !re.test(text)).map(([label]) => label);
console.log(`[favorite-other-block-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite other block static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-other-block-static-probe] PASS all checks');
