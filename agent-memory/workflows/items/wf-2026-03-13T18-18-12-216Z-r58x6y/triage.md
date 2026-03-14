# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 解锁我 tab 取消会员阻断并保留 24 小时免费查看提醒文案
## Cleaned Problem
- 本缺陷对应 `pages/message-record/index` 的“解锁我”tab（`recordType=unlock` + `direction=other_to_me`），属于消息记录页，不是普通消息列表页。
- 飞书描述和附件说明的是一次明确的需求变更：只要任一方已经解锁过对方，就视为双方已具备发起聊天的前置条件；在“解锁我”tab 内，不再因为“我方当前不是会员”而阻断进入详情或私信。
- 期望交互被清晰拆成两条：点击卡片主体、卡片空白区或“详细资料/照片”按钮，统一进入 `pages/guest-detail/index`；点击“联系对方”按钮，统一进入 `pages/chat/index` 私信会话页。
- 附件还补充了一个重要约束：`24 小时内免费查看 xx:xx:xx` 这条顶部提醒文案要继续保留，作为引导点击的提示语；但它不应再作为 24 小时后禁止查看/联系的真实权限开关。
- 当前仓库内的 PRD 仍保留旧版逻辑：非会员仅在“对方 24 小时内解锁我”或“任一方发过私信”时放行。因此本飞书缺陷应视为对仓库 PRD 的新覆盖，而不是仅仅“代码没照旧 PRD 做”。

## Source Quality
- 质量判断：`high`。
- 原始信息虽然标题被截断，但正文把目标 tab、触发条件、详情/联系两个点击分支，以及“24 小时提醒文案保留但权限不受限”都讲清楚了。
- 附件不是模糊的 UI 截图，而是带红框标注的需求说明截图，直接给出了新规则，并对旧规则做了删除线标记，足以作为本次 triage 的最新产品依据。
- 仓库中也能找到可交叉验证的旧版 PRD、记录页代码和聊天页代码，因此问题范围已经收敛到具体页面与权限链路。

## Product Context
- 页面入口来自消息 tab 的金刚区：`pages/message/index` 点击“解锁我的”进入 `pages/message-record/index?type=unlock&direction=other_to_me`，这一点与 `agent-memory/page-topology.md` 和当前代码结构一致。
- `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 中“解锁我”一节仍是旧版规则：非会员只有在“24 小时内被解锁”或“双方有过私信”时才放行；而本缺陷附件明确要求改成“当前 tab 无会员阻断”，说明这是一次产品规则更新。
- “会话即生成”不仅影响记录页卡片点击结果，也影响消息 tab 的会话列表是否能及时出现对应会话，因此该问题不是单页按钮跳转文案问题，而是“记录页 → 会话创建 → 聊天页权限”这条链路的需求变更。
- “24 小时内免费查看”文案在新版规则里更像增长提示文案，而不是硬权限条件；也就是说，倒计时展示与真实可否查看/聊天需要解耦。

## Technical Context
- 前端记录页的本地会员阻断逻辑主要在 `pages/message-record/index.ts`：
  - `onRecordTap()` 目前只对“看过我/收藏我”的非会员做拦截，`解锁我` tab 本地点击详情已不会走会员弹框。
  - `onContactTap()` 在 `recordType === unlock` 时会直接 `navigateTo('/pages/chat/index?guestId=...')`，本地也没有再做会员校验。
- 但前端仍保留了旧的 24 小时有效期语义，集中在 `pages/message-record/helpers.ts` 和 `services/record.ts`：
  - `buildRecordViewModel()` 对 `解锁我` tab 仍启用 `shouldApplyUnlockExpiry`，会把顶部文案渲染成“解锁我 · xx小时后过期 / 已过期”；
  - 同一逻辑还会在过期后把底部按钮改成“已过期”并设置 `contactDisabled=true`，导致按钮事件直接失效；
  - `services/record.ts` 的 `buildUnlockRecords()` 也仍按 `UNLOCK_FREE_VIEW_HOURS=24` 计算 `expiresAt/isExpired`，继续把“24 小时”当成真实权限时限。
- 聊天页不是直接打开现成会话，而是由 `pages/chat/index.ts` 在拿到 `guestId` 时调用 `createAndLoadConversation()`，进一步请求 `/api/v1/conversation/create`。因此只改记录页前端跳转不够，后端会话创建权限必须同步满足新规则。
- 后端目前仍是旧权限模型：
  - `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/message.go` 的 `checkContactPermission()` 只认“当前用户是会员”或“当前用户已经解锁过对方”或“当前用户还有解锁次数”；
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go` 给交互列表返回的 `can_contact` 也是 `isVip || hasUnlocked || remainingQuota >= 1`；
  - `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/interaction.go` 的 `buildInteractionItems()` 只做单向 `HasUnlockedBatch(currentChildID, targetChildIDs)`，没有把“对方已解锁我”折算为可联系；
  - `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/interaction.go` 的 `UnlockContact()` 只创建/更新解锁记录，没有在解锁时立即创建会话。
