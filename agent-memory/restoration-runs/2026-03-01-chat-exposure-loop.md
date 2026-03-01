# 2026-03-01 Chat And Exposure Loop

## Scope

- `pages/chat/index`
- `pages/exposure/index`

## Figma Inputs

- chat:
  - fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
  - nodeId: `159:1169`
  - figmaName: `神仙亲家-消息-聊天室1`
- exposure:
  - fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
  - nodeId: `382:118`
  - figmaName: `神仙亲家-首页-超级曝光-开通页1`

## Chat Work

- Replaced the scrolling homepage `guest-card` in chat with a dedicated white summary card that matches the Figma chat frame more closely.
- Restyled:
  - fixed top header card
  - message bubbles
  - action pills
  - bottom input row
- Added a custom long-press menu state in code:
  - `删除`
  - `撤回`
  - `复制`
- Added probe:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/chat-probe.ts`

## Chat Validation

- `npm run build` in app repo: passed
- `npm run verify:typecheck` in E2E repo: passed
- OS screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T14-37-45__chat_probe__3__before_assert.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T14-38-26__chat_probe__3__chat_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T14-38-33__chat_probe__3__chat_mid.png`

## Chat Findings

- The first stable screen is visually much closer to the mapped Figma frame than the old implementation.
- Initial validation landed in a locked conversation, but after the user unlocked membership the member-state path was revalidated.
- Member-state OS validation confirms:
  - action pills and bottom input row render
  - sending `您好` produces a green outgoing bubble
- Remaining chat gaps:
  - the first visible member-state screen still does not include the white guest summary card from the mapped Figma viewport
  - the black long-press menu still cannot be OS-validated because the current E2E device helper does not support a real press-and-hold gesture

## Additional Chat Validation After Membership Unlock

- Probe:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/chat-probe.ts`
- Additional OS screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-05-10__chat_probe__3__before_assert.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-05-42__chat_probe__3__chat_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-05-49__chat_probe__3__chat_mid.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T15-06-18__chat_probe__4__after_act.png`

## Exposure Work

- Confirmed that the mapped Figma frame is the marketing/opening page, not the functional exposure-control page.
- Corrected the entry semantics from home:
  - home top quick-action `超级曝光` now opens `/pages/exposure/index?showGuide=true`
  - home exposure preview `查看全部` now opens `/pages/exposure/index?showGuide=false`
- Kept the existing guide slicing approach because the local assets already match the Figma opening page structure.
- Added probe:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/exposure-probe.ts`

## Exposure Validation

- `npm run build` in app repo: passed
- `npm run verify:typecheck` in E2E repo: passed
- OS screenshot:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T14-53-13__exposure_probe__2__exposure_top.png`

## Result

- `pages/chat/index`: keep `pending`
- `pages/exposure/index`: update to `completed`
