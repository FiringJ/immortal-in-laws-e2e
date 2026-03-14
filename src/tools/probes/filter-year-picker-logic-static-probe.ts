import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');
const FILTER_WXML = path.join(APP_ROOT, 'pages/filter/index.wxml');

const ts = fs.readFileSync(FILTER_TS, 'utf8');
const wxml = fs.readFileSync(FILTER_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['年份截止选项与起始年份保持 +3 联动', /const YEAR_RANGE_GAP = 3;/.test(ts) && /buildYearEndOptions[\s\S]*startValue \+ YEAR_RANGE_GAP/.test(ts)],
  ['起始年份变化后截止值默认选中“不限”下一项', /fallbackEndValue = nextEndOptions\.find\(\(option\) => option\.value > 0\)\?\.value \?\? 0;/.test(ts)],
  ['点击年份要求打开区间滚轮', /onYearRangeTap\(\)\s*\{\s*this\.openRangePicker\('year'\);/.test(ts)],
  ['年份区间确认后写回 birthYearMin/birthYearMax', /onRangePickerConfirm\([\s\S]*birthYearMin: normalized\.startValue[\s\S]*birthYearMax: normalized\.endValue/.test(ts)],
  ['年份滚轮弹层与完成按钮已接入', /上下滚动选择年份要求/.test(ts) && /onRangePickerConfirm/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[filter-year-picker-logic-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`filter year picker logic static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-year-picker-logic-static-probe] PASS all checks');
