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

## 2026-03-04

- Scope: `pages/guest-detail/index`（底部操作栏）
  - Feedback:
    - 拨打电话按钮颜色需要对齐 Figma
    - 收藏按钮和拨打电话按钮前图标缺失
  - Status: fixed
  - Code:
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/guest-detail-bottom-bar/index.wxss`
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-03T16-48-02__guest_detail_credibility_probe__0__guest_detail_top_after_ui_fix.png`

- Scope: `pages/guest-detail/index`（实名卡 + 举报/屏蔽区）
  - Feedback:
    - 举报、屏蔽按钮前需要补齐图标
    - 家长已实名认证区域需要还原 UI 稿
  - Status: fixed
  - Code:
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxml`
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxss`
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-03T16-48-17__guest_detail_credibility_probe__0__guest_detail_credibility_after_ui_fix.png`

- Scope: `pages/guest-detail/index`（举报弹窗）
  - Feedback:
    - 点击举报按钮后的弹窗样式需按 Figma `node-id=139:753` 优化
  - Status: fixed
  - Code:
    - `/Users/firingj/Projects/immortal-in-laws/components/action-sheet/index.wxml`
    - `/Users/firingj/Projects/immortal-in-laws/components/action-sheet/index.wxss`
    - `/Users/firingj/Projects/immortal-in-laws/components/action-sheet/index.ts`
  - Validation:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-03T16-57-17__guest_detail_report_modal_probe__1__after_act.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-03T16-57-18__guest_detail_report_modal_probe__1__guest_detail_report_modal_after_ui_fix.png`

- Scope: `pages/guest-detail/index`（返回按钮 + 实名认证卡细节 + IP 归属地间距）
  - Feedback:
    - 相亲资料页左上角返回按钮需还原 Figma 样式
    - 家长已实名认证区域需重点校准样式
    - IP 归属地位置需保持上下间距
  - Status: fixed
  - Code:
    - `/Users/firingj/Projects/immortal-in-laws/pages/guest-detail/index.wxss`
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxml`
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/guest-detail/credibility-card/index.wxss`
  - Validation:
    - 本轮受 Figma MCP 额度限制，已按已获取标注完成代码对齐，待额度恢复后补截图复核

- Scope: `pages/index/index`（首页推荐加载）
  - Feedback:
    - 至尊会员账号首页无嘉宾数据并提示“加载失败”（`recordId=recvbyoCJArWi7`）
  - Status: fixed
  - Code:
    - `/Users/firingj/Projects/immortal-in-laws/services/guest.ts`
  - Validation:
    - `npm run type-check`（通过）
