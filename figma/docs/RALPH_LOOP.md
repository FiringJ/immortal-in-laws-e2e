# Ralph Loop

## Goal

Run the Figma restoration workflow continuously without relying on ad-hoc manual context recovery.

## Principles

- Always process one pending page per run.
- Always read memory before editing code.
- Always build and run OS validation before changing page status.
- Never auto-complete a page when known visual gaps remain.
- Stop on repeated blockers instead of infinite retry loops.

## Entry Point

- Command:
  - `npm run loop:next`
  - `npm run loop:next:json`
  - `npm run loop:mark -- --route <route> --result <completed|failed|blocked|pending|reset|skipped> [--blocker "..."] [--notes "..."]`
  - `npm run notify:feishu -- --title "..." --text "..."`

## Runner Output

The runner reads:

- `figma/data/figma-restoration-status.yaml`
- `agent-memory/project-knowledge.md`
- `agent-memory/known-issues.md`
- `agent-memory/user-feedback-ledger.md`

It returns:

- current pending count
- actionable pending count
- blocked page count
- next pending page
- route / figma name / node id / wxss path
- blocked pages and blocker reasons
- reminder hints for the next run

## Recommended Automation Behavior

For each scheduled run:

1. Run `npm run loop:next` in `immortal-in-laws-e2e`
2. Read the next pending page and memory files
3. Use the local Figma restoration skill/workflow to process only that page
4. Build `immortal-in-laws`
5. Run the page-specific probe if it exists
6. Save screenshots and update memory/status
7. At the end of the run, call `npm run loop:mark`:
   - `completed` when the page is actually done
   - `failed` with `--blocker` when a repeatable blocker stopped the run
   - `blocked` when the blocker is immediately known to need manual intervention
   - `reset` when you intentionally want to re-open a previously blocked page
8. Stop after one page, or stop earlier on blocker

## Optional Failure Notification

- Add `FEISHU_WEBHOOK_URL` to the E2E repo runtime environment
- On blocker/failure, call:
  - `npm run notify:feishu -- --title "Ralph Loop Failed" --text "page: ...\nreason: ...\nrun log: ..."`

## Guardrails

- If Figma MCP is unavailable, stop and log blocked state
- If WeChat DevTools or detached simulator window is unavailable, stop
- If the same page hits the same blocker twice across runs, `loop:mark --result failed` will auto-promote it to `blocked`
- If OS state is ambiguous, return to a deterministic base page before continuing
