import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const API_MAPPER_TS = path.join(APP_ROOT, 'services/api-mapper.ts');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');

const apiMapperTs = fs.readFileSync(API_MAPPER_TS, 'utf8');
const chatTs = fs.readFileSync(CHAT_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '消息映射在缺失 can_withdraw 时保留 undefined（交给前端按时间窗判断）',
    /const rawCanWithdraw = item\?\.can_withdraw \?\? item\?\.canWithdraw;[\s\S]*rawCanWithdraw === undefined \|\| rawCanWithdraw === null[\s\S]*\? undefined/.test(apiMapperTs),
  ],
  [
    '撤回能力判断在 canWithdraw 缺失时回落到 2 分钟窗口',
    /canRecallMessage[\s\S]*if\s*\(typeof message\.canWithdraw === 'boolean'\)[\s\S]*return \(Date\.now\(\) - message\.createdAt\) <= 120000;/.test(chatTs),
  ],
  [
    '长按菜单在可撤回时仍会展示撤回动作',
    /onMessageLongPress[\s\S]*if\s*\(this\.canRecallMessage\(message\)\)\s*\{[\s\S]*actions\.push\(\{ key: 'recall', label: '撤回' \}\)/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[chat-voice-recall-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`chat voice recall static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-voice-recall-static-probe] PASS all checks');
