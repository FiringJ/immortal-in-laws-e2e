import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HOME_TS = path.join(APP_ROOT, 'pages/index/index.ts');

const homeTs = fs.readFileSync(HOME_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首页联系对方仍保留非会员无次数阻断',
    /if\s*\(!isMember\s*&&\s*remainingCount\s*<=\s*0\)[\s\S]*showMemberUnlockModal:\s*true/.test(homeTs),
  ],
  [
    '首页联系对方不再出现会员次数不足阻断',
    !/if\s*\(isMember\s*&&\s*remainingCount\s*<=\s*0\s*&&\s*!memberStore\.isSupremeMember\(\)\)/.test(homeTs),
  ],
  [
    '首页联系对方继续走 canContact 兜底判断',
    /if\s*\(!memberStore\.canContact\(guest\)\)[\s\S]*showMemberUnlockModal:\s*true/.test(homeTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[home-member-contact-limit-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`home member contact-limit static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-member-contact-limit-static-probe] PASS all checks');
