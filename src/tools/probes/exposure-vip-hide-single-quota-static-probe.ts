import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const PAGE_WXML = path.join(APP_ROOT, 'pages/exposure/index.wxml');
const CONTROL_TS = path.join(APP_ROOT, 'components/pages/exposure/exposure-control/index.ts');
const CONTROL_WXML = path.join(APP_ROOT, 'components/pages/exposure/exposure-control/index.wxml');

const pageWxml = fs.readFileSync(PAGE_WXML, 'utf8');
const controlTs = fs.readFileSync(CONTROL_TS, 'utf8');
const controlWxml = fs.readFileSync(CONTROL_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '超级曝光页向曝光控制组件透传 isVip 状态',
    /<exposure-control[\s\S]*isVip="\{\{isVip\}\}"/.test(pageWxml),
  ],
  [
    '曝光控制组件在 isVip 下隐藏单次曝光剩余信息并停止倒计时',
    /isEnabled,\s*isVip,\s*exposureEndTime,\s*remainingSeconds/.test(controlTs)
      && /if \(isVip\) \{[\s\S]*this\.stopCountdown\(\)[\s\S]*showQuotaInfo:\s*false[\s\S]*return;/.test(controlTs),
  ],
  [
    '曝光控制组件次数和倒计时文案都受 showQuotaInfo 门控',
    /exposure-count\" wx:if=\"\{\{showQuotaInfo\}\}\"/.test(controlWxml)
      && /exposure-countdown\" wx:if=\"\{\{showQuotaInfo && showCountdown\}\}\"/.test(controlWxml),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[exposure-vip-hide-single-quota-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`exposure vip hide single quota static probe failed: ${failed.length} checks missing`);
}

console.log('[exposure-vip-hide-single-quota-static-probe] PASS all checks');
