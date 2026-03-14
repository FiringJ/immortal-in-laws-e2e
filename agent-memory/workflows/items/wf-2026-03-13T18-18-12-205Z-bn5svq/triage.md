# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 首页待支付横幅点击范围错误，立即支付应仅按钮触发并按最近待支付订单重新拉起支付
## Cleaned Problem
- 缺陷发生在首页底部的待支付订单横幅，截图显示为固定在 tabBar 上方的红色横幅，包含文案“您有2笔订单未支付”和 CTA“立即支付”。
- 当前已知异常有两个：其一，点击“立即支付”会跳到订单记录页；其二，点击按钮以外的整条横幅也会跳到订单记录页。
- 期望行为是：只有点击 CTA 按钮才触发支付；点击横幅正文区域不应跳转；支付动作应针对最近 1 笔待支付订单重新拉起支付，而不是进入订单记录页。

## Source Quality
- 质量判断为 `high`：原始描述明确给出了现状、期望行为、优先级 `P0`，并附带本地截图证据 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_028c6ceaf388/image.png`。
- 仓库内已能定位到明确页面与处理函数，当前 `HEAD` 的已提交实现与缺陷描述一致，说明该问题不是纯口头反馈，而是可直接落到源码表面的缺陷。

## Product Context
- `agent-memory/page-topology.md` 显示订单记录页为 `pages/settings-orders/index`，它是设置页中的正式订单入口，不应由首页待支付横幅整栏承接点击。
- 截图显示问题页面是首页 `pages/index/index`，待支付横幅为固定底部浮层，位于 tabBar 上方，符合首页状态横幅的产品位置而非设置页内容区。
- 按反馈文案，产品意图是把首页横幅当作“快捷补支付”入口，而不是“订单记录跳转卡片”。因此 CTA 与非 CTA 区域需要拆分交互语义。

## Technical Context
- 在当前已提交源码中，`pages/index/index.wxml` 的待支付横幅根节点曾绑定 `bindtap="onViewUnpaidOrders"`，而 CTA 本身没有独立支付点击逻辑；这会导致点击按钮和点击横幅正文都落到同一个跳转处理。
- `pages/index/index.ts` 中的 `onViewUnpaidOrders()` 直接 `wx.navigateTo({ url: '/pages/settings-orders/index' })`，与缺陷中的“跳到了订单列表页”完全对应。
- 待支付横幅的数据来自 `pages/index/index.ts` 的 `refreshStatusBanners()`：它调用 `fetchOrderList(0, 100)` 后筛出 `pending/unpaid` 订单，再选出一笔订单用于横幅展示和后续操作。
- 当前工作区里已经存在未提交的候选修复：`pages/index/index.wxml` 去掉了根节点整栏点击，给 `立即支付` 按钮单独绑定 `onPayLatestOrderTap`；`pages/index/index.ts` 新增了通过 `createOrder(...)` + `requestPayment(...)` 重新拉起支付的逻辑，并把 `unpaidOrderType`、`unpaidOrderPlanType` 存入页面状态。
- `services/order.ts` 里的 `createOrder()` 当前只支持 `order_type`、`plan_type`、`idempotency_key`，没有 `order_no` 或“复用历史订单金额”的参数；因此“按最近 1 次订单价”能否做到严格复用历史金额，取决于后端 `createOrder` 的定价语义。
- 额外注意：当前工作区里的选单逻辑 `pickPrimaryUnpaidOrder()` 是按“最早过期”排序，不是按“最近创建”排序；若产品所说“最近 1 次订单”字面上指最新创建的一单，后续计划需要核对并修正这一点。

## Missing Context
- 需要在计划阶段确认“最近 1 次订单价”的精确定义：
  - 是复用最近待支付订单的 `order_type + plan_type` 重新下单即可；
  - 还是必须严格复用那笔历史订单的金额 / 订单号。
- 如果是后者，现有前端与接口文档都未暴露按 `order_no` 重新拉起支付的能力，可能需要后端补接口或确认 `createOrder` 已隐式按最近订单金额定价。
- 需要确认“最近 1 次订单”选择规则是否按 `createdAt` 最新、接口返回首条，还是按最早过期优先。现有候选实现偏向“最早过期”，与文案“最近”不完全等价。

## Likely Surfaces
- `pages/index/index.wxml`
- `pages/index/index.ts`
- `services/order.ts`
- `utils/payment.ts`
- `pages/settings-orders/index.ts`
- `pages/settings-orders/index.wxml`

## Recommended Next Action
- 进入 `generate_plan`。该缺陷的页面、错误交互、当前错误处理函数、以及候选修复面都已定位清楚，足以进入计划阶段。
- 计划应优先覆盖三件事：
  1. 首页待支付横幅仅保留按钮点击支付，移除整栏跳转；
  2. 用“最近 1 笔待支付订单”所需的订单标识重新拉起支付，并核对是否满足“最近订单价”语义；
  3. 验证点击按钮以外区域不跳转、点击按钮不进入订单记录页、支付成功/取消后横幅状态刷新正确。
- 由于工作区已有未提交候选改动，计划阶段应先把这些改动视为现成线索而不是重新猜修复方向，并补做“最近一单选择规则”和“历史金额语义”检查。
