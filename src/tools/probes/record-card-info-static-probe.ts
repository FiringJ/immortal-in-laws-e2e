import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const CARD_FILE = path.join(APP_ROOT, 'components/pages/message-record/record-card/index.ts');
const MAPPER_FILE = path.join(APP_ROOT, 'services/api-mapper.ts');

const cardText = fs.readFileSync(CARD_FILE, 'utf8');
const mapperText = fs.readFileSync(MAPPER_FILE, 'utf8');

const checks: Array<[string, RegExp, string]> = [
  [
    '浏览/收藏记录启用年龄字段布局',
    /useRecordInfoWithAge\s*=\s*this\.data\.recordType\s*===\s*'favorite'[\s\S]*\|\|\s*this\.data\.recordType\s*===\s*'view'/,
    cardText,
  ],
  [
    '有照片布局包含年龄字段',
    /showPhoto[\s\S]*\?\s*\(useRecordInfoWithAge[\s\S]*\{\s*label:\s*'年龄',\s*value:\s*age\s*\}/,
    cardText,
  ],
  [
    '无照片布局包含年龄字段',
    /:\s*\(useRecordInfoWithAge[\s\S]*\{\s*label:\s*'年龄',\s*value:\s*age\s*\}[\s\S]*\{\s*label:\s*'现居'/,
    cardText,
  ],
  [
    '交互映射补齐相亲介绍别名',
    /matchmakingNote:\s*pickFirstNonEmptyText\([\s\S]*match_desc_label[\s\S]*child_detail\?\.match_desc_label[\s\S]*child_profile\?\.match_desc_label/,
    mapperText,
  ],
];

const failed = checks.filter(([, pattern, text]) => !pattern.test(text)).map(([label]) => label);

console.log(`[record-card-info-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach((item) => console.error(`  FAIL ${item}`));
  throw new Error(`record-card info static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[record-card-info-static-probe] PASS all checks');
