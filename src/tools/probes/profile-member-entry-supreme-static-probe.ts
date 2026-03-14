import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_TS = path.join(APP_ROOT, 'pages/profile/index.ts');

const profileTs = fs.readFileSync(PROFILE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '我的页会员入口根据会员等级决策默认 tab',
    /getMemberCenterEntryUrl\(\)\s*\{[\s\S]*memberStatus\?\.level[\s\S]*targetTab/.test(profileTs),
  ],
  [
    '黄金会员与至尊会员入口统一落至尊 tab',
    /memberLevel === MemberLevel\.GOLD \|\| memberLevel === MemberLevel\.SUPREME[\s\S]*'supreme'/.test(profileTs),
  ],
  [
    '会员横幅入口使用统一会员中心跳转 URL',
    /onMemberBannerTap\(\)\s*\{[\s\S]*url:\s*this\.getMemberCenterEntryUrl\(\)/.test(profileTs),
  ],
  [
    '会员中心点击入口使用统一会员中心跳转 URL',
    /onMemberCenterTap\(\)\s*\{[\s\S]*url:\s*this\.getMemberCenterEntryUrl\(\)/.test(profileTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[profile-member-entry-supreme-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`profile member entry supreme static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-member-entry-supreme-static-probe] PASS all checks');
