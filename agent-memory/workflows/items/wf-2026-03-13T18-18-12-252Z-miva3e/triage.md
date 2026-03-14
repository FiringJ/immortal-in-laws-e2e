# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 非至尊会员次日从精准查找入口重进时错误落到筛选页，应复用最近一次搜索记录进入结果页
## Cleaned Problem
当非至尊会员已经完成过 1 次精准搜索后，次日再次点击“精准查找 / 精准搜索”入口（飞书原文口语称“金刚区”）时，当前实际落到 `pages/filter/index` 的筛选表单页。期望行为应是复用最近一次搜索记录，直接进入 `pages/filter-result/index` 搜索结果页，而不是要求用户重新填写筛选条件。附件截图展示的正是错误落点：筛选表单页，而不是结果页。

## Source Quality
- 缺陷描述给出了明确用户身份条件（非至尊会员）、明确时间条件（次日再进入）、明确触发动作（点击精准查找入口）、明确错误行为（跳到搜索查找页）和明确期望行为（跳到搜索结果页）。
- 附件截图直接证明当前落点是 `pages/filter/index` 对应的筛选表单页，证据不是纯口述。
- 仓库内的页面拓扑、前端入口代码、后端接口文档三者能够互相印证该问题，说明后续可以在不猜核心业务规则的前提下进入计划阶段。
- 虽然飞书状态写的是“待发版验证”，但当前仓库里仍能定位到具体入口分流逻辑和历史记录链路的落差，因此这不是单纯“待测点”，而是可继续拆解的具体 bug。

## Product Context
- `agent-memory/page-topology.md` 已明确写出：首页快捷入口 `精准查找` 在“存在已保存搜索条件”时应进入 `pages/filter-result/index`，否则才进入 `pages/filter/index`。
- 后端筛选匹配模块设计文档也写明：用户点击“精准查找/搜索框”时，如果已有择偶标准则直接展示结果，否则引导填写；并且存在“最近一次筛选记录”接口用于复用结果。
- 该能力并不只存在于首页。`pages/message/index` 也有一条“精准搜索”入口，产品上属于同一搜索结果复用链路，因此后续修复不应只改单一页面入口。
- `app.ts` 已在 `onLaunch()` 中执行 `recommendStore.initFromStorage()`，说明产品实现本来就允许通过已保存的搜索条件恢复结果页；当前缺陷更像是“入口判定只看本地缓存，不看历史搜索记录”的问题，而不是产品规则不明确。

## Technical Context
- 当前工作区里的首页入口 `pages/index/index.ts` 和消息入口 `pages/message/index.ts` 都只用 `recommendStore.getFilterResultList().length > 0 || Boolean(recommendStore.getFilterRequirements())` 来判断去结果页还是筛选页。这种写法只依赖当前内存 / 本地已恢复的条件，无法覆盖“次日重新进入但需要从服务端历史恢复”的场景。
- 附件截图与这段实现是吻合的：一旦本地没有可用的筛选条件或结果缓存，入口就会直接 `navigateTo('/pages/filter/index?...')`，从而出现用户描述的错误落点。
- 仓库 `HEAD` 里其实已经出现过一条更符合产品预期的公共分流链路：`utils/filter-flow.ts` 中的 `shouldOpenFilterResultPage()` 会在本地无结果时，调用 `recommendStore.refreshLatestFilterSearchHistory()` 去拉取 `/api/v1/match/search-history/latest`，再决定是否进入结果页。这说明“复用最近一次搜索记录”并不是新需求，而是已有技术方案。
- 但当前工作区对这条链路处于“半回退/未合拢”状态：入口页已经退回到旧的本地判定逻辑，而 `utils/filter-flow.ts` 仍在调用 `recommendStore.refreshLatestFilterSearchHistory()`；当前 `store/recommendStore.ts` 中却已经找不到这个方法。实际执行 `npm run type-check -- --pretty false` 时，可复现 `utils/filter-flow.ts(28,48): error TS2339: Property 'refreshLatestFilterSearchHistory' does not exist on type 'RecommendStore'.`
- 后端 `MatchSearchHistoryResp` 不仅返回 `has_history`，还会返回最近一次 `criteria`。这意味着前端如果正确接住历史接口，不只是能判断该去结果页，还可以把上次条件恢复给结果页摘要和“条件设置”回跳。当前历史链路即使在 `HEAD` 方案里也主要接了结果列表 / 配额 / 是否有历史，`criteria` 的前端恢复仍是后续实现时要一并确认的相邻风险点。
- 额外上下文：当前 app 仓库工作区不是干净状态，`pages/index/index.ts`、`pages/message/index.ts`、`services/guest.ts`、`store/recommendStore.ts`、`app.ts` 均有未提交改动；其中前四个文件正好触及本问题链路。后续进入实现前，需要先确认是以 `HEAD` 为准恢复该能力，还是接着当前本地 WIP 整理，避免误覆盖同事工作。

