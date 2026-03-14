# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 会员中心：黄金会员页缺少第 4 个“至尊会员”子入口
## Cleaned Problem
会员中心页面在顶部选中“黄金会员”后，套餐横向选择区按反馈应展示 4 个子入口（3 个黄金套餐 + 1 个“至尊会员”入口）。当前附件截图仅看到 3 个黄金套餐卡，缺少第 4 个“至尊会员”入口卡，导致用户无法在黄金页内直接切到至尊会员入口位。

从截图位置判断，这里的“第 4 个子tab”更接近“黄金套餐区的第 4 张入口卡/子入口”，而不是页面顶部的“黄金会员 / 至尊会员”总 tab；顶部总 tab 在截图中已经存在。

## Source Quality
- 反馈模块、优先级、附件截图、候选路由都已给出，足以定位到 `pages/member-center/index`。
- 原始表述中的“子tab”略有歧义，但截图箭头明确指向黄金套餐卡片区右侧缺口，不是顶部导航 tab，因此可清洗为“缺少第 4 个至尊会员入口卡”。
- 本地首屏设计导出 `design/3.设计稿/神仙亲家-我的-黄金会员1.png` 只显式展示了 3 张黄金套餐卡；但现有前端代码已经内置“第 4 张至尊入口卡”逻辑，说明实现侧对该预期已有明确认知，因此该歧义不阻塞进入计划阶段。

## Product Context
- 缺陷归属模块与路由匹配：会员中心页 `pages/member-center/index`。
- 页面入口上下文：`pages/profile/index` 的会员入口会进入会员中心；`agent-memory/page-topology.md` 也将会员中心归为“我的/资料”流转的一部分。
- 会员中心是双主 tab 页面：顶部有 `黄金会员 / 至尊会员` 两个主 tab；黄金页内还有套餐选择区、权益对比区和底部开通 CTA。
- 项目知识中已确认会员中心为多态设计区：`黄金会员1.png` 是黄金页首屏主参考，`黄金会员2.png`/`至尊会员1.png` 是同路由其他状态或长页参考，不能仅凭单张 PNG 推翻页面逻辑。

## Technical Context
- 前端页面代码已显式预留第 4 个“至尊会员”入口：`pages/member-center/index.ts` 中定义了 `SUPREME_ENTRY_PLAN_ID` 和 `buildSupremeEntryPlan()`，并在 `loadData()` 中尝试把 `supremePlan` 追加到黄金套餐数组尾部。
- `onSelectPlan()` 里也已为这个特殊卡片写了跳转逻辑：当选中 `SUPREME_ENTRY_PLAN_ID` 时，直接切换到 `supreme` 主 tab。这说明“黄金页内有一个至尊入口卡”并非纯口头需求，而是现有代码的既定意图。
- 黄金套餐展示组件 `components/pages/member-center/member-center-gold-plans/index.wxml` 只是按 `plans` 数组渲染卡片；样式 `index.wxss` 使用 `display: flex` + `flex: 1`，如果前端实际拿到了 4 条数据，理论上会显示 4 张更窄的卡，而不是稳定显示 3 张大卡。
- 因此，当前截图更像是数据链路问题而非纯样式问题：
  - `fetchMemberPlans()` 请求 `/api/v1/membership/plans` 后，没有拿到 `supreme_forever`；或
  - `services/api-mapper.ts` 对返回的 `plan_type` 识别失败，未将其映射为 `MemberLevel.SUPREME`；或
  - failing 环境的在售商品配置缺少至尊套餐。
- 后端设计与代码均支持四种合法套餐类型：`gold_quarter`、`gold_year`、`gold_forever`、`supreme_forever`。`/Users/firingj/Projects/GodQinJia/internal/apiserver/service/membership.go` 的 `ListPlans()` 会把在售商品映射成套餐列表，只要在售商品里存在至尊套餐，前端就应能拿到该条目。

## Missing Context
- 缺少 failing 环境 `/api/v1/membership/plans` 的真实响应体，无法在 triage 阶段直接判定是前端过滤问题还是后端/配置漏数。
- 缺少触发路径与账号状态说明（例如从“我的”进入、测试账号是否非会员/黄金会员），但这不会影响后续计划生成。
- 本地设计首屏图与当前代码意图存在轻微不一致：设计首屏仅见 3 张黄金卡，代码却显式追加第 4 张至尊入口卡。该差异建议在实施阶段顺手核对产品/设计口径，但不构成当前阻塞。

## Likely Surfaces
- `pages/member-center/index.ts`
- `components/pages/member-center/member-center-gold-plans/index.wxml`
- `components/pages/member-center/member-center-gold-plans/index.wxss`
- `services/member.ts`
- `services/api-mapper.ts`
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/membership.go`
- 运行环境中的会员商品配置 / `product` 在售数据（尤其是 `supreme_forever`）

## Recommended Next Action
进入 `generate_plan`。

建议后续计划按以下顺序推进：
1. 先复核 failing 环境 `/api/v1/membership/plans` 的返回，确认是否缺少 `supreme_forever`。
2. 若接口已返回至尊套餐，则优先检查前端映射与 `goldPlansWithSupremeEntry` 的构造链路。
3. 若接口未返回至尊套餐，则定位为后端/商品配置问题，必要时补充前端兜底策略（仅在产品确认“黄金页必须始终显示至尊入口”后再决定是否加兜底）。
4. 修复后需验证黄金页套餐区显示 4 个入口，并确认点击第 4 个“至尊会员”入口会切到 `supreme` 主 tab。
