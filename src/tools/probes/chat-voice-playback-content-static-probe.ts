import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const API_MAPPER_TS = path.join(APP_ROOT, 'services/api-mapper.ts');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const apiMapperTs = fs.readFileSync(API_MAPPER_TS, 'utf8');
const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '消息映射对语音/图片优先使用 media_url',
    /resolveMessageContent[\s\S]*messageType === ChatMessageType\.IMAGE \|\| messageType === ChatMessageType\.VOICE[\s\S]*return mediaUrl/.test(apiMapperTs),
  ],
  [
    '历史消息映射使用 resolveMessageContent',
    /mapMessageItem[\s\S]*const content = resolveMessageContent\(item, messageType\)/.test(apiMapperTs),
  ],
  [
    'WS 推送消息映射使用 resolveMessageContent',
    /mapWSPushMessageItem[\s\S]*const content = resolveMessageContent\(item, messageType\)/.test(apiMapperTs),
  ],
  [
    '语音播放前会拦截占位内容并尝试解析 json 地址',
    /resolveVoiceSource[\s\S]*rawContent\.startsWith\('\{'\)[\s\S]*JSON\.parse[\s\S]*voiceUrl === '\[语音\]'/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[chat-voice-playback-content-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`chat voice playback content static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-voice-playback-content-static-probe] PASS all checks');
