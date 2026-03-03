# Repository Agent Rules

## Scope
These rules apply to the entire repository at `/Users/firingj/Projects/immortal-in-laws-e2e`.

## Mandatory Feishu Completion Notification
For every task that involves execution work (code changes, command execution, diagnostics, or file edits), send one Feishu webhook notification before the final user-facing response.

1. Run notification from repository root:

```bash
npm run notify:feishu -- --title "[Codex] Task Completed" --text "Task: <task summary>\nStatus: <success|blocked|failed>\nResult: <what was done>\nFiles: <changed files or none>\nNext: <next action or none>"
```

2. Notification timing:
- Must be sent after work is complete.
- Must be sent before the final assistant response.

3. Delivery guarantee:
- If `FEISHU_WEBHOOK_URL` is missing or webhook delivery fails, explicitly report that in the final response with the failure reason.

4. Message quality:
- Keep text concise and factual.
- Do not include secrets, tokens, cookies, or private credentials.

## Environment Requirement
- `FEISHU_WEBHOOK_URL` must be configured in `.env.local` or environment variables.
