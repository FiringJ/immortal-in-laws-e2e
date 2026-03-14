import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/chat/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/chat/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['聊天页新增会员阻断弹框状态字段', /showBlockDialog:\s*false[\s\S]*blockDialogScene:\s*''/.test(ts)],
  ['未解锁点击交换微信弹会员阻断弹框', /onWeChatTap\(\)[\s\S]*if \(!isUnlocked\) \{[\s\S]*onOpenVip\('交换微信'\)/.test(ts)],
  ['未解锁点击拨打电话弹会员阻断弹框', /onCallTap\(\)[\s\S]*if \(!this\.data\.isUnlocked\) \{[\s\S]*onOpenVip\('拨打电话'\)/.test(ts)],
  ['未解锁点击发送照片弹会员阻断弹框', /onPhotoTap\(\)[\s\S]*if \(!this\.data\.isUnlocked\) \{[\s\S]*onOpenVip\('交换照片'\)/.test(ts)],
  ['onOpenVip 不再直接跳会员页而是打开阻断弹框', /onOpenVip\(scene: string = '联系对方'\)[\s\S]*showBlockDialog:\s*true[\s\S]*blockDialogScene:\s*scene/.test(ts) && !/onOpenVip\([\s\S]*\/pages\/member-center\/index/.test(ts)],
  ['聊天页挂载 block-dialog 组件', /<block-dialog[\s\S]*show="\{\{showBlockDialog\}\}"[\s\S]*scene="\{\{blockDialogScene\}\}"/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[chat-unlock-block-dialog-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`chat unlock block dialog static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-unlock-block-dialog-static-probe] PASS all checks');
