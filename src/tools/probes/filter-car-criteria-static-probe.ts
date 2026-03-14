import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CONSTANTS_TS = path.join(APP_ROOT, 'config/constants.ts');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');
const GUEST_SERVICE_TS = path.join(APP_ROOT, 'services/guest.ts');

const constantsTs = fs.readFileSync(CONSTANTS_TS, 'utf8');
const filterTs = fs.readFileSync(FILTER_TS, 'utf8');
const guestServiceTs = fs.readFileSync(GUEST_SERVICE_TS, 'utf8');

const carOptionsMatch = constantsTs.match(/export const FILTER_CAR_OPTIONS:[\s\S]*?\[(?<body>[\s\S]*?)\];/);
const carOptionsBody = carOptionsMatch?.groups?.body || '';

const checks: Array<[string, boolean]> = [
  [
    '购车筛选仅保留“不限 + 已购车/近期购车”两项',
    carOptionsBody.includes("value: 'unlimited'")
      && carOptionsBody.includes("value: 'owned'")
      && carOptionsBody.includes("label: '已购车/近期购车'")
      && !carOptionsBody.includes("value: 'recent_purchase'")
      && !carOptionsBody.includes("value: 'none'"),
  ],
  [
    '筛选页会把历史 recent_purchase 归一到 owned 选项',
    /normalizeCarList[\s\S]*CarStatus\.RECENT_PURCHASE[\s\S]*return hasOwnedOrRecent \? \[CarStatus\.OWNED\] : \[\]/.test(filterTs),
  ],
  [
    '搜索请求 car_status 继续兼容 owned/recent_purchase 统一映射 1',
    /carValue === 'owned' \|\| carValue === 'recent_purchase'[\s\S]*carStatus = 1/.test(guestServiceTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-car-criteria-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter car criteria static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-car-criteria-static-probe] PASS all checks');
