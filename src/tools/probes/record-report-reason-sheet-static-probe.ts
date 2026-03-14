import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');
const JSON_FILE = path.join(APP_ROOT, 'pages/message-record/index.json');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');
const json = fs.readFileSync(JSON_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页存在举报原因配置与映射表', /const REPORT_REASONS = \[[\s\S]*const REPORT_REASON_CODE_MAP: Record<string, number> = \{/.test(ts)],
  ['记录页点击举报先打开原因选择弹层', /if \(key === 'report'\)[\s\S]*showReportReasonSheet:\s*true[\s\S]*pendingReportGuestId:\s*String\(record\.guestId\)/.test(ts)],
  ['记录页原因选择后再调用举报接口', /onReportReasonSelect\([\s\S]*const reasonId = REPORT_REASON_CODE_MAP\[reason\] \|\| 5[\s\S]*reportGuest\(guestId, reasonId\)/.test(ts)],
  ['记录页注册 action-sheet 组件用于举报原因', /\"action-sheet\":\s*\"\/components\/action-sheet\/index\"/.test(json)],
  ['记录页存在举报原因选择 action-sheet 节点', /show=\"\{\{showReportReasonSheet\}\}\"[\s\S]*title=\"请选择举报对方的原因\"[\s\S]*bind:select=\"onReportReasonSelect\"/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-report-reason-sheet-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record report reason sheet static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-report-reason-sheet-static-probe] PASS all checks');
