import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_EDIT_TS = path.join(APP_ROOT, 'pages/profile-edit/index.ts');

const tsText = fs.readFileSync(PROFILE_EDIT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '无人脸/无效照片错误分支固定中文提示',
    /isInvalidPhoto[\s\S]*\?\s*'照片不符合要求，请点击更换'\s*:\s*\(rawErrorMessage\s*\|\|\s*'上传失败，请重试'\)/.test(tsText),
  ],
  [
    '无效照片仍设置 invalid 状态',
    /photoStatus:\s*isInvalidPhoto\s*\?\s*'invalid'\s*:\s*fallbackStatus/.test(tsText),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[profile-edit-photo-invalid-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile-edit photo invalid copy static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-edit-photo-invalid-copy-static-probe] PASS all checks');
