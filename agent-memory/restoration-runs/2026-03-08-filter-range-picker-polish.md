# Restoration Run

## Scope

- Date: 2026-03-08 16:25 +0800
- Route: `pages/filter/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `364:263`, `364:271`, `364:324`
- Goal: 对齐精准查找页“年份要求 / 身高要求”的 PRD 联动规则和 Figma 底部滚动弹层视觉。

## Inputs

- Figma tools used:
  - `get_design_context(364:263)`
  - `get_design_context(364:271)`
  - `get_design_context(364:324)`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/filter/filter-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/filter/filter-card/index.wxss`
- Relevant tracker docs:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/known-issues.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-page-mapping.json`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss`
- Key behavior changes:
  - 将年份和身高入口从原生 `multiSelector picker` 改为页面内自定义底部弹层，避免原生 picker 无法满足视觉和联动约束。
  - 年份起始列改为 2007→1970 的倒序列表，并将“不限”插入在当前自然年 23 岁与 24 岁出生年份之间；默认打开时首填为“不限”。
  - 年份截止列改为动态联动：首项固定为“不限”，起始为实际年份时只允许选择 `起始 + 3` 年及之后的截止年份。
  - 身高起始列改为 150→199 的升序列表，并将“不限”插入在 `159cm及以上` 与 `160cm及以上` 之间。
  - 身高截止列改为动态联动：首项固定为“不限”，起始为实际身高时只允许选择 `起始 + 5cm` 及之后的截止身高。
  - 弹层改为草稿态交互，滚动过程中只更新草稿值；点击“完成”后才真正写回筛选条件，并保留关闭不保存。
  - 去掉弹层外层的 `catchtouchmove` 拦截，避免小程序运行时把 `picker-view` 的滚动手势一起吞掉。
- Key visual changes:
  - 新增橙色问题提示气泡、棕色标题、右上角关闭图标、双列滚动区、中心“到”字、底部红色完成按钮和 Home Indicator，整体对齐 Figma `364:263 / 364:324`。
  - 选中项改为红色高亮，顶部/底部增加渐隐遮罩，中间选中行使用双分隔线强调。

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` in `/Users/firingj/Projects/immortal-in-laws`
  - `node --import tsx -e "...filter-range-picker-check..."` in `/Users/firingj/Projects/immortal-in-laws-e2e`
- Functional checks:
  - TypeScript type-check passed.
  - App build passed.
- OS screenshots:
  - None captured in this run.

## Findings

- Confirmed improvements:
  - 年份/身高规则不再是“任意双列区间”，而是按 PRD 实现了“不限插入位置 + 截止列动态联动 + 完成后提交”。
  - 页面视觉已从原生 picker 入口切换到 Figma 对应的底部弹层结构。
- Remaining gaps:
  - 还缺一次分离模拟器窗口下的 OS 级截图，确认弹层真实渲染后的间距、字号和滚动选中态。
- Blockers / environment quirks:
  - OS 验证被环境阻塞：`initE2E()` 无法找到分离的微信模拟器窗口，本次探针在初始化阶段即退出。

## Durable Knowledge Added

- `pages/filter/index` 的年份/身高选择器现在是页面内自定义弹层，不应再回退为原生 `picker`，否则无法同时满足 PRD 联动和 Figma 视觉。

## Follow-up Recommendations

- 在微信开发者工具中将模拟器分离为独立窗口后，重新执行一次精简探针，至少验证：
  - 年份弹层标题、橙色提示气泡、完成按钮是否渲染正确
  - 身高弹层标题、橙色提示气泡、完成按钮是否渲染正确
  - 起始列切换后截止列是否立即收敛到合法范围

## Follow-up Style Pass

- Date: 2026-03-08 16:40 +0800
- Trigger: User reported that the popup still looked off compared with Figma, especially the bubble/sheet rhythm and overall popup height.
- Additional Figma references:
  - `get_screenshot(364:324)`
  - `get_screenshot(364:271)`
  - `get_screenshot(364:263)`
- Additional changes:
  - 收紧提示气泡宽度，改为自适应内容宽度，并拉大气泡与弹层主体之间的垂直间距。
  - 将弹层主体改成接近 Figma 的固定高度，重排 header / wheel / footer 的垂直节奏。
  - 把底部 Home Indicator 从弹层主体里拆出，独立放进 safe-area 白底区域，避免弹层主体被额外撑高。
  - 为滚动区和列容器补充 `overflow: hidden`，减少运行时多余行数露出的问题。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- OS validation:
  - Not rerun in this follow-up pass because the detached-simulator blocker remains unchanged.

## Follow-up Structure Pass

- Date: 2026-03-08 17:05 +0800
- Trigger: User provided finer-grained Figma nodes `364:272 / 364:273` and pointed out that the current selected-year row was still structurally wrong.
- Additional Figma references:
  - `get_design_context(364:272)`
  - `get_design_context(364:273)`
- Additional changes:
  - 将选中行从“依赖两列 picker-view 自己排布”改为独立的 `range-picker-selection-row`，按 Figma 的 `248 / 114 / 248` 三段结构承载左值、`到`、右值。
  - 左右 picker 列改成绝对定位的 `248rpx` 固定宽度列，避免继续被 flex 压缩或被中间区域侵占。
  - 选中行文案改为由草稿态 label 单独驱动，确保选中态文本完整显示，不再受列内滚动项的裁切影响。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`

