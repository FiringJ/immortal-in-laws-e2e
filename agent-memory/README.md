# Agent Memory

This directory stores durable execution context for repeated Figma restoration and E2E work in the `immortal-in-laws` workspace.

Use it for two kinds of memory:

- `restoration-runs/`: per-run logs with goals, tool calls, file edits, screenshots, validation results, blockers, and conclusions.
- shared knowledge files: reusable facts about page topology, framework quirks, known bugs, and implementation guidance.
- `user-feedback-ledger.md`: a durable ledger of user-reported issues, corrections, and review comments across turns

Minimum update rule for each restoration task:

1. Read the shared knowledge files before editing.
2. Append any newly raised user issue or correction to `user-feedback-ledger.md`.
3. Create or update one run log under `restoration-runs/`.
4. If new durable knowledge was learned, update the appropriate shared knowledge file.
5. Do not mark a page complete unless the run log contains post-change OS validation evidence.

Shared files:

- `project-knowledge.md`
- `page-topology.md`
- `known-issues.md`
- `user-feedback-ledger.md`
- `templates/restoration-run-template.md`
