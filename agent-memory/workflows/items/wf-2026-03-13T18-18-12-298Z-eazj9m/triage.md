# Triage
- readiness: needs_human
- source_quality: medium
- next_action: manual_triage
- normalized_title: 解锁记录页：解锁我 24 小时时效展示与权限规则异常，且“我解锁的”阻断预期待确认
## Cleaned Problem
该缺陷落在 `pages/message-record/index` 的“解锁记录”页，原始描述混用了“解锁我 / 我解锁的”两个 tab，需要拆成两部分理解：

1. **可确认的问题方向**：按 PRD，“24 小时内免费查看”和“已过期”属于 **`解锁我`（other_to_me）** tab 的时效规则；超过 24 小时且双方未建立私信时，非会员应被会员阻断，而不是无条件放行。
2. **待确认的问题方向**：原缺陷第 2 条写的是“`我解锁tab` 的所有嘉宾，无论会员身份与否，都无阻断”。但 PRD 明确写的是 **`我解锁的`（me_to_other）本来就不该阻断**。因此该条要么是缺陷描述写错 tab，要么是产品规则已变更但仓库内 PRD 未更新。

基于当前仓库证据，更精确的 cleaned brief 应为：
- `解锁我` tab 的 24 小时时效展示（倒计时 / 已过期）与非会员访问控制需要复核；
- 原工单第 2 条中的“我解锁 tab 需要阻断”与现 PRD 冲突，进入计划前需先由产品 / QA 明确预期 tab。
## Source Quality
- **优点**：
  - 有明确页面范围：记录页 / 解锁记录。
  - 有本地附件证据：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_d4c1f46944dc/image.png`。
  - 附件内容不是纯截图现象，而是 PRD 摘录，能直接对照需求。
- **不足**：
  - 缺陷标题把“解锁我”和“我解锁的”混在一起，第二条与 PRD 现文冲突。
  - 没有附带账号、会员态、是否已有私信、具体 tab 截图或接口响应，无法直接判断是 FE 逻辑错、BE 返回错，还是提单时表述错。

因此 source quality 评为 `medium`，不足以直接进入无歧义的 plan generation。
## Product Context
- 该问题属于“消息 → 记录页 → 解锁记录”流程，页面路由为 `pages/message-record/index`。
- 入口分两类：
  - 消息页金刚区点击 `解锁我的`，默认进入 `type=unlock`，未显式带方向，页面会按默认方向展示 `解锁我`：`pages/message/index.ts:242`。
  - 我的页功能入口点击 `解锁记录`，显式进入 `type=unlock&direction=me_to_other`，即 `我解锁的`：`pages/profile/index.ts:430`。
- PRD 对解锁记录的定义在 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:144`：
  - 解锁记录分为“解锁我”和“我解锁的”两个 tab，默认选中“解锁我”。
  - **`解锁我`**：24 小时内显示“24 小时内免费查看 xx:xx:xx”；超过条件时，非会员应有会员阻断。
  - **`我解锁的`**：无论己方是否会员，点击卡片/联系对方都应直接进入详情或私信，不应阻断。
- 附件 `image.png` 与上述 PRD 内容一致，能作为产品侧证据。
## Technical Context
### 前端现状
- 页面默认方向是 `other_to_me`，即默认展示“解锁我”：`pages/message-record/index.ts:52`, `pages/message-record/index.ts:93`。
- 解锁列表接口映射未见明显取反：
  - `me_to_other -> /api/v1/interaction/my-unlocks`
  - `other_to_me -> /api/v1/interaction/unlocked-me`
  - 见 `services/record.ts:248`。
- FE 的展示 helper 已把“过期/已过期”**只**绑定到 `解锁我` tab：
  - `pages/message-record/helpers.ts:182`
  - `pages/message-record/helpers.ts:218`
  - `pages/message-record/helpers.ts:256`
  这说明从静态代码看，前端并没有把“24 小时内免费查看 / 已过期”显式写到 `我解锁的` tab 上。
- 但 FE 的点击逻辑目前对 **两个解锁 tab 都直接放行**：
  - `pages/message-record/index.ts:420` 到 `pages/message-record/index.ts:429` 中，只要是 `recordType === unlock`，无论 `解锁我` 还是 `我解锁的`，`联系对方` 都直接跳 `chat`。
  - `pages/message-record/index.ts:371` 到 `pages/message-record/index.ts:401` 中，详情点击也没有针对 `解锁我` 做 24 小时 / 会话 / 会员态阻断。
