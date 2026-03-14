import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['私信上下文菜单仍然支持撤回动作', /actions\.push\(\{ key: 'recall', label: '撤回' \}\)/.test(chatTs)],
  ['撤回能力优先遵循后端 canWithdraw 字段', /if \(typeof message\.canWithdraw === 'boolean'\) \{[\s\S]*return message\.canWithdraw;/.test(chatTs)],
  ['后端未返回 canWithdraw 时不再使用本地 2 分钟硬限制', /canRecallMessage\([\s\S]*return true;/.test(chatTs) && !/120000/.test(chatTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[chat-recall-window-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`chat recall window static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-recall-window-static-probe] PASS all checks');
