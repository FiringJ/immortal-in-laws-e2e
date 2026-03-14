# Feishu Defect Run - bug_6ff9aece5185 (pending)

- Run time: 2026-03-13 12:03 CST
- Issue: `bug_6ff9aece5185`
- Row hash: `a5aafab348528c6dcd8221a9d07596ccccee3d52`
- Queue result: `pending`
- Blocker: `infra: E2E simulator window not available (WeChat DevTools detached window missing), page-level probe screenshot blocked`

## What changed
- Repository: `/Users/firingj/Projects/immortal-in-laws`
- Updated file:
  - `pages/realname-auth/index.ts`
- Fix strategy:
  - Keep existing fallback logic for need-pay scenarios.
  - Expand auto-retry trigger for real-name verification so it can retry when fail reason indicates WeChat mismatch, even if backend error code is non-standard.
  - Preserve final fail-state handling when retry still fails.

## Validation
- `npm run type-check` ✅
- `npm run build` ✅
- Page probe:
  - Added probe script: `src/tools/probes/realname-auth-probe.ts`
  - Run failed due local infra limitation (no detached simulator window), so screenshot evidence could not be produced in this run.

## Queue writeback
- Command:
  - `npm run feishu:queue:mark -- --issue-id bug_6ff9aece5185 --row-hash a5aafab348528c6dcd8221a9d07596ccccee3d52 --result pending --blocker "infra: E2E simulator window not available (WeChat DevTools detached window missing), page-level probe screenshot blocked"`
