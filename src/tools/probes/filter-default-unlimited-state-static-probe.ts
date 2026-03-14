import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');

const filterTs = fs.readFileSync(FILTER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '筛选页默认不选中除年份/身高外的“不限”',
    /educationUnlimitedSelected:\s*false[\s\S]*incomeUnlimitedSelected:\s*false[\s\S]*maritalStatusUnlimitedSelected:\s*false[\s\S]*propertyUnlimitedSelected:\s*false[\s\S]*carUnlimitedSelected:\s*false/.test(filterTs),
  ],
  [
    '选项状态同步以显式 unlimited 标记控制高亮',
    /option\.value === 'unlimited'[\s\S]*educationUnlimitedSelected[\s\S]*incomeUnlimitedSelected[\s\S]*maritalStatusUnlimitedSelected[\s\S]*propertyUnlimitedSelected[\s\S]*carUnlimitedSelected/.test(filterTs),
  ],
  [
    '点击 unlimited 时会显式写入对应标记',
    /value === 'unlimited'[\s\S]*educationUnlimitedSelected:\s*true[\s\S]*incomeUnlimitedSelected:\s*true[\s\S]*maritalStatusUnlimitedSelected:\s*true[\s\S]*propertyUnlimitedSelected:\s*true[\s\S]*carUnlimitedSelected:\s*true/.test(filterTs),
  ],
  [
    '重置筛选时会清空 unlimited 显式标记',
    /onReset\(\)[\s\S]*educationUnlimitedSelected:\s*false[\s\S]*incomeUnlimitedSelected:\s*false[\s\S]*maritalStatusUnlimitedSelected:\s*false[\s\S]*propertyUnlimitedSelected:\s*false[\s\S]*carUnlimitedSelected:\s*false/.test(filterTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[filter-default-unlimited-state-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`filter default unlimited state static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-default-unlimited-state-static-probe] PASS all checks');
