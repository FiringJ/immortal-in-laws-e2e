import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/settings-orders/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/settings-orders/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '订单时间文案不再包含支付时间/创建时间前缀',
    /const timeText = formatOrderTime\(order\.paidAt \|\| order\.createdAt\)/.test(ts),
  ],
  [
    '金额文案移除元后缀，仅保留符号和数值',
    /const amountText = `\$\{amountPrefix\}\$\{Number\.isInteger\(normalizedAmount\) \? normalizedAmount : normalizedAmount\.toFixed\(2\)\}`/.test(ts),
  ],
  [
    '空态文案更新为暂时没有订单记录哦',
    /text="暂时没有订单记录哦"/.test(wxml),
  ],
  [
    '空态底部新增订单问题联系管家按钮',
    /订单问题 联系管家/.test(wxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-orders-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings orders copy static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-orders-copy-static-probe] PASS all checks');
