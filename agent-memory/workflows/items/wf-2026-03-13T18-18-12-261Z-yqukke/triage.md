# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 对方已解锁我并建立会话后，聊天页仍错误要求我先解锁对方才能发消息
## Cleaned Problem
用户反馈：当对方已经解锁我后，若双方会话已建立，则我方应可直接在聊天页发送消息，无需再次解锁对方；当前实际表现是聊天页仍处于“未解锁”状态，底部显示“解锁对方后可发送消息 / 立即解锁”，导致我方被错误拦截。

结合需求与截图，可归一为两类业务判定：
- 真人场景：应按“对方解锁我”的时间窗口/已建会话状态判定我方是否可聊。
- 机器人场景：可按“消息触发成功时间/已建会话”判定我方是否可聊。

本条缺陷的核心不是“能否进入会话”，而是“进入会话后，聊天输入权限是否仍被错误锁住”。截图已显示用户已进入 `聊天室`，底部也已展示 `交换微信 / 发送照片` 等按钮，但文本输入区仍被 `chat-unlock-tip` 替换，说明当前聊天页的“已解锁”判定与产品规则不一致。

## Source Quality
结论：`high`。

理由：
- 原始描述同时给出了期望行为与当前错误行为，核心业务规则明确。
- 附带截图，能直接证明当前 UI 处于“会话已打开但输入仍被锁”的状态。
- 需求文档可找到对应规则支撑，不需要靠主观猜测补全核心事实。

仍需后续计划阶段补充的仅是实现细节，而非问题定义本身，例如：机器人“消息触发成功时间”对应的后端字段名/数据源。

## Product Context
- 路由拓扑显示消息链路为 `pages/message/index` -> `pages/chat/index`，而 `pages/message-record/index` 承载 `解锁我/我解锁的` 记录入口。
- 需求文档明确写到：
  - `打招呼` 时，若“己方是会员”或“双方是否建立过私信会话（任一方发起都算）”满足任一条件，则应直接进入可聊会话。
  - `解锁我` 记录页要求判断“己方是否会员 / 对方是否在 24 小时内解锁了我 / 任一方是否发过私信”，满足任一条件后点击 `联系对方` 应进入私信会话。
- 因此，产品口径已经把“已建立私信会话”定义为可联系信号，而不是要求双方都各自完成一次解锁。

## Technical Context
前端与后端代码已经暴露出非常具体的错位信号：

1. 前端聊天页的最终门控依赖 `isUnlocked`
- `pages/chat/index.ts` 中，发送文本、拨打电话、交换微信、发照片、语音发送等入口都会先检查 `this.data.isUnlocked`。
- `pages/chat/index.wxml` 中，`isUnlocked=true` 才渲染 `chat-input-bar`；否则渲染 `chat-unlock-tip`，与截图现象一致。

2. 前端当前把“可聊”主要建立在 `guest.canContact` / `memberStore.canContact()` 上
- `pages/chat/index.ts` 的 `updateUnlockState()` 目前使用 `conversation.guest?.canContact === true || memberStore.canContact(conversation.guest)` 作为 `isUnlocked` 来源。
- `store/memberStore.ts` 的 `canContact()` 只覆盖：会员、后端直接给的 `guest.canContact`、本地已解锁记录、剩余免费解锁次数；没有显式纳入“该会话已建立/已解锁”的会话级信号。

3. 后端会话接口实际返回了 `is_unlocked`，但前端映射未消费
- 后端 `internal/pkg/types/message_types.go` 的 `ConversationItem` 明确带有 `is_unlocked`。
- 后端 `internal/apiserver/service/message.go` 在 `GetConversations` / `GetConversation` 中均返回 `IsUnlocked: conv.IsUnlocked == 1`。
- 前端 `services/api-mapper.ts` 的 `mapConversationItem()` 只尝试读取 `item.can_contact` / `item.canContact`，没有使用 `item.is_unlocked`，因此会话接口里已经存在的“已解锁”信号无法传到聊天页。

4. 后端会话解锁位会在发起打招呼/发送消息时落库
- 后端 `internal/pkg/logic/message/message_logic.go` 存在 `UpdateConversationUnlocked()`，会写入 `conversation.is_unlocked=1`。
- 后端 `internal/apiserver/service/message.go` 在创建打招呼消息、发送普通消息时，若会话尚未解锁，就会调用该逻辑置位。
- 这意味着“会话建立后可聊”至少已有一部分后端数据基础，但前端当前没有正确接住。

5. 仍有一个需要后续计划阶段审计的次级风险：后端 `CanContact` 口径可能也偏窄
- 后端 `internal/pkg/converter/interaction.go` 与 `internal/pkg/converter/recommend.go` 中，`CanContact` 目前仍是 `isVip || hasUnlocked || remainingQuota >= 1`。
- 该公式未体现“对方已解锁我”“任一方已发私信/会话已建立”等规则。
- 所以本缺陷的主因很可能是前端忽略 `is_unlocked`，但记录页、推荐页、详情页等其他入口是否也存在同类口径缺失，仍需在计划阶段一并排查。

## Missing Context
- 缺少一份可复用的真实接口样例，尚未直接看到故障会话的 `/api/v1/conversation/{id}` 返回体是否已经带 `is_unlocked=true`。
- 机器人场景中“消息触发成功时间”具体落在哪个字段、由哪个接口透出，当前仓库上下文未直接定位到字段名。
- 未拿到精确复现步骤（账号、目标用户、是从消息列表进入还是从 `解锁我` 记录页进入），但这不阻塞计划生成。

这些缺口属于实现核对信息，不影响将该问题推进到计划阶段。

## Likely Surfaces
- 前端页面：`pages/chat/index.ts`
- 前端视图：`pages/chat/index.wxml`
- 前端映射：`services/api-mapper.ts`
- 前端权限容器：`store/memberStore.ts`
- 前端相关入口：`pages/message/index.ts`、`pages/message-record/index.ts`
- 后端消息接口：`/Users/firingj/Projects/GodQinJia/internal/apiserver/service/message.go`
- 后端会话解锁逻辑：`/Users/firingj/Projects/GodQinJia/internal/pkg/logic/message/message_logic.go`
- 后端权限转换：`/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go`、`/Users/firingj/Projects/GodQinJia/internal/pkg/converter/recommend.go`

## Recommended Next Action
建议进入 `generate_plan`。

推荐后续计划重点：
- 先以最小改动验证前端是否遗漏消费 `conversation.is_unlocked`：在会话映射层补齐该信号，并让聊天页 `isUnlocked` 判定优先识别会话级已解锁状态。
- 同步审计 `解锁我`、消息列表、嘉宾详情等入口是否仍依赖过窄的 `can_contact` 口径，避免只修聊天页造成入口行为不一致。
- 若前端接入 `is_unlocked` 后仍不满足“真人按解锁时间、机器人按消息触发成功时间”的规则，再继续下探后端 `CanContact` / `conversation.is_unlocked` 的置位口径。

当前信息足以制定实现计划，不属于待产品澄清或证据不足项。
