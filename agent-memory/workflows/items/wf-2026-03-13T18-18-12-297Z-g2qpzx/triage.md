# Triage
- readiness: needs_human
- source_quality: low
- next_action: manual_triage
- normalized_title: 解锁我测试点因缺少匹配数据暂无法验证
## Cleaned Problem
- 原始飞书在 2026-03-07 记录的不是已复现缺陷，而是一条验证阻塞备注：`解锁我` 测试点因为“无法匹配数据”而暂时无法验收。
- 结合仓库上下文，这个测试点对应消息页金刚区进入的 `pages/message-record/index?type=unlock&direction=other_to_me`，也就是记录页的 `解锁我` tab；`pages/message-record/index.ts` 默认方向本身也是 `other_to_me`。
- 当前描述没有说明实际卡住的是哪一层：是 `解锁我` 列表始终没有数据、测试环境无法构造“对方解锁我”的关系、还是拿到数据后点击详情/联系存在错误行为。
- 因此本条更像“测试数据未准备好时留下的待验证备忘”，并不是边界清晰、可直接进入实现计划的单点 bug。

## Source Quality
- 评为 `low`。
- 原始来源只有一句“目前测试因无法匹配数据，故此处无法验证，此测试点备忘录下”，没有截图、录屏、接口响应、账号信息、childId、会话号或稳定复现步骤。
- `item.json` 中也没有任何附件；当前证据不足以判断故障在前端页面、后端造数、测试环境数据，还是仅仅因为 QA 未拿到可用样本。
- 文案本身明确包含“无法验证”“备忘录”两层含义，属于典型待测/卡数据条目，按规则应标记为 `needs_human`。
- 同主题在 2026-03-11 已出现更明确的后续条目 `wf-2026-03-13T18-18-12-216Z-r58x6y`，该条目已经把 `解锁我` 的真实产品变更写清楚；这进一步说明当前 2026-03-07 条目更像早期待确认备注，而不是独立实现项。

## Product Context
- `agent-memory/page-topology.md` 与 `pages/message/index.ts` 一致：消息页金刚区点击 `解锁我的` 会进入 `pages/message-record/index?type=unlock`，再由记录页默认选中 `other_to_me` 方向，落到 `解锁我` tab。
- PRD `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 对记录页有完整定义：`解锁记录` 分为 `解锁我` / `我解锁` 两个 tab，默认应是 `解锁我`，并围绕“24 小时内免费查看”与聊天/详情放行条件展开。
- `design/4.项目结构分析/项目结构分析.md` 也把 `pages/message-record/` 定义为统一承载浏览/收藏/解锁记录的页面，当前条目所属模块判断明确。
- 但产品基线并不单一：2026-03-11 的后续条目 `wf-2026-03-13T18-18-12-216Z-r58x6y` 已把 `解锁我` 明确为“需求变更，取消会员阻断并保留 24 小时提醒文案”。因此当前 2026-03-07 备忘录若要继续验证，必须先确认应以旧 PRD 还是以 2026-03-11 的新规则为准。

## Technical Context
- 当前前端记录页主逻辑在 `pages/message-record/index.ts`：`loadData()` 会在 `recordType=unlock` 时调用 `fetchUnlockRecords()`，后者通过 `services/record.ts` 请求 `/api/v1/interaction/unlocked-me`。
- 现有页面事件里，`解锁我 / 我解锁` 并没有明显的本地会员阻断：`onRecordTap()` 未对 unlock tab 做额外拦截，`onContactTap()` 在 unlock tab 下会直接跳转 `pages/chat/index?guestId=...`。仅从当前前端路由分支看，这条“无法验证”备注并不能直接落成一个明确的前端 bug。
- 真正依赖数据的地方在接口与映射链路：`services/record.ts` 会把 `/api/v1/interaction/unlocked-me` 的列表映射成解锁记录，并继续按 `UNLOCK_FREE_VIEW_HOURS=24` 计算 `expiresAt/isExpired`；`pages/message-record/helpers.ts` 还会基于这些字段渲染“xx小时后过期/已过期”之类状态。
- 仓库内目前只找到会员调试入口（如 `pages/settings-debug/index.ts`、`services/member.ts` 的 debug activate/reset）；没有看到对应“造一条别人解锁我”的前端 debug 或 seed 入口。这说明 QA 所说“无法匹配数据”是有现实依据的，阻塞点很可能在测试数据准备而非页面代码本身。
- 另外，tracker 里已经有一条更清晰的 `解锁我` 后续单 `wf-2026-03-13T18-18-12-216Z-r58x6y`，并已 triage 为 `ready`。当前条目若继续单独推进，容易与那条更明确的需求变更/实现单重复。

## Missing Context
- 缺少至少一组可复现的测试数据：当前账号、目标账号、childId，以及能让 `/api/v1/interaction/unlocked-me` 返回非空结果的构造方式。
- 缺少对“无法匹配数据”的具体定义：是列表接口返回空、推荐/匹配机制拿不到样本、还是需要后端直接造数。
- 缺少一旦拿到数据后的实际异常描述：当前页面是否有错误跳转、错误阻断、错误倒计时、错误按钮态，还是只是纯粹没法开始测。
- 缺少规则基线确认：后续验证到底以仓库旧 PRD 为准，还是以 2026-03-11 的新条目 `wf-2026-03-13T18-18-12-216Z-r58x6y` 为准。
- 缺少是否需要将本条关闭为 duplicate / blocked-by-data 的产品或 QA 判断。

## Likely Surfaces
- `pages/message/index.ts`
- `pages/message-record/index.ts`
- `pages/message-record/helpers.ts`
- `services/record.ts`
- `store/messageStore.ts`
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/interaction.go`
- 测试环境数据准备链路（账号、关系数据、unlock 记录 seed）

## Recommended Next Action
- 结论：`needs_human`，建议 `manual_triage`。
- 不建议从当前条目直接生成实现计划；它本质上是“缺少可验证数据”的测试阻塞说明，而不是带有实际错误现象的 bug。
- 先由 QA/后端补齐一组稳定样本：给出两个可登录账号或直接提供造数方式，确保 `/api/v1/interaction/unlocked-me` 能稳定返回至少 1 条 `解锁我` 记录。
- 同时由产品/QA 明确验证基线：若当前应遵循 2026-03-11 的新规则，则本条更适合作为 `wf-2026-03-13T18-18-12-216Z-r58x6y` 的早期备忘/重复项，而不是单独计划。
- 只有在“有数据 + 有明确预期 + 已观察到实际错误”这三个条件都满足后，才适合把它重新整理为可执行的实现或回归计划。