- 这意味着当前仓库很可能存在两个实际缺口：
  1. 前端 `解锁我` 卡片仍把 24 小时作为真实过期条件来禁用按钮和显示“已过期”；
  2. 就算前端点进了聊天页，后端 `/conversation/create` 仍可能因为“我方不是会员且我方没有主动解锁过对方”而返回权限失败，违背“任一方解锁即会话生成”的新规则。

## Missing Context
- 还缺一份当前环境真实的 `/api/v1/interaction/unlocked-me` 与 `/api/v1/conversation/create` 响应/报错样例，无法在 triage 阶段直接证明线上到底卡在“按钮被禁用”还是“创建会话失败”，但这不影响进入计划阶段。
- “24 小时提醒文案”的展示规则仍有一个轻微边界待确认：附件强调该文案保留、真实权限不受 24 小时限制，但未明确要求 24 小时结束后文案是否继续显示；仓库旧 PRD是“超过 24 小时则不显示提醒”。这是展示层细节，不阻塞修复主链路。
- 缺少一个指定测试账号/样例 child ID，用于验证“对方解锁我但我未开会员”的真实链路，不过飞书说明和附件已经足够支持计划生成。

## Likely Surfaces
- 前端页面与组件：
  - `pages/message-record/index.ts`
  - `pages/message-record/helpers.ts`
  - `components/pages/message-record/record-card/index.ts`
  - `components/pages/message-record/record-card/index.wxml`
  - `services/record.ts`
  - `pages/chat/index.ts`
  - `services/message.ts`
- 前端产品依据：
  - `design/1.需求文档/神仙亲家--小程序产品需求文档.md`
  - `design/3.设计稿/神仙亲家-消息-解锁我1.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_72247ecfcc84/image.png`
- 后端高概率关联面：
  - `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/interaction.go`
  - `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/message.go`
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go`
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/logic/interaction/interaction_logic.go`

## Recommended Next Action
- 结论：`ready`，建议直接进入 `generate_plan`。
- 建议下一阶段的计划按以下顺序展开：
  1. 先复现“解锁我 + 非会员”链路，区分当前失败点是记录页按钮被前端禁用，还是聊天页创建会话被后端拒绝；
  2. 前端去掉 `解锁我` tab 上基于 24 小时的真实禁用/过期语义，把 `24 小时内免费查看` 改成纯展示文案；
  3. 后端把“对方已解锁我”纳入 `can_contact` / `checkContactPermission` / 列表返回逻辑，并落实“解锁时即创建会话”或同等效果的数据保证；
  4. 回归 `解锁我` 记录页、消息列表会话出现、聊天页进入、24 小时后仍可查看/联系这四类场景。
- 风险提示：如果后续实现阶段仅允许修改前端仓库，本问题大概率无法完整闭环，因为会话创建与 `can_contact` 判定看起来至少部分依赖后端同步调整。
