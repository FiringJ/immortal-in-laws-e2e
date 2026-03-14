import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_EDIT_TS = path.join(APP_ROOT, 'pages/profile-edit/index.ts');
const FAMILY_NAME_TS = path.join(APP_ROOT, 'pages/profile-edit-family-name/index.ts');
const FAMILY_NAME_WXML = path.join(APP_ROOT, 'pages/profile-edit-family-name/index.wxml');

const profileEditTs = fs.readFileSync(PROFILE_EDIT_TS, 'utf8');
const familyNameTs = fs.readFileSync(FAMILY_NAME_TS, 'utf8');
const familyNameWxml = fs.readFileSync(FAMILY_NAME_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  ['称呼字段点击改为跳转独立填写页', /if \(field === 'familyName'\)[\s\S]*openFamilyNameEditor\(\)/.test(profileEditTs) && /\/pages\/profile-edit-family-name\/index/.test(profileEditTs)],
  ['填写页完成后通过 eventChannel 回传称呼', /eventChannel\.on\('confirmFamilyName'/.test(profileEditTs) && /form\.familyName/.test(profileEditTs)],
  ['称呼填写页包含“请问您贵姓”标题', /请问您贵姓\?/.test(familyNameWxml)],
  ['称呼填写页包含热门姓氏选择区', /热门姓氏/.test(familyNameWxml) && /hotOptions/.test(familyNameWxml)],
  ['称呼填写页点击完成会回传并返回', /onConfirmTap\(\)[\s\S]*eventChannel\.emit\('confirmFamilyName'/.test(familyNameTs) && /wx\.navigateBack\(\)/.test(familyNameTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[profile-edit-family-name-page-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`profile edit family name page static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-edit-family-name-page-static-probe] PASS all checks');
