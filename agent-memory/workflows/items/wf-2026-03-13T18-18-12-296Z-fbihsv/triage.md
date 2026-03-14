# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 收藏我底部会员按钮应提示“查看详细资料受限”并进入会员中心黄金 tab
## Cleaned Problem
在 `收藏我` 记录页，非会员用户点击底部常驻 CTA（截图显示文案为“开通会员 查...”）时，当前实际会进入会员阻断弹框链路，而不是按预期走“详情受限提示 + 会员中心黄金 tab”流程。

清洗后的可执行问题描述如下：
- 入口页面为 `pages/message-record/index` 的 `收藏我` 视图，即路由 `type=favorite` 且默认 `direction=other_to_me` 的场景；从消息页金刚区点击“收藏我的”即可进入：`pages/message/index.ts:242`。
- 期望行为：点击底部 CTA 后，应进入 `pages/member-center/index?tab=gold` 对应的黄金会员开通页，并使用文案为“查看详细资料受限 / 平台严格保护用户隐私，开通会员方可查看对方详情”的提示弹框；点击按钮“好的”后弹框关闭。
- 当前行为：运行时仍走旧的会员阻断弹框（`member-unlock-modal`）路径，没有落到上述“查看详细资料受限”提示流。

## Source Quality
- 质量评估：`high`。
- 原始缺陷同时给出了页面场景、触发动作、目标路由（黄金 tab）、目标弹框文案、按钮文案以及当前错误行为。
- 附件 `agent-memory/defect-reports/attachments/bug_33447f0a24b6/image.png` 虽然只展示了 `收藏我` 页面底部 CTA 现状，没有录到点击后的错误弹框，但仓库代码可直接对上该入口和当前错误逻辑，因此证据已足够支撑进入计划阶段。

## Product Context
- 消息页金刚区“收藏我的”入口会进入记录页；未传 `direction` 时，记录页默认落在 `other_to_me`，即“收藏我”场景：`pages/message/index.ts:245`、`pages/message-record/index.ts:58`。
- PRD 对“收藏记录 -> 收藏我”明确要求：非会员点击卡片/底部资料入口应被会员能力阻断，底部常驻按钮应导向会员开通页，并展示“共有 xxx 人收藏我”的提示：`design/1.需求文档/神仙亲家--小程序产品需求文档.md:143`。
- 当前页面底部常驻条只会在非会员 + `看过我/收藏我` 场景出现，因此该问题天然限定在未开通会员的用户：`pages/message-record/index.ts:315`。
- 会员中心已经支持通过 query 直接选中黄金 tab，后续修复不需要新增路由协议：`pages/member-center/index.ts:226`、`pages/member-center/index.ts:300`、`pages/member-center/index.ts:307`。

## Technical Context
- 页面 WXML 已把底部 CTA 绑定到 `onOpenVip`：`pages/message-record/index.wxml:99`。
- TypeScript 源码里，`onOpenVip` 已对 `收藏我` 场景做过分支，目标是直接进入 `pages/member-center/index?tab=gold`：`pages/message-record/index.ts:535`。
- 同一页的 WXML 还已经存在与缺陷描述完全一致的 `confirm-modal`：标题“查看详细资料受限”、内容“平台严格保护用户隐私，开通会员方可查看对方详情”、确认按钮“好的”：`pages/message-record/index.wxml:145`。
- TypeScript 源码也已经实现了该弹框的关闭/确认处理，并在关闭后跳转黄金会员页：`pages/message-record/index.ts:553`。
- 但运行时实际吃的是 `.js` 产物；当前 `pages/message-record/index.js` 仍是旧逻辑：
  - `onOpenVip` 直接 `setData({ showMemberUnlockModal: true, memberUnlockScene: '联系对方' })`，没有走详情受限提示：`pages/message-record/index.js:253`。
  - `onRecordTap` 也没有 `收藏我` 非会员的详情受限判断，仍直接进详情页：`pages/message-record/index.js:202`。
  - `.js` 中甚至没有与 `showDetailRestrictedModal` / `detailRestrictedRedirectToMemberCenter` 对应的数据和处理函数，说明当前仓库存在明显的 `index.ts` → `index.js` 漂移。
- 结合上面两点，当前缺陷的高概率根因不是“需求没有定义”，而是“记录页运行时代码未同步到最新 TS/WXML 逻辑”，导致底部 CTA 仍触发旧的 `member-unlock-modal`。

## Missing Context
- 缺少点击后的录屏或截图，无法从附件直接判断错误弹框是 `member-unlock-modal` 还是其他阻断组件；不过 `pages/message-record/index.js:253` 已给出最可能的运行时来源。
- 原始描述没有完全说明“详情受限提示弹框”应出现在记录页还是会员中心页；不过仓库现有实现已经把这套文案落在 `pages/message-record/index.wxml:145`，因此后续计划可以先按既有页面模式推进。
- 缺少明确的提测包构建信息，但当前仓库的 TS/JS 漂移本身已经足以解释“我看到的还是旧阻断弹框”。

## Likely Surfaces
- `pages/message-record/index.ts`
- `pages/message-record/index.wxml`
- `pages/message-record/index.js`
- `components/member-unlock-modal/index.ts`
- `components/confirm-modal/index.ts`
- `pages/member-center/index.ts`
- `store/memberStore.ts`

## Recommended Next Action
- 结论：`generate_plan`，可以安全进入修复规划。
- 建议后续计划优先覆盖两件事：
  - 先统一 `收藏我` 底部 CTA 的运行时行为，明确它必须复用“查看详细资料受限”提示流，而不是旧的 `member-unlock-modal`。
  - 修复完成后必须同步生成 `pages/message-record/index.js`，并验证非会员从 `pages/message/index` 进入 `收藏我` 后，点击底部按钮是否按预期进入 `pages/member-center/index?tab=gold`。
