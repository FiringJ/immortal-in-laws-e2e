import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const MESSAGE_TS = path.join(APP_ROOT, 'pages/message/index.ts');

const messageTs = fs.readFileSync(MESSAGE_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '消息页精准查找入口读取筛选历史状态（含已保存条件）',
    /onFilterTap\(\)\s*\{[\s\S]*const hasFilterHistory = recommendStore\.getFilterResultList\(\)\.length > 0[\s\S]*recommendStore\.getFilterRequirements\(\)/.test(messageTs),
  ],
  [
    '已有筛选结果时跳转筛选结果页',
    /hasFilterHistory[\s\S]*url:\s*'\/pages\/filter-result\/index\?from=message'/.test(messageTs),
  ],
  [
    '无筛选结果时跳转精准查找页',
    /url:\s*'\/pages\/filter\/index\?from=message'/.test(messageTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[message-filter-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`message filter entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[message-filter-entry-static-probe] PASS all checks');
