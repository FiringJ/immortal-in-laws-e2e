# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 嘉宾消息列表编号与详情页相亲编号不一致，应保持一致
## Cleaned Problem
在 `pages/message/index` 的会话列表中，同一位嘉宾展示的编号与进入 `pages/guest-detail/index` 后展示的详情页编号不一致。当前用户反馈是“消息列表的家长编号与详情页的标号不一致，正确应一致”。结合现有前端实现可进一步归一化为：消息列表行内 `{{item.displayId}}` 与详情页 `相亲编号: {{view.matchId}}` 没有使用同一套编号来源，导致用户在消息列表识别到的对象编号，进入详情页后变成了另一串号码。期望行为是：同一嘉宾在消息列表、聊天/详情链路中应展示同一个对外编号，避免身份识别混乱。

## Source Quality
- 飞书原始描述虽然很短，但已经明确指出了异常模块（嘉宾消息）、对比面（消息列表 vs 详情页）和期望结果（一致）。
- 本地附件 `agent-memory/defect-reports/attachments/bug_ce6c773dbadf/image.png` 能证明消息列表当前确实在展示编号，如截图中的 `编号6683`，因此问题并非纯文字猜测。
- 但源信息缺少同一嘉宾详情页的对照截图、复现账号、具体 conversation/child_id、接口返回样本或抓包日志，无法仅凭原始材料直接断定哪一侧才是正确值，因此 `source_quality` 评为 `medium` 而不是 `high`。

## Product Context
- 页面拓扑显示消息主路径为 `pages/message/index -> pages/chat/index -> pages/guest-detail/index`；聊天页顶部卡片和白色摘要卡都可继续进入详情页，因此“消息列表编号”和“详情页编号”在用户连续浏览路径里是直接对比项。
- 详情页当前把该字段明确展示为 `相亲编号`，属于用户辨认嘉宾身份的核心信息之一；消息列表若显示另一套编号，会直接影响“我正在和谁聊天”的识别可信度。
- 该问题位于消息模块核心列表页，且原始工单优先级为 `P0`，说明它被视为高影响的一致性缺陷，而不是单纯文案优化。

## Technical Context
- 消息列表页的编号来自前端格式化逻辑：`pages/message/index.ts` 中 `formatConversations()` 把 `displayId` 设为 `conv.guest.matchId || (conv.guest.id ? conv.guest.id.slice(-11) : '')`，也就是优先用 `matchId`，拿不到时回退到 `childId` 的尾段。
- 消息列表实际渲染 `displayId`：`pages/message/index.wxml` 使用 `{{item.guest.parent.nickname}} (编号{{item.displayId}})`。
- 详情页使用的是另一套来源：`pages/guest-detail/index.ts` 里 `buildGuestDetailView()` 把 `matchId` 设为 `guest.matchId || guest.id`，`pages/guest-detail/index.wxml` 显示为 `相亲编号: {{view.matchId}}`。
- 会话数据链路里，`services/api-mapper.ts` 的 `mapConversationItem()` 通过 `mapTargetChildToGuest(item?.target_child)` 构造 `Conversation.guest`。虽然 `mapTargetChildToGuest()` 支持读取 `match_id`，但它只会从会话接口返回的 `target_child` / `child_profile` 中拿值。
- 后端消息模块的当前契约并未显式提供这个字段：`/Users/firingj/Projects/GodQinJia/internal/pkg/types/message_types.go` 中 `TargetChildInfo` 只有 `child_id`、`family_name`、`identity`、`avatar`、`child_basic`；对应的后端文档 `docs/modules/06-消息模块-类型定义设计.md`、`/Users/firingj/Projects/GodQinJia/docs/swagger.yaml` 以及前端仓库 `docs/默认模块.openapi.json` 中 `types.ConversationItem` / `types.TargetChildInfo` 也都未声明 `match_id`。
- 这意味着当前极有可能出现以下链路：会话列表接口没有 `match_id` → 前端 `conv.guest.matchId` 为空 → 消息列表回退显示 `childId` 尾段；而详情页接口 `/api/v1/profile/child/{child_id}` 能返回 `match_id` → 详情页显示真正的相亲编号，于是两页不一致。
- 邻近一致性风险也存在于聊天页：`pages/chat/index.ts` 里仍有 `matchId: profile.user.id // TODO: 从后端获取真实的matchId` 这样的临时代码，说明消息/聊天链路上的编号来源整体还没有完全统一。

## Missing Context
- 缺少同一会话对象在“消息列表编号”和“详情页编号”上的成对截图，无法在 triage 阶段直接记录具体错配值。
- 缺少真实 `/api/v1/conversations` 响应样本，尚未验证线上/测试环境是否已经偷偷返回了 `target_child.match_id` 但前端映射遗漏；当前判断主要基于仓库内类型与文档契约。
- 业务表述里写的是“家长编号”，而详情页现有文案是“相亲编号”；是否需要连同字段命名/展示文案一起统一，目前没有额外 PM 说明。不过这不阻塞进入计划阶段，因为“同一嘉宾跨页显示同一个编号”这一核心问题已经足够明确。

## Likely Surfaces
- `pages/message/index.ts`
  - `formatConversations()` 的 `displayId` 生成逻辑是当前直接出错点。
- `pages/message/index.wxml`
  - 会话列表使用 `编号{{item.displayId}}` 展示错误来源，后续可能还要顺带统一标签文案。
- `services/api-mapper.ts`
  - `mapConversationItem()` / `mapTargetChildToGuest()` 决定会话列表能否拿到标准 `matchId`。
- `services/message.ts`
  - 若最终方案需要补充会话详情或补拉嘉宾详情来填充 `matchId`，这里会成为数据聚合层。
- `pages/guest-detail/index.ts`
  - 当前更像“正确编号”的参考面；后续需确认消息链路是否应与它完全对齐。
- `/Users/firingj/Projects/GodQinJia/internal/pkg/types/message_types.go`
  - 若要从根上消除前端回退逻辑，后端消息会话返回结构可能需要补出 `target_child.match_id`。
- `/Users/firingj/Projects/GodQinJia/docs/swagger.yaml`
  - 作为接口契约面，若后端补字段，这里也需要同步更新。

## Recommended Next Action
建议进入 `generate_plan`。

后续计划建议优先围绕“统一编号来源”展开：
- 先确认产品上以详情页 `相亲编号` 作为对外唯一编号，还是存在独立“家长编号”概念；从现有页面实现看，详情页编号更像当前主标准。
- 再确认 `/api/v1/conversations` 实际响应是否包含 `match_id`；如果没有，优先评估补后端字段并前端直接消费，这是最稳妥的一致性修复。
- 若短期无法改后端，则需要设计前端兜底方案，例如基于 `child_id` 补拉详情/缓存 `matchId`，并评估消息列表性能与闪烁风险。
- 回归范围至少覆盖：消息列表编号、聊天页顶部资料卡编号、详情页相亲编号，对同一嘉宾必须完全一致。
