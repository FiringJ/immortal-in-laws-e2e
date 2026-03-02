# Project Knowledge

## Repo Roles

- App repo: `/Users/firingj/Projects/immortal-in-laws`
- Tracker/E2E repo: `/Users/firingj/Projects/immortal-in-laws-e2e`

## Figma Restoration Rules

- Read mapping/status in the E2E repo first, but edit source code only in the app repo.
- The shared Figma MCP file key for the current restoration loop is `WTgcdFVxfCUU2RRtR6ArKq`. If run logs and mapping disagree, treat mapping as the source of truth and update it immediately before continuing.
- Ralph loop pages should not stay in endless `pending` retry. Record run outcomes with `npm run loop:mark`; the same blocker repeated twice should move the page to `blocked` until someone explicitly resets it.
- `npm run loop:mark` writes the shared YAML status file. Do not run multiple `loop:mark` commands in parallel for different pages, or later writes can overwrite earlier status changes.
- For WeChat Mini Program pages, prefer editing `.ts`, `.wxml`, `.wxss`; never hand-edit generated `.js` unless no source exists.
- If `.ts` changes, run `npm run build` in the app repo before trusting simulator output.
- Do not mark a page `completed` when there are known visual gaps or missing post-change OS evidence.

## Mini Program Runtime Quirks

- Native `button` elements often inject default width, padding, and border behavior. For Figma fidelity, prefer `view` wrappers for CTA layout unless native button semantics are required.
- Native `picker` can destabilize visible layout when used directly as a styled flex item. Prefer separating visible UI from interaction, or use a custom bottom sheet with `picker-view` when fidelity matters.
- Simulator state can jump back to the home page after rebuilds or hot reload. Always re-check the actual current page before assuming validation context.
- During OS validation with WeChat DevTools, `Command + R` is not a reliable substitute for project compile. Use the DevTools compile shortcut (`Command + B`) when WXML/WXSS/JSON changes do not appear in the simulator.
- For page-title fidelity, native navigation bars in the simulator can lag behind `index.json` changes. If the title must match Figma exactly during validation, explicitly call `wx.setNavigationBarTitle(...)` in `onLoad/onShow`.

## Filter / Search Flow

- Home quick action `精准查找` is conditional by product logic:
  - if saved filter requirements exist, it can enter `pages/filter-result/index`
  - otherwise it enters `pages/filter/index`
- `pages/filter-result/index` top-right `条件设置` returns to `pages/filter/index`
- `pages/filter/index` search CTA should enter `pages/filter-result/index` without `加载失败`
- For Figma fidelity, `pages/filter-result/index` needs a dedicated result-card scene:
  - no right-side photo block in the non-member result design
  - full-width two-column info layout
  - single gold lock CTA instead of the default dual-button footer

## History Restoration Notes

- `pages/history/index` currently uses live runtime data for preview cards. Do not force card order or photo presence just to imitate the placeholder mix in the Figma screenshot.
- A stable history validation path is:
  - return to `pages/index/index` if needed
  - tap the top-left `历史推荐` entry
  - assert the `历史推荐` title plus `昨日推荐 / 日期筛选`
  - capture one top screenshot and one mid screenshot with fixed-count downward scrolls

## Chat Restoration Notes

- `pages/chat/index` mapped frame `159:1169` is an unlocked conversation state:
  - it shows the white header card, a white guest summary card, one incoming white bubble, one outgoing green bubble, and the bottom input row
  - it also contains a visible custom long-press menu state (`删除 / 撤回 / 复制`)
- After the user unlocked membership, the same validation path now reaches the unlocked input state:
  - the bottom row shows `交换微信 / 拨打电话 / 发送照片`
  - the text input and send button are available
  - a short probe message can be sent to create a green outgoing bubble
- For chat probes:
  - avoid vague AI instructions on the first conversation row
  - a double-tap can open chat and immediately jump again into the guest profile page by hitting the header card on the second tap
  - capture the first stable chat screen before attempting optional long-press validation
  - the E2E device layer now exposes a real hold gesture via `MiniProgramDevice.longPressAt(...)`, and the MCP server also exposes `long_press`
  - the stable chat validation path is:
    - tap the top-left back point twice to unwind guest-detail/chat pages back to a tab page
    - tap the bottom `消息` tab directly
    - assert the message list page before tapping the first conversation row
    - use direct button centers for `交换微信 / 拨打电话 / 发送照片`
    - use the latest outgoing green bubble center for long-press validation
  - on chat modals, hide the bottom fixed action bar while the modal is open; otherwise WeChat Mini Program fixed-layer composition can make the base action bar overlap the sheet

