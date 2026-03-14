# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 黄金会员权益入口点击无反应，应弹出权益图片弹框
## Cleaned Problem
当前缺陷可明确收敛到小程序会员中心 `pages/member-center/index` 的黄金会员页签：页面“会员权益”列表中的各个权益项都展示了右箭头，视觉上属于可点击入口，但基线实现中点击这些行没有任何反馈。期望行为不是仅展示静态表格，而是按 UI 稿弹出对应的权益说明图片弹框。

从仓库内设计稿可直接找到匹配产物：黄金会员弹框稿位于 `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗1.png` 至 `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗6.png`，与黄金会员权益表的 6 条权益说明一一对应。该缺陷是明确的交互缺失，不是需求待确认或模块未实现。

## Source Quality
- 原始描述同时给出了当前行为（点击无反应）和目标行为（弹出权益图片弹框），模块也明确指向“黄金会员 / 会员中心”。
- 附件截图直接圈出了问题区域，能定位到“会员权益”表格中的箭头入口，而不是泛泛的“页面体验不好”。
- 仓库内同时存在对应页面、组件和设计稿弹窗文件，说明问题可在代码层直接定位并进入后续计划，不需要先做产品澄清。
- 因此该条 source quality 评为 `high`。

## Product Context
- `agent-memory/page-topology.md` 与实际代码都表明“我的”页会进入会员中心：`pages/profile/index` 的 `onMemberCenterTap()` / `onMemberBannerTap()` 都会跳转到 `/pages/member-center/index?...`。
- 会员中心页分黄金/至尊两个页签，其中黄金会员页签通过 `member-center-benefits` 组件展示权益对比表，是本缺陷的直接落点。
- 设计稿不仅有黄金会员主页面，还明确提供了 6 张“黄金会员-弹窗”稿，说明产品预期不是单纯看大图预览，而是存在“点击权益项 -> 查看权益说明图”的完整交互路径。
- 同模块内，至尊会员组件已经实现了“点击权益卡片预览图片”的能力，这进一步说明“点击权益查看说明”是会员中心的既有产品模式，而不是新增需求。

## Technical Context
- 基线版本（`HEAD`）中，`components/pages/member-center/member-center-benefits/index.ts` 只有 `title`、`rows` 两个属性，没有任何点击方法；`components/pages/member-center/member-center-benefits/index.wxml` 里的 `.benefit-row` 也没有 `bindtap`，因此“点击无反应”与代码现状完全一致。
- 基线版本（`HEAD`）中，`pages/member-center/index.wxml` 只向 `member-center-benefits` 传了 `title` 和 `rows`，没有传入任何弹窗/预览所需图片列表；`pages/member-center/index.ts` 也没有维护黄金权益弹窗图片数组。
- 同目录下的 `components/pages/member-center/member-center-supreme-cards/index.ts` 已存在 `onBenefitTap()` + `wx.previewImage()` 的参考实现，说明黄金会员缺的是交互接线，不是底层能力不存在。
- 当前工作区存在一组与本缺陷高度吻合的未提交改动：`git diff` 显示 `components/pages/member-center/member-center-benefits/index.ts` 新增了 `previewImages` 属性和 `onBenefitRowTap()`，`index.wxml` 给每行补了 `bindtap`，`pages/member-center/index.ts` / `index.wxml` 也补了 `benefitPreviewImages` 透传。这说明该问题很可能已有人在当前分支中开始修复，但尚未提交、也未完成回归验证。
- 预览图资源本身不是 blocker：当前代码使用的 CDN 地址 `https://static.yilusx.com/assets/imgs/member-center/page-explain/gold/01.png`、`02.png`、`06.png` 已可返回 `HTTP 200`，说明“点了没反应”更像前端交互缺失，而不是图片资源失效。

## Missing Context
- 仍需在微信开发者工具或真机确认：验收要求是否接受原生 `wx.previewImage()`，还是必须做成与设计稿一致的自定义居中弹框（带圆点和关闭按钮）。从 UI 稿看，更像后者；但这不阻碍进入计划阶段。
- 需要确认当前工作区里那组未提交修复是否就是该缺陷的 candidate fix，以及是否已经在实际运行包中生效；triage 阶段只能确认“代码方向对”，不能直接视为已解决。
- 若后续计划要做 1:1 还原，建议明确黄金会员 6 条权益与 6 张弹窗图的映射关系；不过从设计文件数量和当前权益行数量看，默认一一对应是合理假设。

## Likely Surfaces
- `pages/member-center/index.ts`
- `pages/member-center/index.wxml`
- `components/pages/member-center/member-center-benefits/index.ts`
- `components/pages/member-center/member-center-benefits/index.wxml`
- `components/pages/member-center/member-center-supreme-cards/index.ts`（可复用的交互参考实现）
- `design/3.设计稿/神仙亲家-我的-黄金会员1.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗1.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗2.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗3.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗4.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗5.png`
- `design/3.设计稿/神仙亲家-我的-黄金会员-弹窗6.png`

## Recommended Next Action
- 结论：该条缺陷可以直接进入 `generate_plan`，不需要额外人工澄清才能开展后续工作。
- 后续计划建议先做两件事：
  1. 先审计并验证当前工作区未提交的 candidate fix，确认是否已经完整打通“黄金权益行点击 -> 弹出说明图”；
  2. 再根据 UI 稿决定是保留 `wx.previewImage()` 方案，还是升级为自定义图片弹框，以满足视觉一致性。
- 回归重点应覆盖：黄金会员 6 条权益都可点击、每条打开正确图片；切换至尊会员页签不受影响；从“我的”页或会员 banner 进入会员中心时也能正常触发该交互。
