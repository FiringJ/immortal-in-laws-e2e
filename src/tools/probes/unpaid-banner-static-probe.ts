import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const INDEX_TS = path.join(APP_ROOT, 'pages/index/index.ts');
const INDEX_WXML = path.join(APP_ROOT, 'pages/index/index.wxml');

const checks: ProbeCheck[] = [
  { filePath: INDEX_TS, label: '未支付横幅本地存储key', pattern: /UNPAID_BANNER_DISMISS_KEY/ },
  { filePath: INDEX_TS, label: '订单身份标识构建', pattern: /buildUnpaidOrderIdentity/ },
  { filePath: INDEX_TS, label: '读取本地关闭状态', pattern: /dismissedIdentity\s*=\s*storage\.getSync/ },
  { filePath: INDEX_TS, label: '关闭时写入本地状态', pattern: /storage\.setSync\(UNPAID_BANNER_DISMISS_KEY/ },
  { filePath: INDEX_TS, label: '根据本地状态计算隐藏', pattern: /hideUnpaidBanner\s*=\s*unpaidOrderCount\s*>\s*0\s*&&\s*dismissedIdentity\s*===\s*unpaidOrderIdentity/ },
  { filePath: INDEX_TS, label: '立即支付按钮处理逻辑', pattern: /onPayLatestOrderTap\(\)/ },
  { filePath: INDEX_TS, label: '拉起支付下单逻辑', pattern: /createOrder\(orderType,\s*this\.data\.unpaidOrderPlanType/ },
  { filePath: INDEX_WXML, label: '横幅展示条件含hideUnpaidBanner', pattern: /unpaidOrderCount\s*>\s*0\s*&&\s*!hideUnpaidBanner/ },
  { filePath: INDEX_WXML, label: '横幅标题使用最新订单标题', pattern: /home-unpaid-banner-title">\{\{unpaidOrderTitle/ },
  { filePath: INDEX_WXML, label: '立即支付按钮独立点击事件', pattern: /home-unpaid-banner-btn" bindtap="onPayLatestOrderTap"/ },
  { filePath: INDEX_WXML, label: '关闭按钮事件绑定', pattern: /catchtap="onCloseUnpaidBanner"/ },
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
  console.log(`[unpaid-banner-static-probe] checked=${checks.length} passed=${passed} failed=${failed.length}`);

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`unpaid banner static probe failed: ${failed.length} checks missing`);
  }

  checks.forEach((item) => console.log(`  PASS ${item.label}`));
  console.log('[unpaid-banner-static-probe] PASS all checks');
}

run();