## Follow-up Wheel Viewport Pass

- Date: 2026-03-08 17:35 +0800
- Trigger: User reported the current picker still exposed too many rows; the desired state is a Figma-like viewport with one faded half-row + one full row above/below the selected row.
- Additional Figma references:
  - `get_design_context(364:263)`
  - `get_design_context(364:324)`
  - `get_screenshot(364:263)`
  - `get_screenshot(364:324)`
- Additional changes:
  - 在 `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml` 给左右 `picker-view` 增加独立的 `range-picker-column-clip` 可视窗容器。
  - 在 `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss` 中保留 550rpx 的滚轮排布高度，但把实际可视区域裁成 440rpx，并将 `picker-view` 整体上移 55rpx。
  - 这样选中行仍然落在 Figma 的 220rpx 中线位置，同时顶部/底部只露出半项，避免运行时出现“三个完整选项”露出的错误观感。
  - 补充 `range-picker-item` 的 flex 居中，避免不同机型下文本在列内出现轻微竖向偏移。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- OS validation:
  - Not rerun in this pass; detached WeChat simulator window is still required for screenshot-level confirmation.
- Durable knowledge added:
  - 对这个页面的双列 `picker-view`，仅靠设置项高度不足以稳定得到 Figma 的“半项裁切”效果；需要额外的可视窗裁切层和轻微位移来固定真实露出行数。


## Follow-up E2E Spacing Pass

- Date: 2026-03-09 00:05 +0800
- Trigger: User reported that changing `.range-picker-item` height/line-height still looked ineffective in the real simulator and requested E2E-backed validation.
- Additional changes:
  - 在 `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss` 将 `.range-picker-view` 改为 `transform: scaleY(1.32)`，并保持现有选中带覆盖结构不变。
  - 该方案不再依赖原生 `picker-view` 对单项高度的解释，而是直接纵向拉伸整个滚轮内容，让灰色候选项在真实运行时获得更大的上下间距。
- Additional validation:
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
  - 通过 `/Users/firingj/Projects/immortal-in-laws-e2e/src/core/miniprogram-device.ts` 手工打点复现 `首页 -> 精准查找`，并用临时自动打开年份弹窗的调试钩子抓取真实渲染截图后撤回调试代码。
- OS screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/filter_autoopen_modal.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/filter_autoopen_modal_scaled.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/filter_autoopen_modal_scaled_132.png`
- Findings:
  - 真实模拟器中，单改 `.range-picker-item` 的 `height/line-height` 对候选项纵向密度影响不稳定。
  - 直接对 `.range-picker-view` 做 `scaleY(...)` 拉伸后，灰色候选项的上下间距在 OS 截图中明显变松，且不需要改动交互逻辑。


## Follow-up E2E No-Distortion Pass

- Date: 2026-03-09 00:15 +0800
- Trigger: User pointed out that the previous `scaleY(1.32)` approach loosened spacing but visibly stretched the option text vertically.
- Additional changes:
  - 在 `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml` 给左右滚轮项增加内层 `range-picker-item-text` 包裹节点。
  - 在 `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss` 保留父层 `.range-picker-view { transform: scaleY(1.32) }` 以维持更松的纵向节奏，同时对 `.range-picker-item-text` 施加反向 `scaleY(0.7576)`，抵消文字形变。
- Additional validation:
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - 再次用手工坐标 + 临时自动打开年份弹窗钩子抓取模拟器截图，随后撤销临时钩子。
- OS screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/filter_autoopen_modal_no_distort.png`
- Findings:
  - 该组合方案在真实模拟器里能保留更大的上下间距，同时灰色候选项文字不再随着滚轮整体一起被拉长。
