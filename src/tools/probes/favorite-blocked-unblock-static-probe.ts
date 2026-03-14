import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const API_MAPPER_TS = path.join(APP_ROOT, 'services/api-mapper.ts');
const RECORD_PAGE_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const GUEST_DETAIL_TS = path.join(APP_ROOT, 'pages/guest-detail/index.ts');
const SETTINGS_BLOCKED_TS = path.join(APP_ROOT, 'pages/settings-blocked/index.ts');

const apiMapperTs = fs.readFileSync(API_MAPPER_TS, 'utf8');
const recordPageTs = fs.readFileSync(RECORD_PAGE_TS, 'utf8');
const guestDetailTs = fs.readFileSync(GUEST_DETAIL_TS, 'utf8');
const settingsBlockedTs = fs.readFileSync(SETTINGS_BLOCKED_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '交互映射支持 target_child_id 回填 guestId，避免收藏我屏蔽对象缺失ID',
    /const childId = toStringId\([\s\S]*item\?\.target_child_id[\s\S]*targetChild\?\.target_child_id/.test(apiMapperTs),
  ],
  [
    '记录页屏蔽判断支持 record.guestId 与 cardGuest.id 双路径命中',
    /isRecordBlocked\(record:\s*RecordViewModel,\s*blockedIdSet:\s*Set<string>\)[\s\S]*blockedIdSet\.has\(guestId\)[\s\S]*blockedIdSet\.has\(cardGuestId\)/.test(recordPageTs),
  ],
  [
    '嘉宾详情页确认取消屏蔽后调用 unblockGuest 并清理本地屏蔽状态',
    /onConfirmUnblock\(\)[\s\S]*await unblockGuest\(guest\.id\)[\s\S]*clearGuestBlocked\(guest\.id\)/.test(guestDetailTs),
  ],
  [
    '屏蔽列表页确认取消屏蔽后调用 unblockGuest 并清理本地屏蔽状态',
    /onConfirmUnblock\(\)[\s\S]*await unblockGuest\(pendingUnblockGuestId\)[\s\S]*clearGuestBlocked\(pendingUnblockGuestId\)/.test(settingsBlockedTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-blocked-unblock-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite blocked unblock static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-blocked-unblock-static-probe] PASS all checks');
