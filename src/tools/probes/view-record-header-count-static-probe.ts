import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const USER_TYPES_FILE = path.join(APP_ROOT, 'types/user.ts');
const RECORD_SERVICE_FILE = path.join(APP_ROOT, 'services/record.ts');
const HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const userTypes = fs.readFileSync(USER_TYPES_FILE, 'utf8');
const recordService = fs.readFileSync(RECORD_SERVICE_FILE, 'utf8');
const helpers = fs.readFileSync(HELPERS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['ViewRecord 类型支持最近查看文案与累计次数文案', /lastInteractLabel\?:\s*string/.test(userTypes) && /viewCountLabel\?:\s*string/.test(userTypes)],
  ['浏览记录映射保留后端 last_interact_label 与 view_count_label', /buildViewRecords[\s\S]*lastInteractLabel:[\s\S]*last_interact_label[\s\S]*viewCountLabel:[\s\S]*view_count_label/.test(recordService)],
  ['看过我顶部文案优先使用最近查看文案+累计次数文案', /recordType === RecordType\.VIEW[\s\S]*lastInteractLabel[\s\S]*viewCountLabel[\s\S]*headerTime\s*=\s*\[fallbackLastInteractLabel, viewCountLabel\]\.filter\(Boolean\)\.join\(' '\)/.test(helpers)],
  ['看过我顶部文案不再固定写死“通过超级曝光看了我”', !/headerTag\s*=\s*'通过超级曝光看了我'/.test(helpers)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[view-record-header-count-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`view record header count static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[view-record-header-count-static-probe] PASS all checks');
