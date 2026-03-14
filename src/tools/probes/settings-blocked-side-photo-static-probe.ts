import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/settings-blocked/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/settings-blocked/index.wxml');
const WXSS_FILE = path.join(APP_ROOT, 'pages/settings-blocked/index.wxss');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');
const wxss = fs.readFileSync(WXSS_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['屏蔽列表右侧照片来源于 child.photos 而非家长头像', /const sidePhoto = child\.photos\?\.\[1\] \|\| child\.photos\?\.\[0\] \|\| ''/.test(ts)],
  ['头部头像与右侧照片分离（头部仍用 parent.avatar）', /const avatar = guest\.parent\?\.avatar\?\.trim\(\) \|\| child\.photos\?\.\[0\] \|\| DEFAULT_AVATAR;/.test(ts)],
  ['右侧照片渲染使用 sidePhoto 字段', /blocked-side-photo[\s\S]*src="\{\{item\.sidePhoto\}\}"/.test(wxml)],
  ['右侧照片在样式上做模糊与遮罩处理', /\.blocked-side-photo__img[\s\S]*filter:\s*blur\(2rpx\)/.test(wxss) && /\.blocked-side-photo__mask/.test(wxss)],
  ['屏蔽列表移除更多“···”图标', !/blocked-card__menu/.test(wxml)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-blocked-side-photo-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings blocked side photo static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-blocked-side-photo-static-probe] PASS all checks');