## Exposure Entry Rules

- `pages/exposure/index` mapping `382:118` is the marketing/opening page, not the post-purchase control panel.
- Home-page exposure entry semantics are now split:
  - top quick-action card `超级曝光` -> `/pages/exposure/index?showGuide=true`
  - exposure preview section `查看全部` -> `/pages/exposure/index?showGuide=false`
- This keeps the Figma-mapped opening page on the primary home entry while preserving a direct route into the functional control page.

## Member Center Design Mapping

- `pages/member-center/index` is a multi-frame design area. Do not assume one node or one exported PNG covers every state.
- Current confirmed primary mapping for the gold first screen:
  - Figma node: `211:1708`
  - local design export: `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-黄金会员1.png`
- Current confirmed primary mapping for the supreme long page:
  - local design export: `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-至尊会员1.png`
- Likely companion / secondary long frame for the same route:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-黄金会员2.png`
  - treat this as a secondary route/frame reference, not as the single source of truth for the gold first screen
- These three local exports are profile-page membership entry states, not `pages/member-center/index`:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-黄金会员-未过期1.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-黄金会员-已过期1.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-我的-至尊会员-永久1.png`
- Local design file names around member-center are not fully reliable as state labels. Prefer mapping by page intent, visible content, and image dimensions before implementation.
- `https://static.yilusx.com/assets/imgs/member-center/brand.png` already contains the supreme title artwork, the pill text, and the `开通后，成功率提升10倍` line. Do not overlay extra DOM copy on top of it.
- The local copied `brand.png` under `/assets/imgs/member-center/brand.png` renders abnormally in the mini program runtime on this project. The remote CDN version is the stable source for the supreme hero slice.
- On member-center, remote `https://static.yilusx.com/assets/imgs/member-center/...` image URLs are more reliable than local `/assets/...` paths for sliced design assets. If a slice unexpectedly renders blank, first switch it back to the CDN form.
- `member.png` is not a reliable title-decoration asset in the mini program runtime for member-center. The safer implementation for section titles is plain DOM divider lines, while keeping true sliced assets only for real content cards/badges.
- Gold benefits are not static. They should follow the currently selected gold plan:
  - 季卡: `有效期93天` + `每天推荐8位对象`
  - 年卡: `有效期12个月` + `每天推荐18位对象`
  - 永久: `有效期不限时间` + `每天推荐26位对象`
- Test environment member prices returning `0` is normal in this project. Treat it as verification data for fast styling/function checks, not as a blocking runtime bug for member-center restoration.
- On member-center probes, direct `device.scroll('up')` is more reliable for returning to the top of the page than a natural-language `aiAct` scroll-to-top instruction.
- On member-center probes, add an explicit post-tab-switch wait before taking screenshots. Large sliced images can appear blank if the capture happens immediately after switching to the supreme tab.
- The most stable member-center validation path is:
  - from `pages/profile/index`, click the membership entry `去开通`
  - assert the `黄金会员 / 至尊会员` tabs
  - switch tabs with direct device taps
  - capture long-page sections with fixed-count device scrolls instead of AI natural-language scrolling

## Validation Rules

- OCR/title-only checks are insufficient.
- Save screenshots after the latest change, not from earlier iterations.
- When navigation is conditional or flaky, record that condition in the run log instead of pretending navigation is deterministic.
- On the search flow, prefer validating the forward loop `result -> 条件设置 -> filter -> 立即搜索 -> result`; it is more stable than relying on OS back during simulator churn.
- On complex pages that are already open in the simulator, short in-page validation sequences are often more reliable than long AI-driven entry chains.
- On chat-page validation specifically, direct coordinate taps are more stable than AI tap planning for bottom action pills and the first conversation row.
- When the home page has a fixed bottom status banner, tab-bar taps can miss if the y coordinate is too high. For probe scripts, a lower tap near the bottom safe area and a double tap is more reliable for `我的`.
- For the `我的 -> 预览资料 -> 相亲资料` trio, a dedicated probe path is now available:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/profile-flow-probe.ts`
  - use it instead of ad-hoc manual validation so the three-page chain gets the same screenshots every round
- For `pages/settings/index`, use `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/settings-probe.ts`.
  - entering settings from `我的` is more stable with a direct device tap on the settings icon than an AI `act("点击设置")`; the latter can over-tap and immediately drill into `隐私政策摘要`.
