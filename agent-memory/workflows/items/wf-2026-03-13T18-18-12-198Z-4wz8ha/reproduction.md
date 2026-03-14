# Reproduction

## Steps
- 读取缺陷附件 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_504c1b571d39/img_v3_02vo_98ac2632-795a-42d6-97e3-097104d569bg.jpg`，可见当前截图展示的是“黄金会员 有效期至:2026.06.14”，并非过期态。
- 对照设计稿 `design/3.设计稿/神仙亲家-我的-黄金会员-已过期1.png`，确认产品确实存在明确的“黄金会员已过期”目标页面态。
- 检查前端会员状态链路：`services/member.ts:16` 调用 `/api/v1/membership/status`，`services/api-mapper.ts:984` 将接口返回映射为 `MemberStatus`。
- 用本地探针强制输入过期响应：`npx tsx -e "import { mapMembershipStatus } from './services/api-mapper'; const sample={member_type:'golden',start_at:'2025-01-01',end_at:'2026-03-01',status:'expired',days_left:0}; console.log(JSON.stringify(mapMembershipStatus(sample), null, 2));"`，验证前端映射层会产出 `isExpired: true`。
- 检查“我的”页和“会员中心”页的展示分支：`pages/profile/index.ts:501` 已实现黄金会员过期 banner；但 `pages/member-center/index.ts:160` 虽保存了 `memberStatus`，`pages/member-center/index.wxml:15` 到 `pages/member-center/index.wxml:50` 的实际渲染未消费该状态，且 `pages/member-center/index.ts:437` 的 `getMemberStatusText()` 没有被任何模板或逻辑调用。
- 结论：当前工单附件本身无法直接复现“过期态显示错误”；但在“接口返回过期”的确定性场景下，可以复现“我的页显示过期 / 会员中心页仍展示普通开通页”的状态不一致问题。

## Evidence
- 附件证据：缺陷截图显示文案为“黄金会员 有效期至:2026.06.14”，说明提报时使用的账号仍处于有效期内，不满足“过期状态”前置条件。
- 设计证据：`design/3.设计稿/神仙亲家-我的-黄金会员-已过期1.png` 明确展示了“黄金会员 已过期178天 / 去开通”的目标态。
- 前端映射证据：`services/api-mapper.ts:1004` 到 `services/api-mapper.ts:1028` 会综合 `status`、`end_at`、`days_left` 推导 `isExpired` 与负数 `daysUntilExpiry`，不是简单依赖单一字段。
- 前端单测证据：`services/member.spec.ts:205` 已覆盖“`status` 为空但 `end_at` 已过期”仍判定为过期；`services/member.spec.ts:199` 到 `services/member.spec.ts:202` 已覆盖显式 `EXPIRED` 场景。
- 本地探针证据：上述 `tsx` 命令输出 `{"level":"gold","isExpired":true,"daysUntilExpiry":-13,...}`，证明前端状态映射本身可正确识别过期输入。
- 页面实现证据：`pages/profile/index.ts:501` 到 `pages/profile/index.ts:510` 有过期 banner 分支；`pages/member-center/index.wxml:15` 到 `pages/member-center/index.wxml:50` 只渲染 tabs、hero、套餐、footer，没有任何 `memberStatus` / `isExpired` 判断；`components/pages/member-center/member-center-hero/index.ts:7` 到 `components/pages/member-center/member-center-hero/index.ts:20` 也没有接收会员状态相关 props。
- 后端出口证据：`/Users/firingj/Projects/GodQinJia/internal/apiserver/service/membership.go:436` 到 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/membership.go:470` 会根据 `VipLevel` 和 `VipExpireAt` 返回 `status=active|expired`、`end_at`、`days_left`，接口契约本身支持过期态。

## Root Cause
- 直接阻塞原因：工单提供的截图和账号状态并非“黄金会员已过期”，因此无法按附件直接复现缺陷；当前更像“过期场景待验证/待补测试账号”。
- 前端潜在真实缺陷：会员中心页没有消费 `memberStatus`。即使 `/api/v1/membership/status` 已正确返回过期，`pages/member-center/index.ts` 也只是把状态写进 data，`pages/member-center/index.wxml` 与 `components/pages/member-center/member-center-hero` 并未根据 `isExpired`、`endTime`、`daysUntilExpiry` 渲染“已过期/去开通”态，导致从“我的”页点进去后页面状态不一致。
- 当前更接近前端展示链路缺口，而不是状态映射缺陷：映射层、现有单测、本地探针和后端状态出口都表明“过期”数据可以被正确识别；问题集中在会员中心 UI 没有闭环消费该状态。

## Fix Plan
- 先补测试前置条件：提供一个真实过期的黄金会员账号，或在联调环境中 mock `/api/v1/membership/status` 为 `member_type=golden`、`status=expired`、`end_at=<过去日期>`、`days_left=0/-N`，重新截图“我的”页和“会员中心”页。
- 前端修复优先级 1：给 `pages/member-center/index.wxml` 增加基于 `memberStatus` 的过期/未过期/至尊/未开通展示分支，至少补齐标题、副标题、按钮文案和对应背景资源。
- 前端修复优先级 2：让 `components/pages/member-center/member-center-hero` 接收并展示会员状态，或在页面层直接渲染状态条；删除或真正接入 `pages/member-center/index.ts:437` 的 `getMemberStatusText()`，避免死代码。
- 前端修复优先级 3：抽取与 `pages/profile/index.ts` 一致的会员 banner/helper，统一“我的”“邀请好友”“会员中心”三处黄金会员文案和资源，避免状态分叉。
- 验证补充：新增一个会员中心页的过期态用例，覆盖 `status=expired`、`status='' + end_at 过去时间`、`days_left=0` 三类输入，并在微信开发者工具里核对“我的 → 会员中心”跳转后状态一致性。
