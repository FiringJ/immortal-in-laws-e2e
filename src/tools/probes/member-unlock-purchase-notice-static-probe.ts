import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const UNLOCK_MODAL_TS = path.join(APP_ROOT, 'components/member-unlock-modal/index.ts');
const UNLOCK_MODAL_WXML = path.join(APP_ROOT, 'components/member-unlock-modal/index.wxml');

const unlockModalTs = fs.readFileSync(UNLOCK_MODAL_TS, 'utf8');
const unlockModalWxml = fs.readFileSync(UNLOCK_MODAL_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '购买说明点击会打开弹层',
    /onExplainTap\(\)\s*\{[\s\S]*showPurchaseNotice:\s*true/.test(unlockModalTs),
  ],
  [
    '购买说明弹层包含分段内容数据',
    /const PURCHASE_NOTICE_SECTIONS[\s\S]*title:\s*'一、购买须知'[\s\S]*title:\s*'二、退款规则'/.test(unlockModalTs),
  ],
  [
    '购买说明弹层渲染标题与同意按钮',
    /class="purchase-notice-title">关于会员，我想了解<\/text>/.test(unlockModalWxml)
      && /class="purchase-notice-action"[\s\S]*>同意<\/view>/.test(unlockModalWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[member-unlock-purchase-notice-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`member unlock purchase notice static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-unlock-purchase-notice-static-probe] PASS all checks');
