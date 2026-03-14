import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');
const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '拨打电话会员提示文案为“可免费查看对方号码”',
    /openUnlockPrompt[\s\S]*'您是会员，可免费查看对方号码'/.test(guestDetailTs),
  ],
  [
    '联系方式已解锁判定不再仅凭手机号字段',
    /hasUnlockedContact\(guest:[\s\S]*return false;[\s\S]*\},/.test(guestDetailTs)
      && !/return Boolean\(guest\.parent\.phone \|\| guest\.parent\.wechat\);/.test(guestDetailTs),
  ],
  [
    '拨打电话解锁后跳转私信页并携带 autoCall 参数',
    /onCallTap\(\)\s*\{[\s\S]*url:\s*`\/pages\/chat\/index\?guestId=\$\{guest\.id\}&autoCall=1`/.test(guestDetailTs),
  ],
  [
    '私信页读取 autoCall 参数并在加载会话后自动弹出联系方式',
    /const pendingAutoCall = autoCall === '1' \|\| autoCall === 'true';[\s\S]*setData\(\{ pendingAutoCall: true \}\)/.test(chatTs)
      && /const shouldAutoShowCall = this\.data\.pendingAutoCall[\s\S]*callModalVisible: shouldAutoShowCall[\s\S]*pendingAutoCall: false/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[guest-detail-call-unlock-chat-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`guest detail call unlock chat static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-detail-call-unlock-chat-static-probe] PASS all checks');
