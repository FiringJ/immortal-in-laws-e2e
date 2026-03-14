# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 首页关闭订单提醒后，退出并重新进入小程序仍再次显示提醒栏
## Cleaned Problem
用户在首页看到“待支付订单”固定提醒栏后，点击右上角关闭按钮（“叉”）将其关闭；随后退出小程序并重新进入，同一笔/同一批未支付订单的提醒栏再次出现。期望行为是：对同一未支付订单提醒，用户本次关闭后，在重新进入小程序时不应再次显示，除非未支付订单集合发生变化（如出现新订单、原订单状态变化或提醒对象发生变化）。

## Source Quality
- 原始描述明确包含当前行为、期望行为。
- 附件截图清楚展示了首页底部固定的未支付订单提醒栏，能定位到具体 UI 模块。
- 缺少录屏和复现步骤细节，但不影响进入后续计划阶段。

## Product Context
- 问题页面是首页 `pages/index/index`，截图中的底部 tab 为“今日推荐 / 消息 / 我的”，与页面拓扑一致。
- 首页底部存在固定状态横幅能力；除“未支付订单”外，同区域还会显示“您未开启每日推荐服务”等固定提醒。
- 订单详情/记录页入口在 `pages/settings-orders/index`，首页提醒栏的“立即支付”是快捷支付入口。
- 该问题属于用户主动关闭提醒后的会话连续性问题，影响首页主路径体验，且优先级为 P0。

## Technical Context
- 首页未支付订单提醒栏模板位于 `pages/index/index.wxml`，显示条件是 `unpaidOrderCount > 0 && !hideUnpaidBanner`。
- 首页逻辑位于 `pages/index/index.ts`：
  - `onShow()` 每次页面重新展示时都会调用 `refreshStatusBanners()`，因此“退出小程序再回来”一定会重新走提醒计算。
  - `onCloseUnpaidBanner()` 已将关闭态写入本地存储键 `home_unpaid_banner_dismiss_key`，并将 `hideUnpaidBanner` 置为 `true`。
  - `refreshStatusBanners()` 会重新拉取 `fetchOrderList(0, 100)`，筛选 `pending/unpaid` 订单，计算 `unpaidOrderIdentity`，再读取本地存储并通过 `dismissedIdentity === unpaidOrderIdentity` 决定是否继续隐藏。
- 本地存储封装位于 `utils/storage.ts`，`setSync/getSync` 为持久化同步存储，不会因普通前后台切换而自动丢失。
- 当前源码已存在“关闭后跨页面/跨重进隐藏”的设计，因此若线上仍复现，说明更可能是以下几类问题：
  1. `unpaidOrderIdentity` 在重新进入后发生变化，导致关闭态匹配失败；
  2. 订单列表接口返回的主订单标识不稳定（例如 `orderNo` 缺失，退化到 fallback identity，而 fallback 又依赖标题/过期时间/数量等可能变化字段）；
  3. 线上运行版本落后于当前仓库代码，或该逻辑在其他分支/构建产物中未生效。

## Missing Context
- 缺少稳定复现步骤：是“后台切前台”还是“彻底杀进程后重进”。
- 缺少复现账号和对应订单样本，暂无法核对接口返回的 `orderNo / createdAt / expireAt / status` 是否稳定。
- 缺少线上包版本/分支信息，无法确认问题是否已被当前仓库代码覆盖。
- 缺少接口日志，无法确认重进后首页命中的“主订单”是否与关闭前为同一条。

## Likely Surfaces
- `pages/index/index.ts`：未支付订单提醒的关闭、恢复、identity 计算、`onShow` 刷新入口都在这里。
- `pages/index/index.wxml`：提醒栏可见条件与关闭按钮事件绑定在这里。
- `services/order.ts`：订单列表字段映射来源，若 `order_no` / `expire_at` / `created_at` 不稳定，会直接影响 identity。
- `utils/storage.ts`：关闭态持久化读写封装。
- `app.ts`：小程序前后台切换入口，虽当前未清理该 key，但这里是生命周期联动排查点。

## Recommended Next Action
建议进入 `generate_plan`。后续计划应优先做以下核查与修复设计：
- 先复现实机/模拟器路径，确认是前后台返回还是冷启动重进。
- 打点或调试 `refreshStatusBanners()` 前后 `dismissedIdentity`、`unpaidOrderIdentity`、订单列表首条未支付订单的关键字段。
- 若 identity 依赖了易变化字段，改为基于稳定订单主键（优先 `orderNo`）持久化关闭态；必要时按“已关闭订单号集合”而非单一 fallback 字符串处理。
- 为首页提醒栏补充最小回归覆盖，验证“关闭 -> 再次 onShow -> 同单不再出现；订单变化后可重新出现”。
