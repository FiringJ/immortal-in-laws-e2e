# Guest Detail Credibility Card Fix Run

## Scope

- Date: 2026-03-05
- Route: `pages/guest-detail/index`
- Target component: `/components/pages/guest-detail/credibility-card/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `116:91`
- Goal: Restore real-name credibility card geometry and right-side alignment to match Figma.

## Inputs

- Figma tools used:
  - `get_design_context(fileKey=WTgcdFVxfCUU2RRtR6ArKq, nodeId=116:91)`
  - `get_screenshot(fileKey=WTgcdFVxfCUU2RRtR6ArKq, nodeId=116:91)`
- Local implementation read:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.ts`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxss`
- Key visual changes:
  - Card width changed from full container width to fixed `670rpx` with centered placement.
  - Right-side info anchor adjusted from `right: 20rpx` to `right: 28rpx`.
- Rationale:
  - Figma node is a fixed `670x190` card at page x=40, while page content container is wider; fixed width is required for accurate left/right margins and trust block position.

## Validation

- Commands run:
  - `npm run build` (in `/Users/firingj/Projects/immortal-in-laws`) ✅
- OS screenshot validation:
  - Not executed in this round.

## Notes

- Existing background and medal assets (`bg-2.png`, `badge.png`) already match the node style and were retained.
