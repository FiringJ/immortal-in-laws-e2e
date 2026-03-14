import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/member-center/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/member-center/index.wxml');
const JSON_FILE = path.join(APP_ROOT, 'pages/member-center/index.json');

const checks: ProbeCheck[] = [
  { filePath: TS_FILE, label: '返回拦截逻辑', pattern: /shouldShowRetainModal\(\)/ },
  { filePath: TS_FILE, label: '返回时先弹挽留', pattern: /setData\(\{\s*showRetainModal:\s*true\s*\}\)/ },
  { filePath: TS_FILE, label: '挽留确认后离开', pattern: /onRetainLeave\(\)[\s\S]*leavePage\(\)/ },
  { filePath: WXML_FILE, label: '挽留弹框组件', pattern: /confirm-modal/ },
  { filePath: WXML_FILE, label: '挽留弹框展示绑定', pattern: /show="\{\{showRetainModal\}\}"/ },
  { filePath: WXML_FILE, label: '返回离开按钮文案', pattern: /忍痛离开/ },
  { filePath: JSON_FILE, label: '注册confirm-modal组件', pattern: /"confirm-modal"\s*:\s*"\/components\/confirm-modal\/index"/ },
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
  console.log(`[member-center-retain-static-probe] checked=${checks.length} passed=${passed} failed=${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`member center retain static probe failed: ${failed.length} checks missing`);
  }

  checks.forEach((item) => console.log(`  PASS ${item.label}`));
  console.log('[member-center-retain-static-probe] PASS all checks');
}

run();
