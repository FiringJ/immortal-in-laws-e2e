# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 至尊会员在嘉宾详情点击“交换照片”被误弹“去登记资料”
## Cleaned Problem
- 使用测试号 `15717136585`，在嘉宾详情页的“交换照片”入口点击后，当前弹出的是“您还未登记孩子的相亲资料 / 去登记”弹窗，而不是进入交换照片流程。
- 附件截图显示页面顶部标题为“相亲资料”，且页面中部存在“交换照片后可看清晰照片”区域，和 `pages/guest-detail/index` 的当前实现一致，说明问题更像发生在嘉宾详情页，而不是会员中心首页。
- 缺陷描述明确强调“至尊会员身份”，因此该问题的关键不是普通会员阻断，而是至尊会员在交换照片入口被错误分流到“资料登记”提示。

## Source Quality
- 质量评估为 `high`：缺陷单提供了测试账号、明确操作按钮、明确错误弹窗文案、优先级 `P0`，并附有本地截图证据 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_69f52e9040b0/image.png`。
- 虽然原始单据未直接写出页面路由或目标嘉宾 ID，但截图和仓库实现足以把问题收敛到 `pages/guest-detail/index` 的交换照片分支。
- 当前缺少接口日志与目标对象 ID，不利于一步确认“账号无照片”还是“前端误判”，但不影响进入后续计划生成。

## Product Context
- 产品需求文档中，“交换照片”的口径是：点击后先判断“己方是否会员或剩余联系次数是否 ≥ 1”；满足任一项，则成功发起交换照片请求并进入私聊；若都不满足，才提示“交换照片需先解锁对方联系方式”。见 `/Users/firingj/Projects/GodQinJia/docs/xuqiu.md:73`。
- 后端配套的前端接入指南进一步明确：详情页点击“交换照片”应调用 `POST /api/v1/photo-exchange/request`，成功后进入会话页；权限不足时才展示“交换照片需先解锁对方联系方式 / 联系次数不足”。见 `/Users/firingj/Projects/GodQinJia/docs/modules/06-消息模块-交换照片前端接入指南.md:34`。
- 聊天页另有“发送照片”流程；如果家长没有已上传照片，应在照片弹框内提供“点击上传/点击更换”能力，而不是跳转成完整“去登记资料”提示。见 `/Users/firingj/Projects/GodQinJia/docs/xuqiu.md:444`。
- 本地设计稿也区分了“首页-对方资料-交换照片-弹窗”和“消息-聊天室-发送照片-弹窗”，说明“交换照片”和“发送照片”是两个相关但不同的交互面。设计稿路径：`design/3.设计稿/神仙亲家-首页-对方资料-交换照片-弹窗1.png`、`design/3.设计稿/神仙亲家-消息-聊天室-发送照片-弹窗1.png`。

## Technical Context
- 嘉宾详情页“交换照片”按钮位于 `pages/guest-detail/index.wxml:74`，错误弹窗“您还未登记孩子的相亲资料”位于 `pages/guest-detail/index.wxml:269`。
- 详情页的 `openPhotoExchangeConfirmModal()` 会先取自己的孩子照片；只要 `getSelfExchangePhotoUrl()` 返回空值，就直接把 `showProfileRegisterModal` 设为 `true`，弹出“去登记资料”弹窗。见 `pages/guest-detail/index.ts:918`。
- `performExchangePhoto()` 在真正执行交换前又重复了一次同样的空照片判断，因此即使是至尊会员，也会先被本地“是否存在 self photo URL”门槛拦住。见 `pages/guest-detail/index.ts:1042`。
- 当前详情页并没有复用已经存在的 `requestPhotoExchange()` 接口封装（`services/message.ts:490`），而是走 `createConversation()` + `sendImageMessage()` + 本地缓存 `photoExchanged` 的手工流程。见 `pages/guest-detail/index.ts:1059`。这与后端推荐时序不一致，容易出现前端自判错误、文案错误或状态不一致。
- 用户资料读取逻辑先走 preview 接口 `fetchProfile()`，缺图时再 fallback 到 detail 接口 `fetchProfileDetail()`；映射层确实会把 `media.gallery`/`primary_photo` 填入 `child.photos`。见 `services/user.ts:121`、`services/user.ts:143`、`services/api-mapper.ts:916`、`services/api-mapper.ts:982`。因此本问题的可能性包括：
  - 账号确实没有孩子照片，前端文案/交互不符合需求；
  - 账号有照片，但 `child_id`、profile fallback、映射或缓存导致前端误判为空；
  - 详情页错误地把“是否有自家照片”当成了比会员/解锁权限更高优先级的阻断条件。
- 会员状态能力在 `store/memberStore.ts:102` 和 `store/memberStore.ts:116` 可区分会员/至尊会员，但这些能力判断并不会绕过 `pages/guest-detail/index.ts` 里的本地资料门槛。

## Missing Context
- 缺少测试号 `15717136585` 当前是否已经上传孩子照片的直接证据；这是判断“误判”还是“交互设计错位”的关键上下文。
- 缺少触发问题时的目标嘉宾 ID / child ID，无法直接串联该次点击涉及的会话、解锁和资料接口日志。
- 缺少 `/api/v1/profile/child/{childId}/preview`、`/api/v1/profile/child/{childId}`、`/api/v1/photo-exchange/request` 的实际返回样本，无法在 triage 阶段判定是纯前端问题还是接口字段缺失。
- 但这些缺口均属于“实施与验证所需”，不影响先进入计划生成，因为问题入口、错误 UI 和主要代码表面已经明确。

## Likely Surfaces
- `pages/guest-detail/index.ts`
- `pages/guest-detail/index.wxml`
- `services/message.ts`
- `services/user.ts`
- `services/api-mapper.ts`
- `store/userStore.ts`
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/message_photo_exchange.go`
- `/Users/firingj/Projects/GodQinJia/docs/modules/06-消息模块-交换照片前端接入指南.md`

## Recommended Next Action
- 进入 `generate_plan`。
- 后续计划优先做两件事：
  - 用测试号 `15717136585` 复现并抓取资料接口返回，确认 `child.photos` 在 preview/detail 口径下是否为空；
  - 校正详情页交换照片入口，使其与 `requestPhotoExchange()` 的后端口径一致，不再由前端本地“去登记资料”分支抢先拦截至尊会员的正常流程。
- 如果最终确认账号确实没有孩子照片，也建议修复交互：应给出“上传/更换照片”能力或更准确文案，而不是笼统提示“未登记孩子的相亲资料”。
