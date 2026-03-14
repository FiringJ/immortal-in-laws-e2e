# Plan

## Problem
- 当前会员、实名认证、超级曝光三个支付入口都会先创建订单，再拉起 `wx.requestPayment`；如果用户取消或支付失败，前端只提示并返回，没有调用取消订单接口，导致后端残留 `pending` 未支付订单。
- 这些入口每次重试都会生成新的幂等键：`services/member.ts`、`services/exposure.ts`、`services/order.ts` 都是时间戳/随机数策略；后端仅会在“幂等键相同”时复用已有订单，因此重复尝试会不断累积新的未支付订单，而不是续付原单。
- 首页已经把未支付订单当作重点提醒处理：`pages/index/index.ts` 会查询 `/api/v1/order/list`，筛出 `pending/unpaid` 并展示“您有 N 笔订单未支付”横幅；但点击后只跳到 `pages/settings-orders/index`，该页目前仅展示标题/时间/金额，没有“继续支付/取消订单”等闭环动作。
- 订单记录页还有两处映射缺口会放大问题定位难度：前端把实名认证类型写成 `realname`，但后端/接口定义实际是 `verification`；同时订单状态映射缺少 `expired`，过期单展示会退化为原始英文或模糊状态。

## Impact
- 这是 P0：用户一次正常的“取消支付/支付失败”就会留下待支付订单，首页持续出现未支付横幅，影响主流程和信任感。
- 重试支付会继续堆积未支付订单，横幅数量会越来越大，用户无法在当前前端自行清理或完成这些订单。
- 首页按钮文案是“立即支付”，但当前实际跳转到无操作能力的订单记录页，形成明显的死路 CTA。
- 该问题横跨会员、实名认证、超级曝光三个核心付费场景，且会影响订单统计与客服排查成本。

## Reproduction Hypothesis
1. 在 `pages/member-center/index.ts`、`pages/realname-auth/index.ts` 或 `pages/exposure/index.ts` 发起支付。
2. 订单创建成功后，在微信支付收银台主动取消，或制造一次支付失败。
3. 返回首页，`pages/index/index.ts` 再次调用 `fetchOrderList(0, 100)`，命中 `pending` 订单并展示未支付横幅。
4. 点击横幅进入 `pages/settings-orders/index`，只能看到静态订单卡片，无法继续支付或取消。
5. 再次回到业务页点击购买，会因为前端重新生成幂等键而创建新订单，未支付订单数继续增加。
6. 如果订单类型是实名认证，订单记录页标题还可能直接显示 `verification`，增加用户困惑。

## Evidence To Collect
- 抓取一次完整链路日志：`/api/v1/order/create` 成功 → 用户取消 `wx.requestPayment` → `/api/v1/order/list` 返回新增 `pending` 订单。
- 记录首页与订单记录页现状：
  - 设计稿 `design/3.设计稿/神仙亲家-首页-待支付1.png` 显示首页底部有强提示“立即支付”；
  - 设计稿 `design/3.设计稿/神仙亲家-我的-设置-订单记录1.png` 对应的是静态记录列表；
  - 需要确认产品预期是“在订单页继续支付”，还是“返回原业务页重新下单/支付”。
- 代码证据：
  - 前端没有任何 `/api/v1/order/cancel` 调用；
  - 后端已提供 `POST /api/v1/order/cancel`，且业务规则是“只能取消待支付订单”；
  - 后端创建逻辑只在幂等键相同时复用旧单，当前前端实现天然会制造重复未支付单。
- 额外核对：`/api/v1/order/list` 实际返回是否包含 `expired`、`product_name`、`expire_at`，以及是否存在继续支付所需参数；若无，则前端无法直接基于历史订单拉起支付。

## Initial Fix Direction
- 第一优先级先止血：在三个支付入口保留 `orderNo`，当 `wx.requestPayment` 返回用户取消或明确失败时，补调用 `POST /api/v1/order/cancel`，避免无意义的待支付订单残留。
- 同步补齐订单页闭环：为 `pages/settings-orders/index` 增加状态展示与动作区，至少覆盖 `pending / paid / canceled / expired / refunded`；其中 `pending` 需要产品明确“继续支付”方案。
- 对“继续支付”做接口确认：当前历史订单详情不返回支付参数，后端也没有现成 `repay` 接口，且前端不保留原始幂等键，因此需二选一：
  - 方案 A：前端在订单页点击“继续支付”时，跳回原业务页并重新创建订单，同时先取消旧未支付单；
  - 方案 B：后端补一个“续付/重新拉起支付参数”接口，订单页可直接恢复支付。
- 顺手修正订单映射一致性：把 `realname` 改为 `verification`，补上 `expired` 状态文案，分页优先使用接口返回的 `has_more`，避免订单列表体验继续跑偏。
- 验证口径：分别在会员、实名认证、超级曝光场景执行“创建订单后取消支付”与“再次重试支付”，确认不会再累计幽灵未支付订单，首页横幅数量与订单页状态一致。
