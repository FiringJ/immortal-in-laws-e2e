import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_DETAIL_WXML = path.join(APP_ROOT, 'pages/guest-detail/index.wxml');
const BOTTOM_BAR_WXML = path.join(APP_ROOT, 'components/pages/guest-detail/guest-detail-bottom-bar/index.wxml');
const BOTTOM_BAR_TS = path.join(APP_ROOT, 'components/pages/guest-detail/guest-detail-bottom-bar/index.ts');

const guestDetailWxml = fs.readFileSync(GUEST_DETAIL_WXML, 'utf8');
const bottomBarWxml = fs.readFileSync(BOTTOM_BAR_WXML, 'utf8');
const bottomBarTs = fs.readFileSync(BOTTOM_BAR_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '详情页向底部栏透传 hasPhone 状态',
    /guest-detail-bottom-bar[\s\S]*has-phone="\{\{guest\.parent\.phone \? true : false\}\}"/.test(guestDetailWxml),
  ],
  [
    '底部栏声明 hasPhone 属性',
    /hasPhone:\s*\{[\s\S]*type:\s*Boolean/.test(bottomBarTs),
  ],
  [
    '拨打电话按钮按 hasPhone 条件渲染',
    /class="bar-btn call"[\s\S]*wx:if="\{\{hasPhone\}\}"/.test(bottomBarWxml),
  ],
  [
    '无手机号时收藏按钮使用单列居中布局',
    /class="bar-actions \{\{hasPhone \? '' : 'single'\}\}"/.test(bottomBarWxml)
      && /favorite-single/.test(bottomBarWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[guest-detail-call-visibility-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`guest detail call visibility static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-detail-call-visibility-static-probe] PASS all checks');
