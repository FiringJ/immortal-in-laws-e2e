# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 首页未支付订单横幅倒计时错误显示为 00:00:00，应从 2 小时开始倒计时
## Cleaned Problem
- 缺陷对象已可定位为首页 `pages/index/index` 底部的未支付订单提醒横幅，而非每日推荐或超级曝光倒计时。
- 当前表现：横幅出现时，剩余支付时间直接显示为 `00:00:00`。
- 期望表现：当存在新的待支付订单（尤其是会员开通订单）时，横幅应从订单有效期开始展示倒计时，按 PRD 要求为精确到时分秒的 2 小时倒计时。
- 附件截图还显示标题退化为 `会员开通·0.01元`，没有带出具体套餐名（如年度/季度/永久黄金会员、至尊会员），这与产品要求不一致，说明订单展示字段可能也存在缺失。

## Source Quality
- 质量判断：`high`。
- 证据完整：飞书标题直接描述了症状和期望；附件截图清楚展示了首页底部橙色未支付订单横幅、`00:00:00` 倒计时和“立即支付”按钮。
- 需求可核对：PRD 明确规定“站内：首页底部提示未支付订单以及倒计时；倒计时精确至时分秒，总时长 2 小时；倒计时结束或点击叉后消失”。
- 代码面已收窄：首页横幅、订单列表映射、后端订单列表响应与订单过期时长均已找到明确实现位置。

## Product Context
- 入口页面是首页 `pages/index/index`。`agent-memory/page-topology.md` 已确认首页是推荐流主入口，当前缺陷截图也来自首页底部固定横幅区域。
- 横幅文案和交互属于“支付失败/存在待支付订单”的站内提醒，和会员开通流程直接相关；点击“立即支付”会继续拉起支付，点击关闭应隐藏当前横幅。
- 相关联页面为订单记录页 `pages/settings-orders/index`，但当前用户反馈的直接问题发生在首页底部提醒层。
- 设计稿 `design/3.设计稿/神仙亲家-首页-待支付1.png` 也对应同一首页待支付场景，设计中倒计时是正常运行态，不是 `00:00:00`。

## Technical Context
- 首页横幅由 `pages/index/index.ts` 的 `refreshStatusBanners()` 驱动：
  - 调用 `fetchOrderList(0, 100)` 拉取订单；
  - 过滤 `pending/unpaid` 订单；
  - 选取一笔主订单展示 `unpaidOrderTitle`、`unpaidOrderExpireAt`、`unpaidOrderCountdownText`；
  - 页面定时器 `updateCountdown()` 每秒用 `unpaidOrderExpireAt - now` 刷新倒计时。
- 前端订单映射在 `services/order.ts`，当前首页逻辑依赖这些字段：`expire_at`、`product_name`、`plan_type`、`created_at`。
- 前端首页存在 2 小时兜底逻辑：当列表项没有 `expireAt` 时，`resolveOrderExpireAtMs()` 会尝试 `createdAt + 2h`，否则再退回 `Date.now() + 2h`。
- PRD 与后端服务都明确“2 小时”规则：
  - PRD：会员支付失败后的首页待支付提醒，总时长 2 小时；
  - 后端 `internal/apiserver/service/order.go` 中 `orderExpireDuration = 2 * time.Hour`。
- 已发现一个强相关字段不一致：
  - 前端 `services/order.ts` 试图从订单列表项读取 `expire_at`、`product_name`、`plan_type`；
  - 但后端 `internal/pkg/types/order_types.go` 的 `OrderItem` 列表结构只定义了 `order_no / order_type / amount / status / created_at / paid_at`；
  - 后端 `internal/apiserver/service/order.go` 的 `buildOrderItem()` 也确实没有把 `expire_at`、`product_name`、`plan_type` 写入列表响应。
- 该字段缺失已经被截图侧面印证：标题显示成了通用的 `会员开通·0.01元`，说明首页没拿到套餐名，只能走前端兜底文案。
- `00:00:00` 的直接成因仍需结合真实接口响应确认，但高概率与订单过期信息缺失/创建时间兜底链路不可靠有关；其中 `created_at` 目前是后端格式化后的字符串，前端用 `Date.parse()` 解析，属于小程序运行时常见脆弱点。

## Missing Context
- 缺少一份当前环境真实的 `/api/v1/order/list` 返回样例，无法最终确认线上返回是否完全缺失 `expire_at/product_name/plan_type`，或是否还有字段名/格式偏差。
- 缺少最小复现步骤（例如“会员中心下单后取消支付，再回首页”），不过从截图和产品规则已足够进入计划阶段。
- 缺少一个“新建未支付订单”的时间点信息，因此还不能断言 `00:00:00` 是立即出现，还是订单已实际超时但状态仍被识别为待支付。
- 尚未抓到运行时日志，无法直接验证 `created_at` 在当前小程序 JS 运行时是否被稳定解析。

## Likely Surfaces
- 前端首页横幅逻辑：`pages/index/index.ts`、`pages/index/index.wxml`。
- 前端订单数据映射：`services/order.ts`、`types/order.ts`。
- 前端订单记录页同样依赖 `productName`：`pages/settings-orders/index.ts`，属于同一数据契约风险面。
- 后端订单列表契约：`/Users/firingj/Projects/GodQinJia/internal/pkg/types/order_types.go`。
- 后端订单列表装配：`/Users/firingj/Projects/GodQinJia/internal/apiserver/service/order.go` 中 `buildOrderItem()`。
- 需求/设计依据：`design/1.需求文档/神仙亲家--小程序产品需求文档.md`、`design/3.设计稿/神仙亲家-首页-待支付1.png`。

## Recommended Next Action
- 结论：可直接进入 `generate_plan`，不需要人工补充才能继续。
- 建议计划优先级：
  1. 先抓一份真实 `/api/v1/order/list` 响应，验证待支付订单在当前环境下的 `status / created_at / expire_at / product_name / plan_type` 实际返回；
  2. 对齐前后端订单列表契约，优先让列表接口直接返回首页所需的 `expire_at / product_name / plan_type`；
  3. 前端保留并强化兜底：对 `created_at` 做小程序兼容解析，避免时间字符串解析失败时倒计时异常；
  4. 补充回归点：新建待支付会员订单后，首页横幅应显示具体套餐名与约 `02:00:00` 初始倒计时，并按秒递减；订单超时或关闭后横幅消失。
