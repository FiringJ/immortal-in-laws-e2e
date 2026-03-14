import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_SERVICE_TS = path.join(APP_ROOT, 'services/record.ts');
const RECORD_HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const recordServiceTs = fs.readFileSync(RECORD_SERVICE_TS, 'utf8');
const recordHelpersTs = fs.readFileSync(RECORD_HELPERS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '解锁记录过期时间缺失时使用 unlockTime+24h 兜底',
    /resolveExpireAt\(interaction\)\s*\|\|\s*\(time\s*\+\s*UNLOCK_FREE_VIEW_HOURS\s*\*\s*3600000\)/.test(recordServiceTs),
  ],
  [
    '24小时过期态仅应用在“解锁我(other_to_me)”方向',
    /const shouldApplyUnlockExpiry = recordType === RecordType\.UNLOCK[\s\S]*direction === RecordDirection\.OTHER_TO_ME/.test(recordHelpersTs),
  ],
  [
    '解锁方向过期态会写入已过期按钮文案',
    /if\s*\(shouldApplyUnlockExpiry\)\s*\{[\s\S]*contactButton\.text = '已过期'/.test(recordHelpersTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[unlock-record-direction-expiry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`unlock record direction expiry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-record-direction-expiry-static-probe] PASS all checks');
