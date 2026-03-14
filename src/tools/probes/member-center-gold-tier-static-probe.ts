import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/member-center/index.ts');
const text = fs.readFileSync(TS_FILE, 'utf8');

const checks: Array<[string, RegExp]> = [
  ['黄金档位识别函数', /resolveGoldPlanTier\s*=\s*\(plan:\s*DisplayPlan\s*\|\s*null\)/],
  ['档位包含季度/年度/永久', /type\s+GoldPlanTier\s*=\s*'quarter'\s*\|\s*'year'\s*\|\s*'permanent'/],
  ['权益有效期按档位区分', /const validity\s*=\s*isPermanent\s*\?\s*'有效期不限时间'\s*:\s*isAnnual\s*\?\s*'有效期12个月'\s*:\s*'有效期93天'/],
  ['每日推荐人数按档位区分', /每天推荐26位对象[\s\S]*每天推荐18位对象[\s\S]*每天推荐8位对象/],
];

const failed = checks.filter(([, pattern]) => !pattern.test(text)).map(([label]) => label);
console.log(`[member-center-gold-tier-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member center gold tier static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-gold-tier-static-probe] PASS all checks');
