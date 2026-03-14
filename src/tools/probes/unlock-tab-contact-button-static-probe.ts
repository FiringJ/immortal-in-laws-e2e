import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const text = fs.readFileSync(HELPERS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['联系方式按钮默认文案为“联系对方”', /const contactButton\s*=\s*\{[\s\S]*text:\s*'联系对方'/.test(text)],
  ['解锁记录仅过期场景显示“已过期”禁用态', /shouldApplyUnlockExpiry[\s\S]*isExpired[\s\S]*contactButton\.text\s*=\s*'已过期'/.test(text)],
  ['解锁记录不再设置“已解锁”按钮文案', !/contactButton\.text\s*=\s*'已解锁'/.test(text)],
  ['解锁记录不再切换到 unlocked 按钮态', !/contactButton\.variant\s*=\s*'unlocked'/.test(text)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[unlock-tab-contact-button-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`unlock tab contact button static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[unlock-tab-contact-button-static-probe] PASS all checks');
