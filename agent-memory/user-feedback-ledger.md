# User Feedback Ledger

## 2026-03-01

- Scope: `pages/member-center/index`
  - Feedback:
    - top marquee strip style still needs refinement
    - the `开通至尊会员可享受` section is still not fully aligned with the design
    - the compare element position is still off
  - Status: open
  - Tracking:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/known-issues.md`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/figma/data/figma-restoration-status.yaml`

- Scope: `pages/history/index`
  - Feedback:
    - the `至尊会员才能查看/联系过往嘉宾` strip must not overlap the guest introduction copy
  - Status: fixed
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-23-40__history_probe__3__history_top.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-23-49__history_probe__3__history_mid.png`

- Scope: `pages/index/index`
  - Feedback:
    - unpaid-order banner should occupy the same fixed slot as the daily-recommend banner
    - unpaid-order banner and daily-recommend banner must not appear at the same time
  - Status: fixed
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T12-36-02__home_status_banner_probe__3__home_status_banner.png`

- Scope: `pages/chat/index` / E2E device layer
  - Feedback:
    - E2E needs a real long-press ability instead of repeated tap fallback
    - chat bottom buttons, modal presentation, and related interactions need OS-level verification in the unlocked member scene
  - Status: partially fixed
  - Fixed:
    - added real long-press support to the E2E device helper and MCP server
    - verified `交换微信 / 拨打电话 / 发送照片` modal presentation plus long-press menu in the unlocked chat scene
  - Still open:
    - the initial chat viewport still differs from Figma because the white guest summary card is not fully visible on first render
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-03-54__chat_probe__1__chat_top.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-04-12__chat_probe__2__chat_wechat_modal.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-04-26__chat_probe__3__chat_call_modal.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-04-41__chat_probe__4__chat_photo_modal.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T16-05-01__chat_probe__6__chat_context_menu.png`
