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
  [
    '我的首页功能项定义支持 badgeText',
    /interface FunctionItem[\s\S]*badgeText\?:\s*string;/.test(profileTs),
  ],
  [
    '邀请好友入口配置分享赚钱标签',
    /key:\s*'invite'[\s\S]*badgeText:\s*'分享赚钱'/.test(profileTs),
  ],
  [
    '其他功能区渲染分享赚钱 badge',
    /function-badge\" wx:if=\"\{\{item\.badgeText\}\}\"/.test(profileWxml),
  ],
  [
    '分享赚钱 badge 样式已定义',
    /\.function-badge\s*\{[\s\S]*linear-gradient\(90deg,\s*#ff4d56 0%,\s*#ff8a4a 100%\)/.test(profileWxss),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[profile-invite-badge-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`profile invite badge static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-invite-badge-static-probe] PASS all checks');
