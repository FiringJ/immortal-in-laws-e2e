import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_WXML = path.join(APP_ROOT, 'pages/message-record/index.wxml');
const MEMBER_CENTER_TS = path.join(APP_ROOT, 'pages/member-center/index.ts');

const recordTs = fs.readFileSync(RECORD_TS, 'utf8');
const recordWxml = fs.readFileSync(RECORD_WXML, 'utf8');
const memberCenterTs = fs.readFileSync(MEMBER_CENTER_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页声明联系次数不足弹窗状态', /showContactLimitModal:\s*false/.test(recordTs)],
  ['我收藏的非会员无次数时弹联系次数不足', /isMyFavoriteTab\s*&&\s*!memberStore\.isMember\(\)\s*&&\s*remainingUnlockCount\s*<=\s*0[\s\S]*showContactLimitModal:\s*true/.test(recordTs)],
  ['联系次数不足确认后跳会员中心黄金年卡', /onContactLimitConfirm\(\)[\s\S]*\/pages\/member-center\/index\?tab=gold&plan=year/.test(recordTs)],
  ['页面挂载联系次数不足弹窗文案', /show="\{\{showContactLimitModal\}\}"[\s\S]*title="联系次数不足"[\s\S]*subContent="开通会员无限解锁联系方式"/.test(recordWxml)],
  ['会员中心支持 plan=year 查询参数', /normalizeQueryPlan\(plan\?: string\)/.test(memberCenterTs)],
  ['会员中心按查询参数优先选择年度会员', /this\._queryPlan\s*===\s*'year'[\s\S]*annualPlan/.test(memberCenterTs)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[favorite-contact-limit-member-open-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`favorite contact limit/member open static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[favorite-contact-limit-member-open-static-probe] PASS all checks');
