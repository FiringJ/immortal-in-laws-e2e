# 2026-03-01 History Loop

- Route:
  - `pages/history/index`
- Figma:
  - file key: `WTgcdFVxfCUU2RRtR6ArKq`
  - node id: `129:146`

## Scope

- Re-pulled the history page design context and screenshot from Figma MCP.
- Refined the non-member history page to match the Figma layout more closely:
  - top filter arrow now uses the proper iconfont arrow instead of a text glyph
  - date pill width/offset matches the card shell more closely
  - history cards use corrected top spacing and inner horizontal padding
  - lock strip now uses a real lock image asset and corrected inset/bottom spacing
  - footer count, helper copy, and primary CTA were resized to match the design
- Added a reusable `history-probe` script for future OS validation loops.

## Files Edited

- `/Users/firingj/Projects/immortal-in-laws/pages/history/index.wxml`
- `/Users/firingj/Projects/immortal-in-laws/pages/history/index.wxss`
- `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxss`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/history-probe.ts`
- `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
- `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/known-issues.md`
- `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml`

## Validation

- `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- `npm run verify:typecheck` passed in `/Users/firingj/Projects/immortal-in-laws-e2e`
- `npx tsx src/tools/history-probe.ts` passed in `/Users/firingj/Projects/immortal-in-laws-e2e`
- Latest OS screenshots:
  - top: `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-09-41__history_probe__3__history_top.png`
  - middle / blocked card / footer: `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-09-50__history_probe__3__history_mid.png`

## Notes

- The Figma screenshot shows a mixed placeholder set of one no-photo card, one photo card, and one blocked card. Runtime history data is live, so card photo presence and the exact preview mix should not be hard-coded or reordered just to mimic that placeholder composition.
- This pass is considered complete for visual restoration of the current non-member state.
