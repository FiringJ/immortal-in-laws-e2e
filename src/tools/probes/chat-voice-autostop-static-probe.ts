import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '语音播放结束时会清理播放态',
    /audioContext\.onEnded\(\(\)\s*=>\s*\{[\s\S]*stopVoicePlayback\(true\)/.test(chatTs),
  ],
  [
    '语音 stop 事件也会清理播放态，避免动效悬挂',
    /audioContext\.onStop\(\(\)\s*=>\s*\{[\s\S]*stopVoicePlayback\(true\)/.test(chatTs),
  ],
  [
    'stopVoicePlayback 支持跳过二次 stop，避免事件递归',
    /stopVoicePlayback\(skipAudioStop: boolean = false\)[\s\S]*if \(!skipAudioStop && audioContext\)/.test(chatTs),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[chat-voice-autostop-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`chat voice autostop static probe failed: ${failed.length} checks missing`);
}

console.log('[chat-voice-autostop-static-probe] PASS all checks');
