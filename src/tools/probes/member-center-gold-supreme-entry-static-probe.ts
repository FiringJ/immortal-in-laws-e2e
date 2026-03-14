import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const MEMBER_CENTER_TS = path.join(APP_ROOT, 'pages/member-center/index.ts');

const memberCenterTs = fs.readFileSync(MEMBER_CENTER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员中心定义黄金页至尊入口子卡标识',
    /const SUPREME_ENTRY_PLAN_ID = '__supreme_entry__'/.test(memberCenterTs),
  ],
  [
    '黄金卡型列表会追加至尊入口作为第4子项',
    /goldPlansWithSupremeEntry[\s\S]*\[\.\.\.goldPlans,\s*buildSupremeEntryPlan\(supremePlan\)\]/.test(memberCenterTs),
  ],
  [
    '点击至尊入口子卡会切换到至尊会员主tab',
    /onSelectPlan[\s\S]*planid === SUPREME_ENTRY_PLAN_ID[\s\S]*applySelectedTab\('supreme'\)/.test(memberCenterTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[member-center-gold-supreme-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member center gold supreme entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-center-gold-supreme-entry-static-probe] PASS all checks');
