# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 搜索结果页在黄金会员升级为至尊会员后底部悬浮按钮未及时切换为搜索按钮
## Cleaned Problem
在 `pages/filter-result/index` 搜索结果页中，用户原本处于黄金会员态时，底部固定悬浮 CTA 会展示非至尊态按钮“开通至尊会员（每天搜索6位）”。当用户完成“黄金会员 -> 至尊会员”升级后，当前搜索结果页未及时刷新为至尊会员态，底部 CTA 仍停留在“开通至尊会员”，而不是切换为高亮搜索按钮“点击搜索嘉宾（今日剩1次机会）”。

从附件可确认：
- 实际态：搜索结果页底部仍显示“开通至尊会员（每天搜索6位）”。
- 期望态：同一位置应切换为“点击搜索嘉宾（今日剩1次机会）”。

该问题本质是“会员等级升级成功后，搜索结果页底部 CTA 未同步到最新会员态”。

## Source Quality
- 原始描述清楚说明了当前表现、期望表现和具体 UI 文案差异。
- 两张本地附件里同时给出了实际态和期望态，证据充分，可直接定位到底部悬浮 CTA 模块。
- `Likely route hints` 已明确指向 `pages/filter-result/index`、`pages/member-center/index`、`pages/profile/index`，足以进入后续计划阶段。
- 仍缺少一条完整复现路径说明：用户是通过搜索结果页底部按钮跳转到会员中心升级后返回，还是在搜索结果页内联会员弹窗中支付升级；但这不会阻碍后续计划制定，因为当前仓库已能识别两条相关代码路径。

## Product Context
- 页面拓扑显示搜索主链路为 `pages/index/index -> pages/filter/index -> pages/filter-result/index`，搜索结果页是“精准查找 / 搜索结果”的直接落点。
- PRD `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 对筛选结果页已写明：
  - 非至尊会员（含黄金会员）底部应显示常驻阻断按钮“开通至尊会员（每天搜索6位）”；
  - 至尊会员进入该页时，页面应按至尊身份展示，并允许继续走“点击搜索嘉宾（今日剩1次机会）”的搜索动作。
- 因为这是搜索结果页底部的核心 CTA，若会员升级后仍停留在旧态，会直接误导用户继续购买/升级，属于高频主路径上的状态同步问题。

## Technical Context
- 底部 CTA 的视图分支已经集中在 `pages/filter-result/index.wxml`：
  - `isSupremeView === true` 时展示 `{{supremeSearchButtonText}}`；
  - 否则展示“开通至尊会员 / 查看至尊会员其他特权”。
- `pages/filter-result/index.ts` 中，`isSupremeView`、`isMemberView` 均来自 `memberStore`：
  - `syncMemberViewState()` 会把 `memberStore.isSupremeMember()` 映射到页面数据；
  - `loadData()` 在加载搜索结果后也会重新写入 `isSupremeView` 与 `supremeSearchButtonText`。
- 搜索结果页当前已存在“从会员中心返回后刷新”的防线：
  - `onShow()` 会调用 `memberStore.refreshStatus()`；
  - 若会员态发生变化，则执行 `loadData(0)` 重新同步页面。
- 但当前仓库里仍有一条高概率缺口：
  - `components/member-unlock-modal/index.ts` 在支付成功后会等待 `memberStore.refreshStatus()` 完成，并显式触发 `paidsuccess` 事件；
  - `pages/filter-result/index.ts` 的 `onMemberUnlockPaidSuccess()` 目前仅执行 `this.setData({ showMemberUnlockModal: false })`，没有继续刷新 `memberStore` 派生视图，也没有调用 `syncMemberViewState()` / `loadData(0)`；
  - 对比之下，`pages/index/index.ts`、`pages/exposure/index.ts`、`pages/message-record/index.ts` 的同名处理器都在支付成功后主动刷新会员状态或权益。
- 这说明：
  1. 若问题发生在“结果页内联会员弹窗支付成功后仍停留当前页”的路径，当前代码仍有明显同步缺口；
  2. 若问题发生在“跳转会员中心升级后返回搜索结果页”的路径，当前源码已包含 `onShow -> refreshStatus -> loadData(0)` 的补救逻辑，需先确认是否为旧包/旧分支问题，或是否仍有返回链路未触发该逻辑。
- 会员状态底层来源为 `store/memberStore.ts` + `services/member.ts`：`memberStore.refreshStatus()` 调用 `/api/v1/membership/status`，因此页面级问题更像“升级成功后的视图同步遗漏”，而不是接口定义不明。

## Missing Context
- 缺少精确复现路径：
  - 是否是点击搜索结果页底部 CTA 进入 `pages/member-center/index` 升级后返回；
  - 还是在搜索结果页卡片/阻断链路里弹出 `member-unlock-modal` 后直接支付成功。
- 缺少受影响包版本 / 分支信息。当前仓库已出现部分刷新逻辑，无法仅靠工单文字判断线上问题是否已被主干代码覆盖。
- 缺少复现账号与支付/调试会员数据，暂无法确认升级成功后 `/api/v1/membership/status` 的返回时机是否稳定。
- 缺少操作录屏，无法判断用户在支付成功后是否留在当前页、关闭成功弹窗、或通过返回按钮离开会员中心。

## Likely Surfaces
- `pages/filter-result/index.ts`
  - 搜索结果页会员态同步、`onShow` 刷新、`onMemberUnlockPaidSuccess()` 都在这里。
- `pages/filter-result/index.wxml`
  - 底部悬浮 CTA 的分支渲染完全由这里控制。
- `components/member-unlock-modal/index.ts`
  - 内联会员支付成功后会触发 `paidsuccess`，是“当前页不跳转但会员等级变了”这条链路的关键事件源。
- `pages/member-center/index.ts`
  - 底部 CTA 跳转到会员中心后的升级流程与支付成功轮询在这里，需确认返回搜索结果页时是否始终触发 `onShow` 刷新。
- `store/memberStore.ts`
  - 会员等级判定的单一真源；页面是否变成至尊态最终都取决于这里是否被及时刷新、及时消费。
- `services/member.ts`
  - 会员状态接口定义与映射入口；若升级后接口返回存在延迟，会影响页面刷新时机。

## Recommended Next Action
建议进入 `generate_plan`。后续计划应优先围绕“复现路径分流 + 页面级状态同步补齐”展开：
- 先区分两条升级路径并分别复现：
  - `filter-result -> member-center -> 支付成功 -> 返回 filter-result`；
  - `filter-result -> member-unlock-modal -> 支付成功 -> 留在当前页`。
- 若问题命中当前页弹窗支付链路，首选修复点是 `pages/filter-result/index.ts` 的 `onMemberUnlockPaidSuccess()`：支付成功后应刷新会员状态，并立即重算 `isSupremeView` / `supremeSearchButtonText`，必要时重载第一页数据。
- 若问题命中会员中心返回链路，需确认 `onShow()` 在真实返回路径中是否总会触发，以及 `refreshStatus()` 的轮询结果是否足够覆盖支付回调延迟。
- 计划阶段应把“底部 CTA 文案切换”“条件设置入口显隐切换”“卡片底部按钮从阻断态变为正常态”一起列入回归，避免只修复底部按钮而遗漏同页其他会员态 UI。
- 若确认当前主干代码已覆盖“会员中心返回链路”，则应把该信息写入计划，避免重复做已存在的修复，集中处理剩余的支付成功后本页即时刷新问题。
