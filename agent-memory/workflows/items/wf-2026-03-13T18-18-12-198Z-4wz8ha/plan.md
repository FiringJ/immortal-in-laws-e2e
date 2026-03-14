# Plan
## Problem
- 飞书标题只有“黄金会员：过期状态，待测点”，信息非常少；附件截图展示的是“黄金会员有效期至 2026.06.14”的未过期态，不是过期态，因此当前更像“过期场景待验证/待补齐”而不是已拿到完整复现证据的缺陷。
- 设计稿已明确存在“我的-黄金会员-已过期”页面态，说明产品对过期态有明确预期；需要确认线上/测试环境是否真的进入了该态，以及进入后前端各页面是否一致。
- 前端当前在“我的”页与“邀请好友”页都写了黄金会员过期分支，但“会员中心”页虽然会拉取 `memberStatus`，实际 WXML/组件没有消费该状态，存在进入会员中心后仍只展示普通开通页的风险。

## Impact
- 若黄金会员过期后仍显示为未过期，会直接误导用户对会员有效期、升级入口和权益状态的判断，属于会员核心路径问题，符合 P0 风险。
- 若“我的”页与“会员中心”页对同一会员状态展示不一致，会导致用户在点击 banner 后出现状态跳变或文案冲突，影响续费/升级转化。
- 若问题根因在后端 `membership/status` 返回值，前端多个入口都会同时受影响，包括“我的”、邀请页以及任何依赖 `memberStore.refreshStatus()` 的会员门槛判断。

## Reproduction Hypothesis
- 假设 1：测试账号实际上仍是有效黄金会员，所以接口 `/api/v1/membership/status` 返回 `status=active` 或未来 `end_at`，导致前端始终走未过期分支；当前附件截图与该假设一致。
- 假设 2：接口已返回过期，但字段组合与前端预期不一致（例如 `status`/`member_type`/`end_at` 缺失或格式异常），导致 `services/api-mapper.ts` 没能把状态正确映射为 `isExpired=true`。
- 假设 3：`pages/profile/index.ts` 可正确显示过期态，但 `pages/member-center/index.ts` 没有真正渲染 `memberStatus`，所以用户点击 banner 进入会员中心后看不到对应的“已过期/去开通”态，形成体验缺口。
- 假设 4：若后端返回 `status=expired` 但 `days_left=0`，前端目前依赖 `end_at` 兜底计算已过期天数；若真实返回里没有 `end_at`，则过期天数文案可能退化为 `0天`。

## Evidence To Collect
- 抓取真实/测试账号的 `/api/v1/membership/status` 响应，重点记录 `member_type`、`status`、`start_at`、`end_at`、`days_left` 五个字段，确认账号是否真的过期。
- 在同一账号下分别截图“我的”页和“会员中心”页，确认是否都进入过期态；若只有“我的”页正确，则可基本锁定为会员中心 UI 漏实现。
- 对照设计稿 `design/3.设计稿/神仙亲家-我的-黄金会员-已过期1.png` 与 `design/3.设计稿/神仙亲家-我的-黄金会员-未过期1.png`，核对标题、副标题、按钮文案和背景资源是否一致。
- 如接口返回异常，再补查后端 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/membership.go` 中 `buildMembershipStatusResp` 的输出，确认 `VipExpireAt`、`status` 与 `days_left` 是否符合约定。
- 如需前端快速本地验证，可临时在请求层或 DevTools mock 一个过期响应：`member_type=golden`、`status=expired`、`end_at` 为过去日期，观察 `pages/profile/index.ts`、`pages/invite/index.ts`、`pages/member-center/index.ts` 的行为差异。

## Initial Fix Direction
- 先做状态归因：若接口本身未返回过期，则优先修后端状态计算/测试数据；若接口已正确返回过期，则集中修前端展示链路。
- 前端修复优先级建议：先保证 `pages/profile/index.ts` 的 banner 与设计稿一致，再补 `pages/member-center/index.ts` 的过期态展示，因为该页当前只存了 `memberStatus` 和 `getMemberStatusText()`，但未真正渲染状态文案。
- 视实现成本，建议把黄金会员 banner 文案构建抽成共享 helper，避免“我的”页与邀请页两套分支继续分叉；至少保证过期/未过期/至尊/未开通四种态的文案、按钮和资源统一。
- 补验证用例：覆盖 `status=expired + end_at 过去时间`、`status 为空但 end_at 已过期`、`days_left=0 且已过期`、`member_type=golden` 四类输入，避免后续再次出现映射偏差。
- 如果最终确认只是“待测点”而非现网缺陷，应把测试前置条件补齐到缺陷单：测试账号、到期时间、期望页面、期望按钮文案，避免后续重复沟通。
