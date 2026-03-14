# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 精准查找结果页：非至尊会员完成首次搜索后仍显示“条件设置”且可重复搜索
## Cleaned Problem
- 缺陷聚焦于 `精准查找 -> 搜索结果` 流程：非至尊会员按产品规则应仅有 1 次搜索机会。
- 期望行为：首次搜索完成并进入 `pages/filter-result/index` 后，结果页应立即隐藏右上角 `条件设置` 入口，且用户不能再次进入条件页发起新的精准搜索。
- 当前反馈行为：非至尊会员在结果页仍能看到 `条件设置`，并可回到 `pages/filter/index` 重复搜索。
- 附件证据：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_b75cd683ea10/image.png`。

## Source Quality
- 评价：`medium`。
- 优点：问题描述清楚，包含明确的期望/现状对比，并附带截图；路由和模块范围明确，可直接落到 `pages/filter/index` 与 `pages/filter-result/index`。
- 限制 1：缺少可复现的账号信息、会员状态来源、是否冷启动/切后台后的复现步骤。
- 限制 2：截图与当前仓库模板存在冲突：当前 `pages/filter-result/index.wxml` 已用 `wx:if="{{isSupremeView}}"` 控制 `条件设置` 是否展示，但截图中同时出现了非至尊页脚 CTA 与 `条件设置`，说明反馈可能来自旧包、旧分支或运行产物/状态与当前源码不一致。
- 限制 3：飞书状态虽为 `待发版验证`，但问题本身不是纯验证备注，仍具备进入后续修复计划的条件。

## Product Context
- 根据页面拓扑，首页 `精准查找` 入口会在“已有筛选记录/条件”时直接进入 `pages/filter-result/index`，否则进入 `pages/filter/index`。
- `pages/filter/index` 的主 CTA 是 `立即搜索`，提交后进入 `pages/filter-result/index`。
- `pages/filter-result/index` 的右上角 `条件设置` 会返回筛选条件页，这是当前产品流中的“重新改条件再搜一次”入口。
- 本缺陷的核心业务约束是：非至尊会员没有重复精准搜索权限；首次搜索后应停留在结果态，只能看结果/引导开通至尊，不能再通过 `条件设置` 回流到条件页继续搜索。
- 关联上下文：在缺陷工作台里还存在另一条相邻问题 `bug_2e1530e4ebc9`，说明“非至尊会员有过 1 次搜索记录后，次日从首页仍应进入结果页而不是条件页”，可作为“单次搜索资格需要跨页面/跨时段稳定生效”的补充产品信号。

## Technical Context
- 入口路由：`pages/index/index.ts` 通过 `recommendStore.getFilterResultList().length > 0 || Boolean(recommendStore.getFilterRequirements())` 判断是否已有搜索历史，并决定跳 `pages/filter-result/index` 还是 `pages/filter/index`。
- 条件页门禁：`pages/filter/index.ts` 的 `onSubmit()` 已有“非至尊会员仅可搜索1次”判断，条件同样依赖 `recommendStore` 中的筛选历史/条件。
- 结果页展示：`pages/filter-result/index.wxml` 当前源码中，`条件设置` 入口仅在 `isSupremeView` 为真时渲染；而底部非至尊 CTA 与至尊 CTA 也同样依赖 `isSupremeView` 切换。
- 结果页状态源：`pages/filter-result/index.ts` 的 `isSupremeView` 来自 `memberStore.isSupremeMember()`；但页面首次 `onShow()` 会直接 return，不会先 `refreshStatus()`，因此首次进入可能直接使用本地缓存会员态。
- 会员态缓存：`app.ts` 在 `onLaunch()` 里只做 `memberStore.initFromStorage()`，`refreshStores()` 目前为空；`store/memberStore.ts` 会从本地 `member_status` 恢复状态。这意味着会员降级、切号或旧缓存未刷新时，筛选结果页和条件页都可能读到过期的至尊态。
- 搜索接口：`services/guest.ts` 的 `fetchFilterResult()` 已映射 `/api/v1/match/search` 返回的 `quota_left`；接口文档 `docs/默认模块.openapi.json` 标注该字段为“今日剩余筛选次数（至尊会员可用）”，说明非至尊的“仅 1 次”规则当前更像前端业务门禁，而不是明确的后端统一额度字段。
- 状态持久化：`store/recommendStore.ts` 会持久化 `filter_requirements`，并在运行时缓存 `filterResultList`、`filterQuotaLeft`、`filterCanView`。当前一次搜索资格的判断是由多个本地状态拼起来的，而非单一、强一致的权限标志。

## Missing Context
- 缺少报障时使用的测试账号、会员等级来源（真实后端/测试开通/缓存残留）以及是否发生过切账号或会员状态变更。
- 缺少缺陷发生时的小程序包版本或提交哈希；因为截图与当前 `pages/filter-result/index.wxml` 的显示逻辑不一致，需要确认问题是否针对旧构建产物。
- 缺少后端是否对“非至尊仅 1 次精准搜索”做强校验的说明；现有接口文档只明确了至尊会员的 `quota_left`。
- 缺少是否必须在“首次搜索完成的同一会话内”立即隐藏入口，还是冷启动后也必须继续隐藏；不过从当前描述和关联缺陷看，后续计划已足以先按“首次搜索后立即且持续隐藏”处理。

## Likely Surfaces
- `pages/index/index.ts`：首页入口路由，决定用户是进入条件页还是结果页。
- `pages/filter/index.ts`：`onSubmit()` 的一次搜索门禁，当前依赖本地 `recommendStore` 与 `memberStore` 状态。
- `pages/filter-result/index.ts`：`isSupremeView` 的计算、首次进入不刷新会员态、`onConditionTap()` 的点击保护。
- `pages/filter-result/index.wxml`：`条件设置` 入口和底部 CTA 的显隐规则；需核对与反馈截图的版本一致性。
- `store/memberStore.ts`：至尊会员判定、会员状态本地恢复与刷新时机。
- `store/recommendStore.ts`：搜索历史/筛选条件的持久化与“是否已有一次搜索”的本地事实来源。
- `services/guest.ts` / `docs/默认模块.openapi.json`：`match/search` 返回的 `quota_left` 能否提供更稳定的服务端约束信号。

## Recommended Next Action
- 结论：`ready`，可以进入 `generate_plan`。
- 建议后续计划优先做两件事：
- 1) 先复核“当前源码 vs 反馈截图”的差异，确认是不是旧包/旧分支/缓存态导致 `条件设置` 仍展示；
- 2) 再把“非至尊只可搜一次”的判断收敛到更稳定的状态源，重点检查 `memberStore` 首次进入未刷新、`recommendStore` 本地历史判断、以及是否需要服务端返回不可再搜标志。
- 如果后续复现发现当前源码已不会展示 `条件设置`，也仍应保留该项在计划中，因为重复搜索问题尚未被同等强度地后端兜底，且当前架构存在明显的本地缓存/首屏会员态时序风险。
