import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_TS = path.join(APP_ROOT, 'pages/profile/index.ts');
const PROFILE_WXML = path.join(APP_ROOT, 'pages/profile/index.wxml');
const INVITE_TS = path.join(APP_ROOT, 'pages/invite/index.ts');
const INVITE_WXML = path.join(APP_ROOT, 'pages/invite/index.wxml');
const NOTIFY_HELPER_TS = path.join(APP_ROOT, 'utils/notify-subscribe.ts');
const NOTIFY_STATUS_TS = path.join(APP_ROOT, 'pages/notify-status/index.ts');

const profileTs = fs.readFileSync(PROFILE_TS, 'utf8');
const profileWxml = fs.readFileSync(PROFILE_WXML, 'utf8');
const inviteTs = fs.readFileSync(INVITE_TS, 'utf8');
const inviteWxml = fs.readFileSync(INVITE_WXML, 'utf8');
const notifyHelperTs = fs.readFileSync(NOTIFY_HELPER_TS, 'utf8');
const notifyStatusTs = fs.readFileSync(NOTIFY_STATUS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['profile 入口包含通知开关态并支持 toggle', /notifyAllowEnabled:\s*false/.test(profileTs) && /onToggleNotifyAllowSwitch\(\)/.test(profileTs)],
  ['profile 一级弹框按钮改为拒绝/允许', /onRejectNotifyGuide">拒绝</.test(profileWxml) && /onConfirmNotifyGuide">[\s\S]*允许/.test(profileWxml)],
  ['invite 入口包含通知开关态并支持 toggle', /notifyAllowEnabled:\s*false/.test(inviteTs) && /onToggleNotifyAllowSwitch\(\)/.test(inviteTs)],
  ['invite 一级弹框按钮改为拒绝/允许', /onRejectNotifyGuide">拒绝</.test(inviteWxml) && /onConfirmNotifyGuide">[\s\S]*允许/.test(inviteWxml)],
  ['通知订阅缺少模板 ID 时不再 fallback 放行', /templateIds\.length === 0[\s\S]*return \{ ok: false, fallbackUsed: false \};/.test(notifyHelperTs) && !/return \{ ok: true, fallbackUsed: true \};/.test(notifyHelperTs)],
  ['通知订阅优先判断系统主开关已开启态', /checkMainSwitchEnabled/.test(notifyHelperTs) && /if \(mainSwitchEnabled\) \{[\s\S]*return \{ ok: true, fallbackUsed: false \};/.test(notifyHelperTs)],
  ['通知状态页默认天数为 0 且点击自增并封顶 100000', /remainingDays:\s*0/.test(notifyStatusTs) && /NOTIFY_REMAINING_DAYS_MAX = 100000/.test(notifyStatusTs) && /Math\.min\(NOTIFY_REMAINING_DAYS_MAX,\s*current \+ 1\)/.test(notifyStatusTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[notify-permission-flow-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`notify permission flow static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[notify-permission-flow-static-probe] PASS all checks');
