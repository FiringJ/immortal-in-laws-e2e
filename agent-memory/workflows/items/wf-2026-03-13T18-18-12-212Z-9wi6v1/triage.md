# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 我收藏的页会员点击联系对方应先弹免费解锁聊天提示并按条件弹出联系方式
## Cleaned Problem
用户从“我的”进入“我收藏的”列表后，在会员身份下点击卡片上的“联系对方”。飞书反馈的当前线上行为是：直接完成解锁并跳转到私信页。期望行为是分成两步：

1. 首次点击“联系对方”时，先弹确认框，文案为“您是会员，可免费解锁和对方的聊天”。
2. 点击弹框按钮“立即解锁”后，再执行解锁，toast 提示“成功解锁联系方式”，随后立即跳转到私信会话页；如果解锁返回了联系方式，则在会话页底部弹出“xx家长联系方式/xxxxxxxxxxx”，如果没有联系方式则不弹。

归一化后的目标场景可定义为：`/pages/message-record/index?type=favorite&direction=me_to_other` 中，会员用户、与对方尚未建立可联系状态时，点击“联系对方”应先走“免费解锁聊天确认”分支，而不是直接完成解锁；确认后进入 `pages/chat/index`，并根据解锁接口返回结果决定是否自动展示联系方式底部弹层。

## Source Quality
- 原始反馈给出了明确入口（“我收藏的”）、用户身份（会员）、当前错误行为、目标弹框文案、确认后的 toast 文案、跳转目标页，以及“没有联系方式则不弹”的条件分支，核心事实足够完整。
- 工作项元数据包含飞书缺陷 ID `bug_6e4eb5547b71`、优先级 `P0`、反馈日期、提报人和来源链接，便于计划阶段继续回写和追踪。
- 缺少截图、录屏、复现账号以及接口样本，但这些不是进入计划阶段的硬阻塞，因为页面入口、交互分支和目标结果已经足够具体。

## Product Context
- “我收藏的”入口在 `pages/profile/index.ts:433`，跳转到 `pages/message-record/index?type=favorite&direction=me_to_other`，与本缺陷描述完全一致。
- `agent-memory/page-topology.md:29` 到 `agent-memory/page-topology.md:35` 将 `pages/chat/index` 定义为消息会话页，符合“解锁后进入私信”的产品边界。
- PRD 在 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:87` 到 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:101` 明确了两类相关能力：
  - “联系对方/打招呼”属于建立私信会话与聊天权限的流程；
  - “拨打电话”成功时需要底部弹出“xx家长联系方式/xxxxxxxxxxx”。
- 本缺陷把这两类体验组合到了“我收藏的 -> 联系对方”链路里：先确认“免费解锁聊天”，再进入私信页，并在有联系方式时补弹底部联系方式。因此它是记录页与聊天页联动的权限/落地体验问题，不是单一文案问题。

## Technical Context
- 记录页当前已对“我收藏的”做单独分支处理：`pages/message-record/index.ts:432` 到 `pages/message-record/index.ts:461` 中，若是 `favorite + me_to_other` 且用户是会员或仍有剩余解锁次数，会先设置 `showContactUnlockConfirm: true`，并不是无条件直接进私信。
- 但当前弹框文案与飞书目标不一致：`pages/message-record/index.ts:453` 到 `pages/message-record/index.ts:455` 使用的是“您是会员，可免费解锁并查看对方号码”，`pages/message-record/index.wxml:156` 到 `pages/message-record/index.wxml:167` 渲染了这个确认框。
- 当前确认后的处理仍在记录页内直接执行解锁：`pages/message-record/index.ts:495` 到 `pages/message-record/index.ts:529` 会调用 `unlockContact(...)`，toast “成功解锁联系方式”后直接 `navigateTo('/pages/chat/index?guestId=...')`。这条路径没有携带 `unlockPrompt=1` 或 `autoCall=1` 之类的上下文，也没有把返回的联系方式传给聊天页，因此无法满足“进入私信页后按条件自动弹出联系方式”的要求。
- 聊天页已经具备一部分可复用能力：
  - `pages/chat/index.ts:154` 到 `pages/chat/index.ts:165` 识别 `unlockPrompt` 和 `autoCall` 查询参数；
  - `pages/chat/index.ts:541` 到 `pages/chat/index.ts:568` 会根据 `pendingUnlockPrompt` 与 `pendingAutoCall` 决定是否自动弹出解锁提示或联系方式弹层；
  - `pages/chat/index.wxml:277` 到 `pages/chat/index.wxml:286` 已存在非常接近目标的确认框，文案为“您是会员可免费解锁和对方的聊天。”。
