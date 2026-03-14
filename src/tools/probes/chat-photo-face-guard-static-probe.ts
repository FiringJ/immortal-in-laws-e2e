import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '发送照片前会再次调用 validateChatPhoto 做合规校验',
    /onConfirmSendPhoto[\s\S]*const latestValidatedUrl = await validateChatPhoto\(photoPendingPath\)/.test(chatTs),
  ],
  [
    '发送照片失败的无效照片提示固定为中文',
    /onConfirmSendPhoto[\s\S]*isInvalidPhoto[\s\S]*title:\s*isInvalidPhoto\s*\?\s*'照片不符合要求，请点击更换'/.test(chatTs),
  ],
  [
    '选图检测失败时也会命中无效照片中文提示',
    /onChoosePhoto[\s\S]*isInvalidPhoto[\s\S]*'照片不符合要求，请点击更换'/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[chat-photo-face-guard-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`chat photo face guard static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-photo-face-guard-static-probe] PASS all checks');
