import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_SERVICE_FILE = path.join(APP_ROOT, 'services/guest.ts');
const GUEST_DETAIL_FILE = path.join(APP_ROOT, 'pages/guest-detail/index.ts');

const guestService = fs.readFileSync(GUEST_SERVICE_FILE, 'utf8');
const guestDetail = fs.readFileSync(GUEST_DETAIL_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['取消屏蔽接口包含容错分支', /export async function unblockGuest\(guestId: string\): Promise<void>[\s\S]*catch \(error: any\)/.test(guestService)],
  ['取消屏蔽容错识别“未在屏蔽列表”类错误', /errorCode === 11316[\s\S]*not blocked[\s\S]*already unblocked/.test(guestService)],
  ['命中容错时按成功处理', /already unblocked, treating as success/.test(guestService)],
  ['详情页取消屏蔽仍走统一服务层 unblockGuest', /onConfirmUnblock\(\)[\s\S]*await unblockGuest\(guest\.id\)/.test(guestDetail)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-blocked-unblock-resilient-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`favorite blocked unblock resilient static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-blocked-unblock-resilient-static-probe] PASS all checks');
