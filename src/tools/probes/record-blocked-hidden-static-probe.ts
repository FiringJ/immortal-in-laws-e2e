import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const PAGE_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_SERVICE_TS = path.join(APP_ROOT, 'services/record.ts');
const HELPERS_TS = path.join(APP_ROOT, 'pages/message-record/helpers.ts');

const pageTs = fs.readFileSync(PAGE_TS, 'utf8');
const recordServiceTs = fs.readFileSync(RECORD_SERVICE_TS, 'utf8');
const helpersTs = fs.readFileSync(HELPERS_TS, 'utf8');

const run = async () => {
  const checks: Array<[string, boolean]> = [
    ['记录页引入 isGuestBlocked 判断', /isGuestBlocked/.test(pageTs)],
    ['记录页存在屏蔽列表兜底同步方法', /async\s+refreshBlockedGuestIdSet\(\)/.test(pageTs) && /fetchBlockedList\(currentPage,\s*pageSize\)/.test(pageTs)],
    ['记录页屏蔽列表支持按页大小持续拉取', /for\s*\(let\s+currentPage\s*=\s*0;[\s\S]*currentPage\s*<\s*maxPages/.test(pageTs) && /pageResult\.list\.length\s*<\s*pageSize/.test(pageTs)],
    ['记录页屏蔽总数兼容字符串 total', /const\s+parsedTotal\s*=\s*Number\(pageResult\.total\)/.test(pageTs) && /Number\.isFinite\(parsedTotal\)/.test(pageTs)],
    ['记录页使用统一屏蔽判断函数过滤列表', /isRecordBlocked\(record:\s*RecordViewModel,\s*blockedIdSet:\s*Set<string>\)/.test(pageTs) && /filter\(item => !this\.isRecordBlocked\(item,\s*blockedIdSet\)\)/.test(pageTs)],
    ['记录页屏蔽判断包含 guestId 与 cardGuest.id 双兜底', /blockedIdSet\.has\(guestId\)/.test(pageTs) && /record\.cardGuest\?\.id/.test(pageTs)],
    ['记录映射保留后端 isBlocked 字段（浏览记录）', /buildViewRecords[\s\S]*isBlocked:\s*guest\.isBlocked/.test(recordServiceTs)],
    ['记录映射保留后端 isBlocked 字段（收藏记录）', /buildFavoriteRecords[\s\S]*isBlocked:\s*guest\.isBlocked/.test(recordServiceTs)],
    ['记录映射保留后端 isBlocked 字段（解锁记录）', /buildUnlockRecords[\s\S]*isBlocked:\s*guest\.isBlocked/.test(recordServiceTs)],
    ['记录卡片 guest 数据支持 isBlocked 透传', /RecordGuest\s*=\s*\{[\s\S]*isBlocked\?:\s*boolean/.test(helpersTs) && /isBlocked:\s*Boolean\(guest\?\.isBlocked\)/.test(helpersTs)],
  ];

  const { mapInteractionItemToGuestSummary } = await import(pathToFileURL(path.join(APP_ROOT, 'services/api-mapper.ts')).href);
  const mappedByTargetChild = mapInteractionItemToGuestSummary({
    target_child: {
      child_id: 3079540,
      family_id: 8801,
      can_contact: 1,
      is_blocked: 1,
      parent_info: {
        family_id: 8801,
        family_name: '王',
        identity: '妈妈',
      },
      child_profile: {
        birth_year: 1996,
      },
    },
  });

  checks.push(['交互映射支持 target_child 结构提取 guestId', mappedByTargetChild.id === '3079540' && mappedByTargetChild.childId === '3079540']);
  checks.push(['交互映射支持 target_child 屏蔽态识别', mappedByTargetChild.isBlocked === true]);
  checks.push(['交互映射支持 target_child 联系权限透传', mappedByTargetChild.canContact === true]);

  const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
  console.log(`[record-blocked-hidden-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
  if (failed.length > 0) {
    failed.forEach(item => console.error(`  FAIL ${item}`));
    throw new Error(`record blocked hidden static probe failed: ${failed.length} checks missing`);
  }
  checks.forEach(([label]) => console.log(`  PASS ${label}`));
  console.log('[record-blocked-hidden-static-probe] PASS all checks');
};

run().catch((error) => {
  console.error('[record-blocked-hidden-static-probe] runtime failure:', error);
  process.exit(1);
});
