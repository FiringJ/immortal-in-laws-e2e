import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');

const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '嘉宾资料基础信息中不再渲染户籍项',
    !/buildInfoRow\('户籍'/.test(guestDetailTs),
  ],
  [
    '基础信息仍保留家乡字段',
    /buildInfoRow\('家乡',\s*hometownName\)/.test(guestDetailTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[guest-detail-remove-hukou-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`guest detail remove hukou static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-detail-remove-hukou-static-probe] PASS all checks');
