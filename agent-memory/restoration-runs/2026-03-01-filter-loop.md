# Restoration Run: Filter Page + Loop Hardening

## Scope

- Date: 2026-03-01
- Route: `pages/filter/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `124:1699`
- Goal: improve filter page fidelity against Figma and harden the restoration loop with reusable logging/knowledge files

## Inputs

- Figma tools used:
  - `get_design_context(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="124:1699", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
  - `get_screenshot(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="124:1699", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
- Local design references:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-首页-精准查找1.png`
- Product doc reference:
  - `/Users/firingj/Projects/immortal-in-laws/design/1.需求文档/神仙亲家--小程序产品需求文档.md`

## Changes

- Files edited in app repo:
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/filter/filter-card/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/filter/filter-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/filter/filter-card/index.wxss`
- Structural direction:
  - removed the duplicated text-based hero composition and switched back to using the cut-image header asset as the visible hero
  - hardened `filter-card` so option rendering no longer depends on named slot fallback behavior
  - started replacing the region `picker` presentation with a custom bottom-sheet driven selection flow for more stable visuals

## Validation

- Commands run:
  - `npm run type-check` in app repo
  - `npm run build` in app repo
- Key screenshots captured:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-44-49__filter_after_fix_top_2.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-53-46__filter_after_custom_region_top_2.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-27-34__filter_after_text_flatten_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-28-13__filter_after_text_flatten_region.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-30-20__filter_region_sheet_open_ai.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-31-11__filter_submit_after_region_refactor.png`
- Functional checks confirmed earlier in this session:
  - search CTA can navigate to filter result without `加载失败`
  - marital-status behavior is single-select after repeated OS interactions
  - custom region trigger `+其他地区` opens the custom bottom-sheet region picker

## Findings

- Confirmed improvements:
  - hero is now rendered from the cut-image asset instead of retyped text
  - duplicated hero text problem is removed
  - picker-row and option-card spacing were tightened closer to Figma
  - `+其他地区` secondary region option now renders as a stable visible pill instead of breaking under native `picker` layout
  - region selection interaction was moved to a custom bottom sheet backed by `picker-view`
- Remaining gaps:
  - no major blocker remains on `pages/filter/index`; next pending page is `pages/filter-result/index`
- Environment quirks:
  - simulator sometimes returns to home during rebuild/hot-reload cycles
  - home-page dynamic banners can change the hit area for entering the filter flow

## Durable Knowledge Added

- Search flow is conditional and must be treated that way during validation.
- Native `picker` is not a reliable visual primitive for Figma-accurate pills in this workspace.
- Completion state should be rolled back when later fidelity review finds unresolved gaps.
