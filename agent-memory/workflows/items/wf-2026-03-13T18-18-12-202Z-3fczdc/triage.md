# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 首页未支付订单横幅应只提示最新一笔订单
## Cleaned Problem
- 现象：首页底部未支付订单横幅会按全部待支付订单聚合提示，出现“您有2笔订单未支付”。
- 期望：该横幅只提示最新一笔待支付订单，不应继续按多笔订单数量做聚合提醒。
- 证据：附件截图显示首页橙色横幅文案为“您有2笔订单未支付”，右侧 CTA 为“立即支付”，与提报描述一致。
- 影响对象：存在多笔 `pending` 未支付订单的用户，尤其是在会员开通、实名认证、超级曝光多次尝试支付后更容易触发。

## Source Quality
- 原始描述同时给出了“当前表现”和“正确期望”，不是纯待测点。
- 附件截图直接证明了当前线上/测试环境存在多笔聚合提示。
- 仓库内已能定位到明确实现：首页横幅读取订单列表后统计全部待支付订单数量，并据此渲染标题。
- 缺口：源信息没有附带新的设计稿或精确文案规范，因此“单笔提示”的最终文案样式仍需在计划阶段一起确认，但不阻塞进入方案制定。

## Product Context
- 该问题发生在首页 `pages/index/index` 的底部橙色状态横幅，属于用户主流程中的强提醒入口。
- 从页面拓扑看，首页横幅的“立即支付”会把用户带入支付/订单相关链路；设置页中也有 `订单记录 -> pages/settings-orders/index` 的承接页面。
- 历史沉淀中，`agent-memory/restoration-runs/2026-03-05-home-unpaid-banner-ui.md` 曾明确把该横幅实现为“您有{n}笔订单未支付”的聚合样式，说明当前行为很可能是按既有还原思路实现出来的，而本缺陷是在此基础上提出新的产品纠偏。

## Technical Context
- 前端首页在 `pages/index/index.ts` 的 `refreshStatusBanners()` 中会调用 `fetchOrderList(0, 100)`，筛出 `pending/unpaid` 订单后计算 `unpaidOrderCount = unpaidOrders.length`，再把数量写回页面状态。
- 同一段逻辑又会从这些未支付订单里选出一笔 `primaryUnpaidOrder` 作为详情展示，但当前选择规则是“过期时间最早优先”，不是“最新创建优先”。
- 横幅结构本身已经支持展示单笔订单摘要：页面状态里有 `unpaidOrderNo / unpaidOrderType / unpaidOrderPlanType / unpaidOrderTitle / unpaidOrderExpireAt`，说明问题主要集中在“选哪一单”和“标题是否仍按数量聚合”两个点。
- 订单列表接口在后端 `internal/apiserver/service/order.go` 中按 `-created_at,-id` 倒序返回，天然具备“最新一笔”判定基础；前端 `services/order.ts` 也已拿到 `createdAt/orderNo/orderType/status` 等字段。
- 当前首页“立即支付”点击后并不是基于已有订单续付，而是重新调用 `createOrder(orderType, planType)` 创建新订单；因此本缺陷与“多次尝试支付后产生多笔 pending 订单”的上游问题存在直接关联，但两者不是同一个修复点。

## Missing Context
- “最新一笔”是否严格以 `created_at` 最新为准，还是按业务优先级（如会员 > 实名 > 曝光）或最近一次未过期订单为准，提报里未显式说明。
- 缺少更新后的视觉稿/文案稿，暂未确认横幅标题应改成固定单笔文案，还是保留“1笔订单未支付”这类数量表述。
- 未明确当用户同时存在多笔 `pending` 与 `expired` 订单时，首页横幅是否只关注可支付订单；现有实现与后端状态定义支持区分，但提报未写清过滤口径。
- 未明确关闭横幅后的本地 dismiss key 是否仍应绑定“某一单”，还是绑定“最新单版本”，这会影响关闭后新订单出现时的再次提醒策略。

## Likely Surfaces
- `pages/index/index.ts`：未支付订单筛选、主订单选取、横幅标题/identity 计算都在这里。
- `pages/index/index.wxml`：当前横幅标题区域使用数量型文案，后续计划大概率需要同步调整模板绑定。
- `pages/index/index.wxss`：如果标题从双行/计数态切成单笔态，可能需要轻微样式回归。
- `services/order.ts`：若计划阶段决定前端直接依赖接口顺序选“最新一笔”，这里可能需要补充/保留排序和字段映射说明。
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/order.go`：后端订单列表排序和状态定义是确认“最新一笔”规则的重要参照面。
- `../immortal-in-laws-e2e/agent-memory/restoration-runs/2026-03-05-home-unpaid-banner-ui.md`：已有实现依据写成了多笔聚合提示，后续方案需同步更新该上下文，避免再次按旧口径回归。

## Recommended Next Action
- 进入 `generate_plan`。
- 计划阶段优先确认三件事：
  1. 首页横幅改为“只看最新一笔”时，判定规则采用 `created_at` 最新还是其他业务优先级；
  2. 标题/副标题的目标文案是什么，是否需要新的设计稿或仅做逻辑纠偏；
  3. 是否要与上游“重复创建 pending 订单”问题联动处理，避免只改首页展示后仍持续堆积历史未支付单。
- 如果没有新增产品输入，默认可按“仅展示最新创建且仍可支付的一笔 pending 订单”先出实施计划，因为当前代码和接口都已具备落地条件。
