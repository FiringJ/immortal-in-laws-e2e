import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');
const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '交换照片流程创建会话时不再发送默认问候',
    /performExchangePhoto[\s\S]*createConversation\(guest\.id,\s*false\)/.test(guestDetailTs),
  ],
  [
    '交换成功跳转聊天时携带 photoExchangeDone=1',
    /wx\.navigateTo\(\{[\s\S]*\/pages\/chat\/index\?conversationId=\$\{conversationId\}&photoExchangeDone=1/.test(guestDetailTs),
  ],
  [
    '聊天页支持 photoExchangeDone 强制完成态参数',
    /const forcePhotoExchangeDone = photoExchangeDone === '1' \|\| photoExchangeDone === 'true';[\s\S]*this\.setData\(\{ forcePhotoExchangeDone: true \}\)/.test(chatTs),
  ],
  [
    '聊天页在强制完成态下将状态提升到已交换',
    /if\s*\(this\.data\.forcePhotoExchangeDone && resolvedStatus !== PHOTO_EXCHANGE_DONE\)\s*\{[\s\S]*resolvedStatus = PHOTO_EXCHANGE_DONE;/.test(chatTs),
  ],
  [
    '聊天页在强制完成态下隐藏交换申请消息卡片',
    /const filteredMessages = this\.data\.forcePhotoExchangeDone[\s\S]*message\.messageType !== ChatMessageType\.PHOTO_EXCHANGE/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[photo-exchange-direct-send-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`photo exchange direct-send static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[photo-exchange-direct-send-static-probe] PASS all checks');
