import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_PAGE_WXML = path.join(APP_ROOT, 'pages/chat/index.wxml');
const CHAT_ACTION_WXML = path.join(APP_ROOT, 'components/pages/chat/chat-action-buttons/index.wxml');
const CHAT_ACTION_WXSS = path.join(APP_ROOT, 'components/pages/chat/chat-action-buttons/index.wxss');

const chatPageWxml = fs.readFileSync(CHAT_PAGE_WXML, 'utf8');
const chatActionWxml = fs.readFileSync(CHAT_ACTION_WXML, 'utf8');
const chatActionWxss = fs.readFileSync(CHAT_ACTION_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['私信页按对方手机号状态透传 showCallButton', /showCallButton="\{\{!!counterpartyPhoneNumber\}\}"/.test(chatPageWxml)],
  ['动作栏拨打电话按钮仅在 showCallButton=true 时渲染', /wx:if="\{\{showCallButton\}\}"\s+class="chat-pill call"/.test(chatActionWxml)],
  ['动作栏使用 flex-start 左对齐布局', /justify-content:\s*flex-start;/.test(chatActionWxss)],
  ['按钮为固定宽度胶囊，隐藏电话后其余按钮保持左对齐顺序', /\.chat-pill\s*\{[\s\S]*width:\s*190rpx;[\s\S]*flex-shrink:\s*0;/.test(chatActionWxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[chat-call-button-visibility-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`chat call button visibility static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-call-button-visibility-static-probe] PASS all checks');
