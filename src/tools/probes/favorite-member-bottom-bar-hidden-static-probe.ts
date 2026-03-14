import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');

const ts = fs.readFileSync(TS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页 onLoad 先执行依赖初始化流程', /onLoad\([\s\S]*this\.initDependenciesAndLoad\(\);/.test(ts)],
  ['依赖初始化流程先等待会员状态刷新', /async initDependenciesAndLoad\(\)[\s\S]*await Promise\.all\(\[[\s\S]*memberStore\.refreshStatus\(\)[\s\S]*memberStore\.refreshBenefits\(\)/.test(ts)],
  ['依赖初始化流程等待地区映射后再拉列表', /await ensureRegionMaps\(\)[\s\S]*this\.loadData\(\);/.test(ts)],
  ['底部开通会员条仍受非会员条件约束', /showBottomBar\s*=\s*!memberStore\.isMember\(\)[\s\S]*RecordType\.VIEW[\s\S]*RecordType\.FAVORITE[\s\S]*RecordDirection\.OTHER_TO_ME/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-member-bottom-bar-hidden-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`favorite member bottom bar hidden static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-member-bottom-bar-hidden-static-probe] PASS all checks');
