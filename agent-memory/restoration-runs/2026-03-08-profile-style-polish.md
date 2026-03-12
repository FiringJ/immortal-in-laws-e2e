# Restoration Run

## Scope

- Date: 2026-03-08 13:05 +0800
- Route: `pages/profile/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `333:170`, `333:366`, `333:401`, `333:412`
- Goal: Polish the profile page top-left share pill, realname button icon treatment, vertical spacing rhythm, preview button icon, and membership banner left padding to match the reported Figma nodes.

## Inputs

- Figma tools used:
  - `get_design_context(333:170)`
  - `get_design_context(333:366)`
  - `get_design_context(333:401)`
  - `get_design_context(333:412)`
- Existing implementation files read:
  - `pages/profile/index.{ts,wxml,wxss}`
  - `pages/invite/index.{wxml,wxss}`
  - `assets/iconfont/iconfont.wxss`
- Relevant tracker docs:
  - `agent-memory/project-knowledge.md`
  - `agent-memory/page-topology.md`
  - `agent-memory/known-issues.md`
  - `figma/data/figma-restoration-status.yaml`
  - `figma/data/figma-page-mapping.json`

## Changes

- Files edited:
  - `pages/profile/index.wxml`
  - `pages/profile/index.wxss`
- Key visual changes:
  - Increased the topbar horizontal padding and share-pill internal padding so the green `转发资料` button matches the Figma whitespace more closely.
  - Switched the `预览资料` button icon to the filled eye glyph.
  - Changed the unverified realname pill icon from the outline shield to the filled shield and tuned the pill gap/padding.
  - Relaxed the topbar-to-card spacing and the profile action-row spacing to restore the vertical rhythm from node `333:366`.
  - Removed the membership banner's state-specific negative left offset and restored a consistent left/right inner padding so the left icon no longer hugs the card edge.

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
  - `node --import tsx src/tools/profile-flow-probe.ts` in `/Users/firingj/Projects/immortal-in-laws-e2e`
- Functional checks:
  - App TypeScript type-check passed.
- OS screenshots:
  - None captured in this run.

## Findings

- Confirmed improvements:
  - The share pill now uses explicit left/right padding instead of centered content, which aligns with node `333:170`.
  - The realname and preview buttons now use filled icon treatments consistent with the reported UI deltas.
  - The member banner no longer applies the previous negative icon offset that pushed the icon into the left edge.
- Remaining gaps:
  - Actual pixel-level comparison against the simulator still needs one visual pass after the simulator window is available.
- Blockers / environment quirks:
  - OS validation was blocked because the WeChat simulator window was not detached as a separate visible window, so `profile-flow-probe` exited with `E2E skipped`.

## Durable Knowledge Added

- Page topology learned:
  - None beyond existing shared knowledge.
- Framework quirks learned:
  - None beyond existing shared knowledge.
- Follow-up recommendations:
  - Detach the simulator window in WeChat DevTools and rerun `node --import tsx src/tools/profile-flow-probe.ts` before marking the page complete again.

## Follow-up Pass

- Date: 2026-03-08 13:22 +0800
- Trigger: User reported that the profile-card vertical spacing was still too tight and that the gold member banner CTA overlapped the text block.
- Additional Figma references:
  - `get_screenshot(333:366)`
  - `get_design_context(211:609)`
  - `get_screenshot(211:609)`
- Additional changes:
  - Restored the title-row vertical rhythm in the profile card by lowering the realname pill and adding the missing space below the title row before the first info line.
  - Reworked the member banner horizontal allocation to match the gold-card Figma proportions: 20rpx side inset, 80rpx icon, narrow icon-text gap, fixed text-to-button separation, and ellipsis protection on the subtitle/description.
  - Added explicit right-side room for the info block so the gold CTA no longer intrudes into the description line.
- Additional validation:
  - `npm run type-check` passed in `/Users/firingj/Projects/immortal-in-laws`
  - OS validation was not rerun in this pass because the latest `profile-flow-probe` attempt in the same session was already blocked by the detached-simulator requirement and there was no environment change.
