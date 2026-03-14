import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HOME_TS = path.join(APP_ROOT, 'pages/index/index.ts');

const homeTs = fs.readFileSync(HOME_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员场景不再因 guest.canContact 直接放行',
    /hasEstablishedContact\s*=\s*hasLocalContactRecord[\s\S]*\(!isMember && Boolean\(guest\.canContact\)\)/.test(homeTs),
  ],
  [
    '会员点击联系对方会出现免费解锁提示文案',
    /const contactUnlockHint = isMember[\s\S]*'您是会员，可免费解锁和对方的聊天'/.test(homeTs),
  ],
  [
    '立即解锁确认后在成功分支展示 toast',
    /onConfirmContactUnlock\(\)[\s\S]*unlockResult\.unlockedNow[\s\S]*成功解锁联系方式/.test(homeTs),
  ],
  [
    '解锁跳转方法返回 unlockedNow 结果',
    /ensureUnlockedAndNavigate\(guestId: string\): Promise<\{ unlockedNow: boolean; navigated: boolean \}>/.test(homeTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-member-contact-unlock-toast-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home member contact unlock toast static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-member-contact-unlock-toast-static-probe] PASS all checks');
