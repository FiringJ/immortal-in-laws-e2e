import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页新增屏蔽二次确认状态字段', /showBlockConfirm:\s*false[\s\S]*blockTargetIndex:\s*-1/.test(ts)],
  ['屏蔽动作先弹二次确认框而非直接执行', /if \(key === 'block'\)[\s\S]*showBlockConfirm:\s*true[\s\S]*blockTargetIndex:\s*targetIndex/.test(ts)],
  ['确认屏蔽后再调用屏蔽删除接口', /onConfirmBlock\(\)[\s\S]*blockAndDeleteRecord\(this\.data\.recordType, record\.guestId\)/.test(ts)],
  ['确认屏蔽成功后移除记录并提示成功', /onConfirmBlock\(\)[\s\S]*recordList:\s*this\.data\.recordList\.filter\([\s\S]*已屏蔽并删除/.test(ts)],
  ['页面包含屏蔽并删除二次确认弹框', /wx:if="\{\{showBlockConfirm\}\}"/.test(wxml) && /您确定要屏蔽并删除该资料吗/.test(wxml) && /屏蔽并删除/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-block-confirm-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record block confirm static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-block-confirm-static-probe] PASS all checks');
