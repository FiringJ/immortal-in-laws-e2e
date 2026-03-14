import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_EDIT_TS = path.join(APP_ROOT, 'pages/profile-edit/index.ts');
const PROFILE_EDIT_WXML = path.join(APP_ROOT, 'pages/profile-edit/index.wxml');

const tsText = fs.readFileSync(PROFILE_EDIT_TS, 'utf8');
const wxmlText = fs.readFileSync(PROFILE_EDIT_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '首次无照片点击入口会优先弹出引导弹层',
    /onPhotoTap\(\)\s*\{[\s\S]*if\s*\(!this\.data\.photoUrl\s*&&\s*!this\.data\.photoPendingPath\)\s*\{[\s\S]*photoGuideVisible:\s*true[\s\S]*photoModalVisible:\s*false/.test(tsText),
  ],
  [
    '非首次场景仍保留原上传弹层入口',
    /onPhotoTap\(\)\s*\{[\s\S]*this\.openPhotoModal\(\)/.test(tsText),
  ],
  [
    '引导弹层包含从相册上传动作',
    /guide-modal[\s\S]*bindtap="onGuideUploadTap"/.test(wxmlText),
  ],
  [
    '引导弹层上传动作会自动拉起选图流程',
    /onGuideUploadTap\(\)\s*\{[\s\S]*this\.openPhotoModal\(true\)/.test(tsText),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[profile-edit-first-photo-guide-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile-edit first photo guide static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-edit-first-photo-guide-static-probe] PASS all checks');
