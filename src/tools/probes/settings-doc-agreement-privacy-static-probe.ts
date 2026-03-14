import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const SETTINGS_DOC_TS = path.join(APP_ROOT, 'pages/settings-doc/index.ts');

const ts = fs.readFileSync(SETTINGS_DOC_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '用户协议标题更新为神仙亲家协议抬头',
    /agreement:\s*\{[\s\S]*title:\s*'用户协议'[\s\S]*《神仙亲家用户协议》/.test(ts),
  ],
  [
    '用户协议包含接受条款与用户注册章节',
    /一、接受条款[\s\S]*二、用户注册/.test(ts),
  ],
  [
    '隐私政策标题更新为神仙亲家隐私政策抬头',
    /privacy:\s*\{[\s\S]*title:\s*'隐私政策'[\s\S]*《神仙亲家隐私政策》/.test(ts),
  ],
  [
    '隐私政策包含引言与信息收集章节',
    /一、引言[\s\S]*二、我们收集的个人信息及收集方式/.test(ts),
  ],
  [
    '用户协议和隐私政策导航栏标题为神仙亲家',
    /const navTitle = \(type === 'agreement' \|\| type === 'privacy'\) \? '神仙亲家' : doc\.title/.test(ts),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);
console.log(`[settings-doc-agreement-privacy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`settings doc agreement/privacy static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[settings-doc-agreement-privacy-static-probe] PASS all checks');
