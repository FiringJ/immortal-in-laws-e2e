# Triage
- readiness: needs_human
- source_quality: medium
- next_action: manual_triage
- normalized_title: 会员阻断弹窗四档套餐测试价格需求（0.01/0.02/0.03/0.04）需先澄清范围
## Cleaned Problem
- 当前条目更像“测试环境价格配置请求”，而不是一个自包含的前端缺陷：原文没有明确描述“当前错误行为 vs 期望行为”，只提出“为了测试价格档位是否生效，可将 4 档价格改为 0.01、0.02、0.03、0.04”。
- 附件 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_15906a83febf/image.png` 显示的是会员阻断弹窗，而不是完整会员中心页；弹窗内当前可见黄金会员价格卡显示为 `0元`。
- 结合现有仓库上下文，这个“0元”现象本身不能直接判定为 bug：`agent-memory/project-knowledge.md` 已明确记录“test environment member prices render as 0 is normal in this project”。
- 目前可以确认的业务对象是 4 个会员档位：`gold_quarter`、`gold_year`、`gold_forever`、`supreme_forever`。但仍缺少关键定义：这 4 个测试价是只改前端展示，还是要影响真实下单金额、支付拉起金额、未支付订单金额与订单记录金额。

## Source Quality
- 质量判定为 `medium`：有截图，且能定位到会员阻断弹窗/会员套餐这一业务域，但原始描述本质是“便于测试的改价建议”，不是可直接进入实现的缺陷说明。
- 原文没有说明目标环境（测试环境、灰度环境、全部环境），也没有说明是临时调价还是产品最终要求。
- 原文没有明确影响范围：是只针对阻断弹窗，还是还要同步会员中心页、待支付订单横幅、订单记录页，以及实际支付金额。

## Product Context
- PRD `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 中，会员中心只有两类会员：黄金会员与至尊会员；其中黄金会员包含 3 个档位（季卡、年卡、永久），至尊会员包含 1 个档位（永久），合计正好 4 档。
- 附件截图与 `components/member-unlock-modal/` 的交互形态一致：顶部标题“开通黄金会员即可查看”、黄金/至尊 tab、价格卡、底部“马上开通/购买说明”，说明当前问题首先落在“会员阻断弹窗”链路。
- 同批缺陷里还存在会员阻断弹窗的关联问题，例如“根据选中价格档位切换权益标题”“购买说明缺失”“默认 tab 选错”等，说明这是一组围绕会员阻断弹窗和会员套餐展示的联动问题，而非单一价格渲染问题。

## Technical Context
- 会员阻断弹窗主实现位于 `components/member-unlock-modal/index.ts`、`components/member-unlock-modal/index.wxml`。该组件会构造 4 个可展示档位：3 个黄金会员档位 + 1 个至尊会员档位。
- 价格数据主来源不是前端常量，而是 `services/member.ts` 中的 `fetchMemberPlans()`，请求 `/api/v1/membership/plans` 后通过 `services/api-mapper.ts` 的 `mapMembershipPlanItem()` 映射 `price`、`origin_price`、`days` 等字段。
- `components/member-unlock-modal/index.ts` 虽然存在 `FALLBACK_PLANS` 前端兜底套餐，但这组价格只会在“接口失败或返回空列表”时生效；如果接口成功返回了价格为 `0` 的 4 档数据，当前弹窗会直接显示 `0元`。
- 会员中心页 `pages/member-center/index.ts` 也复用了同一套 `fetchMemberPlans()` 数据流，因此如果后续真的要改“4 档价格”，通常不能只改一个弹窗，还要评估 `pages/member-center/index.ts` 与支付链路的一致性。
- 后端仓库 `/Users/firingj/Projects/GodQinJia` 中，`internal/pkg/types/membership_types.go` 已枚举 4 个稳定套餐类型：`gold_quarter`、`gold_year`、`gold_forever`、`supreme_forever`，说明“4 档”是后端一等概念，价格更可能属于后端/环境配置，而非单纯前端文案问题。

## Missing Context
- 缺少产品/测试确认：这是“临时测试数据需求”还是“正式缺陷修复要求”。
- 缺少环境范围确认：仅测试环境需要改成 `0.01/0.02/0.03/0.04`，还是所有环境都要改。
- 缺少影响范围确认：只改会员阻断弹窗显示，还是要同步会员中心页、下单接口返回金额、微信支付金额、首页待支付横幅、订单记录等所有价格展示与交易结果。
- 缺少后端接口样例：当前 `/api/v1/membership/plans` 在测试环境是否固定返回 `0`，以及订单创建 `/api/v1/order/create` 是否允许实际支付 `1/2/3/4` 分，均未提供证据。

## Likely Surfaces
- `components/member-unlock-modal/index.ts`
- `components/member-unlock-modal/index.wxml`
- `services/member.ts`
- `services/api-mapper.ts`
- `pages/member-center/index.ts`
- 后端价格来源：`/Users/firingj/Projects/GodQinJia/internal/pkg/types/membership_types.go` 及对应 membership/order service 配置

## Recommended Next Action
- 结论：`manual_triage`，当前不建议直接进入 `generate_plan`。
- 建议先由产品/测试/后端三方明确以下问题：
- 1. 这是临时联调需求还是正式产品改价需求；
- 2. 只需要“页面显示测试价”，还是要“真实支付也按 1/2/3/4 分下单”；
- 3. 生效范围是否包括会员阻断弹窗、会员中心页、首页待支付横幅、订单记录与支付回调链路；
- 4. 若仅为测试环境改价，应优先作为后端/配置任务处理，因为前端当前主要消费的是接口下发价格。
- 若上述问题确认后，后续任务可再拆分为：后端测试价配置、前端展示一致性检查、支付链路验收三个独立计划项。
