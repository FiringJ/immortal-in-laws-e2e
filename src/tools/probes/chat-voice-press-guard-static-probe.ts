import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_INPUT_BAR_TS = path.join(APP_ROOT, 'components/pages/chat/chat-input-bar/index.ts');
const CHAT_INPUT_BAR_WXML = path.join(APP_ROOT, 'components/pages/chat/chat-input-bar/index.wxml');

const chatInputBarTs = fs.readFileSync(CHAT_INPUT_BAR_TS, 'utf8');
const chatInputBarWxml = fs.readFileSync(CHAT_INPUT_BAR_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '语音输入仅在 touchstart 中进入延迟触发逻辑',
    /bindtouchstart="onVoiceTouchStart"/.test(chatInputBarWxml)
      && !/bindlongpress="onVoiceLongPress"/.test(chatInputBarWxml),
  ],
  [
    'touchstart 使用延迟定时器触发 voicestart',
    /onVoiceTouchStart[\s\S]*setTimeout\([\s\S]*this\.triggerEvent\('voicestart'\)/.test(chatInputBarTs),
  ],
  [
    'touchend 会先清理定时器，避免单击误触发',
    /onVoiceEnd\(\)\s*\{[\s\S]*this\.clearVoicePressTimer\(\);[\s\S]*if\s*\(!this\.data\.voicePressActive\)/.test(chatInputBarTs),
  ],
  [
    'touchcancel 会先清理定时器，避免取消时误触发',
    /onVoiceCancel\(\)\s*\{[\s\S]*this\.clearVoicePressTimer\(\);[\s\S]*if\s*\(!this\.data\.voicePressActive\)/.test(chatInputBarTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[chat-voice-press-guard-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`chat voice press guard static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-voice-press-guard-static-probe] PASS all checks');
