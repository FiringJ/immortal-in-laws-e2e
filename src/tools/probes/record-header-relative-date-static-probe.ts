import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const helpersTs = fs.readFileSync(HELPERS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '记录页存在今天/昨天日期格式化函数',
    /const formatRecordDateLabel = \(timestamp: number\): string =>[\s\S]*if \(diffDays === 0\)[\s\S]*'今天'[\s\S]*if \(diffDays === 1\)[\s\S]*'昨天'/.test(helpersTs),
  ],
  [
    '记录页 headerTime 默认使用相对日期标签',
    /const dateLabel = formatRecordDateLabel\(normalizedTime\)[\s\S]*let headerTime = `\$\{dateLabel\}\$\{directionSuffix\}`\.trim\(\)/.test(helpersTs),
  ],
  [
    '看过我 fallback 文案同样使用相对日期标签',
    /fallbackLastInteractLabel = lastInteractLabel \|\| `\$\{dateLabel\}看了我`/.test(helpersTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-header-relative-date-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`record header relative date static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-header-relative-date-static-probe] PASS all checks');
