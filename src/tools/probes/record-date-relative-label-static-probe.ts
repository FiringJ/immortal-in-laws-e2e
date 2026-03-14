import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_FILE = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const helpers = fs.readFileSync(HELPERS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '记录页日期格式函数支持今天与昨天',
    /const formatRecordDateLabel = \(timestamp: number\): string => \{[\s\S]*return '今天';[\s\S]*return '昨天';/.test(helpers),
  ],
  [
    '记录卡片头部时间统一使用相对日期标签',
    /const dateLabel = formatRecordDateLabel\(normalizedTime\);[\s\S]*let headerTime = `\$\{dateLabel\}\$\{directionSuffix\}`\.trim\(\);/.test(helpers),
  ],
  [
    '看过我回退文案也改为相对日期标签',
    /fallbackLastInteractLabel = lastInteractLabel \|\| `\$\{dateLabel\}看了我`/.test(helpers),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-date-relative-label-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record date relative label static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-date-relative-label-static-probe] PASS all checks');