- 这意味着：
  - **`解锁我` tab 缺少会员阻断是前端已确认问题。**
  - **“我解锁的 tab 无阻断”本身并不是前端证据中的问题，反而与 PRD 一致。**

### 后端现状
- 后端接口命名与 FE 路由语义一致：
  - `unlocked-me` 对应“解锁我”：`/Users/firingj/Projects/GodQinJia/internal/apiserver/handler/interaction.go:422`
  - `my-unlocks` 对应“我解锁”：`/Users/firingj/Projects/GodQinJia/internal/apiserver/handler/interaction.go:461`
- 后端 `InteractionInfo` 会返回 `expire_at` / `is_expired`，说明“已过期”字段链路是存在的：
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/types/interaction_types.go:89`
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go:35`
- 但后端权限计算较粗，只按 `isVip / hasUnlocked / remainingQuota` 给 `can_view_detail` 与 `can_contact`：
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go:45`
  - `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go:46`
- 当前仓库内未看到后端直接编码“解锁我 tab 超过 24 小时后且无私信则阻断”的完整规则，因此如果现场真出现“24 小时逻辑在错误 tab 展示”，还需要补抓接口 payload 或联调环境复现，不能只凭静态代码下结论。
## Missing Context
- 需要 QA / 产品明确：原工单第 2 条写的“我解锁 tab 要阻断”是否其实想表达 **`解锁我` tab**。
- 需要问题账号的最小复现条件：
  - 当前账号是否非会员 / 黄金 / 至尊；
  - 对方是否在 24 小时内解锁过我；
  - 双方是否已有私信会话；
  - 进入页面的真实入口是消息页金刚区还是我的页“解锁记录”。
- 需要接口证据确认“展示逻辑搞反了”到底发生在：
  - FE 取错 tab / 取错字段；
  - BE `unlocked-me` 与 `my-unlocks` 返回内容混淆；
  - 还是测试时进入的其实是另一个入口方向。
- 最好补充两份网络响应样本：
  - `/api/v1/interaction/unlocked-me`
  - `/api/v1/interaction/my-unlocks`
  并确认 `interaction_info.expire_at` / `interaction_info.is_expired` 是否只出现在 `unlocked-me` 场景。
## Likely Surfaces
- 前端页面逻辑：`pages/message-record/index.ts:259`
- 前端解锁页点击放行逻辑：`pages/message-record/index.ts:371`, `pages/message-record/index.ts:407`
- 前端解锁页展示态 / 已过期态：`pages/message-record/helpers.ts:180`, `pages/message-record/helpers.ts:218`, `pages/message-record/helpers.ts:250`
- 前端接口映射：`services/record.ts:136`, `services/record.ts:248`
- 前端入口路由：`pages/message/index.ts:242`, `pages/profile/index.ts:430`
- 后端接口入口：`/Users/firingj/Projects/GodQinJia/internal/apiserver/handler/interaction.go:422`, `/Users/firingj/Projects/GodQinJia/internal/apiserver/handler/interaction.go:461`
- 后端解锁返回字段 / 权限计算：`/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go:35`, `/Users/firingj/Projects/GodQinJia/internal/pkg/converter/interaction.go:45`
## Recommended Next Action
建议先做 **manual triage**，不要直接进 plan generation。推荐动作：

1. **先拆单或澄清预期**：请 QA/产品确认第 2 条究竟指 `解锁我` 还是 `我解锁的`。若坚持“我解锁的也应阻断”，需同步更新 PRD，因为现文档明确写的是不阻断。
2. **补一轮最小复现证据**：使用一个非会员账号分别从消息页和我的页进入解锁记录，抓取 `unlocked-me` 与 `my-unlocks` 响应，并记录：
   - header 文案是否出现在正确 tab；
   - `联系对方` 是否出现 `已过期` 态；
   - 超过 24 小时且无私信时，`解锁我` 是否仍可直接进详情/聊天。
3. **若按当前 PRD 执行后续计划**，优先把问题归并为：
   - A. `解锁我` 缺少 24 小时后的会员阻断；
   - B. `解锁我` 的已过期按钮态/文案需要联调确认；
   - C. 原工单第 2 条作为“描述待更正”回写给提单方。
