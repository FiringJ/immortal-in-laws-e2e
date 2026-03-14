# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 二三级页面缺少通顶头部交互，且“我的”页顶部右侧操作区与系统胶囊重叠
## Cleaned Problem
当前小程序只有首页具备相对完整的通顶/沉浸式顶部处理，多个二级、三级页面仍在使用原生导航栏或各自为政的头部实现。结果是页面下拉或内容上滑时，顶部背景不能连续延展到状态栏/胶囊区域，右侧操作区缺少统一背景承接，视觉上会与正文发生重叠。另一个已被附件截图明确证实的子问题是：`pages/profile/index`（我的首页）顶部右侧自绘操作区与系统右上角胶囊区域发生重叠，出现双层按钮/胶囊并存。期望行为是：主要二级、三级页面统一采用通顶头部方案，下拉和滚动时顶部背景连续、右上操作区有完整背景承接且不与系统胶囊冲突；“我的”页右侧只保留一套位置正确的操作区。

## Source Quality
- 原始缺陷描述给出了核心现象、优先级、归属模块（我的首页）和一张能直接定位到重叠问题的截图。
- 代码仓库中可以快速找到相关路由、页面拓扑和现有导航实现，说明该问题不是空泛的“体验建议”，而是可定位的实现缺陷。
- 不足之处是“其他所有二级页、三级页”没有逐页列举，“通顶设计”的目标形态也主要依赖口头描述和“参考完美亲家”，缺少明确设计稿或录屏，因此 source quality 评为 `medium` 而不是 `high`。

## Product Context
- 页面拓扑显示 `pages/profile/index -> pages/profile-preview/index -> pages/profile-edit/index` 构成连续的“我的/资料维护”二级、三级页面链路，是本缺陷最直接的一组落点。
- `pages/profile/index` 还是“设置”“会员中心”“邀请好友”“通知状态”等入口页，顶部交互异常会放大到用户高频个人中心路径。
- 代码审查显示项目当前确实混用了两套导航策略：部分页面已做自定义导航，另一部分仍使用原生导航栏，因此“除主页面外其余内页头部体验不统一”的产品反馈与仓库现状一致。
- 该问题影响页面首屏观感、滚动体验和顶部可用空间，属于高频路径的全局 UI/交互缺陷，进入后续计划是合理的。

## Technical Context
- 项目已存在统一导航尺寸工具 `utils/layout.ts`，并已有共享组件 `components/custom-navbar/`，说明后续修复具备抽象基础，不需要从零设计导航高度和胶囊避让。
- `components/custom-navbar/index.wxss` 当前通过 `position: fixed`、毛玻璃背景和 `padding-right: 200rpx` 预留系统胶囊区，已经是较接近“通顶头部”的现成实现。
- `pages/profile/index` 没有复用 `custom-navbar`，而是手写了一套 `profile-topbar` / `topbar-content` / `topbar-right`。其中 `pages/profile/index.wxss` 给顶部内容仅预留 `padding-right: 180rpx`，同时又额外绘制了右侧操作胶囊；结合附件截图，可直接解释为“自绘右侧操作区 + 系统胶囊”双层并存导致重叠。
- 与之相邻的 `pages/profile-preview/index.json`、`pages/profile-edit/index.json`、`pages/settings/index.json`、`pages/history/index.json` 等页面仍使用默认导航栏，没有开启 `navigationStyle: "custom"`，这与“二级/三级页缺少通顶头部设计”的主诉高度吻合。
- 仓库审计中，已启用自定义导航的页面包括 `pages/filter-result/index`、`pages/member-center/index`、`pages/message-record/index`、`pages/realname-auth/index` 等；这些页面和共享组件可以作为后续统一内页头部样式的参考实现。

## Missing Context
- 缺少一份明确的“需要纳入本次修复范围”的页面清单；虽然“所有二级页、三级页”足够指导排查，但计划阶段最好先收敛为优先级页面集。
- 缺少“通顶设计”的明确视觉基准，当前只有口头参考“完美亲家”，没有对应 Figma 节点、设计稿页名或录屏。
- 缺少除“我的首页”外其他页面的截图或录屏，因此目前能被附件直接证实的是 `pages/profile/index` 的顶部重叠；其余页面更多是依据仓库现状和用户描述判断为同类问题。
- 不过这些缺口不影响进入 `generate_plan`：当前已经能确认问题类型、主路径页面和可复用代码基座。

## Likely Surfaces
- `pages/profile/index.wxml`
  - 手写顶部栏，包含 `share-pill` 与 `topbar-right`，是截图中重叠问题的直接落点。
- `pages/profile/index.wxss`
  - 顶部布局通过 `padding-right: 180rpx` 和自绘右侧操作区控制，极可能没有正确避让系统胶囊。
- `pages/profile/index.ts`
  - 使用 `getNavMetrics()` 读取 `statusBarHeight / capsuleNavBarHeight / capsuleNavBarTop`，说明顶部高度已具备改为统一头部方案的技术条件。
- `components/custom-navbar/index.{wxml,wxss,ts}`
  - 现有统一头部组件，可作为内页通顶样式、胶囊避让和右侧操作背景的复用基座。
- `utils/layout.ts`
  - 统一导航尺寸与胶囊数据来源，是后续收敛不同页面顶部布局的底层依赖。
- 首批高优先级默认导航页面
  - `pages/profile-preview/index.json`
  - `pages/profile-edit/index.json`
  - `pages/history/index.json`
  - `pages/settings/index.json`
  - `pages/settings-blocked/index.json`
  - `pages/settings-doc/index.json`
  - `pages/settings-orders/index.json`
  - `pages/settings-unlock/index.json`

## Recommended Next Action
建议进入 `generate_plan`。后续计划可按以下顺序展开：
- 先以“我的 / 预览资料 / 编辑资料 / 设置 / 历史推荐”为首批页面，明确修复范围与验收截图清单。
- 统一定义内页通顶头部方案：优先评估复用 `components/custom-navbar`，而不是继续让各页面各自绘制顶部栏。
- 优先单点修复 `pages/profile/index` 的右上角重叠问题，处理策略应围绕“去掉重复右侧操作区”或“完全按胶囊区做避让/背景承接”。
- 再把默认导航的二级、三级页面迁移到统一头部实现，并验证下拉、滚动、顶部背景连续性与右侧操作区不重叠。
- 计划阶段应把“哪些页面必须本轮覆盖、哪些页面只做抽样验证”写清楚，避免后续范围失控。
