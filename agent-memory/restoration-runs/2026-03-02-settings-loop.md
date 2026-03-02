# 2026-03-02 Settings Loop

## Scope

- Route: `pages/settings/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `188:392`
- Figma name: `神仙亲家-我的-设置1`

## Figma Inputs

- `get_design_context(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="188:392", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
- `get_screenshot(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="188:392", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
- `get_variable_defs(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="188:392", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`

## Files Edited

- `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.ts`
- `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.wxml`
- `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.wxss`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/settings-probe.ts`
- `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/project-knowledge.md`
- `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md`

## Changes

- Retuned the settings page to the Figma card rhythm:
  - outer page padding `30rpx`
  - white grouped cards with `20rpx` radius
  - `120rpx` row height
  - tighter icon/label/status spacing
- Reworked the danger and pause sections:
  - `申请注销账号` uses the same card rhythm with red emphasis
  - `申请暂停相亲` now uses a custom Figma-like switch instead of the native Mini Program `switch`
- Cleaned up the greeting sheet interaction:
  - mask tap closes the sheet
  - panel tap no longer bubbles and closes accidentally
  - save CTA no longer depends on native `button` styling
- Added a dedicated settings probe for route entry + top/bottom/sheet screenshots.

## Validation

- `npm run build` in `/Users/firingj/Projects/immortal-in-laws`
- `npm run verify:typecheck` in `/Users/firingj/Projects/immortal-in-laws-e2e`
- `npx tsx src/tools/settings-probe.ts` in `/Users/firingj/Projects/immortal-in-laws-e2e`

## OS Screenshots

- top:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T17-07-02__settings_probe__4__settings_top.png`
- bottom:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T17-07-30__settings_probe__5__settings_bottom.png`
- greeting sheet:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T17-08-06__settings_probe__7__settings_greeting_sheet.png`

## Result

- `pages/settings/index`: `completed`
- The remaining visual differences are data-driven only, such as `个性化推荐` showing `已关闭` instead of the Figma mock's `已开启`.
