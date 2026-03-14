import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');
const CHAT_WXML = path.join(APP_ROOT, 'pages/chat/index.wxml');

const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');
const chatTs = fs.readFileSync(CHAT_TS, 'utf8');
const chatWxml = fs.readFileSync(CHAT_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '详情页打招呼直接跳转私信页并携带 unlockPrompt 参数',
    /onGreetTap\(\)\s*\{[\s\S]*\/pages\/chat\/index\?guestId=\$\{guest\.id\}&unlockPrompt=1/.test(guestDetailTs),
  ],
  [
    '私信页读取 unlockPrompt 参数并在未解锁时自动展示解锁提示',
    /const pendingUnlockPrompt = unlockPrompt === '1' \|\| unlockPrompt === 'true';[\s\S]*setData\(\{ pendingUnlockPrompt: true \}\)/.test(chatTs)
      && /const shouldAutoShowUnlockPrompt = this\.data\.pendingUnlockPrompt[\s\S]*memberStore\.isMember\(\)[\s\S]*!isContactUnlocked/.test(chatTs),
  ],
  [
    '私信页提供“立即解锁”弹框并触发解锁逻辑',
    /confirm-modal[\s\S]*您是会员可免费解锁和对方的聊天。[\s\S]*bind:confirm="onConfirmUnlockPrompt"/.test(chatWxml)
      && /onConfirmUnlockPrompt\(\)[\s\S]*unlockContact\(/.test(chatTs),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[guest-detail-greet-chat-unlock-prompt-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`guest detail greet chat unlock prompt static probe failed: ${failed.length} checks missing`);
}

console.log('[guest-detail-greet-chat-unlock-prompt-static-probe] PASS all checks');
