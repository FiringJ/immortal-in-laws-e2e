import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '撤回错误文案映射函数存在',
    /resolveRecallErrorMessage\(error: any\): string/.test(chatTs),
  ],
  [
    '撤回失败/withdraw failed 归并为“超出撤回时间”',
    /timeoutKeywords = \[[\s\S]*'withdraw failed'[\s\S]*'撤回失败'[\s\S]*\]/.test(chatTs)
      && /timeoutKeywords\.some\(keyword => errorMessage\.includes\(keyword\)\)[\s\S]*return '超出撤回时间';/.test(chatTs),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[chat-recall-timeout-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`chat recall timeout copy static probe failed: ${failed.length} checks missing`);
}

console.log('[chat-recall-timeout-copy-static-probe] PASS all checks');