## Missing Context
- 缺少本次缺陷对应的“目标代码基线”说明。`HEAD` 与当前工作区在该能力上并不一致：`HEAD` 有历史搜索分流方案，而当前工作区又把入口回退到了旧逻辑。
- 缺少本次“待发版验证”对应包体的基线信息，暂时无法判断线上/测试包命中的到底是 `HEAD` 之前的旧实现，还是当前本地未提交回退后的实现。
- 缺少一次围绕“本地无缓存，仅服务端有最近一次搜索记录”场景的明确验收口径。后端接口已支持返回 `criteria`，但前端是否必须在结果页完整恢复筛选摘要与条件设置回显，还需要在执行计划时顺手确认。
- 上述缺口不会阻塞进入 `generate_plan`，但计划第一步应先解决“目标基线”问题，再开始真正改代码。

## Likely Surfaces
- `pages/index/index.ts`
  - 首页“精准查找”入口的分流逻辑是直接缺陷点之一。
- `pages/message/index.ts`
  - 消息页“精准搜索”入口与首页属于同一搜索功能链路，必须同步修复，避免入口行为不一致。
- `utils/filter-flow.ts`
  - 这里已经存在共用的“本地优先 + 历史兜底”入口判定意图，是后续应复用而不是重写分流逻辑的位置。
- `store/recommendStore.ts`
  - 需要承接“最近一次搜索历史”的列表、配额、是否有历史，以及必要时的筛选条件恢复。
- `services/guest.ts`
  - 这里应承接 `/api/v1/match/search-history/latest` 的前端请求与响应映射，避免结果页只能靠本地缓存工作。
- `pages/filter-result/index.ts`
  - 结果页需要确认：当入口通过“最近一次搜索历史”进入时，是否能够直接消费已注入的 store 数据，而不是再次依赖本地筛选条件重新发起搜索。

## Recommended Next Action
建议进入 `generate_plan`。后续计划建议按下面顺序展开：
- 先确认基线：对比当前工作区与 `HEAD` 在 `pages/index/index.ts`、`pages/message/index.ts`、`services/guest.ts`、`store/recommendStore.ts` 上的差异，决定是恢复已有历史分流方案，还是在现有 WIP 上补齐并收口。
- 再统一入口：让首页和消息页都复用同一个异步分流逻辑，优先读本地已恢复的筛选条件/结果；本地没有时，对非至尊会员调用“最近一次搜索记录”接口，命中历史则直接进入 `pages/filter-result/index`。
- 同步补足 store/service：确保历史接口返回的列表、`has_history`、`quota_left` 以及必要的 `criteria` 都能灌入前端状态，避免只修正路由落点，却让结果页摘要或“条件设置”回显失真。
- 最后验证至少四类路径：同日/次日、首页入口/消息入口、本地已有缓存/仅服务端有历史记录，确保两个入口行为一致且不会重新落回筛选表单页。
