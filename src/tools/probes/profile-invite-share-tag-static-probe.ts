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
    '我的页邀请好友入口配置分享赚钱标签',
    /key:\s*'invite'[\s\S]*label:\s*'邀请好友'[\s\S]*badgeText:\s*'分享赚钱'/.test(profileTs),
  ],
  [
    '我的页其他功能模板渲染分享赚钱标签容器',
    /function-badge/.test(profileWxml) && /wx:if="\{\{item\.badgeText\}\}"/.test(profileWxml),
  ],
  [
    '分享赚钱标签具备独立样式定义',
    /\.function-badge\s*\{[\s\S]*position:\s*absolute[\s\S]*line-height:\s*36rpx/.test(profileWxss),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[profile-invite-share-tag-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile invite share tag static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-invite-share-tag-static-probe] PASS all checks');
