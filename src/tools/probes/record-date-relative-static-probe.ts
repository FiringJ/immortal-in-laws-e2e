import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const helpers = fs.readFileSync(HELPERS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页存在统一日期标签格式化函数', /const formatRecordDateLabel = \(timestamp: number\): string => \{/.test(helpers)],
  ['记录页日期标签支持今天/昨天/明天', /diffDays === 0[\s\S]*今天[\s\S]*diffDays === 1[\s\S]*昨天[\s\S]*diffDays === -1[\s\S]*明天/.test(helpers)],
  ['记录页顶部文案统一复用日期标签', /const dateLabel = formatRecordDateLabel\(normalizedTime\)[\s\S]*headerTime = `\$\{dateLabel\}\$\{directionSuffix\}`\.trim\(\)/.test(helpers)],
  ['看过我缺省文案回退也使用日期标签', /fallbackLastInteractLabel = lastInteractLabel \|\| `\$\{dateLabel\}看了我`/.test(helpers)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-date-relative-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record date relative static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-date-relative-static-probe] PASS all checks');
