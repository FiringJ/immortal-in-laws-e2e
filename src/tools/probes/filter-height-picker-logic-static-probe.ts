import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');
const FILTER_WXML = path.join(APP_ROOT, 'pages/filter/index.wxml');
const FILTER_WXSS = path.join(APP_ROOT, 'pages/filter/index.wxss');

const filterTs = fs.readFileSync(FILTER_TS, 'utf8');
const filterWxml = fs.readFileSync(FILTER_WXML, 'utf8');
const filterWxss = fs.readFileSync(FILTER_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['身高范围终点最小值按起点+5cm联动', /const HEIGHT_RANGE_GAP = 5;/.test(filterTs) && /buildHeightEndOptions[\s\S]*startValue \+ HEIGHT_RANGE_GAP/.test(filterTs)],
  ['身高起点/终点选项保留“不限”并支持联动重算', /buildHeightStartOptions[\s\S]*createUnlimitedOption/.test(filterTs) && /nextEndOptions = getRangeEndOptions\(activeRangePicker, nextStartValue\)/.test(filterTs)],
  ['起始值变更后，截止值默认回落到“不限”下一项', /fallbackEndValue = nextEndOptions\.find\(\(option\) => option\.value > 0\)\?\.value \?\? 0;/.test(filterTs)],
  ['点击身高要求会打开区间滚轮选择器', /onHeightRangeTap\(\)\s*\{\s*this\.openRangePicker\('height'\);/.test(filterTs)],
  ['确认后写回 heightMin/heightMax 并更新展示文案', /onRangePickerConfirm\([\s\S]*heightMin: normalized\.startValue[\s\S]*heightMax: normalized\.endValue/.test(filterTs) && /heightRange: formatRangeText\(heightMin, heightMax, 'cm'\)/.test(filterTs)],
  ['WXML 使用双列滚轮 + 完成按钮的身高区间交互', /range-picker-column-start/.test(filterWxml) && /range-picker-column-end/.test(filterWxml) && /onRangePickerConfirm/.test(filterWxml)],
  ['滚轮样式去除纵向拉伸，避免上下选项遮挡', !/transform: scaleY\(/.test(filterWxss) && /range-picker-item[\s\S]*height:\s*132rpx;/.test(filterWxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[filter-height-picker-logic-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`filter height picker logic static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-height-picker-logic-static-probe] PASS all checks');
