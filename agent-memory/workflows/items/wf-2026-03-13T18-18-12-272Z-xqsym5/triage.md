# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 历史推荐页嘉宾卡片内会员提示条点击无响应
## Cleaned Problem
- 原始描述“历史推荐：点击嘉宾卡片按钮，无反应”存在按钮指代不清的问题，但附件截图明确指向历史推荐卡片内部的橙色提示条 `至尊会员才能查看/联系过往嘉宾`。
- 结合页面现状，问题可清洗为：在 `pages/history/index` 的非至尊历史推荐受限态中，点击卡片内会员提示条后，没有出现任何可感知反馈（未弹出会员引导、未跳转、未提示）。
- 截图中的推荐日期为 `2026年3月6日推荐`，反馈日期为 `2026-03-08`；若以提报当日为准，这更像是“3 天预览期内的受限 CTA 无响应”，而不是“超 3 天完全锁定态”。这一点属于基于附件与现有规则的推断。
- 后续计划阶段应把 3 个触点分开验证：卡片空白区、`详细资料/照片` 按钮、`联系对方` 按钮。当前截图最直接证明的是卡片内会员提示条，而不是全部按钮都失效。
## Source Quality
- 结论：`medium`。
- 优点：页面明确（历史推荐），有本地截图附件，且截图能定位到具体 UI 元素。
- 不足：缺少账号身份、复现日期筛选值、点击的是哪一个“按钮”的口头说明，期望行为也未在飞书文案中直接写明。
- 但仓库内已有完整页面、会员拦截逻辑和弹窗组件，足以让后续计划先按“现有设计意图未生效”方向排查，无需猜测模块归属。
## Product Context
- 页面入口明确：`pages/index/index` 的“历史推荐”进入 `pages/history/index`，见 `../immortal-in-laws-e2e/agent-memory/page-topology.md`。
- 现有需求文档把历史推荐定义为独立模块，并约束“3天内可正常查看；超过3天显示阻断与跳转”，见 `docs/prd-todo.md:89`。
- 当前会员能力定义中，`memberStore.canViewHistory()` 只有至尊会员返回 `true`，见 `store/memberStore.ts:212`。
- 因此该缺陷属于“历史推荐页的会员受限交互异常”，不是未实现模块，也不是纯文案/待测点问题。
## Technical Context
- 历史推荐列表为每个受限卡片额外挂载了一个独立点击层：`pages/history/index.wxml:40` 的 `.history-lock`，点击后调用 `onHistoryBlockedTap`。
- 处理函数 `pages/history/index.ts:367` 会进入 `showHistoryMemberUnlockModal()`，而该方法在 `pages/history/index.ts:375` 只负责把 `showMemberUnlockModal` 置为 `true` 并设置场景为 `查看历史推荐`。
- 同页已经挂载 `member-unlock-modal` 组件，见 `pages/history/index.wxml:111`；组件本身也支持 `查看历史推荐` 场景并默认切到至尊会员页签，见 `components/member-unlock-modal/index.ts:241`。
- 历史页的预览逻辑在 `pages/history/index.ts:419`：非至尊且日期仍在 3 天内时，会显示最多 2 张预览卡；这与截图“能看到卡片，但同时出现会员提示条”的状态一致。
- 样式上，卡片内提示条位于 `.history-lock`（`pages/history/index.wxss:114`，`z-index: 3`），而底部常驻购买栏位于 `.history-footer`（`pages/history/index.wxss:272`，`z-index: 20`）。后续排查需确认是否存在点击热区被底部浮层覆盖、或弹窗已触发但视觉上未出现的情况。
- 如果飞书里的“嘉宾卡片按钮”实际指的是组件内 `详细资料/照片` / `联系对方`，则还要检查 `components/guest-card/index.wxml` 与 `pages/history/index.ts:222`、`pages/history/index.ts:244` 这条组件事件链；当前页面逻辑对这两个入口也都应落到会员拦截或后续跳转流程。
## Missing Context
- 缺少提报人明确说明：点击的是卡片内橙色会员提示条，还是卡片底部两个按钮中的某一个。
- 缺少复现账号身份（普通/黄金/至尊）、所选历史日期、以及底部常驻按钮 `开通至尊会员 查看全部资料` 是否正常可点击。
- 缺少运行态证据，暂时无法区分“点击事件未送达”“`setData` 已执行但弹窗未显现”“被底部固定栏抢占点击区域”三类问题。
- 这些缺口不会阻塞计划生成，因为仓库内已有足够明确的页面、逻辑和截图目标，后续可以先通过复现把歧义压缩掉。
## Likely Surfaces
- `pages/history/index.wxml:27`：历史列表卡片、卡片内 `.history-lock`、底部常驻 CTA、`member-unlock-modal` 挂载点。
- `pages/history/index.ts:222`：`onGuestCardTap`；`pages/history/index.ts:244`：`onContactTap`；`pages/history/index.ts:367`：`onHistoryBlockedTap`；`pages/history/index.ts:375`：`showHistoryMemberUnlockModal`；`pages/history/index.ts:419`：预览/锁定态计算。
- `pages/history/index.wxss:114`：卡片内会员提示条的定位与层级；`pages/history/index.wxss:272`：底部固定购买栏的层级与覆盖范围。
- `components/member-unlock-modal/index.ts:241`：`查看历史推荐` 场景是否正确切到至尊会员流程。
- `components/guest-card/index.wxml:120` 与 `components/guest-card/index.ts:183`：若实际失效的是卡片底部按钮，而非橙色提示条，需要继续查组件事件触发链。
## Recommended Next Action
- `generate_plan`。
- 下一阶段先在非至尊账号、最近 3 天的历史日期下复现，并分别验证：卡片空白区、`详细资料/照片`、`联系对方`、卡片内橙色会员提示条、底部常驻 CTA。
- 复现时优先记录两类证据：1）点击后 `showMemberUnlockModal` 是否被置为 `true`；2）页面上是否真的出现 `member-unlock-modal`，从而快速区分“逻辑没走到”与“视觉/层级问题”。
- 若确认只有卡片内橙色提示条失效，可优先从 `pages/history/index.wxml` / `pages/history/index.wxss` 的命中区域与层级冲突着手；若卡片底部按钮同样失效，再扩展到 `guest-card` 组件事件链。
