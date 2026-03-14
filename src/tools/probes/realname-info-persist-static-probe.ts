import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const USER_SERVICE = path.join(APP_ROOT, 'services/user.ts');
const REALNAME_PAGE = path.join(APP_ROOT, 'pages/realname-auth/index.ts');

const checks: ProbeCheck[] = [
  { filePath: USER_SERVICE, label: '读取实名认证缓存', pattern: /cachedInfo\s*=\s*storage\.getSync<RealnameInfo>/ },
  { filePath: USER_SERVICE, label: '姓名回退到缓存', pattern: /if\s*\(!realName\s*&&\s*cachedInfo\?\.realName\)/ },
  { filePath: USER_SERVICE, label: '身份证回退到缓存', pattern: /if\s*\(!idCard\s*&&\s*cachedInfo\?\.idCard\)/ },
  { filePath: USER_SERVICE, label: '认证时间回退到缓存', pattern: /verifiedAt\s*=\s*parseNumberField[\s\S]*cachedInfo\?\.verifiedAt/ },
  { filePath: REALNAME_PAGE, label: '仅未认证时清理实名缓存', pattern: /if\s*\(realnameInfo\s*&&\s*!profile\?\.isRealnameVerified\)/ },
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
  console.log(`[realname-info-persist-static-probe] checked=${checks.length} passed=${passed} failed=${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`realname info persist static probe failed: ${failed.length} checks missing`);
  }

  checks.forEach((item) => console.log(`  PASS ${item.label}`));
  console.log('[realname-info-persist-static-probe] PASS all checks');
}

run();
