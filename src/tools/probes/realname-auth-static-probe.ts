import fs from 'node:fs';
import path from 'node:path';

interface ProbeCheck {
  filePath: string;
  label: string;
  pattern: RegExp;
}

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const REALNAME_TS = path.join(APP_ROOT, 'pages/realname-auth/index.ts');
const REALNAME_WXML = path.join(APP_ROOT, 'pages/realname-auth/index.wxml');

const checks: ProbeCheck[] = [
  { filePath: REALNAME_WXML, label: '实名认证页面文案', pattern: /实名认证/ },
  { filePath: REALNAME_TS, label: '自动重试延迟队列', pattern: /AUTO_RETRY_DELAYS_MS/ },
  { filePath: REALNAME_TS, label: '最终状态轮询队列', pattern: /FINAL_STATUS_POLL_DELAYS_MS/ },
  { filePath: REALNAME_TS, label: '延迟二次提交兜底', pattern: /LATE_SUBMIT_RETRY_DELAY_MS/ },
  { filePath: REALNAME_TS, label: '延迟提交开关判断', pattern: /allowLateSubmitRetry/ },
  { filePath: REALNAME_TS, label: '微信号校验失败自动重试策略', pattern: /shouldAutoRetryWechatMismatch/ },
  { filePath: REALNAME_TS, label: '完成态判定', pattern: /isVerificationCompleted/ },
];

const cache = new Map<string, string>();

function readText(filePath: string): string {
  if (!cache.has(filePath)) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`missing file: ${filePath}`);
    }
    cache.set(filePath, fs.readFileSync(filePath, 'utf8'));
  }
  return cache.get(filePath) || '';
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

  console.log(`[realname-auth-static-probe] checked=${checks.length} passed=${passed.length} failed=${failed.length}`);
  passed.forEach((item) => console.log(`  PASS ${item}`));

  if (failed.length > 0) {
    failed.forEach((item) => console.error(`  FAIL ${item}`));
    throw new Error(`realname auth static probe failed: ${failed.length} checks missing`);
  }

  console.log('[realname-auth-static-probe] PASS all checks');
}

run();
