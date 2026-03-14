import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CONTROL_TS = path.join(APP_ROOT, 'components/pages/exposure/exposure-control/index.ts');
const CONTROL_WXML = path.join(APP_ROOT, 'components/pages/exposure/exposure-control/index.wxml');
const PAGE_WXML = path.join(APP_ROOT, 'pages/exposure/index.wxml');

const controlTs = fs.readFileSync(CONTROL_TS, 'utf8');
const controlWxml = fs.readFileSync(CONTROL_WXML, 'utf8');
const pageWxml = fs.readFileSync(PAGE_WXML, 'utf8');

const checks: Array<[string, RegExp, string]> = [
  ['控制组件声明 remainingSeconds 属性', /remainingSeconds:\s*\{\s*type:\s*Number[\s\S]*value:\s*0/s, controlTs],
  ['观察器在关闭时保留暂停倒计时文本', /isEnabled,\s*exposureEndTime,\s*remainingSeconds[\s\S]*pausedMs[\s\S]*formatCountdown\(pausedMs\)/s, controlTs],
  ['倒计时展示条件改为 showCountdown', /wx:if="\{\{showCountdown\}\}"/, controlWxml],
  ['页面向控制组件透传 remainingSeconds', /<exposure-control[\s\S]*remainingSeconds="\{\{remainingSeconds\}\}"/s, pageWxml],
];

const failed = checks.filter(([, pattern, text]) => !pattern.test(text)).map(([label]) => label);
console.log(`[exposure-countdown-pause-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`exposure countdown pause static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[exposure-countdown-pause-static-probe] PASS all checks');
