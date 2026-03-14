import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const FILTER_TS = path.join(APP_ROOT, 'pages/filter/index.ts');
const FILTER_WXML = path.join(APP_ROOT, 'pages/filter/index.wxml');
const FILTER_WXSS = path.join(APP_ROOT, 'pages/filter/index.wxss');

const ts = fs.readFileSync(FILTER_TS, 'utf8');
const wxml = fs.readFileSync(FILTER_WXML, 'utf8');
const wxss = fs.readFileSync(FILTER_WXSS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['地区筛选新增“+其他地区”入口', /\+其他地区/.test(wxml) && /mode="multiSelector"/.test(wxml)],
  ['地区筛选支持省市联动列变更', /onRegionPickerColumnChange\(/.test(ts) && /provinceCityOptions: \[provinces, cities, districts\]/.test(ts)],
  ['地区筛选支持确认添加新城市', /onRegionPickerConfirm\(/.test(ts) && /nextCities = dedupedCities\.slice\(0, 2\)/.test(ts)],
  ['地区筛选保持单选命中（cities 仅保留 1 个）', /cities: \[selected\]/.test(ts)],
  ['“+其他地区”入口样式为突出可点击态', /filter-option-add/.test(wxss)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[filter-region-second-city-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`filter region second city static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[filter-region-second-city-static-probe] PASS all checks');