- 但聊天页当前的“确认解锁”后置动作也还没完全满足本缺陷：`pages/chat/index.ts:1278` 到 `pages/chat/index.ts:1322` 成功后 toast 是“成功解锁”，并且只更新 `counterpartyPhoneNumber` / `isUnlocked`，不会在解锁刚成功时自动再打开底部联系方式弹层。
- 服务层已具备判断条件所需数据：`services/record.ts:316` 到 `services/record.ts:343` 的 `unlockContact(...)` 会返回 `contact.phone`、`contact.phone_backup`、`contact.wechat` 和 `remainingQuota`，足以支持“有联系方式就弹、没有就不弹”的分支。
- 会员与可联系状态判断集中在 `store/memberStore.ts:173` 到 `store/memberStore.ts:321`，包括 `isMember()`、`getRemainingUnlockCount()`、`isUnlocked()`、`recordContact()` 和 `unlockGuest()`；计划阶段可以把它当作统一状态源，避免在页面里重复猜权限。
- 需要注意一个 triage 结论：飞书所说“当前点击联系对方会直接解锁并跳转”与当前 `HEAD` 源码并不完全一致。就仓库代码看，首层确认框已经存在；当前明显未对齐的是确认框文案、解锁动作落点、以及聊天页联系方式自动弹出行为。因此后续计划应先核对是否存在运行时构建产物/分支漂移，再做代码层修正。

## Missing Context
- 缺少截图或录屏，暂时无法判断飞书描述的“直接解锁并跳转”究竟是完全跳过了首层确认框，还是指“点击弹框确认后立刻解锁跳转”。
- 缺少复现账号与接口返回样本，尚不能确认解锁接口在该场景下是否稳定返回 `contact.phone`、`contact.phone_backup` 或仅返回微信号。
- 缺少对“进入私信页且底部弹出联系方式”交互细节的补充说明，例如是否要求自动拉起现有 `call-modal`、是否允许仅展示号码不显示“呼叫”动作，但这不阻碍进入计划阶段，因为已有现成的聊天页底部联系方式弹层可作为实现落点。
- 若线上行为与当前仓库源码不一致，计划阶段还需要补查是否存在未编译的 `.ts` 源与实际运行 `.js` 产物差异；不过这属于实现验证问题，不属于需求不清。

## Likely Surfaces
- `pages/message-record/index.ts`
- `pages/message-record/index.wxml`
- `pages/chat/index.ts`
- `pages/chat/index.wxml`
- `services/record.ts`
- `store/memberStore.ts`
- `components/pages/message-record/record-card/index.ts`

## Recommended Next Action
- 进入 `generate_plan`。该问题的入口页面、目标用户身份、当前与期望交互差异、服务层返回能力、以及主要代码落点都已足够明确，不需要额外人工澄清核心事实。
- 计划阶段建议优先覆盖四件事：
  1. 统一“我收藏的/会员/未建立联系”场景下的首层弹框文案和触发条件；
  2. 明确解锁动作究竟放在记录页执行后带参跳转，还是跳到聊天页后再复用 `unlockPrompt` 流程，只保留一条解锁主路径；
  3. 在解锁成功后，按接口返回的联系方式决定是否自动展示聊天页底部联系方式弹层，并统一 toast 文案；
  4. 验证已建立联系、无联系方式、非会员、剩余联系次数不足等邻接分支，避免修复时把现有的 `favorite` 特判或会员阻断逻辑带坏。
- 如果计划阶段发现当前运行环境确实会“直接解锁并跳转”而源码却已有首层确认框，应把“构建产物/分支漂移排查”列为第一步验证项。
