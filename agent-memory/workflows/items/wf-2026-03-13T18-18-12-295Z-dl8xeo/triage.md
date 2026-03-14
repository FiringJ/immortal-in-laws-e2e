# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 会员阻断购买说明弹窗内容缺失且排版混乱
## Cleaned Problem
- 这条缺陷更像是“会员阻断”弹窗里的购买说明问题，而不是会员中心页本身的问题。`feishu-defects-latest.tsv` 中该行的父记录为“会员阻断：点击底部‘购买说明’，未出现弹框提示，需对照视觉稿、prd补充”，说明这是一条在会员阻断链路下继续拆出来的内容/排版缺陷。
- 附件展示的是一个标题为“关于会员，我想了解”的页内说明卡片，底部按钮为“同意”，可与仓库里的 `components/member-unlock-modal` 购买说明弹层直接对应；这也说明当前关注点是“弹窗内文案与排版”，不是“是否跳页”。
- 清洗后的问题可表述为：非会员触发会员阻断后，点击底部“购买说明”出现的说明弹窗，当前文案内容不完整，且信息层级/排版不符合参考文档“神仙亲家购买说明”，需要补齐说明内容并按结构化样式整理。

## Source Quality
- 证据强项：有本地附件截图，且截图中的标题“关于会员，我想了解”、按钮“同意”、正文结构都能与代码中的 `components/member-unlock-modal/index.wxml` 对上，定位面比较明确。
- 证据弱项：workflow 原始 `item.json` 中 `parentRecord` 丢失为空，但 `agent-memory/defect-reports/feishu-defects-latest.tsv` 的原始导出仍保留了“会员阻断”父记录；说明源数据在同步到 workflow item 时有上下文丢失。
- 原文没有给出“神仙亲家购买说明”这份参考文档的仓库路径，也没有逐条列出缺失的是哪些段落/标题，因此文案验收标准还不算完整。
- 综合判断：问题的落点与修复方向已经足够明确，可进入计划阶段；但计划中应保留一步确认最终参考文案来源。

## Product Context
- 会员阻断弹窗是非会员点击受限能力时的统一拦截层，底部有“购买即同意 购买说明”入口；这一入口的说明内容直接影响会员转化与退款规则告知，属于高优先级文案/合规展示面。
- 附件显示的说明卡片是一个页内二级弹层，不是独立页面，因此该问题与另一条“点击购买说明误跳转新页面，应改为弹框”的会员中心缺陷不是同一件事。
- 当前更像是：阻断弹窗已经有说明弹层，但其内容不完整、信息层级不清楚、版式不符合参考稿/参考文档。

## Technical Context
- `components/member-unlock-modal/index.wxml` 底部渲染“购买即同意 购买说明”，点击后打开 `showPurchaseNotice` 对应的说明卡片；同文件内标题文案正是“关于会员，我想了解”。
- `components/member-unlock-modal/index.ts` 里已经有 `PURCHASE_NOTICE_SECTIONS` 常量，当前只定义了两组内容：`一、购买须知` 与 `二、退款规则`。从缺陷描述“说明内容缺失”看，最可能的问题是这里的章节/段落数量仍不足，或者内容与参考文档不一致。
- `components/member-unlock-modal/index.wxss` 为这块说明卡片定义了独立的 `purchase-notice-*` 样式，说明“排版混乱无内容排版”的主要实现面也应在这个组件内，而不是通用 `confirm-modal`。
- 仓库中没有检索到名为“神仙亲家购买说明”的独立文档文件；当前能找到的最接近实现基线就是 `components/member-unlock-modal/index.ts` 中的结构化段落配置。
- 需要避免与 `pages/member-center/index.ts` 的购买说明逻辑混淆：后者当前使用通用 `confirm-modal`，属于另一条“开通会员页/会员中心页”的购买说明问题面。

## Missing Context
- 缺少“神仙亲家购买说明”参考文档的实际仓库路径或正文内容，当前无法仅凭 defect 原文确认最终应该补齐到几段、每段标题为何。
- 缺少完整的预期态截图；现有附件只有一张局部截图，且左上角有 vConsole 遮挡，无法作为精细排版验收图。
- 缺少复现入口描述（例如从哪个受限能力触发会员阻断），但这不会影响定位到共享组件 `components/member-unlock-modal`。
- 缺少是否区分黄金/至尊会员两套购买说明内容的产品说明；当前代码里的购买说明是通用的。

## Likely Surfaces
- `components/member-unlock-modal/index.ts`
- `components/member-unlock-modal/index.wxml`
- `components/member-unlock-modal/index.wxss`
- `agent-memory/defect-reports/feishu-defects-latest.tsv`
- `agent-memory/defect-reports/attachments/bug_e0dbe455f178/image.png`

## Recommended Next Action
- 进入 `generate_plan`。
- 计划阶段应先确认参考文档“神仙亲家购买说明”的来源；若短期拿不到文档，可先以现有 `PURCHASE_NOTICE_SECTIONS` 为基线，列出缺失内容与排版改造点，再向产品确认最终文案。
- 修复面建议聚焦 `components/member-unlock-modal`：先补全章节/段落数据，再整理标题、段间距、滚动区和底部按钮布局。
- 不建议在后续实现中把这条单和会员中心页的“购买说明跳页/内容简化”问题混做一条，避免范围串单。
