import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(__dirname, '../../../../immortal-in-laws');
const UNLOCK_MODAL_TS = path.join(APP_ROOT, 'components/member-unlock-modal/index.ts');

const unlockModalTs = fs.readFileSync(UNLOCK_MODAL_TS, 'utf8');

const checks: Array<[string, boolean]> = [
  [
    '权益标题文案覆盖季度/年度/不限时/至尊四个档位',
    /季度会员尊享6大特权/.test(unlockModalTs)
      && /年度会员尊享6大特权/.test(unlockModalTs)
      && /不限时会员尊享6大特权/.test(unlockModalTs)
      && /至尊会员尊享12大特权/.test(unlockModalTs),
  ],
  [
    '至尊档位判定包含至尊选项卡与至尊类型套餐',
    /activePlan\.isSupremeOption\s*\|\|\s*activePlan\.raw\.type === MemberLevel\.SUPREME/.test(unlockModalTs),
  ],
  [
    '黄金档位文案根据套餐时长分支切换',
    /duration <= 0[\s\S]*不限时会员尊享6大特权[\s\S]*duration >= 330[\s\S]*年度会员尊享6大特权[\s\S]*季度会员尊享6大特权/.test(unlockModalTs),
  ],
  [
    '套餐切换后会刷新权益标题',
    /updateFooter\(\)[\s\S]*benefitTitle:\s*this\.getBenefitTitle\('gold',\s*selectedPlan\)/.test(unlockModalTs),
  ],
  [
    'tab 切换和弹窗打开时按当前套餐重算权益标题',
    /benefitTitle:\s*this\.getBenefitTitle\(tab,\s*this\.data\.selectedPlan\)/.test(unlockModalTs),
  ],
];

const failed = checks.filter(([, ok]) => !ok).map(([label]) => label);

console.log(`[member-unlock-benefit-title-tier-static-probe] checked=${checks.length} passed=${checks.length - failed.length} failed=${failed.length}`);
if (failed.length > 0) {
  failed.forEach(item => console.error(`  FAIL ${item}`));
  throw new Error(`member unlock benefit title tier static probe failed: ${failed.length} checks missing`);
}
checks.forEach(([label]) => console.log(`  PASS ${label}`));
console.log('[member-unlock-benefit-title-tier-static-probe] PASS all checks');
