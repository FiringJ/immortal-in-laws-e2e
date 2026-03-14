import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const STORE_TS = path.join(APP_ROOT, 'store/recommendStore.ts');
const GUEST_SERVICE_TS = path.join(APP_ROOT, 'services/guest.ts');

const storeTs = fs.readFileSync(STORE_TS, 'utf8');
const guestServiceTs = fs.readFileSync(GUEST_SERVICE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '推荐仓库定义至尊推荐数量 26',
    /SUPREME_DAILY_RECOMMEND_SIZE\s*=\s*26/.test(storeTs),
  ],
  [
    '刷新每日推荐前会刷新会员状态',
    /refreshDailyRecommend\(\)[\s\S]*await memberStore\.refreshStatus\(\)/.test(storeTs),
  ],
  [
    '至尊会员请求 daily 接口会透传 size=26',
    /fetchDailyRecommendGuests\(\{\s*[\s\S]*size:\s*memberStore\.isSupremeMember\(\)\s*\?\s*SUPREME_DAILY_RECOMMEND_SIZE\s*:\s*undefined/.test(storeTs),
  ],
  [
    'daily 推荐服务支持 query 参数 page/size',
    /fetchDailyRecommendGuests\(\s*params:\s*\{\s*page\?: number;\s*size\?: number/.test(guestServiceTs),
  ],
  [
    'daily 推荐请求会把 page\/size 作为 query 传入',
    /request\.get<any>\(\s*'\/api\/v1\/recommend\/daily',[\s\S]*Object\.keys\(query\)\.length > 0 \? query : undefined/.test(guestServiceTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-daily-recommend-supreme-size-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home daily recommend supreme size static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-daily-recommend-supreme-size-static-probe] PASS all checks');
