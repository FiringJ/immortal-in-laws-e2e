import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = '/Users/firingj/Projects/immortal-in-laws';
const MEMBER_CENTER_TS = path.join(APP_ROOT, 'pages/member-center/index.ts');
const MEMBER_CENTER_WXML = path.join(APP_ROOT, 'pages/member-center/index.wxml');
const SUCCESS_MODAL_WXML = path.join(APP_ROOT, 'components/pages/member-center/member-center-success-modal/index.wxml');

const memberCenterTs = fs.readFileSync(MEMBER_CENTER_TS, 'utf8');
const memberCenterWxml = fs.readFileSync(MEMBER_CENTER_WXML, 'utf8');
const successModalWxml = fs.readFileSync(SUCCESS_MODAL_WXML, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '会员中心成功弹窗接收 success-text 属性',
    /<member-center-success-modal[\s\S]*success-text="\{\{successText\}\}"/.test(memberCenterWxml),
  ],
  [
    '成功等级根据实际购买 planId 推导，而不是直接使用 selectedTab',
    /resolveSuccessLevelByPlan\(planId: string\)[\s\S]*return planId\.includes\('supreme'\) \? 'supreme' : 'gold';/.test(memberCenterTs)
      && /const successLevel = this\.resolveSuccessLevelByPlan\(planId\);/.test(memberCenterTs),
  ],
  [
    '成功文案根据开通/升级和会员类型动态拼接',
    /buildSuccessText\(planId: string, statusBefore: MemberStatus \| null\)[\s\S]*成功\$\{action\}\$\{memberLabel\}/.test(memberCenterTs)
      && /const successText = this\.buildSuccessText\(planId, statusBefore\);/.test(memberCenterTs),
  ],
  [
    '成功弹窗文案优先渲染 successText',
    /\{\{successText \|\| \('恭喜你，成功开通' \+ \(successLevel === 'supreme' \? '至尊会员' : '黄金会员'\)\)\}\}/.test(successModalWxml),
  ],
];

const failed = checks.filter(([, pass]) => !pass);
console.log(`[member-center-success-copy-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
for (const [name, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'} - ${name}`);
}

if (failed.length > 0) {
  throw new Error(`member center success copy static probe failed: ${failed.length} checks missing`);
}

console.log('[member-center-success-copy-static-probe] PASS all checks');
