import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const GUEST_CARD_TS = path.join(APP_ROOT, 'components/guest-card/index.ts');

const ts = fs.readFileSync(GUEST_CARD_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  ['嘉宾卡抽取收入与职业文本字段', /const incomeText = child\.income \?/.test(ts) && /const occupationText = child\.occupation \|\| ''/.test(ts)],
  ['有照片卡片优先展示收入', /if \(hasPhoto\)[\s\S]*if \(incomeText\) \{[\s\S]*pushInfo\('收入', incomeText\)/.test(ts)],
  ['收入为空时回退展示职业', /if \(incomeText\) \{[\s\S]*\} else \{[\s\S]*pushInfo\('职业', occupationText\)/.test(ts)],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[guest-card-income-priority-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`guest card income priority static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[guest-card-income-priority-static-probe] PASS all checks');
