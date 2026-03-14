import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const MESSAGE_TS = path.join(APP_ROOT, 'pages/message/index.ts');
const API_MAPPER_TS = path.join(APP_ROOT, 'services/api-mapper.ts');
const GUEST_TYPES_TS = path.join(APP_ROOT, 'types/guest.ts');

const messageTs = fs.readFileSync(MESSAGE_TS, 'utf8');
const apiMapperTs = fs.readFileSync(API_MAPPER_TS, 'utf8');
const guestTypesTs = fs.readFileSync(GUEST_TYPES_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    'Guest 类型包含 matchId 字段',
    /interface Guest[\s\S]*matchId\?:\s*string/.test(guestTypesTs),
  ],
  [
    '会话目标对象映射会提取 match_id',
    /mapTargetChildToGuest[\s\S]*matchId:\s*pickFirstNonEmptyText[\s\S]*info\?\.match_id/.test(apiMapperTs),
  ],
  [
    '消息列表显示编号优先使用 guest.matchId',
    /displayId:\s*conv\.guest\.matchId\s*\|\|\s*\(conv\.guest\.id\s*\?\s*conv\.guest\.id\.slice\(-11\)\s*:\s*''\)/.test(messageTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[message-matchid-consistency-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`message matchId consistency static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[message-matchid-consistency-static-probe] PASS all checks');
