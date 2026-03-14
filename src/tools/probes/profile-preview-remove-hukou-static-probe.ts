import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_PREVIEW_TS = path.join(APP_ROOT, 'pages/profile-preview/index.ts');

const profilePreviewTs = fs.readFileSync(PROFILE_PREVIEW_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '资料预览基础信息不再渲染户籍项',
    !/buildDisplayItem\('户籍'/.test(profilePreviewTs),
  ],
  [
    '资料预览基础信息保留现居字段',
    /buildDisplayItem\('现居',\s*currentCityText/.test(profilePreviewTs),
  ],
  [
    '资料预览基础信息保留家乡字段',
    /buildDisplayItem\('家乡',\s*hometownText/.test(profilePreviewTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[profile-preview-remove-hukou-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile preview remove hukou static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-preview-remove-hukou-static-probe] PASS all checks');
