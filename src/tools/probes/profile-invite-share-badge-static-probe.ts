import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_TS = path.join(APP_ROOT, 'pages/profile/index.ts');
const PROFILE_WXML = path.join(APP_ROOT, 'pages/profile/index.wxml');
const PROFILE_WXSS = path.join(APP_ROOT, 'pages/profile/index.wxss');

const profileTs = fs.readFileSync(PROFILE_TS, 'utf8');
const profileWxml = fs.readFileSync(PROFILE_WXML, 'utf8');
const profileWxss = fs.readFileSync(PROFILE_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['我的首页功能配置包含邀请好友分享赚钱标签', /key:\s*'invite'[\s\S]*badgeText:\s*'分享赚钱'/.test(profileTs)],
  ['我的首页其他功能区渲染分享赚钱徽标节点', /function-badge[\s\S]*wx:if=\"\{\{item\.badgeText\}\}\"/.test(profileWxml)],
  ['我的首页存在分享赚钱徽标样式定义', /\.function-badge\s*\{[\s\S]*background:\s*linear-gradient/.test(profileWxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[profile-invite-share-badge-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`profile invite share badge static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-invite-share-badge-static-probe] PASS all checks');
