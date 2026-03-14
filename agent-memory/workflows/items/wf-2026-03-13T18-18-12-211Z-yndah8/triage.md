# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 我收藏的页非会员点击联系对方应提示联系次数不足并跳转黄金年度会员
## Cleaned Problem
用户从“我的”进入“我收藏的”列表后，在非会员且剩余联系次数不足的前提下，点击卡片上的“联系对方”。当前飞书反馈称页面弹出的是通用会员开通阻断弹层；期望行为是弹出文案为“联系次数不足 / 开通会员无限解锁联系方式”的确认弹框，并在点击“开通会员”后立即跳转到会员中心，默认选中黄金会员页签且预选年度会员套餐。

更具体的目标场景可归一化为：`/pages/message-record/index?type=favorite&direction=me_to_other` 中，非会员、无剩余联系次数、且与对方尚未建立可联系状态时，点击“联系对方”应走“联系次数不足”分支，而不是通用会员阻断/解锁大弹层分支。

## Source Quality
- 原始描述包含了入口场景（“我收藏的”）、用户身份（非会员）、当前错误行为、期望弹框文案以及点击后的目标落点，信息完整度较高。
- 飞书元数据包含缺陷 ID、优先级 P0、提报日期、提报人与来源链接，便于后续回写与追踪。
- 缺少复现账号、剩余联系次数实际值、截图/录屏，但不影响进入后续计划阶段，因为核心交互条件和目标行为已经足够明确。

## Product Context
- “我收藏的”入口来自“我的”页功能区：`pages/profile/index.ts:433` 会跳转到 `pages/message-record/index?type=favorite&direction=me_to_other`。
- 页面拓扑与结构文档均将 `pages/message-record/index` 定义为浏览/收藏/解锁记录页，将 `pages/member-center/index` 定义为会员中心页，符合本缺陷描述的页面边界。
- PRD 明确写到“联系对方”逻辑：先判断己方是否会员或剩余联系次数是否 >= 1；若两项都不满足，则跳会员权益页，并提示“联系次数不足 / 开通会员无限解锁联系方式”。见 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:87` 与 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:88`。
- 当前缺陷属于记录页里的精细化权限分流问题，不是会员中心本身的视觉问题；会员中心只负责承接跳转，并需默认落在黄金会员年度套餐。

## Technical Context
- 记录页在加载时会并行刷新会员状态与会员权益：`pages/message-record/index.ts:101` 到 `pages/message-record/index.ts:116`。
- 当前源码中，`pages/message-record/index.ts:432` 到 `pages/message-record/index.ts:465` 已对“我收藏的”场景做了单独分支：
  - 若已建立联系，直接进私信；
  - 若非会员且 `remainingUnlockCount <= 0`，则 `setData({ showContactLimitModal: true })`；
  - 若是会员或还有剩余次数，则弹出解锁确认框；
  - 只有未命中上述“我收藏的”专用分支时，才会回退到通用 `member-unlock-modal`。
- 记录页模板中也已存在目标弹框文案和目标跳转：
  - `pages/message-record/index.wxml:170` 到 `pages/message-record/index.wxml:181` 配置了 `title="联系次数不足"`、`subContent="开通会员无限解锁联系方式"`、`confirmText="开通会员"`；
  - `pages/message-record/index.ts:574` 到 `pages/message-record/index.ts:578` 会在确认后跳转到 `/pages/member-center/index?tab=gold&plan=year`。
- 会员中心支持该 query 语义：`pages/member-center/index.ts:238` 到 `pages/member-center/index.ts:240` 识别 `plan=year`，`pages/member-center/index.ts:363` 到 `pages/member-center/index.ts:366` 会优先选中年度黄金会员套餐。
- 免费联系次数（剩余解锁次数）来源于 `interaction/unlock-quota`：`services/member.ts:21` 到 `services/member.ts:56` 将会员状态与剩余次数合并为 `MemberBenefits`，`services/record.ts:303` 到 `services/record.ts:310` 实际读取 `remaining_quota`。
- 因此，从当前仓库源码看，目标行为已经被显式实现；若线上/当前运行环境仍出现“会员开通阻断弹框”，更像是运行时状态、构建产物或分支版本与源码不一致，而不是需求不清。

## Missing Context
- 缺少稳定复现账号与接口样本，暂时无法确认复现时 `membership/status` 与 `interaction/unlock-quota` 的实际返回值。
- 缺少“当前弹出的具体弹层”截图；需要确认是 `member-unlock-modal` 还是别处复用的 `block-dialog`，因为飞书描述用语偏产品语义，未精确到组件名。
- 缺少运行包版本/分支信息；当前仓库源码已含目标分支，需确认缺陷来自线上旧包、开发工具缓存、未重新编译的 JS 产物，还是另一个入口复用了错误逻辑。
- 缺少是否“曾建立过联系”的现场数据；若 `cardGuest.canContact`、本地 `contacted_guests` 或本地 `unlock_records` 状态异常，也会改变分支命中结果。

## Likely Surfaces
- `pages/message-record/index.ts`：核心分流逻辑、会员状态初始化、弹框开关与跳转都在这里，是首要排查面。
- `pages/message-record/index.wxml`：目标“联系次数不足”弹框文案和按钮绑定在这里，需要确认运行时模板是否与源码一致。
- `store/memberStore.ts`：`isMember()`、`getRemainingUnlockCount()`、`hasContacted()`、`isUnlocked()` 决定是否进入收藏页专用分支。
- `services/member.ts` 与 `services/record.ts`：负责拼装会员权益和读取 `remaining_quota`，若接口映射或返回值异常，会导致页面误判。
- `pages/member-center/index.ts`：负责承接 `tab=gold&plan=year`，虽然不是根因面，但属于验收链路必检点。
- 构建/运行产物：当前源码已包含目标逻辑，需把“代码已修但运行包未生效/非当前分支”作为高优先排查项。

## Recommended Next Action
建议进入 `generate_plan`。

后续计划应优先按以下方向执行：
- 先在 `我收藏的` 场景下精确复现，并记录触发时的 `recordType`、`direction`、`memberStore.isMember()`、`remainingUnlockCount`、`currentRecord.cardGuest.canContact`。
- 核对运行环境是否真在执行当前源码：必要时确认微信开发者工具是否使用最新构建产物，并排除旧包/缓存问题。
- 若源码与运行结果不一致，优先排查 `memberStore.refreshBenefits()` 的时序、`unlock-quota` 返回值映射、以及“我收藏的”按钮事件是否误走了其他入口。
- 若确认是当前源码仍能复现，再补最小回归覆盖，锁定“非会员 + 0 次额度 + 我收藏的 -> 联系次数不足弹框 -> 会员中心黄金年度会员”的完整链路。
