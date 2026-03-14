import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const INVITE_TS = path.join(APP_ROOT, 'pages/invite/index.ts');

const inviteTs = fs.readFileSync(INVITE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '邀请页状态保存当前会员状态',
    /memberStatus:\s*null as MemberStatus \| null/.test(inviteTs),
  ],
  [
    '加载数据时同步写入 memberStatus',
    /const memberStatus = memberStore\.getStatus\(\);[\s\S]*memberStatus,/.test(inviteTs),
  ],
  [
    '至尊会员点击查看特权默认跳转至尊 tab',
    /onMemberBannerTap\(\)\s*\{[\s\S]*memberStatus\?\.level === MemberLevel\.SUPREME \? 'supreme' : 'gold'[\s\S]*\/pages\/member-center\/index\?tab=\$\{targetTab\}/.test(inviteTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[invite-member-banner-tab-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`invite member banner tab static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[invite-member-banner-tab-static-probe] PASS all checks');
