# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 待支付会员订单文案未区分会员档位，应显示年度/季度/永久黄金会员或至尊会员
## Cleaned Problem
- 当前缺陷不是“会员中心套餐文案”本身，而是**待支付会员订单的展示文案过于泛化**。附件截图显示首页固定待支付横幅展示为 `会员开通·0.01元`，无法让用户识别具体开通的是哪种会员。
- 期望行为已经足够明确：当待支付订单属于会员开通时，文案应明确展示具体档位，如 `年度黄金会员`、`季度黄金会员`、`永久黄金会员`、`至尊会员`，而不是统一显示 `会员开通`。
- 从截图看，已确认的异常落点是首页底部固定待支付横幅；后续计划阶段应顺带核查订单记录页等其他“待支付会员订单标题”展示位是否存在同类泛化。

## Source Quality
- 质量判定为 `high`：原始描述给出了明确的“现状 vs 正确文案”，并附带了本地截图证据。
- 附件 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_dc838438d8c1/image.png` 清楚显示当前 UI 为“您有2笔订单未支付 / 会员开通·0.01元 / 00:00:00过期 / 立即支付”，能够直接证明“会员类型未明确”。
- 虽然飞书里“Likely module”写的是会员中心，但截图底部 tab 高亮为“今日推荐”，说明**已确认异常页面是首页**，这属于可修正的上下文偏差，不影响进入后续计划。

## Product Context
- 路由与页面结构显示：首页是 `pages/index/index`，且项目 `tabBar` 为“今日推荐 / 消息 / 我的”；附件截图与该结构一致。
- `agent-memory/page-topology.md` 说明“订单记录”入口位于 `pages/settings/index -> pages/settings-orders/index`，因此“待支付会员订单”至少存在首页提醒与订单记录两个潜在查看面。
- `design/4.项目结构分析/项目结构分析.md` 将 `pages/index/` 标注为首页推荐页，并明确其依赖 `order.ts`；同文档将 `pages/member-center/` 标注为“套餐、权益、购买”页面，说明会员中心更像下单来源，而不是当前截图中的异常展示页。
- 现有产品文案中已经存在明确会员档位命名：项目内可见 `年度黄金会员`、`季度黄金会员`、`永久黄金会员`、`至尊会员` 等稳定术语，因此该缺陷属于现有命名未正确透传/映射，而不是新的产品命名定义。

## Technical Context
- 首页待支付横幅逻辑位于 `pages/index/index.ts`：`refreshStatusBanners()` 会调用 `fetchOrderList(0, 100)` 拉取订单，筛出 `pending/unpaid` 订单，并通过 `buildUnpaidOrderTitle()` 生成横幅标题。
- 同文件中已经存在会员档位解析逻辑 `resolveMembershipPlanLabel(planType, productName)`，并内置了一批 token 映射（如 `yearly_gold`、`quarter_gold`、`permanent_gold`、`supreme`）。截图仍出现 `会员开通·0.01元`，说明**当前真实订单返回值没有被这套映射命中，或上游返回字段过于泛化/缺失**。
- 订单数据来自 `services/order.ts` 的 `/api/v1/order/list`；当前前端只映射了 `order_type`、`product_name`、`plan_type`、`amount`、`status` 等字段。若后端真实返回的是其他 plan token，首页将回退到通用 `会员开通`。
- `pages/settings-orders/index.ts` 也会基于 `order.productName || orderTypeLabel` 生成标题；如果后端 `product_name` 同样是泛化值，则订单记录页也可能出现“会员开通”而非具体会员档位，属于高概率联动面。
- 会员中心页 `pages/member-center/index.ts` 内部已经使用 `年度黄金会员 / 季度黄金会员 / 永久黄金会员 / 至尊会员` 的成功文案和套餐分层命名，这进一步说明缺陷更偏向“订单展示映射不完整”，不是“会员中心缺失命名能力”。

## Missing Context
- 缺少一份真实待支付会员订单的 `/api/v1/order/list` 返回样例，暂时无法确认后端究竟返回的是哪一种 `plan_type` / `product_name`（例如 `annual_gold`、`gold_yearly`、`gold_forever`、中文名、或仅返回 `membership`）。
- 缺少产品确认“修复范围是否仅限首页待支付横幅，还是包括订单记录页 / 其他待支付订单入口”的显式说明；不过从缺陷描述看，至少“所有待支付会员订单标题不要泛化”是合理的后续审查范围。
- 缺少复现账号信息；但由于已有截图、明确期望和清晰代码落点，这不是计划阶段的阻塞项。

## Likely Surfaces
- `pages/index/index.ts`：待支付订单筛选、标题生成、会员档位映射，是当前缺陷的首要修复点。
- `pages/index/index.wxml`：首页固定待支付横幅的实际展示位，已被附件截图直接命中。
- `services/order.ts` 与 `types/order.ts`：订单字段映射入口，决定前端是否拿到足够的会员档位信息。
- `pages/settings-orders/index.ts`：订单记录页标题生成逻辑可能复用泛化文案，建议纳入同批审查。
- `pages/member-center/index.ts`：不是当前截图中的直接异常页，但它是会员下单来源，也是现有正确会员档位命名的参考实现。

## Recommended Next Action
- 结论：`generate_plan`。
- 跟进计划可直接围绕“待支付会员订单标题映射”展开，不需要先做人工澄清。
- 建议计划步骤：先抓真实订单 payload / mock 数据确认 `plan_type` 变体，再统一首页横幅与订单记录页的会员订单命名策略，最后补充针对不同会员档位的映射验证。
