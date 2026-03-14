import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const TS_FILE = path.join(APP_ROOT, 'pages/message-record/index.ts');
const WXML_FILE = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const ts = fs.readFileSync(TS_FILE, 'utf8');
const wxml = fs.readFileSync(WXML_FILE, 'utf8');

const checks: Array<[string, boolean]> = [
  ['记录页保留“查看详细资料受限”提示弹框', /title="查看详细资料受限"/.test(wxml)],
  [
    '更多按钮在看过我/收藏我非会员场景触发受限弹框',
    /shouldRedirectMoreToMemberCenter\s*=\s*!memberStore\.isMember\(\)[\s\S]*RecordDirection\.OTHER_TO_ME[\s\S]*RecordType\.VIEW[\s\S]*RecordType\.FAVORITE/.test(ts),
  ],
  [
    '更多按钮受限时记录跳转会员中心标记',
    /shouldRedirectMoreToMemberCenter[\s\S]*setData\(\{[\s\S]*showDetailRestrictedModal:\s*true,[\s\S]*detailRestrictedRedirectToMemberCenter:\s*true/.test(ts),
  ],
  ['受限弹框关闭后跳转黄金会员页', /onDetailRestrictedClose\(\)[\s\S]*\/pages\/member-center\/index\?tab=gold/.test(ts)],
  ['受限弹框确认沿用关闭处理逻辑', /onDetailRestrictedConfirm\(\)\s*\{\s*this\.onDetailRestrictedClose\(\);\s*\}/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[record-more-member-redirect-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`record more member redirect static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-more-member-redirect-static-probe] PASS all checks');
