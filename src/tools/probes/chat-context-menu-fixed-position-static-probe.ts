import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['长按菜单定位函数返回固定 above 方向', /resolveContextMenuPosition[\s\S]*direction:\s*'above'/.test(chatTs)],
  ['长按菜单横向固定为屏幕居中', /\(windowWidth - menuWidth\) \/ 2/.test(chatTs)],
  ['长按菜单纵向固定在输入区上方安全位置', /windowHeight - this\.data\.bottomBarHeight - menuHeight - this\.rpxToPx\(120\)/.test(chatTs)],
  ['长按菜单隐藏箭头，避免遮挡气泡附近内容', /arrowStyle:\s*'display:\s*none;'/.test(chatTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[chat-context-menu-fixed-position-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`chat context menu fixed position static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-context-menu-fixed-position-static-probe] PASS all checks');
