import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PROFILE_EDIT_TS = path.join(APP_ROOT, 'pages/profile-edit/index.ts');
const PROFILE_EDIT_WXML = path.join(APP_ROOT, 'pages/profile-edit/index.wxml');
const PROFILE_EDIT_WXSS = path.join(APP_ROOT, 'pages/profile-edit/index.wxss');

const tsText = fs.readFileSync(PROFILE_EDIT_TS, 'utf8');
const wxmlText = fs.readFileSync(PROFILE_EDIT_WXML, 'utf8');
const wxssText = fs.readFileSync(PROFILE_EDIT_WXSS, 'utf8');

const hasTapEditorCell = (field: string): boolean => {
  const pattern = new RegExp(`<view[^>]*bindtap="onTextFieldTap"[^>]*data-field="${field}"[^>]*>`);
  const reversePattern = new RegExp(`<view[^>]*data-field="${field}"[^>]*bindtap="onTextFieldTap"[^>]*>`);
  return pattern.test(wxmlText) || reversePattern.test(wxmlText);
};

const checks: Array<[string, boolean]> = [
  ['称呼项改为点击弹层编辑', hasTapEditorCell('familyName')],
  ['职业项改为点击弹层编辑', hasTapEditorCell('occupation')],
  ['毕业院校项改为点击弹层编辑', hasTapEditorCell('school')],
  ['页面挂载文本编辑弹层结构', /text-editor-modal[\s\S]*onConfirmTextEditor/.test(wxmlText)],
  ['实现文本编辑入口与确认逻辑', /openTextEditor\(field: TextEditorField\)/.test(tsText) && /onConfirmTextEditor\(\)/.test(tsText)],
  ['称呼/职业热门选项存在', /const HOT_SURNAME_OPTIONS/.test(tsText) && /const HOT_OCCUPATION_OPTIONS/.test(tsText)],
  ['毕业院校联想建议逻辑存在', /getSchoolSuggestionList/.test(tsText) && /textEditorSuggestions/.test(tsText)],
  ['文本编辑弹层样式存在', /\.text-editor-modal/.test(wxssText) && /\.text-editor-hot-option/.test(wxssText)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[profile-edit-interaction-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`profile-edit interaction static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[profile-edit-interaction-static-probe] PASS all checks');
