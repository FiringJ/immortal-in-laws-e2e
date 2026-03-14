# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 我看过的页顶部 CTA 与模糊蒙层未统一跳转至尊会员开通页
## Cleaned Problem
- 问题范围：`pages/message-record/index` 的“我看过的”视图，即 `type=view&direction=me_to_other`。从“我的”页功能入口可直接进入该路由：`pages/profile/index.ts:437`。
- 触发条件：非至尊会员用户进入该页后，页面顶部会出现“此功能仅限至尊会员使用”的 banner，同时列表区域被模糊遮罩；该阻断态由 `showVipBanner` 控制：`pages/message-record/index.ts:312`。
- 期望行为：点击顶部“开通至尊会员”按钮，以及点击被模糊遮罩覆盖的列表区域，都应统一跳转到 `pages/member-center/index?tab=supreme`，并默认选中至尊会员 tab。
- 当前反馈行为：顶部按钮没有直接跳会员开通页，而是误出了会员弹框；模糊蒙层点击无反应。附件截图能明确定位到页面和两个具体点击区域。

## Source Quality
- 质量评估：`high`。
- 原因：原始描述同时给出了具体页面状态、两个明确入口、当前错误表现和目标行为，并附带截图，足以支持后续修复计划。
- 剩余轻微缺口：没有标明复现账号是普通用户、黄金会员还是已过期会员，也没有录屏显示“错误弹框”的具体组件类型；但这些不影响进入计划阶段。

## Product Context
- `message-record` 是“浏览/收藏/解锁记录”统一页，`message-record/` 模块本身就承载“我看过/看过我”等双向切换：`design/4.项目结构分析/项目结构分析.md:39`。
- 当前问题的入口来自“我的”页功能区的“浏览记录”，会显式带 `type=view&direction=me_to_other` 打开“我看过的”：`pages/profile/index.ts:427`。
- 会员中心页已支持通过 query 选择 tab，`tab=supreme` 会在加载早期就切到至尊会员态：`pages/member-center/index.ts:300`。
- 同类“至尊会员阻断”页面已有直接跳至尊会员开通页的先例，例如历史推荐页底部 CTA 直接走 `pages/member-center/index?tab=supreme`：`pages/history/index.ts:371`。

## Technical Context
- 当前 WXML 已把两个入口都绑定到了同一个 handler：顶部按钮 `bindtap="onOpenSupremeVip"`，模糊遮罩 `bindtap="onOpenSupremeVip"`：`pages/message-record/index.wxml:36`、`pages/message-record/index.wxml:60`。
- TypeScript 源码里的 `onOpenSupremeVip()` 也已经是目标行为，直接 `wx.navigateTo({ url: '/pages/member-center/index?tab=supreme' })`：`pages/message-record/index.ts:547`。
- 但运行态文件 `pages/message-record/index.js` 明显与 `index.ts` 漂移：
  - 生成态里仍保留旧版 `onOpenVip()`，其行为是 `setData({ showMemberUnlockModal: true, memberUnlockScene: '联系对方' })`，会拉起会员弹框而不是跳页面：`pages/message-record/index.js:253`。
  - 同一份 `index.js` 中看不到 `onOpenSupremeVip()` 的实现，`onOpenVip()` 后直接进入 `onMoreTap()` 段落，说明 WXML 绑定到的 handler 很可能在运行态缺失。
- 这类问题在当前仓库是高风险真因，因为项目运行产物依赖 `tsc` 生成 `.js` 文件；若只改了 `.ts` 未重新构建，实际包会继续吃旧 `index.js`：`package.json:7`。
- 因此，这条缺陷的核心更像“message-record 页面 TS/WXML 与运行态 JS 不一致”，而不是产品规则不明确。

## Missing Context
- 缺少复现账号会员等级（普通 / 黄金 / 已过期），仅能从文案推断为“非至尊会员”。
- 缺少实际弹框截图或日志，尚不能 100% 确认错误弹框是 `member-unlock-modal` 还是其他会员阻断组件。
- 缺少当前提测包是否使用仓库内已提交 `index.js`，还是由 DevTools/CI 临时编译 `index.ts` 的信息。

## Likely Surfaces
- `pages/message-record/index.ts`
- `pages/message-record/index.wxml`
- `pages/message-record/index.js`
- `pages/member-center/index.ts`
- `components/member-unlock-modal/index.wxml`
- `package.json`

## Recommended Next Action
- 结论：`generate_plan`，可直接进入修复规划。
- 建议后续计划优先做三件事：
  - 先确认运行时究竟吃的是哪份逻辑，并优先修复 `pages/message-record/index.ts` 与 `pages/message-record/index.js` 的构建漂移。
  - 将“我看过的”页顶部 CTA 与模糊蒙层收敛到同一个直跳逻辑：统一进入 `pages/member-center/index?tab=supreme`，不要再落到会员弹框分支。
  - 修复后至少用一个非会员账号和一个黄金会员账号回归，验证两个入口都能进入会员中心且默认选中至尊 tab。
