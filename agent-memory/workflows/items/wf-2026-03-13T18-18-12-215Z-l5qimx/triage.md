# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 收藏我：非会员点击卡片/详细资料/联系对方应统一弹出会员阻断弹框
## Cleaned Problem
在 `pages/message-record/index` 的“收藏我”tab（`recordType=favorite` + `direction=other_to_me`）中，非会员用户点击嘉宾卡片主体、`详细资料/照片` 按钮、`联系对方` 按钮时，预期都应停留在当前页并统一弹出会员开通阻断弹框，而不是进入详情页/会话页，或走不同类型的弹框/确认流。

当前源码里，这三个入口并没有统一到同一个“会员阻断弹框”实现：
- 卡片主体/`详细资料/照片` 走的是 `confirm-modal` 受限提示流，关闭后会继续跳会员中心：`pages/message-record/index.ts:376`。
- `联系对方` 走的是 `member-unlock-modal` 解锁弹框，而不是通用会员阻断弹框：`pages/message-record/index.ts:464`。
- 该页面没有接入 `block-dialog` 组件，说明当前实现与 PRD 所说的“一律弹出会员阻断弹框”不一致：`pages/message-record/index.json:6`。

因此，即使线上现象表现为“直接跳新页面”，当前代码也已能明确定位到同一组权限分支和弹框选择逻辑，足够进入后续修复计划。

## Source Quality
该缺陷源信息质量高：
- 明确给出了页面语义（“收藏我”）、用户身份（非会员）、触发入口（卡片/详细资料/联系对方）和期望行为（统一会员阻断弹框）。
- PRD 对该场景有直接描述，可作为产品准绳，无需猜测核心交互：`design/1.需求文档/神仙亲家--小程序产品需求文档.md:143`。
- 缺少的是运行时截图/录屏，因此无法仅靠 triage 判断线上究竟是“直接跳页”还是“弹框后再跳页”；但这不影响进入计划阶段。

## Product Context
- PRD 对“收藏我”tab定义非常明确：非会员点击卡片、`详细资料页/照片`、`联系对方` 时，**一律弹出会员阻断弹框**；页面底部常驻按钮才是“开通会员 查看全部资料”并跳会员开通页：`design/1.需求文档/神仙亲家--小程序产品需求文档.md:143`。
- 黄金会员权益包含“查看谁看过我、查看谁收藏我”，说明“收藏我”阻断默认应导向黄金会员开通，而不是至尊会员：`design/1.需求文档/神仙亲家--小程序产品需求文档.md:181`。
- 项目 README 也将 `block-dialog` 定义为通用“会员阻断弹窗”，用于权限不足场景：`README.md:162`。

## Technical Context
- 页面入口已注册：`app.json:11`。
- `record-card` 把卡片主体和 `详细资料/照片` 都绑定到 `cardtap`，把 `联系对方` 绑定到 `contact`，因此三个入口最终都汇总到 `pages/message-record/index.ts` 的两个处理函数：`components/pages/message-record/record-card/index.wxml:64`。
- `onRecordTap` 在“收藏我 + 非会员”分支中使用 `showDetailRestrictedModal`，而不是 `block-dialog`：`pages/message-record/index.ts:376`。
- `onContactTap` 在“收藏我 + 非会员”分支中不会走“我收藏”专用的解锁确认，而是直接落到 `showMemberUnlockModal`：`pages/message-record/index.ts:432`、`pages/message-record/index.ts:464`。
- `pages/message-record/index.json` 目前只注册了 `member-unlock-modal` 和 `confirm-modal`，没有注册 `block-dialog`：`pages/message-record/index.json:6`。
- `components/block-dialog/index.ts` 已支持 `查看记录` / `联系对方` 场景，并且默认跳黄金会员 tab；这与“收藏我”场景更匹配。反而 `查看详情` 会默认跳至尊 tab，不适合直接复用到“收藏我”：`components/block-dialog/index.ts:19`。
- 邻近代码还有一个相关但未在本缺陷中点名的偏差：`onMoreTap` 对非会员的“收藏我”也会拦成受限确认并导向会员中心，而 PRD 期望“更多”仍可弹出举报/置顶/屏蔽操作菜单：`pages/message-record/index.ts:590` 附近；建议修复时顺手比对，但不必默认并入当前单。

## Missing Context
- 缺少缺陷录屏/截图，无法在 triage 阶段确认线上是“完全未拦截直接跳页”，还是“拦截方式错误（确认弹框/解锁弹框/关闭后跳页）”。
- 缺少与设计稿一一对应的“收藏我-非会员阻断弹框”命名映射；不过从组件职责和 PRD 权益看，优先复用 `block-dialog` 且默认黄金会员 tab 的方向已经足够明确。
- 若产品对“更多”菜单是否也应对非会员开放已有变更，需要在计划阶段一并核实；现有 PRD 与源码不一致。

## Likely Surfaces
- `pages/message-record/index.ts`
- `pages/message-record/index.wxml`
- `pages/message-record/index.json`
- `components/pages/message-record/record-card/index.wxml`
- `components/block-dialog/index.ts`
- `store/memberStore.ts`

## Recommended Next Action
进入 `generate_plan`。

建议后续计划以“统一收藏我非会员阻断策略”为中心展开：
- 只在 `recordType=favorite` 且 `direction=other_to_me` 且非会员时生效。
- 将卡片主体、`详细资料/照片`、`联系对方` 三个入口统一改为同一种 `block-dialog` 阻断流，而不是混用 `confirm-modal` / `member-unlock-modal` / 直接跳页。
- 阻断场景应默认导向黄金会员开通；优先复用 `block-dialog` 的 `查看记录` / `联系对方` 场景，必要时补一个更准确的“收藏我”场景文案。
- 保持底部常驻 CTA 继续跳会员中心，不把底部 CTA 也改成弹窗。
- 修复后至少验证：非会员进入“收藏我”tab，点击卡片主体、`详细资料/照片`、`联系对方` 三处都停留当前页并弹出同类会员阻断弹框；会员态仍保持详情页/私信页跳转。
