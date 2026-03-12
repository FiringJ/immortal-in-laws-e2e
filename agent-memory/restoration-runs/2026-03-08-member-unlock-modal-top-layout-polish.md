# Restoration Run

## Scope

- Date: 2026-03-08 18:05 +0800
- Target: `components/member-unlock-modal`
- Related route(s): member-lock / member-upsell modal flows
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `383:2415`
- Goal: Tighten the top layout of the member unlock modal so the benefits carousel sits higher and visually covers part of the hero background, while also reducing loose vertical gaps.

## Inputs

- Figma tools used:
  - `get_design_context(383:2415)`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/components/member-unlock-modal/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/member-unlock-modal/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/member-unlock-modal/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss`
- Relevant tracker docs:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/known-issues.md`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/member-unlock-modal/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/member-unlock-modal/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss`
- Key structural changes:
  - Moved the `explain-section` carousel out of the scroll body and into the modal hero block so it now lives inside the colored top area, matching the Figma composition more closely.
- Key visual changes:
  - Tightened the modal top spacing around tabs, purchase-tips strip, and benefit header.
  - Reduced the gap before the plan cards / supreme card block so the full modal stack is more compact.
  - Widened the filter range-picker wheel from the previous narrow layout so the left and right sides no longer leave the same obvious white gutter.

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` in `/Users/firingj/Projects/immortal-in-laws`
- Functional checks:
  - TypeScript type-check passed.
  - App build passed.
- OS screenshots:
  - None captured in this run.

## Findings

- Confirmed improvements:
  - The member unlock modal now places the hero carousel in the intended visual layer instead of pushing it down into the white body region.
  - The top stack is denser and should read closer to the Figma rhythm.
  - The filter range picker now uses a wider wheel viewport, which should reduce the user-reported left/right blank area.
- Remaining gaps:
  - Real-device / simulator visual confirmation is still needed for the exact overlap amount and the final horizontal density of the filter picker labels.
- Blockers / environment quirks:
  - OS validation was not rerun here; detached WeChat simulator window is still required for screenshot-level confirmation.

## Durable Knowledge Added

- For `components/member-unlock-modal`, the hero carousel belongs visually to the top hero area, not the scroll body. Leaving it in the body makes the modal look too loose and prevents the card from covering the themed background like the Figma modal.

## Follow-up Full-Bleed Pass

- Date: 2026-03-08 18:18 +0800
- Trigger: User pointed out that `unlock-tips` still had horizontal inset from the hero padding, and the top swiper sat in the wrong horizontal/vertical position.
- Additional Figma references:
  - `get_design_context(383:2497)`
- Additional changes:
  - 改为让 `unlock-tips` 脱离 `unlock-hero` 的水平内边距影响，使用负外边距扩到整块 hero 宽度，并在 viewport 内单独补回 `30rpx` 的起始偏移。
  - 将购买提示条单项宽度收紧到 `480rpx`，与 Figma 顶部提示条尺寸一致，避免两端额外空白和滚动条节奏变松。
  - 将 `explain-section-hero` 同样改成 full-bleed 层，消除 hero padding 与 section padding 的双重叠加，修正 swiper 的实际落位。
  - 微调圆点到底部的距离，使其更接近 Figma `383:2497` 的位置。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- OS validation:
  - Not rerun in this pass; still pending detached simulator screenshot verification.

## Follow-up Gold Plans Pass

- Date: 2026-03-08 18:42 +0800
- Trigger: User asked to restore the gold-tab plan strip, Figma badge treatment, and the dot position under the top carousel.
- Additional Figma references:
  - `get_design_context(383:2418)`
  - `get_design_context(383:2460)`
  - `get_screenshot(383:2415)`
- Additional changes:
  - 黄金 tab 套餐数据改回 Figma 对应的 3 张卡（`3个月 / 12个月 / 不限时间`），不再把至尊卡混进黄金套餐横向区。
  - 套餐卡片结构改为 badge image + content wrapper，重新对齐标题、价格、原价、日均/副文案的垂直节奏。
  - `性价比最高` 改回顶部居中的独立角标图，位置和样式参考 Figma `383:2460`，不再使用左上角矩形条。
  - 套餐区容器改为 20rpx 两侧边距 + 16rpx 卡间距，首屏直接呈现完整三卡布局。
  - 顶部轮播 dot 进一步上移，避免继续贴近底边。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- OS validation:
  - Not rerun in this pass; still pending detached simulator screenshot verification.
- Durable knowledge added:
  - 对该会员解锁弹窗的黄金 tab，UI 设计是三张等宽套餐卡直接铺满宽度；将至尊卡并入 gold strip 会破坏 Figma 的密度与层次。

## Follow-up Product-Logic Pass

- Date: 2026-03-08 19:02 +0800
- Trigger: User asked to keep the 4th extra plan card, fix the `性价比最高` badge clipping/position, and continue polishing the top carousel dots.
- Additional Figma references:
  - `get_design_context(383:2418)`
  - `get_design_context(383:2460)`
  - `get_metadata(383:2415)`
  - `get_design_context(385:847)`
- Additional changes:
  - 恢复 gold strip 的第 4 张额外卡片产品逻辑，并保持横向滚动可继续访问最后一张卡。
  - 将套餐轨道改回 `inline-flex` 内容宽度模式，避免 `width: 100%` 压缩后影响真实滚动宽度。
  - 将 `性价比最高` 角标从居中悬浮改回左上角贴边定位，并给滚动区增加更大的顶部安全空间，修复角标被顶部裁切的问题。
  - 将轮播 dot 再次上移，使其与卡片底边拉开更明显距离。
- Slice decision for supreme main card:
  - 用户给的 `385:847` 经过 MCP 检查后只解析到了一个圆角背景切片，并不是至尊主卡的完整可用整图节点，因此本轮没有直接把它接入运行时代码，避免错误使用半成品切图。
  - 目前仍保留现有 `supreme-main-card` 结构化实现；如果后续定位到完整主卡切片节点，可再走 CDN 切图替换流程。
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
