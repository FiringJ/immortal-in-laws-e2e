# Chat Photo Modal Three-State Restoration

## Scope

- Date: 2026-03-05
- Route: `pages/chat/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId:
  - `163:51` (未上传照片)
  - `163:156` (审核失败/不符合要求)
  - `163:119` (上传成功)
- Goal: Restore the chat photo-send bottom modal to match Figma and expose three visual states.

## Inputs

- Figma tools used:
  - `get_design_context` + `get_screenshot` for `163:51`
  - `get_design_context` + `get_screenshot` for `163:156`
  - `get_design_context` + `get_screenshot` for `163:119`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-photo-modal/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`
- Key structural changes:
  - Converted photo modal from centered card to bottom sheet layout.
  - Added explicit three-state rendering path:
    - `idle`: placeholder upload area + disabled button.
    - `invalid`: warning text + preview + disabled button.
    - `ready`: preview + enabled gradient send button.
- Key logic changes:
  - Confirm action is blocked unless `photoStatus === 'ready'`.
  - Reopen modal keeps invalid state instead of coercing to ready.
  - Sending now checks `photoStatus` before upload and maps moderation-like backend errors to `invalid`.

## Validation

- Commands run:
  - `npm run build` (app repo, passed)
  - `node --import tsx src/tools/chat-probe.ts` (E2E repo, blocked before actions)
- OS screenshots:
  - Not captured due E2E init blocker (detached simulator window not found).

## Findings

- Confirmed improvements:
  - Photo modal now visually/behaviorally supports all three Figma states.
  - Disabled/enabled send button behavior matches state design.
- Remaining gaps:
  - OS-level screenshot evidence pending environment recovery.
- Blockers / environment quirks:
  - E2E cannot locate a detached WeChat simulator window in current desktop state.
