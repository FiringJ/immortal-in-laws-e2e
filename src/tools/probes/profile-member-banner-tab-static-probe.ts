import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_TS = path.join(APP_ROOT, 'pages/profile/index.ts');

const profileTs = fs.readFileSync(PROFILE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '我的页会员入口根据会员等级计算目标 tab',
    /getMemberCenterEntryUrl\(\)\s*\{[\s\S]*memberLevel = this\.data\.memberStatus\?\.level/.test(profileTs),
  ],
  [
    '黄金/至尊会员入口默认跳转至尊 tab',
    /targetTab = memberLevel === MemberLevel\.GOLD \|\| memberLevel === MemberLevel\.SUPREME[\s\S]*\? 'supreme'[\s\S]*: 'gold'/.test(profileTs),
  ],
  [
    '入口栏点击“查看特权”复用目标 tab 跳转',
    /onMemberBannerTap\(\)\s*\{[\s\S]*url: this\.getMemberCenterEntryUrl\(\)/.test(profileTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[profile-member-banner-tab-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile member banner tab static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-member-banner-tab-static-probe] PASS all checks');
