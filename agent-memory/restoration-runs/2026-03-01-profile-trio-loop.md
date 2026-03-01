# 2026-03-01 Profile Trio Loop

## Scope

- Complete Figma restoration and OS validation for:
  - `pages/profile/index`
  - `pages/profile-preview/index`
  - `pages/profile-edit/index`

## Figma Sources

- `pages/profile/index`
  - fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
  - nodeId: `211:80`
  - figma name: `神仙亲家-我的-会员未开通1`
- `pages/profile-preview/index`
  - fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
  - nodeId: `183:1603`
  - figma name: `神仙亲家-我的-预览资料1`
- `pages/profile-edit/index`
  - fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
  - nodeId: `175:1082`
  - figma name: `神仙亲家-我的-相亲资料1`

## Files Edited

- App repo:
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-preview/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-preview/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-preview/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`
  - `/Users/firingj/Projects/immortal-in-laws/types/user.ts`
- Tracker / E2E repo:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/profile-flow-probe.ts`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md`

## Key Restoration Decisions

- `profile`:
  - restored the missing top-right floating controls from the Figma first screen
  - kept the profile card / member banner / function blocks on the same visual rhythm as the design
- `profile-preview`:
  - replaced the generic section-card implementation with a Figma-specific long page
  - restored the gradient identity card, red gender-year headline, split summary columns, section dividers, and bottom dual CTA
  - added explicit `户籍` support from preview payload fields
  - aligned mate criteria display to the design by deriving `年份要求` from full criteria data when available
- `profile-edit`:
  - replaced the generic form look with grouped white cards on a gray page
  - restored the Figma photo-upload block, grouped section headers, and fixed bottom save CTA
  - aligned visible field order with the design, including `相亲编号`
  - removed the visible `微信号` row from the contact block to match the Figma frame
  - forced the native nav title with `wx.setNavigationBarTitle('相亲资料')` because simulator/native-title refresh lagged behind JSON changes during OS validation

## Validation

- `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- `npm run verify:typecheck` passed in `/Users/firingj/Projects/immortal-in-laws-e2e`
- DevTools compile had to be triggered with `Command + B` so the simulator would pick up `profile-edit` WXML/WXSS/JSON changes
- Dedicated OS flow validation passed with:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/profile-flow-probe.ts`

## Screenshot Evidence

- `profile` top:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-46-57__profile_flow_probe__1__profile_top.png`
- `profile-preview` top / bottom:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-47-41__profile_flow_probe__3__profile_preview_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-47-50__profile_flow_probe__3__profile_preview_bottom.png`
- `profile-edit` top / middle / bottom:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-49-15__profile_flow_probe__5__profile_edit_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-49-28__profile_flow_probe__5__profile_edit_mid.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T13-49-41__profile_flow_probe__5__profile_edit_bottom.png`

## Outcome

- `pages/profile/index`: completed
- `pages/profile-preview/index`: completed
- `pages/profile-edit/index`: completed
