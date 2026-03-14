import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');
const CHAT_WXML = path.join(APP_ROOT, 'pages/chat/index.wxml');

const ts = fs.readFileSync(CHAT_TS, 'utf8');
const wxml = fs.readFileSync(CHAT_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['消息列表展示时间分割线与时间文案', /message-time-line/.test(wxml) && /timeDividerLabel/.test(wxml)],
  ['己方消息展示未读/已读状态文案', /item\.senderId === 'me' && item\.statusLabel/.test(wxml) && /status-text/.test(wxml)],
  ['状态判定优先使用 readAt 或首条对方回复时间', /const statusTime = message\.readAt \|\| replyTime;/.test(ts) && /findFirstReplyTime/.test(ts)],
  ['己方消息状态写回为“已读\/未读”', /statusLabel = message\.senderId === 'me'[\s\S]*'已读'[\s\S]*'未读'/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[chat-message-time-read-status-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`chat message time/read status static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-message-time-read-status-static-probe] PASS all checks');
