import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_RESULT_TS = path.join(APP_ROOT, 'pages/filter-result/index.ts');

const ts = fs.readFileSync(FILTER_RESULT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '联系按钮文案仅在至尊会员且可联系时显示“联系对方”',
    /withContactButtonText[\s\S]*const isSupreme = memberStore\.isSupremeMember\(\);[\s\S]*const canContact = isSupreme && memberStore\.canContact\(guest\)/.test(ts),
  ],
  [
    '点击联系入口优先拦截非至尊会员并跳至尊会员页',
    /onContactTap[\s\S]*if\s*\(!memberStore\.isSupremeMember\(\)\)\s*\{[\s\S]*this\.navigateToSupremeMemberCenter\(\);[\s\S]*return;/.test(ts),
  ],
  [
    '解锁跳私信前再次做非至尊会员兜底拦截',
    /ensureUnlockedAndNavigate[\s\S]*if\s*\(!memberStore\.isSupremeMember\(\)\)\s*\{[\s\S]*this\.navigateToSupremeMemberCenter\(\);[\s\S]*return;/.test(ts),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-result-precise-contact-gate-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter result precise contact gate static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-result-precise-contact-gate-static-probe] PASS all checks');
