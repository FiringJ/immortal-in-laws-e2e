# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 黄金会员页购买说明点击后误跳转说明页，应改为页内弹框提示
## Cleaned Problem
- 缺陷范围聚焦在会员中心黄金会员页底部的“购买说明”入口。
- 当前现象是点击后跳转到独立“购买说明”页面；附件截图显示的是一个完整新页面，顶部标题为“购买说明”。
- 正确预期应为留在当前会员中心页内，弹出说明弹框/提示层，而不是触发路由跳转。
- 结合仓库上下文，稳定复现路径可收敛为：`pages/profile/index` 会员入口“去开通” → `pages/member-center/index?tab=gold` → 点击底部“购买说明”。

## Source Quality
- 原始描述明确给出了“当前错误行为”和“正确交互形式”，核心修复目标清晰。
- 附件仅提供了错误态截图，且两个附件路径重复；原文提到的“图 1”预期态并未单独附上。
- 页面入口和路由未在飞书原文中写明，但与 workflow 提示、page topology、代码搜索结果能够相互印证。
- 综合判断可进入计划阶段，但视觉细节和最终文案仍有少量补充空间。

## Product Context
- `pages/member-center/index` 是会员中心页面，负责黄金/至尊会员套餐、权益说明和购买流程。
- `pages/profile/index` 的会员 banner / “去开通”是项目知识中记录的最稳定进入会员中心的验证路径。
- E2E 用例基线已把“购买说明入口存在且应出现弹框”视为会员中心的一项检查点。
- 仓库中另有相关缺陷 `wf-2026-03-13T18-18-12-295Z-dl8xeo`，标题为“购买说明：说明内容缺失，且排版混乱无内容排版…”。本单更适合只处理“交互形式错误（跳页 vs 弹框）”，不要与内容排版问题混在一起。

## Technical Context
- `components/pages/member-center/member-center-footer/index.wxml` 在底部渲染“购买说明”，并通过 `bindtap="onExplainTap"` 触发 `explain` 事件。
- `components/pages/member-center/member-center-footer/index.ts` 只负责向页面层抛出 `explain` 事件，真正的跳转/弹框行为在 `pages/member-center/index.ts` 决定。
- 当前工作区未提交 diff 显示：`pages/member-center/index.ts` 的 `onExplainTap()` 已从 `wx.navigateTo('/pages/settings-doc/index?type=member-purchase&tab=...')` 改为设置 `showPurchaseExplainModal: true`；`pages/member-center/index.wxml` 同时新增了 `confirm-modal` 渲染。这与缺陷诉求完全一致。
- `pages/settings-doc/index.ts` 仍保留 `type === 'member-purchase'` 的独立说明页生成逻辑，说明历史实现确实走过“跳转到说明页”的方案。
- `components/confirm-modal/index.ts` 已提供通用弹框能力，足以承接此类说明提示。
- E2E 仓库已有静态探针 `src/tools/probes/member-center-purchase-explain-static-probe.ts`；本次运行结果为 PASS（6/6），说明当前工作区代码结构已经是“弹框版”。
- 综上，这个缺陷更像是“旧实现/旧包体/未提交改动未落地”的问题，而不是需求本身不清楚。

## Missing Context
- 缺少单独的预期截图（图 1）；现有附件只展示了错误态独立页面。
- 缺少明确复现环境信息：问题出现在哪个体验包、分支或构建时间点。
- 缺少是否要彻底移除 `member-purchase` 独立说明页入口的产品决定；目前只能确定会员中心底部入口不应再跳页。
- 缺少弹框最终文案和排版的验收标准，但这更接近关联缺陷中的内容/样式范围。

## Likely Surfaces
- `pages/member-center/index.ts`
- `pages/member-center/index.wxml`
- `components/pages/member-center/member-center-footer/index.ts`
- `components/pages/member-center/member-center-footer/index.wxml`
- `components/confirm-modal/index.ts`
- `components/confirm-modal/index.wxml`
- `pages/settings-doc/index.ts`（历史跳页实现 / 潜在死分支）
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/member-center-purchase-explain-static-probe.ts`

## Recommended Next Action
- 进入 `generate_plan`。
- 计划阶段优先确认目标分支/体验包是否仍在使用旧的跳页实现；若是，应直接围绕现有未提交弹框改动做整理或落地，而不是重新设计交互。
- 修复范围建议限定为“会员中心底部购买说明入口改为页内弹框”，并把“说明内容缺失/排版混乱”的处理留给关联缺陷单独推进。
- 若需要收口技术债，可在实施阶段顺带确认 `pages/settings-doc/index.ts` 中 `member-purchase` 路径是否仍有真实入口，避免后续再次误用。
