# Restoration Run

## Scope

- Date: 2026-03-08 12:00:37 CST
- Routes:
  - `pages/beans/index`
  - `pages/beans-record/index`
  - `pages/beans-rule/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeIds:
  - `270:74` 我的红豆
  - `185:969` 红豆明细
  - `185:1110` 红豆规则
- Goal: Rebuild the beans home, record, and rule pages against the mapped Figma screens, and supplement the rule page with PRD-backed bean rules.

## Inputs

- Figma tools used:
  - `get_design_context` for `270:74`, `185:969`, `185:1110`
  - `get_screenshot` for `270:74`, `185:969`, `185:1110`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.wxss`
- Relevant product/docs sources:
  - `/Users/firingj/Projects/immortal-in-laws/docs/prd-todo.md`
  - `/Users/firingj/Projects/GodQinJia/docs/xuqiu.md`
  - `/Users/firingj/Projects/GodQinJia/docs/bean-task-support-review-2026-02-08.md`
  - `/Users/firingj/Projects/GodQinJia/docs/cron-schedule.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/known-issues.md`

## Changes

- Files edited in app repo:
  - `/Users/firingj/Projects/immortal-in-laws/config/beans.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-record/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/beans-rule/index.wxss`
- Key structural changes:
  - Switched all three pages to custom navigation so the beans hero and simple white top bars can match Figma.
  - Rebuilt the beans page hero, consume cards, and task list spacing/styling to follow node `270:74`.
  - Rebuilt the record page into simple single-line cards with Figma-like spacing and exact `MM月DD日 HH:mm` time formatting.
  - Replaced the placeholder rule page with a text-heavy PRD-backed rules layout following node `185:1110`.
- Key content/business changes:
  - Centralized bean page copy into `config/beans.ts`.
  - Preserved real consumption values from product/backend docs: search `100`, refresh `300`, unlock `30`, exposure `500`.
  - Added rule copy for earning paths, usage rules, transaction visibility, and yearly free-bean expiry/clear behavior.
  - Added fallback transaction title mapping by `source` when backend `remark` is empty.

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` in `/Users/firingj/Projects/immortal-in-laws`
  - `node --import tsx -e "... initE2E ..."` in `/Users/firingj/Projects/immortal-in-laws-e2e`
- Results:
  - TypeScript type-check: passed
  - App build: passed
  - OS-level validation: blocked before navigation
- OS screenshots: none
- Functional/visual blockers:
  - `initE2E()` could not find a detached WeChat simulator window, so no device screenshot or page-level visual diff could be produced in this run.

## Findings

- Confirmed improvements:
  - The previous generic beans home layout has been replaced with a Figma-aligned custom-nav hero and tighter card/task styling.
  - Record and rule pages now have their own dedicated custom-nav layouts instead of generic placeholder cards.
- Remaining gaps:
  - Final OS-level comparison against the live simulator is still pending for all three pages.
- Blockers / environment quirks:
  - WeChat DevTools simulator was not available as a detached visible window, so the E2E device layer could not initialize.

## Durable Knowledge Added

- None beyond existing shared notes; the detached-simulator blocker was already documented in shared memory.

## Follow-up

- Re-run OS validation after opening WeChat DevTools with the simulator detached as an independent visible window.
- Capture fresh screenshots for:
  - beans home top section
  - beans record list
  - beans rule page first screen
