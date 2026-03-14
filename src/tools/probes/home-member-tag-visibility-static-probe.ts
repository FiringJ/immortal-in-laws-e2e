import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CARD_TS = path.join(APP_ROOT, 'components/guest-card/index.ts');
const CARD_WXML = path.join(APP_ROOT, 'components/guest-card/index.wxml');

const cardTs = fs.readFileSync(CARD_TS, 'utf8');
const cardWxml = fs.readFileSync(CARD_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员标签仅在 isMember 为 true 时加入 badges',
    /if \(guest\.isMember\)[\s\S]*badges\.push\([\s\S]*type:\s*'member'[\s\S]*text:\s*guest\.memberLevel \|\| '会员'/.test(cardTs),
  ],
  [
    '实名标签仍在 isRealnameVerified 为 true 时加入 badges',
    /if \(guest\.isRealnameVerified\)[\s\S]*type:\s*'realname'[\s\S]*text:\s*'已实名'/.test(cardTs),
  ],
  [
    '卡片模板渲染 badges 容器',
    /card-badges" wx:if="\{\{badges\.length > 0\}\}"/.test(cardWxml),
  ],
  [
    '会员/实名标签通过类型 class 渲染',
    /class="card-badge card-badge-\{\{item\.type\}\}"/.test(cardWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[home-member-tag-visibility-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`home member tag visibility static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[home-member-tag-visibility-static-probe] PASS all checks');
