import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const INVITE_TS = path.join(APP_ROOT, 'pages/invite/index.ts');
const INVITE_WXML = path.join(APP_ROOT, 'pages/invite/index.wxml');
const INVITE_WXSS = path.join(APP_ROOT, 'pages/invite/index.wxss');

const checks: ProbeCheck[] = [
  { filePath: INVITE_WXML, label: '分享领现金主标题', pattern: /分享领现金/ },
  { filePath: INVITE_WXML, label: '收益明细tab', pattern: /收益明细/ },
  { filePath: INVITE_WXML, label: '我的邀请tab', pattern: /我的邀请/ },
  { filePath: INVITE_WXML, label: '去提现按钮', pattern: /去提现/ },
  { filePath: INVITE_WXML, label: '活动规则弹窗', pattern: /reward-rule-mask/ },
  { filePath: INVITE_TS, label: '提现处理逻辑', pattern: /onWithdrawTap\(\)/ },
  { filePath: INVITE_TS, label: '收益tab切换逻辑', pattern: /onRewardTabTap\(/ },
  { filePath: INVITE_TS, label: '催认证逻辑', pattern: /onRemindVerifyTap\(/ },
  { filePath: INVITE_WXSS, label: '邀请有奖主容器样式', pattern: /\.invite-reward-card\s*\{/ },
  { filePath: INVITE_WXSS, label: '收益列表样式', pattern: /\.reward-list\s*\{/ },
];

const readCache = new Map<string, string>();

function readText(filePath: string): string {
  if (!readCache.has(filePath)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`missing file: ${filePath}`);
    }
    readCache.set(filePath, fs.readFileSync(filePath, 'utf8'));
  }
  return readCache.get(filePath) || '';
}

function run() {
  const failed: string[] = [];
  const passed: string[] = [];

  checks.forEach((check) => {
    const text = readText(check.filePath);
    if (check.pattern.test(text)) {
      passed.push(check.label);
    } else {
      failed.push(`${check.label} (${check.filePath})`);
    }
  });

  console.log(`[invite-reward-static-probe] checked=${checks.length} passed=${passed.length} failed=${failed.length}`);
  passed.forEach((item) => console.log(`  PASS ${item}`));

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`invite reward static probe failed: ${failed.length} checks missing`);
  }

  console.log('[invite-reward-static-probe] PASS all checks');
}

run();
