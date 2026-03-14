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

const checks: ProbeCheck[] = [
  { filePath: TS_FILE, label: '购买说明弹窗状态', pattern: /showPurchaseExplainModal/ },
  { filePath: TS_FILE, label: '购买说明点击改为弹窗', pattern: /onExplainTap\(\)[\s\S]*showPurchaseExplainModal:\s*true/ },
  { filePath: TS_FILE, label: '购买说明关闭方法', pattern: /onClosePurchaseExplainModal\(\)/ },
  { filePath: WXML_FILE, label: '购买说明confirm-modal', pattern: /title="购买说明"/ },
  { filePath: WXML_FILE, label: '购买说明弹窗展示绑定', pattern: /show="\{\{showPurchaseExplainModal\}\}"/ },
  { filePath: WXML_FILE, label: '购买说明确认关闭绑定', pattern: /bind:confirm="onClosePurchaseExplainModal"/ },
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
  console.log(`[member-center-purchase-explain-static-probe] checked=${checks.length} passed=${passed} failed=${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`member center purchase explain static probe failed: ${failed.length} checks missing`);
  }

  checks.forEach((item) => console.log(`  PASS ${item.label}`));
  console.log('[member-center-purchase-explain-static-probe] PASS all checks');
}

run();
