import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_TS = path.join(APP_ROOT, 'pages/settings/index.ts');

const ts = fs.readFileSync(SETTINGS_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '个性化推荐已开启时先弹确认弹框',
    /if \(currentEnabled\)[\s\S]*wx\.showModal\([\s\S]*关闭个性化推荐/.test(ts),
  ],
  [
    '关闭弹框文案与需求一致',
    /关闭后，将不会再为您推荐个性化资料卡，卡片推荐精准度会下降/.test(ts),
  ],
  [
    '弹框点击取消不会触发关闭请求',
    /if \(!res\.confirm\)\s*\{\s*return;\s*\}/.test(ts),
  ],
  [
    '已关闭状态点击会直接开启并提示已开启个性化推荐',
    /updatePersonalizedRecommend\(true\)[\s\S]*已开启个性化推荐/.test(ts),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-recommend-confirm-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings recommend confirm static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-recommend-confirm-static-probe] PASS all checks');
