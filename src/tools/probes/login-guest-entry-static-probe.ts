import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const APP_TS = path.join(APP_ROOT, 'app.ts');

const appTs = fs.readFileSync(APP_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    'App.onShow 不再全局调用 ensureLogin 强制跳登录',
    /onShow\(\)\s*\{[\s\S]*refreshStores\(\);[\s\S]*syncFamilyContextIfNeeded\(\);/.test(appTs)
      && !/onShow\(\)\s*\{[\s\S]*ensureLogin\(\)/.test(appTs),
  ],
  [
    'app.ts 已移除无 token 时的全局 reLaunch 登录逻辑',
    !/ensureLogin\(\)\s*\{[\s\S]*wx\.reLaunch\(\{\s*url:\s*'\/pages\/login\/index'/.test(appTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[login-guest-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`login guest entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[login-guest-entry-static-probe] PASS all checks');
