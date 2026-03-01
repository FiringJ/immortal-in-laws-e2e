# 2026-03-01 Feedback Fixes And Profile Loop

## Scope

- Fix two user-reported regressions with a perception -> code -> validation loop:
  - `pages/history/index`: the lock strip must not overlap the guest introduction copy
  - `pages/index/index`: unpaid-order banner must use the same fixed slot as the recommend banner, and the two banners must never appear together
- Start the next pending page:
  - `pages/profile/index`

## User Feedback Logged

- Added a durable feedback ledger:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/user-feedback-ledger.md`
- Updated memory README so each new user issue must be appended before coding:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/README.md`

## Files Edited

- Feedback fixes:
  - `/Users/firingj/Projects/immortal-in-laws/pages/history/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/history/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/index/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/index/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/service-banner/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/service-banner/index.wxss`
- Probe tooling:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/home-status-banner-probe.ts`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/profile-probe.ts`
- Profile first-pass polish:
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.wxss`
- Memory / tracking:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/README.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/user-feedback-ledger.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml`

## Key Corrections

- `history` preview cards now reserve bottom space for the `至尊会员才能查看/联系过往嘉宾` strip, so the strip no longer covers the guest introduction copy.
- Home unpaid-order UI no longer reuses the recommend-banner visibility slot incorrectly:
  - unpaid and recommend banners are now mutually exclusive
  - unpaid banner is rendered in the same fixed bottom position
  - the unpaid banner is now a dedicated page-level structure, which avoids the earlier component-theme mismatch
- `profile` first-pass refinements:
  - adjusted card radii and inner spacing
  - enlarged the photo block toward the Figma proportions
  - refined the real-name pill, member banner button, and function-card spacing

## Validation

- `npm run build` passed in `/Users/firingj/Projects/immortal-in-laws`
- `npm run verify:typecheck` passed in `/Users/firingj/Projects/immortal-in-laws-e2e`
- History OS validation passed:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-23-40__history_probe__3__history_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-23-49__history_probe__3__history_mid.png`
- Home status-banner OS validation passed:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-36-02__home_status_banner_probe__3__home_status_banner.png`
- Profile first-pass OS screenshot captured:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-43-43__profile_probe__1__profile_top.png`

## Current Decision

- `pages/history/index`: fixed and validated
- `pages/index/index` banner regression: fixed and validated
- `pages/profile/index`: still pending; first Figma-guided polish pass is done, but the route is not complete yet
