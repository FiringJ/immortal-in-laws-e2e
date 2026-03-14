# Message Record Action Sheet Two-Action Spacing (2026-03-14)

## Scope

- Date: 2026-03-14
- Route: `pages/message-record/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `184:56`
- Goal: 修正“看过我”卡片更多操作弹框在仅有 2 个按钮时底部留白过大的问题，并保持多操作场景不受影响。

## Inputs

- Figma tools used:
  - `mcp__figma__get_design_context`
  - `mcp__figma__get_screenshot`
  - `mcp__figma__get_metadata`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-action-sheet/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-action-sheet/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-action-sheet/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/helpers.ts`
- Local design reference:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-看过我-选择操作-弹窗1.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-我收藏的-选择操作-弹窗1.png`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-action-sheet/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-action-sheet/index.wxss`
- Key structural changes:
  - 为记录页专用操作弹框增加按 `actionItems.length` 切换的两项紧凑态类名。
  - 保留三到四项操作的原有网格布局，避免“我收藏的 / 我解锁的”等多操作场景回归。
- Key visual changes:
  - 两项操作时将底板最小高度从通用的 `677rpx` 收紧为 `470rpx`，与本地设计图底板高度一致。
  - 两项操作时去掉底部多余的 item 间距，减少底部 padding，并让两个操作项居中分布。

## Validation

- Commands run:
  - `git diff -- components/pages/message-record/record-action-sheet/index.wxml components/pages/message-record/record-action-sheet/index.wxss`
  - `sips -g pixelWidth -g pixelHeight '/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-看过我-选择操作-弹窗1.png'`
- OS screenshots: 无
- Functional checks:
  - 代码路径确认“看过我 / 收藏我”两项操作场景会命中紧凑态类名。
  - 三到四项操作场景仍走原有类名和布局，不受本次样式收紧影响。

## Findings

- Confirmed improvements:
  - 已消除两项操作场景的固定大高度来源，底部留白会明显收紧。
  - 两项操作改为居中排布，更贴近“看过我”本地设计图。
- Remaining gaps:
  - 本轮未拿到微信开发者工具中的 OS 级渲染截图，仍需在模拟器里做一次最终视觉确认。
- Blockers / environment quirks:
  - 本次仅做组件级样式修正，没有现成的专用视觉 probe；若要补 OS 证据，需要手动或新增短路径 probe 进入 `pages/message-record/index` 的“看过我”更多弹框态。

## Durable Knowledge Added

- Page topology learned:
  - `pages/message-record/index` 的更多操作弹框由 `components/pages/message-record/record-action-sheet` 承担，多个 tab 共用同一组件。
- Framework quirks learned:
  - 该弹框不能对两项和多项操作共用同一个固定高度；小程序底部安全区叠加后会把两项场景的底部空白放大得很明显。
- Follow-up recommendations:
  - 后续若继续做记录页视觉还原，优先按按钮数量定义弹框 variant，不要再用单一 `min-height` 覆盖所有记录 tab。
