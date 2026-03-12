# 2026-03-08 Guest Detail Unfavorite Modal

- Route: `pages/guest-detail/index`
- Figma file: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma node: `154:1684`
- Scope: align the guest-detail unfavorite confirmation modal with the Figma UI

## Changes

- Replaced the guest-detail page's unfavorite dialog with a page-scoped custom modal in `/Users/firingj/Projects/immortal-in-laws/pages/guest-detail/index.wxml`.
- Added dedicated unfavorite modal styles in `/Users/firingj/Projects/immortal-in-laws/pages/guest-detail/index.wxss`.
- Removed the split between blocked-state and normal-state unfavorite dialog markup so both states now use the same Figma-aligned layout.
- Updated the modal copy to match the Figma node:
  - title: `温馨提醒`
  - content: `您确定将此人从收藏联系人中取消吗？`
  - confirm CTA: `取消此人`

## Verification

- Figma MCP fetched successfully:
  - `get_design_context(154:1684)`
  - `get_screenshot(154:1684)`
- Code diff reviewed locally.
- OS-level validation attempt failed before navigation because WeChat DevTools did not expose a detached simulator window.

## Blocker

- E2E probe command:
  - `node --import tsx /Users/firingj/Projects/immortal-in-laws-e2e/src/tools/favorite-visual-coordinate-probe.ts`
- Failure:
  - `找不到分离的模拟器窗口`
- Required environment fix:
  - open WeChat DevTools
  - detach the simulator into a separate visible window
  - keep the simulator window visible and not minimized
