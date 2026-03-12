# 2026-03-05 Profile FAST Calibration (Node 211:916)

## Scope
- Route: `pages/profile/index`
- Mode: `FAST`
- Goal: calibrate visual mismatches against Figma node `211:916` after user reported style issues.

## Figma
- File: `WTgcdFVxfCUU2RRtR6ArKq`
- Node fetched: `211:916` (full page state, supreme member variant)
- Calls used this round: 1 design-context call

## Changes
- `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.wxml`
  - Added `member-title-row` and `member-title-sub` rendering for split membership title typography.
  - Added section modifiers: `function-card-common` and `function-card-other`.
- `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.ts`
  - Added `titleSub?: string` in `MemberBanner`.
  - Split membership titles for `gold/expired/supreme` to align with Figma mixed font sizing.
  - Fixed `防骗指南` icon source from shield-check to book icon.
- `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.wxss`
  - Top bar: adjusted share pill width/background and converted right controls to a single capsule style.
  - Member banner: added title-row/subtitle typography and color inheritance by state.
  - Function cards: set common-function label color to `#800000` per Figma.

## Minimal Verification
- `npm run type-check` passed.

## Not done in FAST
- No OS-level visual screenshot comparison against simulator after this patch.
- No loop status mark update.

## Follow-up tweak after user feedback (background color)
- Parsed Figma asset SVG fills for card backgrounds (profile/common/other cards), which resolve to white fill fallback.
- Adjusted card background colors in `pages/profile/index.wxss`:
  - `.profile-card`: `#ffffff`
  - `.function-card`: `#ffffff`
- Minor member subtitle overflow tuning:
  - reduced title-row gap and removed subtitle ellipsis clipping to avoid premature truncation.
