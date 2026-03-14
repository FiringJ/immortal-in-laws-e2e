import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CHAT_TS = path.join(APP_ROOT, 'pages/chat/index.ts');
const MEMBER_STORE_TS = path.join(APP_ROOT, 'store/memberStore.ts');
const API_MAPPER_TS = path.join(APP_ROOT, 'services/api-mapper.ts');

const chatTs = fs.readFileSync(CHAT_TS, 'utf8');
const memberStoreTs = fs.readFileSync(MEMBER_STORE_TS, 'utf8');
const apiMapperTs = fs.readFileSync(API_MAPPER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    'memberStore.canContact 支持后端 canContact 直通放行',
    /guest\.canContact\s*===\s*true[\s\S]*return\s+true/.test(memberStoreTs),
  ],
  [
    '会话目标对象映射保留 can_contact 字段',
    /mapTargetChildToGuest[\s\S]*rawCanContact[\s\S]*canContact,/.test(apiMapperTs),
  ],
  [
    'chat 解锁状态优先尊重会话级 canContact',
    /updateUnlockState[\s\S]*conversation\.guest\?\.canContact\s*===\s*true[\s\S]*\|\|[\s\S]*memberStore\.canContact/.test(chatTs),
  ],
  [
    'chat 合并 guestDetail 时保留已存在 canContact',
    /preservedCanContact[\s\S]*canContact:\s*typeof guestDetail\.canContact === 'boolean'[\s\S]*:\s*preservedCanContact/.test(chatTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[chat-established-contact-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`chat established contact static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[chat-established-contact-static-probe] PASS all checks');
