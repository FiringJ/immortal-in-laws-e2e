import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const APP_JSON = path.join(APP_ROOT, 'app.json');
const MESSAGE_TS = path.join(APP_ROOT, 'pages/message/index.ts');
const SYSTEM_MESSAGE_TS = path.join(APP_ROOT, 'pages/system-message/index.ts');
const SYSTEM_MESSAGE_WXML = path.join(APP_ROOT, 'pages/system-message/index.wxml');

const appJsonText = fs.readFileSync(APP_JSON, 'utf8');
const messageTs = fs.readFileSync(MESSAGE_TS, 'utf8');
const systemMessageTs = fs.readFileSync(SYSTEM_MESSAGE_TS, 'utf8');
const systemMessageWxml = fs.readFileSync(SYSTEM_MESSAGE_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '消息首页系统消息入口跳转到系统消息详情页',
    /onSystemMessageTap\(\)\s*\{[\s\S]*url:\s*'\/pages\/system-message\/index'/.test(messageTs),
  ],
  [
    '系统消息详情页已注册到 app.json',
    /"pages\/system-message\/index"/.test(appJsonText),
  ],
  [
    '系统消息详情页存在列表渲染',
    /wx:for="\{\{systemMessages\}\}"/.test(systemMessageWxml),
  ],
  [
    '系统消息详情页具备消息点击处理',
    /onSystemMessageItemTap\(/.test(systemMessageTs) && /bindtap="onSystemMessageItemTap"/.test(systemMessageWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[message-system-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`message system entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[message-system-entry-static-probe] PASS all checks');
