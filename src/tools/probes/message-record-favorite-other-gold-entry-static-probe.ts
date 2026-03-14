import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const RECORD_TS = path.join(APP_ROOT, 'pages/message-record/index.ts');
const RECORD_WXML = path.join(APP_ROOT, 'pages/message-record/index.wxml');

const recordTs = fs.readFileSync(RECORD_TS, 'utf8');
const recordWxml = fs.readFileSync(RECORD_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '收藏我场景底部开通会员按钮直达黄金会员 tab',
    /onOpenVip\(\)\s*\{[\s\S]*recordType === RecordType\.FAVORITE[\s\S]*direction === RecordDirection\.OTHER_TO_ME[\s\S]*url:\s*'\/pages\/member-center\/index\?tab=gold'/.test(recordTs),
  ],
  [
    '收藏我非会员点击资料卡弹出查看受限提示弹框',
    /onRecordTap[\s\S]*showDetailRestrictedModal:\s*true/.test(recordTs),
  ],
  [
    '查看受限弹框文案与按钮为“好的”',
    /show="\{\{showDetailRestrictedModal\}\}"/.test(recordWxml)
      && /title="查看详细资料受限"/.test(recordWxml)
      && /content="平台严格保护用户隐私，开通会员方可查看对方详情"/.test(recordWxml)
      && /showCancel="\{\{false\}\}"/.test(recordWxml)
      && /confirmText="好的"/.test(recordWxml),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(
  `[message-record-favorite-other-gold-entry-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`
);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`message record favorite other gold entry static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[message-record-favorite-other-gold-entry-static-probe] PASS all checks');
