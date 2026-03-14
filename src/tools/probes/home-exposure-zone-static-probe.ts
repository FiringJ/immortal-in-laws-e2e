import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HOME_TS = path.join(APP_ROOT, 'pages/index/index.ts');
const HOME_WXML = path.join(APP_ROOT, 'pages/index/index.wxml');
const EXPOSURE_BANNER_WXML = path.join(APP_ROOT, 'components/pages/index/exposure-banner/index.wxml');

const homeTs = fs.readFileSync(HOME_TS, 'utf8');
const homeWxml = fs.readFileSync(HOME_WXML, 'utf8');
const exposureBannerWxml = fs.readFileSync(EXPOSURE_BANNER_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首页会拉取超级曝光专区推荐前 3 位嘉宾',
    /loadData[\s\S]*fetchExposureList\(0,\s*3\)[\s\S]*memberPreviewList:\s*previewList/.test(homeTs),
  ],
  [
    '超级曝光专区插入在推荐列表第 3 位后方',
    /exposure-banner[\s\S]*wx:if="\{\{index === memberBannerIndex && memberPreviewList\.length\}\}"/.test(homeWxml),
  ],
  [
    '专区卡片展示正确的性别/年龄/身高/学历/工作信息',
    /genderLabel \|\| \(item\.child\.gender === 1 \? '男'[\s\S]*item\.child\.height \? \(item\.child\.height \+ 'cm'\)[\s\S]*item\.child\.educationLabel \|\| item\.child\.education[\s\S]*item\.child\.occupation \|\| item\.child\.job/.test(exposureBannerWxml),
  ],
  [
    '专区按钮按会员身份切换为“查看全部”或“帮孩子开启超级曝光”',
    /bindtap="onExposureTap" wx:if="\{\{!isMember\}\}">帮孩子开启超级曝光[\s\S]*bindtap="onViewAllTap" wx:if="\{\{isMember\}\}">查看全部/.test(exposureBannerWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[home-exposure-zone-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`home exposure zone static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-exposure-zone-static-probe] PASS all checks');
