# Triage
- readiness: needs_human
- source_quality: low
- next_action: manual_triage
- normalized_title: 我收藏的：已建立会话的嘉宾点击后应直达私信并按手机号情况弹出联系方式
## Cleaned Problem
- 问题归一化后可表述为：在 `我收藏的` 记录页中，如果目标嘉宾与当前用户已经建立过私信会话/已具备可联系状态，点击该嘉宾后应直接进入 `pages/chat/index`，并在“对方有手机号”时自动弹出联系方式；若无手机号，则只进入私信页，不弹联系方式。
- 现有来源仅说明“目前好像是会阻断”，没有明确说明是点击整张嘉宾卡、`详细资料/照片`、还是 `联系对方` 按钮时出现阻断，也没有说明当前实际弹出的阻断样式或路由结果。

## Source Quality
- 来源描述包含明显的待确认措辞：`好像`、`待测点`，更像验收备注而不是可直接实施的缺陷说明。
- 缺少截图、录屏、控制台日志、账号信息、嘉宾编号、会话编号，无法确认当前实际分支到底走到了“会员阻断”“解锁确认”“屏蔽态跳转”还是“未跳转”。
- 缺少关键前置条件：当前账号是否会员、剩余免费解锁次数是否大于 0、该“已建立过会话”是后端会话事实还是本地 `memberStore` 联系历史、对方是否存在手机号。
- 同批次还存在 3 条相邻的 `我收藏的` 联系分支缺陷（会员身份、非会员有次数、已建立过会话），说明这是同一大流程下的分支校验项，但当前单条描述仍不足以安全进入实现计划。

## Product Context
- PRD 在 `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 中明确了消息/联系行为：
  - `联系对方` / `打招呼` 应进入私信会话。
  - `拨打电话` 在满足会员或“双方已建立过私信会话（任一方发起都算）”时，应弹出联系方式；没有手机号时不应硬弹空内容。
- 现有实现中，嘉宾详情页已经存在与该预期高度相似的成熟链路：
  - `pages/guest-detail/index.ts:785` 通过 `unlockPrompt=1` 进入聊天页。
  - `pages/guest-detail/index.ts:802` 通过 `autoCall=1` 进入聊天页并触发联系方式弹层。
- `pages/chat/index.ts:538` 到 `pages/chat/index.ts:568` 已经支持“仅当手机号存在且联系方式已解锁时自动弹出电话弹层”，这与“没手机号则不弹”一致。

## Technical Context
- 记录页主路由位于 `pages/message-record/index.ts`，该页是 `pages/message/index` 与 `pages/chat/index` 之间的记录流量入口，且页面结构分析文档把它定义为“看过/收藏/解锁记录”的统一承载页。
- `pages/message-record/index.ts:432` 到 `pages/message-record/index.ts:470` 是 `我收藏的` → `联系对方` 的核心分支：
  - 通过 `currentRecord?.cardGuest?.canContact`、`memberStore.hasContacted()`、`memberStore.isUnlocked()` 判断是否“已建立联系/可直接联系”。
  - 命中后当前仅 `wx.navigateTo('/pages/chat/index?guestId=...')`，没有像嘉宾详情页那样传递 `autoCall=1` 或 `unlockPrompt=1`。
- `pages/chat/index.ts:597` 到 `pages/chat/index.ts:602` 在只给 `guestId` 时会先创建/复用会话再加载详情；但自动弹出联系方式依赖 `pendingAutoCall`，而该标志仅由 URL 参数 `autoCall=1` 触发。
- `pages/chat/index.ts:2587` 到 `pages/chat/index.ts:2589` 的 `getCounterpartyPhoneNumber()` 会在手机号为空时返回空串，因此聊天页本身已具备“无手机号则不弹”的保护。
- `services/api-mapper.ts:1283` 到 `services/api-mapper.ts:1372` 负责把交互记录映射为 `Guest.canContact`。这里把缺失的 `can_contact` 统一经 `toBoolean()` 转成 `false`，会让“后端未显式返回该字段”与“明确不可联系”在记录页看起来一样，可能导致“已建立过会话”识别依赖本地 `memberStore`，在换设备/清缓存后更容易误走阻断分支。
- `services/record.ts:107` 到 `services/record.ts:126` 会把 `mapInteractionItemToGuestSummary()` 的 `canContact` 透传给收藏记录，因此如果 mapper 侧丢失或误判，记录页的“已建立过会话”分支就会不稳定。

## Missing Context
- 需要明确点击热区：是点整张嘉宾卡、`详细资料/照片`，还是 `联系对方` 按钮。
- 需要明确“阻断”具体是什么：会员开通弹窗、免费解锁确认弹窗、已屏蔽弹窗/跳转、还是根本没有跳转。
- 需要至少一组稳定复现数据：当前账号、目标嘉宾编号、双方是否已有会话、对方是否有手机号、当前账号会员等级与剩余免费解锁次数。
- 需要说明“已建立过会话”的判定来源：以后端真实 `conversation` 为准，还是本地曾发过打招呼/曾解锁即算。
- 需要补一张截图或录屏，证明当前实际行为与预期不一致；否则该项仍然属于待验收观察点，而不是可直接落代码的缺陷。

## Likely Surfaces
- 页面入口：`pages/message-record/index.ts`
- 记录卡片点击热区：`components/pages/message-record/record-card/index.wxml`
- 收藏/记录数据装配：`services/record.ts`
- “已建立联系”字段映射：`services/api-mapper.ts`
- 聊天页自动联系方式弹层：`pages/chat/index.ts`
- 已有对照实现：`pages/guest-detail/index.ts`
- 本地联系状态兜底：`store/memberStore.ts`

## Recommended Next Action
- 结论：`manual_triage`。当前信息仍不足以无猜测进入计划生成。
- 建议先向 QA/产品补齐 4 个事实：
  - 点击的是哪个热区；
  - 当前实际出现的阻断样式；
  - 复现账号是否会员、剩余解锁次数多少；
  - 对方是否已有手机号、双方是否在后端已有会话。
- 若人工补充后确认是 `我收藏的 -> 联系对方` 分支问题，则后续计划大概率会集中在两类修正：
  - 对齐嘉宾详情页的聊天路由参数，按场景补传 `autoCall=1` / `unlockPrompt=1`；
  - 加固“已建立过会话/可联系”判定，优先基于后端 `can_contact` / 会话事实，而不是仅依赖本地 `memberStore`。
