# Chat Input / Emoji / Voice Fidelity Pass

## Scope

- Date: 2026-03-05
- Route: `pages/chat/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId:
  - `165:522` 聊天室-表情-弹窗1
  - `167:63` 聊天室-表情-弹窗2（图包）
  - `162:72` 聊天室-语音模式
  - `165:41` 聊天室-语音模式-说话中
  - `165:359` 聊天室-语音模式-松开取消
- Goal: Continue chat page restoration for emoji panel and voice-record interaction states.

## Inputs

- Figma tools used:
  - `get_design_context` + `get_screenshot` for all five nodes above.
- Existing implementation files read:
  - `components/emoji-picker/index.{ts,wxml,wxss}`
  - `components/pages/chat/chat-input-bar/index.{ts,wxml,wxss}`
  - `components/pages/chat/chat-action-buttons/index.wxss`
  - `components/pages/chat/chat-voice-overlay/index.{wxml,wxss}`
  - `pages/chat/index.{ts,wxml}`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-action-buttons/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-voice-overlay/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-voice-overlay/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxml`
  - Added local sticker assets:
    - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-1.png` … `sticker-8.png`
- Key structural changes:
  - Rebuilt emoji picker to two-tab layout (`smile` / `heart`) with separate emoji and sticker panels.
  - Moved emoji panel to live under `chat-bottom-fixed` instead of floating as an independent overlay.
  - Refactored input bar to explicit text-mode/voice-mode UI with iconfont buttons and Figma-like dimensions.
  - Rebuilt voice recording overlay into full-screen dim layer + wave card + cancel pill + bottom release zone with cancel/send states.
- Key behavior changes:
  - Emoji panel open/close and input-mode switches now trigger `calculateScrollViewHeight()` to keep chat viewport stable.
  - Sticker tab click currently gives a non-blocking toast (`表情包发送能力开发中`) while preserving UI fidelity.

## Validation

- Commands run:
  - `npm run build` in `/Users/firingj/Projects/immortal-in-laws` (pass).
- OS screenshots:
  - Not run in this pass (user explicitly requested no probe flow due speed).

## Findings

- Confirmed improvements:
  - Chat bottom interaction area now matches the five provided nodes much closer in hierarchy and state transitions.
  - Emoji and voice recording states are represented as dedicated UI states instead of a generic panel/overlay.
- Remaining gaps:
  - OS-level pixel check is pending by request; should be done in next pass if visual fine-tune is needed.
