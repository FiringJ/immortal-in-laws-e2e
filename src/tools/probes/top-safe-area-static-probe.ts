import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const NAVBAR_WXSS = path.join(APP_ROOT, 'components/custom-navbar/index.wxss');
const PROFILE_WXSS = path.join(APP_ROOT, 'pages/profile/index.wxss');
const INVITE_WXSS = path.join(APP_ROOT, 'pages/invite/index.wxss');

const checks: ProbeCheck[] = [
  { filePath: NAVBAR_WXSS, label: '通顶导航默认背景', pattern: /\.custom-navbar\s*\{[\s\S]*background:\s*linear-gradient/ },
  { filePath: NAVBAR_WXSS, label: '通顶导航毛玻璃', pattern: /backdrop-filter:\s*blur/ },
  { filePath: NAVBAR_WXSS, label: '通顶导航底部分隔线', pattern: /border-bottom:\s*1rpx\s*solid/ },
  { filePath: PROFILE_WXSS, label: '我的页右侧胶囊安全间距', pattern: /\.topbar-content\s*\{[\s\S]*padding:\s*0\s*180rpx\s*0\s*30rpx/ },
  { filePath: INVITE_WXSS, label: '邀请页右侧胶囊安全间距', pattern: /\.topbar-content\s*\{[\s\S]*padding:\s*0\s*180rpx\s*0\s*24rpx/ },
];

function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing file: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function run() {
  const failed: string[] = [];

  checks.forEach((check) => {
    const text = readText(check.filePath);
    if (!check.pattern.test(text)) {
      failed.push(`${check.label} (${check.filePath})`);
    }
  });

  const passed = checks.length - failed.length;
  console.log(`[top-safe-area-static-probe] checked=${checks.length} passed=${passed} failed=${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`top safe area static probe failed: ${failed.length} checks missing`);
  }

  checks.forEach((item) => console.log(`  PASS ${item.label}`));
  console.log('[top-safe-area-static-probe] PASS all checks');
}

run();
