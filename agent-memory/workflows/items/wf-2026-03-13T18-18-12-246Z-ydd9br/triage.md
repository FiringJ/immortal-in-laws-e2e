# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 看过我页中黄金/至尊会员仍显示“开通会员 查看全部资料”底部按钮
## Cleaned Problem
- 问题页面不是会员中心首页，而是记录页 `pages/message-record/index` 的“看过我”视图，路由态应为 `type=view`、`direction=other_to_me`。
- 缺陷现象：当前账号为有效黄金会员或至尊会员时，页面底部仍出现“开通会员 查看全部资料”按钮。
- 正确行为：有效黄金会员/至尊会员不应看到该底部开通会员 CTA；该按钮应只对无查看权限的非会员态展示。
- 现有证据充分：附件截图 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_157abc4b4612/image.png` 清晰展示了“看过我”顶部页签、记录卡片内容，以及底部错误出现的 CTA。

## Source Quality
- 质量判断：`high`。
- 原始描述直接给出了用户身份（黄金/至尊会员）、错误文案（“开通会员 查看全部资料”）、期望结果（不展示）和截图证据。
- 虽然缺少具体账号 ID、复现步骤和接口响应，但不影响进入后续计划阶段；核心页面、核心错误态和预期都足够明确。

## Product Context
- PRD 明确“看过我/收藏我/解锁我”属于记录/消息体系的二级页，不是会员中心主页面；见 `design/1.需求文档/神仙亲家--小程序产品需求文档.md:79` 与 `design/4.项目结构分析/项目结构分析.md:39`。
- 当前缺陷虽然展示的是会员开通文案，但产品归属更准确地说是“记录页的会员权限展示错误”，而非“会员中心页缺陷”。
- 截图中顶部为“看过我 / 我看过的”切换，且卡片已展示基础资料与按钮，说明问题聚焦在页面底部全局会员 CTA 的错误展示，而不是卡片内容缺失。

## Technical Context
- 页面默认就是记录页浏览态：`pages/message-record/index.ts:101` 在无参时默认 `recordType=view`、`direction=other_to_me`。
- 页面初始化会先刷新会员状态和权益，再加载记录数据；但 `pages/message-record/index.ts:111` 的异常处理会吞掉会员刷新失败并继续 `loadData()`，因此一旦会员态未拉到，页面仍会按非会员分支渲染。
- 底部按钮的直接开关来自 `pages/message-record/index.ts:315`：
  - `showBottomBar = !memberStore.isMember() && (view || favorite) && other_to_me`
  - 这意味着只要 `memberStore.isMember()` 返回 `false`，就会展示底部 CTA。
- 底部 CTA 的实际渲染位于 `pages/message-record/index.wxml:92`，文案固定为“开通会员 查看全部资料”。
- `memberStore.isMember()` 的判断位于 `store/memberStore.ts:103`，依赖 `status !== null && !status.isExpired`。
- 会员状态来自 `services/member.ts:27` 的 `/api/v1/membership/status`，最终由 `services/api-mapper.ts:1018` 的 `mapMembershipStatus()` 解析。
- `mapMembershipStatus()` 目前只识别 `member_type` 为 `golden`、`gold`、`supreme`；若后端返回其他值、状态字段异常、到期时间解析异常，都会把有效会员映射成 `null` 或 `isExpired=true`，从而触发错误 CTA。
- 因此前端已有明确可疑面：
  - 会员状态刷新失败后页面仍按非会员继续渲染；
  - 会员状态映射兼容性不足；
  - CTA 直接依赖 `isMember()`，没有“会员状态已完成判定”保护，也没有走更贴近业务语义的 `canViewRecords()` 权限口径。

## Missing Context
- 缺少受影响账号在问题发生时 `/api/v1/membership/status` 与 `/api/v1/interaction/unlock-quota` 的真实响应样本。
- 缺少问题出现时是否为冷启动、支付后返回、切账号后进入等入口信息；这些都会影响 `memberStore` 是否可能取到空/旧状态。
- 缺少是否“黄金会员”和“至尊会员”两类账号都稳定复现的确认，以及是否“收藏我”页也存在同类问题的确认。
- 缺少本地缓存 `member_status` / `member_benefits` 是否为空、过期或被覆盖的现场信息。

## Likely Surfaces
- `pages/message-record/index.ts:111`：会员状态/权益初始化与错误吞掉逻辑。
- `pages/message-record/index.ts:315`：底部 CTA 展示条件。
- `pages/message-record/index.wxml:92`：错误展示的实际 DOM。
- `store/memberStore.ts:103`：有效会员判定。
- `services/member.ts:27`：会员状态与权益获取链路。
- `services/api-mapper.ts:1018`：会员状态字段兼容与过期判断。
- `services/member.spec.ts:182`：后续可补状态映射和记录页权限回归用例。

## Recommended Next Action
- `generate_plan`。
- 后续执行建议先做一次定向复现：使用有效黄金会员、有效至尊会员账号进入 `pages/message-record/index?type=view&direction=other_to_me`，同时记录 `membership/status` 响应、`memberStore.getStatus()` 结果和 `showBottomBar` 计算值。
- 优先排查两类根因：
  - 有效会员被映射成非会员/过期会员；
  - 会员刷新失败后页面错误地回退到非会员 CTA。
- 修复方向建议：
  - 给记录页增加“会员态已完成判定”保护，避免状态未知时直接展示开通会员按钮；
  - 重新确认底部 CTA 是否应基于 `canViewRecords()` 或显式“记录页查看权限”而不是单纯 `isMember()`；
  - 为黄金/至尊有效态补充回归测试，覆盖 `showBottomBar` 不展示的场景。
