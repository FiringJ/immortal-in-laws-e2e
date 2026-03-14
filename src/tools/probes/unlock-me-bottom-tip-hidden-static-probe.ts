import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['我解锁的页已移除“共解锁…位”底部提示文案', !/共解锁\{\{totalUnlockCount\}\}位/.test(wxml)],
  ['我解锁的页已移除“点击查看”底部入口', !/bindtap="onViewBlocked"/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[unlock-me-bottom-tip-hidden-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`unlock me bottom tip hidden static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-me-bottom-tip-hidden-static-probe] PASS all checks');
