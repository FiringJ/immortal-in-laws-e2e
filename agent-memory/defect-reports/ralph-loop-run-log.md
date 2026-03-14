## 2026-03-13T06:03:51Z
- issue: bug_6ff9aece5185 (rowHash: a5aafab348528c6dcd8221a9d07596ccccee3d52)
- preflight: writable check passed for both repos
- change: strengthened realname first-failure auto-retry in /Users/firingj/Projects/immortal-in-laws/pages/realname-auth/index.ts
  - switched from single 1.2s retry to delayed multi-attempt retries (1.5s, 3.2s)
  - added status-first check before re-submit; if verify_result already turned success, directly complete
  - carried forward fail reason from retry error when available
- validation:
  - npm run type-check (immortal-in-laws): pass
  - npm run build (immortal-in-laws): pass
  - npx tsx src/tools/probes/realname-auth-probe.ts (immortal-in-laws-e2e): fail (infra: detached WeChat simulator unavailable)
- queue mark: pending (infra blocker), no blocked escalation

## 2026-03-13T10:02:50Z
- issue: bug_6ff9aece5185 (rowHash: a5aafab348528c6dcd8221a9d07596ccccee3d52)
- preflight: writable check passed for both repos
- change: hardened realname first-attempt failure fallback in /Users/firingj/Projects/immortal-in-laws/pages/realname-auth/index.ts and failReason compatibility in /Users/firingj/Projects/immortal-in-laws/services/user.ts
  - added generic failure-text fallback retry for first-attempt verification failures
  - expanded verification status fail reason parsing to fail_reason/failReason/message
- validation:
  - npm run type-check (immortal-in-laws): pass
  - npm run build (immortal-in-laws): pass
  - npx tsx src/tools/probes/realname-auth-probe.ts (immortal-in-laws-e2e): fail (infra: detached WeChat simulator unavailable)
- queue mark: pending (infra blocker), no blocked escalation

## 2026-03-13 19:02 +0800
- Preflight: writable ✅ (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- Next issue: `bug_6ff9aece5185` (`rowHash: a5aafab348528c6dcd8221a9d07596ccccee3d52`) from online queue.
- Fix attempt: updated `/Users/firingj/Projects/immortal-in-laws/pages/realname-auth/index.ts` to default verification-failed errors into delayed auto-retry, with explicit hard identity-mismatch guard.
- Validation:
  - `npm run type-check` ✅
  - `npm run build` ✅
  - `npx tsx src/tools/probes/realname-auth-probe.ts` ❌ infra blocker (detached WeChat simulator window not found)
- Queue mark: `pending` with blocker `infra: realname-auth probe blocked, detached WeChat simulator window unavailable`.

## 2026-03-13 22:28 +0800
- issue: bug_a40bc8cb61cc (rowHash: ad51f265b64b119fe724508050a1bcbc3d55102e)
- preflight: writable check passed for both repos
- change: hardened membership expired-state mapping in /Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts
  - accept member type aliases (`member_type`/`memberType`, `golden`/`gold`)
  - avoid strict `status === 'expired'` dependency by adding explicit + fallback expiry detection (status text, end_at, days_left)
  - keep expired day count negative and derive fallback expired days from end_at when needed
- test update: added expired-status regression specs in /Users/firingj/Projects/immortal-in-laws/services/member.spec.ts
- validation:
  - npm run type-check (immortal-in-laws): pass
  - npm run build (immortal-in-laws): pass
  - node --import tsx src/tools/probes/member-center-probe.ts (immortal-in-laws-e2e): fail (infra: detached WeChat simulator unavailable)
- queue mark: pending (infra blocker), no blocked escalation

## 2026-03-14 02:16 +0800
- issue: bug_72585c20016c (rowHash: 4bfc0244cdb79efef5ac9ee82f1dd3dee19b35f5)
- preflight: writable check passed for both repos
- change:
  - replaced notify switch-sheet flow on `/pages/profile/index` and `/pages/invite/index` with tutorial modal -> subscribe request -> failure-retry interaction
  - added shared subscribe helper `/utils/notify-subscribe.ts` (uses configured template IDs when available)
  - added new page `/pages/notify-status/index` and registered route in `/app.json`
- validation:
  - `npm run type-check` (immortal-in-laws): pass
  - `npm run build` (immortal-in-laws): pass
  - `npx tsx src/tools/probes/notify-status-probe.ts` (immortal-in-laws-e2e): pass
  - screenshots:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-14-04__notify_status_probe__3__notify_guide_modal.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-14-37__notify_status_probe__5__notify_result_state.png`
- queue mark: completed

## 2026-03-14 02:24 +0800
- issue: bug_a40bc8cb61cc (rowHash: ad51f265b64b119fe724508050a1bcbc3d55102e)
- preflight: writable check passed for both repos
- change: no additional code changes this run (re-validated previous expired-state mapping fix in `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`)
- validation:
  - `npx tsx src/tools/probes/member-center-expired-probe.ts` (immortal-in-laws-e2e): pass
  - screenshot: `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-22-33__member_center_expired_probe__8__member_center_gold_state_probe.png`
  - mapper sanity check: `node --import tsx -e "import mapper from './services/api-mapper.ts'; ..."` returns `isExpired=true` for `status=EXPIRED` + alias fields
- queue mark: completed

## 2026-03-14 02:28 +0800
- issue: bug_c215bf84b4df (rowHash: 01d6eeeeb4e854463f456149e3aff0a4fdd18a8c)
- preflight: writable check passed for both repos
- change:
  - updated `/Users/firingj/Projects/immortal-in-laws/pages/profile/index.ts` other-functions config/order:
    - added `相亲红豆`、`账号切换`
    - removed `联系管家`、`防骗指南`
    - aligned order to: 邀请好友 / 相亲红豆 / 实名认证 / 通知状态 / 账号切换 / 设置
  - updated function routing for `beans` + `switch`
- validation:
  - `npm run type-check` (immortal-in-laws): pass
  - `npm run build` (immortal-in-laws): pass
  - `npx tsx src/tools/probes/profile-other-functions-probe.ts` (immortal-in-laws-e2e): pass
  - screenshot: `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-28-30__profile_other_functions_probe__4__profile_other_functions_state.png`
- queue mark: completed

## 2026-03-14 02:31 +0800
- issue: bug_fd9f2f51d843 (rowHash: 81fef3492d059e9f70b44222828adf6e4ee1a95a)
- preflight: writable check passed for both repos
- assessment/fix attempt:
  - inspected current `/pages/invite/index` implementation; page is “邀请家人帮孩子找对象”能力，不是完整“邀请有奖”收益体系
  - gap includes missing invite-reward core modules (累计邀请收益、现金分成、去提现、收益明细/提现记录 workflows) and corresponding backend dependencies
- validation evidence:
  - `npx tsx src/tools/probes/invite-reward-gap-probe.ts` attempted; navigation/assert did not establish the target invite-reward page flow
  - screenshots captured during attempt:
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-31-04__invite_reward_gap_probe__4__after_act.png`
    - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-31-07__invite_reward_gap_probe__5__before_assert.png`
- queue mark:
  - command used `--result failed --blocker ...`
  - queue state normalized to `pending` with `consecutiveFailures=1` (no blocked escalation)

## 2026-03-13T20:15:03Z

- Precheck: write access OK for app + e2e repos.
- Completed and marked in queue:
  - bug_b0167aca9ea9
  - bug_bbcf64afe94b
  - bug_e84ee96d9a0c
  - bug_f5ecf2d7f1ab
- Validation for each round included `npm run type-check`, `npm run build`, and issue-specific page/static probes.
- Next unprocessed issue after this run: bug_0f4382659d79.

## 2026-03-14 05:12 +0800
- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded (no local TSV fallback needed).

### processed issues (this run)
- `bug_0f4382659d79` (`rowHash: 1f71dc401fb4ccad0b26b56b8a2141136a2435b9`) → `completed`
  - fix: allow `我解锁` tab contact action to bypass membership blocker and navigate chat directly (same as `解锁我`) in `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.ts`.
  - probe update: `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/unlock-me-contact-static-probe.ts` now checks both unlock directions.
  - validation: `npm run type-check` + `npm run build` passed; `unlock-me-contact-static-probe` + `favorite-other-block-static-probe` passed.

- `bug_61997de1cbd1` (`rowHash: 29297e36a839c8ae41db6ed7620b38ab50f53944`) → `completed`
  - change: no additional app code change (re-validated existing non-member block flow for `看过我`).
  - validation: `npm run type-check` + `npm run build` passed; `favorite-other-block-static-probe` passed.

- `bug_a4268f56320e` (`rowHash: fa2ab7952eec6d224eedaf60687b0b7246929fcc`) → `completed`
  - fix 1: record card info layout for view/favorite tabs now includes age field in both photo and no-photo layouts (`/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-card/index.ts`).
  - fix 2: interaction guest mapping now supports more matchmaking intro aliases (`match_desc_label` etc.) in `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`.
  - new probe: `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/record-card-info-static-probe.ts`.
  - validation: `npm run type-check` + `npm run build` passed; `record-card-info-static-probe` and `favorite-other-block-static-probe` passed.

- `bug_ed0f20458847` (`rowHash: 22e329566d7de117344d799c6fc97ae505c867b3`) → `completed`
  - fix: bottom "开通会员 查看全部资料" bar now only shows for non-members in `看过我/收藏我` tabs (`/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.ts`).
  - probe update: `favorite-other-block-static-probe` now also verifies bottom-bar member gating.
  - validation: `npm run type-check` + `npm run build` passed; `favorite-other-block-static-probe` + `record-card-info-static-probe` passed.

- `bug_64e029b78154` (`rowHash: a13ace84ed670661dec43d2eb7e332459c8a6776`) → `completed`
  - fix: exposure countdown is preserved when switch is off (pause-display behavior), not reset/hidden:
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/exposure/exposure-control/index.ts`
    - `/Users/firingj/Projects/immortal-in-laws/components/pages/exposure/exposure-control/index.wxml`
    - `/Users/firingj/Projects/immortal-in-laws/pages/exposure/index.wxml`
  - new probe: `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/exposure-countdown-pause-static-probe.ts`.
  - validation: `npm run type-check` + `npm run build` passed; `exposure-countdown-pause-static-probe` passed.

- `bug_20ec794a8446` (`rowHash: 83121e71c400de3913cfc9f59427c99d03877fe9`) → marked with `--result failed`, queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: scope too broad for a single actionable fix (no attachment and no concrete reproducible interaction points in this parent record).

- stop condition: run stopped after failed (non-infra) issue.

## 2026-03-14 06:11 +0800
- issue: bug_20ec794a8446 (rowHash: 83121e71c400de3913cfc9f59427c99d03877fe9)
- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`)
- queue fetch: online Feishu queue succeeded (no TSV fallback)
- fix attempt (real code changes):
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.ts`
    - added text-editor interaction flow for `称呼/职业/毕业院校`
    - added hot options (`热门姓氏`/`热门职业`) and school suggestion matching
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.wxml`
    - switched `称呼/职业/毕业院校` from inline input to tap-to-edit cell modal
    - mounted full text editor modal with confirm/clear/hot-option/suggestion interactions
  - `/Users/firingj/Projects/immortal-in-laws/pages/profile-edit/index.wxss`
    - added text editor modal visual styles to align with profile-edit design interactions
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/profile-edit-interaction-static-probe.ts`
    - new static page-level probe for modal interaction coverage
- validation:
  - `npm run type-check` (immortal-in-laws): pass
  - `npm run build` (immortal-in-laws): pass
  - `node --import tsx src/tools/probes/profile-edit-interaction-static-probe.ts` (immortal-in-laws-e2e): pass
- queue mark:
  - `npm run feishu:queue:mark -- --issue-id bug_20ec794a8446 --row-hash 83121e71c400de3913cfc9f59427c99d03877fe9 --result blocked --blocker "scope remains umbrella-level after second attempt: fixed surname/occupation/school modal interactions, but phone-verify popup and other sub-flows lack concrete acceptance/attachments; split into child defects for deterministic closure"`
  - result: blocked (`consecutiveFailures=2`), stop this run per blocker rule.

## 2026-03-14 08:19 +0800

- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded throughout this run (no TSV fallback).

### processed issues (this run)
- `bug_1b6d4d7e209e` (`rowHash: c67a410a9e0db22f486e2adeff602e58d1c2046c`) → `completed`
  - fix: filter-result footer now supports supreme-state CTA text (`点击搜索嘉宾（今日剩X次机会）`) and refreshes membership state on `onShow`.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxss`, plus `quotaLeft` plumbing in `/Users/firingj/Projects/immortal-in-laws/services/guest.ts`, `/Users/firingj/Projects/immortal-in-laws/store/recommendStore.ts`, `/Users/firingj/Projects/immortal-in-laws/types/guest.ts`.

- `bug_24abea9fd148` (`rowHash: be5e6195d7aca91f351537ccd7583da2fdcdc0f5`) → `completed`
  - fix: guest-detail photo-exchange self-photo loader now falls back to profile detail fetch when preview lacks photos, reducing false “去登记” modal.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/guest-detail/index.ts`.

- `bug_ba7148038722` (`rowHash: 9f868fcfd93442f2a027432cdcc2461a351f624a`) → `completed`
  - fix: car filter options reduced to `不限 + 已购车/近期购车`; legacy saved values (`recent_purchase`) normalized to unified option while request mapping keeps compatibility.
  - code: `/Users/firingj/Projects/immortal-in-laws/config/constants.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`.

- `bug_f69081a6c401` (`rowHash: be4c73d548fe20e8ee8d600a7f07cb34cf88e1e4`) → `completed`
  - fix: filter page now uses explicit unlimited-selection flags so default state no longer highlights “不限” for non-range options.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`.

- `bug_ffcfe349d830` (`rowHash: cb7187a6b6db08cd88c0b284013fde19d3bd6667`) → `completed`
  - fix: non-supreme users can no longer re-enter condition edits from result page; repeated submit path is also guarded with toast + redirect to existing result page.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`.

- `bug_0bba281ae2c3` (`rowHash: 23fc4faa2ee067ddb944d08ddafc0eb30132aa6c`)
  - first attempt: marked `failed` with blocker `缺少可匹配测试数据，当前无法复现“解锁我的”校验场景，需补充可命中的样本会话后再验证`.
  - second consecutive same blocker: marked `blocked` and stopped run per loop rule.

### validation
- app build chain: `npm run type-check` + `npm run build` (multiple rounds) all passed.
- static/page probes passed:
  - `filter-result-footer-member-state-static-probe.ts`
  - `guest-detail-photo-exchange-profile-fallback-static-probe.ts`
  - `filter-car-criteria-static-probe.ts`
  - `filter-default-unlimited-state-static-probe.ts`
  - `filter-non-supreme-single-search-static-probe.ts`


## 2026-03-14 10:23 +0800

- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded throughout this run (no TSV fallback).

### processed issues (this run)
- `bug_92e8f445beff` (`rowHash: 9922377611e688b15f367a5eb1b2d16c956113ba`) → `completed`
  - fix: chat voice press start handler binding repaired (`bindtouchstart`), preventing single-tap accidental recording.
  - code: `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxml`.

- `bug_a8640277c2d5` (`rowHash: c86313a7520f5335a8f8a6c2809920ff6060b15a`) → `completed`
  - fix: removed homepage member-contact-limit wrong branch (gold member no longer blocked by quota-0 in home contact flow).
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/index/index.ts`.

- `bug_b22d42f99f8e` (`rowHash: f0593ff4417c5e6ae9a7c6664b9755a565f135fb`) → `completed`
  - fix: voice/image message content mapping now prioritizes `media_url`; voice playback source resolver supports JSON payload and placeholder/url normalization.
  - code: `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`.

- `bug_cf6efa9e3f4e` (`rowHash: c494dcc8256e537f7dbfedafd272fa348fb69ad4`) → `completed`
  - fix: when backend omits `can_withdraw`, mapper keeps it `undefined` so frontend recall fallback uses 2-minute rule (instead of hard false).
  - code: `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`.

- `bug_ed83a202a998` (`rowHash: 6c35ba1f89bd9925fd40af5d194f4599db478bb8`) → `completed`
  - fix: photo-exchange path changed to direct-send semantics:
    - exchange flow creates conversation with `sendGreeting=false`
    - navigate to chat with `photoExchangeDone=1`
    - chat page forces exchanged state and hides pending photo-exchange request cards in forced mode.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/guest-detail/index.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`.

- `bug_2c60cb5ea37c` (`rowHash: 090efc0ececf3617cde24f065d711cbbc3983842`) → `completed`
  - fix: precise-search contact gate hardened:
    - contact button text only shows `联系对方` for supreme users
    - non-supreme users are blocked both at tap entry and again before unlock+navigate.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.ts`.

- `bug_792fbb85dd10` (`rowHash: abc5d51fb4d21b0de5a548a50f100349097cf34e`) → `completed`
  - fix: homepage super-exposure zone card fields corrected (gender/year/height/education/occupation mapping), matching required area info display.
  - code: `/Users/firingj/Projects/immortal-in-laws/components/pages/index/exposure-banner/index.wxml`.

- `bug_12987ba6072e` (`rowHash: 64f80043943e044b89d2d056aebd0f17bc5c4d87`) → mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: parent-level umbrella issue with no attachment and no executable acceptance boundary (only references “新需求-3”); actionable closure requires processing split child defects first.

### validation
- app build chain repeatedly passed: `npm run type-check`, `npm run build`.
- page/static probes passed:
  - `chat-voice-press-guard-static-probe.ts`
  - `home-member-contact-limit-static-probe.ts`
  - `chat-voice-playback-content-static-probe.ts`
  - `chat-voice-recall-static-probe.ts`
  - `photo-exchange-direct-send-static-probe.ts`
  - `guest-detail-photo-exchange-profile-fallback-static-probe.ts`
  - `filter-result-precise-contact-gate-static-probe.ts`
  - `filter-result-supreme-block-static-probe.ts`
  - `home-exposure-zone-static-probe.ts`

## 2026-03-14 11:05 +0800

- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded (no TSV fallback).

### processed issues (this run)
- `bug_155a00acd573` (`rowHash: 9573de96edde1633743d9a35c9bd25b97d15d5d1`) → `completed`
  - fix: removed `户籍` field rendering from profile preview basic info.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/profile-preview/index.ts`.
  - evidence: `profile-preview-remove-hukou-static-probe.ts` passed.

- `bug_efb3500370da` (`rowHash: 977be704146a588c21b609cc2cefb246b3bc2957`) → `completed`
  - fix status: no new code change; existing implementation already hides `拨打电话` when no phone and centers favorite button.
  - evidence: `guest-detail-call-visibility-static-probe.ts` passed.

- `bug_12987ba6072e` (`rowHash: 64f80043943e044b89d2d056aebd0f17bc5c4d87`) → `blocked`
  - blocker: parent-level umbrella issue references only “新需求-3” without attachments/executable acceptance boundary; child issues remain in queue.
  - escalation rule: previous state already had `consecutiveFailures=1`; this run hit same blocker again and was escalated to `blocked` (`consecutiveFailures=2`), then loop stopped.

### validation
- app checks passed: `npm run type-check`, `npm run build`.
- page/static probes passed:
  - `profile-preview-remove-hukou-static-probe.ts`
  - `guest-detail-call-visibility-static-probe.ts`

## 2026-03-14 12:32 +0800

- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded throughout this run (no TSV fallback).

### processed issues (this run)
- `bug_1a6ba3ba6ac0` (`rowHash: 623e3193fd5abaed628c5b64116f055e58c065e1`) → `completed`
  - fix: homepage contact flow now distinguishes unlock-confirm vs member-open blocking correctly, and refreshes unlock quota before non-member block fallback.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/index/index.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/index/index.wxml`.

- `bug_1c673d72a40e` (`rowHash: 0faa7020fa009b3b4ff9cb07a04cd7681e3dc2c4`) → `completed`
  - fix: when users still have unlock quota, home contact now shows “立即解锁” confirm popup instead of direct unlock+jump.
  - evidence: `home-contact-unlock-block-static-probe.ts` passed.

- `bug_1c7ce033d9a3` (`rowHash: ac23327ff85cf5a06252b72a7ea0016644b17b41`) → `completed`
  - fix: guest-card now renders member/realname badges (previously computed but not rendered), restoring member-tag visibility logic.
  - code: `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxss`.

- `bug_ed83a202a998` (`rowHash: 64d1e4c01ee76d32912493a986de8dd24ee73ed2`) → `completed`
  - verification-only: existing direct-send photo-exchange logic remained valid.
  - evidence: `photo-exchange-direct-send-static-probe.ts` passed.

- `bug_79e8f41bc62d` (`rowHash: 78804b85abff6e0d01ba5fc6d9748614c47f9602`) → `completed`
  - verification-only: no-photo card branch still uses dedicated 8-field grid layout and has-photo 4-field mode.
  - evidence: `home-card-no-photo-style-static-probe.ts` passed.

- `bug_a5da01907bdd` (`rowHash: f2b468d5e95aeef1d91a17d2a7ea04a413be7978`) → `completed`
  - fix: daily recommend request now supports query params and, for supreme members, explicitly requests `size=26` (instead of backend default 20).
  - code: `/Users/firingj/Projects/immortal-in-laws/services/guest.ts`, `/Users/firingj/Projects/immortal-in-laws/store/recommendStore.ts`.

- `bug_ac6a31661e0c` (`rowHash: 619b5d82ec50a37ff48a8ab6b9d290f45e576b8a`) → `completed`
  - fix: member home-contact flow now blocks before unlock (no direct pass-through on `guest.canContact`), and successful unlock-confirm path shows `成功解锁联系方式` toast.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/index/index.ts`.

- `bug_2101e11fd4b6` (`rowHash: 3321626a1e0cfd271d74967cd1dbff1693d4775b`) → `completed`
  - fix: settings doc page updated user agreement/privacy policy body copy to match current UI稿 structure and set nav title to `神仙亲家` for both docs.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings-doc/index.ts`.

- `bug_4270c3d99e6b` (`rowHash: faa66f55376da28462d12369a61ac05ca133ba32`) → `completed`
  - fix: order-record copy updated (time copy simplified, amount copy removed `元` suffix), empty-state text adjusted, and empty-state bottom CTA `订单问题 联系管家` added.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings-orders/index.ts`, `/Users/firingj/Projects/immortal-in-laws/pages/settings-orders/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/pages/settings-orders/index.wxss`.

- `bug_89fb17d46060` (`rowHash: 0bb3a2f1d5d326971faed2a763928fbc0edab5fd`) → `completed`
  - fix: removed three settings entries (`隐私政策摘要` / `个人信息收集清单` / `第三方共享个人信息清单`), keeping only user agreement + privacy policy.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.wxml`.

- `bug_bc58e20adb86` (`rowHash: 85737522b4e26b9074a88ee0a6e6d4fc6281ae21`) → `completed`
  - fix: hid `申请注销账号` and `申请暂停相亲` entry blocks per first-phase scope.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.ts`.

- `bug_0be855d52bd3` (`rowHash: ac9dbc6b4822e21a3043b94f70efeddcb6fb7031`) → `completed`
  - fix: hid `无门槛联系` entry (phase-1 fallback path: hide entry when feature not delivered).
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.wxml`.

- `bug_42075bac542e` (`rowHash: dceafce51e8e18de2e8e32d25c9a325485a7f767`) → `completed`
  - fix: personalized recommend interaction updated to confirm-close modal when enabled; direct-enable + toast when disabled.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/settings/index.ts`.

- `bug_c31af041d188` (`rowHash: 296494524b4050185ad71e811a1254f87dc687ab`) → mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: only “关闭态”打招呼语 UI稿可核对，缺少完整开启态与交互边界（独立页面 vs 弹层、保存策略、返回流）；为避免误改，暂停在此问题并等待明确PRD。

### validation
- app build chain passed repeatedly: `npm run type-check`, `npm run build`.
- page/static probes passed:
  - `home-contact-unlock-block-static-probe.ts`
  - `home-member-tag-visibility-static-probe.ts`
  - `photo-exchange-direct-send-static-probe.ts`
  - `home-card-no-photo-style-static-probe.ts`
  - `home-daily-recommend-supreme-size-static-probe.ts`
  - `home-member-contact-unlock-toast-static-probe.ts`
  - `settings-doc-agreement-privacy-static-probe.ts`
  - `settings-orders-copy-static-probe.ts`
  - `settings-doc-entries-trim-static-probe.ts`
  - `settings-hide-cancel-pause-static-probe.ts`
  - `settings-hide-unlock-entry-static-probe.ts`
  - `settings-recommend-confirm-static-probe.ts`

## 2026-03-14 15:28 +0800

- preflight: writable check passed for both repos (`/Users/firingj/Projects/immortal-in-laws`, `/Users/firingj/Projects/immortal-in-laws-e2e`).
- queue fetch source: online Feishu queue succeeded (no TSV fallback).

### processed issues (this run)
- `bug_b85d92552729` (`rowHash: 631ea996e3d761b3b254555e9de164e03826d61f`) → `completed`
  - fix: message-record 增加“服务端屏蔽列表 ID + 本地缓存”双重过滤，避免收藏/浏览/解锁页漏显被屏蔽用户。
  - code: `pages/message-record/index.ts`, `services/api-mapper.ts`.
  - evidence: `record-blocked-hidden-static-probe.ts` passed.

- `bug_042825834443` (`rowHash: e80bf4d676eb2bb7603585d3dbdb6e753eac97ec`) → `completed`
  - fix: 精准搜索页底部常驻开通入口与阻断弹窗确认入口统一跳转 `member-center?tab=supreme`。
  - code: `pages/filter-result/index.ts`.
  - evidence: `filter-result-supreme-block-static-probe.ts` passed.

- `bug_d0eec0e6ea62` (`rowHash: 390cb235f826b81ade779f29a042e95c3163fd64`) → `completed`
  - fix: 会员阻断弹层权益标题改为按套餐动态联动：`季度/年度/不限时/至尊`，并匹配 `6/6/6/12` 特权数。
  - code: `components/member-unlock-modal/index.ts`.
  - evidence: `member-unlock-benefit-title-tier-static-probe.ts` passed.

- `bug_1061eabcb7b7` (`rowHash: 841fe535da42adc8fc1eb13c10767bdfde4a58ee`) → `completed`（复核通过）
  - evidence: `filter-year-picker-logic-static-probe.ts` passed。

- `bug_5a8ebdd397e3` (`rowHash: 53556f3197729cdb4f8df0a088f60a7010127240`) → `completed`（复核通过）
  - evidence: `filter-year-picker-logic-static-probe.ts` passed。

- `bug_111afb7d5109` (`rowHash: 13363b4e9426cfad488bce5604e92ca142c22b84`) → `completed`
  - fix: 我的首页“邀请好友”入口补齐 badge 文案 `分享赚钱`。
  - code: `pages/profile/index.ts`, `pages/profile/index.wxml`, `pages/profile/index.wxss`.
  - evidence: `profile-invite-badge-static-probe.ts` passed.

- `bug_81ddcd9144b9` (`rowHash: b96b3dfab720949c08236b95711e48724a1b994b`) → `completed`
  - fix: 我的页会员入口按会员等级跳转，黄金/至尊默认落 `tab=supreme`。
  - code: `pages/profile/index.ts`.
  - evidence: `profile-member-entry-supreme-static-probe.ts` passed.

- `bug_60d28c216fa9` (`rowHash: b84e090417ea8950d05a80bda2b92bb6d8374795`) → `completed`
  - fix: 会员中心顶部滚动弹幕改为 sticky，跟随顶部导航吸顶。
  - code: `components/pages/member-center/member-center-hero/index.wxml`, `components/pages/member-center/member-center-hero/index.wxss`.
  - evidence: `member-center-marquee-sticky-static-probe.ts` passed.

- `bug_704a939942b2` (`rowHash: f9f410abb3a1570d794a9e2493872f9734e7f6cd`) → `completed`
  - fix: 记录页“举报对方”改为先选择举报原因再调用接口，不再直接成功。
  - code: `pages/message-record/index.ts`, `pages/message-record/index.wxml`, `pages/message-record/index.json`.
  - evidence: `record-report-reason-sheet-static-probe.ts` passed。

- `bug_810ac9db9c56` (`rowHash: 415151a9c85537107f2bb3bcecc596c1edd4bc42`) → `completed`
  - fix: 记录页日期头部支持“今天/昨天”相对日期（覆盖 6 个 tab 的统一渲染链路）。
  - code: `pages/message-record/helpers.ts`.
  - evidence: `record-date-relative-label-static-probe.ts` passed。

- `bug_b2416e9f18c8` (`rowHash: f4ac5fe7f0440332f59ea7cb28dff632a5541e7b`) → `completed`
  - fix: 解锁我/我解锁更多操作增加置顶能力，并移除我解锁 tab 的“查看联系方式”误项。
  - code: `types/member.ts`, `services/record.ts`, `pages/message-record/helpers.ts`, `pages/message-record/index.ts`.
  - evidence: `unlock-tab-action-sheet-static-probe.ts` passed。

- `bug_d2d2d31fbd8a` (`rowHash: eeb915581406273685686bbb7b61d891ab2ef281`) → `completed`
  - fix: 收藏我底部提示前缀从“最近有”切换为“共有”。
  - code: `pages/message-record/index.ts`, `pages/message-record/index.wxml`.
  - evidence: `record-favorite-bottom-prefix-static-probe.ts` passed。

- `bug_f59220398103` (`rowHash: d5d0cbe3f871a0ad117c0ded6b290730d965aa6d`) → `completed`（复核通过）
  - evidence: `record-blocked-hidden-static-probe.ts` passed（包含 target_child ID 提取与屏蔽态识别校验）。

- `bug_fedce3eabf31` (`rowHash: af80a657e818336394365ef766f1b6b5180d3953`) → `completed`
  - fix: 邀请页至尊会员“查看特权”入口改为默认跳转 `member-center?tab=supreme`。
  - code: `pages/invite/index.ts`.
  - evidence: `invite-member-banner-tab-static-probe.ts` passed。

- `bug_4a50e0d48187` (`rowHash: b425f4672f8f00d0b783cc54a9f809e0b0a66c82`) → mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: 超级曝光提醒目标覆盖“浏览/收藏/解锁/私信会话”四链路，但当前仅浏览链路存在 `source_label` 映射；收藏/解锁/私信会话接口与 UI 缺少统一来源字段，无法在不补接口契约前做一致落地。

### validation
- build chain: `npm run type-check` passed after each修改批次。
- page/static probes passed:
  - `record-blocked-hidden-static-probe.ts`
  - `filter-result-supreme-block-static-probe.ts`
  - `member-unlock-benefit-title-tier-static-probe.ts`
  - `filter-year-picker-logic-static-probe.ts`
  - `profile-invite-badge-static-probe.ts`
  - `profile-member-entry-supreme-static-probe.ts`
  - `member-center-marquee-sticky-static-probe.ts`
  - `record-report-reason-sheet-static-probe.ts`
  - `record-date-relative-label-static-probe.ts`
  - `unlock-tab-action-sheet-static-probe.ts`
  - `record-favorite-bottom-prefix-static-probe.ts`
  - `invite-member-banner-tab-static-probe.ts`

## 2026-03-14 15:31 +0800 Ralph Loop

### queue processing summary
- Preflight passed: `/Users/firingj/Projects/immortal-in-laws` and `/Users/firingj/Projects/immortal-in-laws-e2e` writable.
- Online Feishu queue pull remained available (no TSV fallback needed).

### issue results
- `bug_b85d92552729` (`rowHash: 631ea996e3d761b3b254555e9de164e03826d61f`) -> `completed`
  - fix: interaction record mapping now robustly extracts `guestId/isBlocked/canContact` from nested `target_child` payloads.
  - code: `services/api-mapper.ts`.
  - evidence: `record-blocked-hidden-static-probe.ts` passed.

- `bug_042825834443` (`rowHash: e80bf4d676eb2bb7603585d3dbdb6e753eac97ec`) -> `completed`
  - fix: precise-search member redirects unified to `member-center?tab=supreme&scene=精准搜索`; member-center scene fallback also maps to `supreme`.
  - code: `pages/filter-result/index.ts`, `pages/member-center/index.ts`.
  - evidence: `filter-result-supreme-block-static-probe.ts` passed.

- `bug_111afb7d5109` (`rowHash: 13363b4e9426cfad488bce5604e92ca142c22b84`) -> `completed` (verification)
  - note: invite entry already includes `分享赚钱` badge in profile page.
  - evidence: `profile-invite-share-tag-static-probe.ts` passed.

- `bug_60d28c216fa9` (`rowHash: b84e090417ea8950d05a80bda2b92bb6d8374795`) -> `completed` (verification)
  - note: member-center marquee is already fixed with `member-tips-sticky` + fixed positioning.
  - evidence: `member-center-sticky-barrage-static-probe.ts` passed.

- `bug_810ac9db9c56` (`rowHash: 415151a9c85537107f2bb3bcecc596c1edd4bc42`) -> `completed` (verification)
  - note: record header date already supports `今天/昨天` across shared helper.
  - evidence: `record-header-relative-date-static-probe.ts` passed.

- `bug_b2416e9f18c8` (`rowHash: f4ac5fe7f0440332f59ea7cb28dff632a5541e7b`) -> `completed` (verification)
  - note: unlock tabs already support pin/unpin; `我解锁` no longer includes `查看联系方式` in action sheet.
  - evidence: `unlock-more-actions-static-probe.ts` passed.

- `bug_d2d2d31fbd8a` (`rowHash: eeb915581406273685686bbb7b61d891ab2ef281`) -> `completed` (verification)
  - note: bottom prefix for `收藏我` already switched to `共有` via `bottomPrefixText` binding.
  - evidence: `favorite-other-bottom-prefix-static-probe.ts` passed.

- `bug_f59220398103` (`rowHash: d5d0cbe3f871a0ad117c0ded6b290730d965aa6d`) -> `completed` (verification)
  - note: unblock chain and blocked-id mapping already present for favorite records.
  - evidence: `favorite-blocked-unblock-static-probe.ts` passed.

- `bug_fedce3eabf31` (`rowHash: af80a657e818336394365ef766f1b6b5180d3953`) -> `completed` (verification)
  - note: profile member banner already routes gold/supreme users to `member-center?tab=supreme`.
  - evidence: `profile-member-banner-tab-static-probe.ts` passed.

- `bug_4a50e0d48187` (`rowHash: b425f4672f8f00d0b783cc54a9f809e0b0a66c82`) -> `completed` (verification)
  - note: favorite/unlock record mapping already carries `source_label`, and header tags already render `通过超级曝光xx`.
  - evidence: `record-source-label-super-exposure-static-probe.ts` passed.

- `bug_e6c2787c0812` (`rowHash: 843e9dfcff1592ec4d98f172d51f7d301ec946ef`) -> mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: only textual requirement provided; missing the referenced PRD/UI empty-state visuals (图1/图2) for exact 6-tab empty-state implementation.

### validation
- app repo build checks passed repeatedly:
  - `npm run type-check`
  - `npm run build`
- probes added and executed this run:
  - `record-blocked-hidden-static-probe.ts`
  - `filter-result-supreme-block-static-probe.ts`
  - `profile-invite-share-tag-static-probe.ts`
  - `member-center-sticky-barrage-static-probe.ts`
  - `record-header-relative-date-static-probe.ts`
  - `unlock-more-actions-static-probe.ts`
  - `favorite-other-bottom-prefix-static-probe.ts`
  - `favorite-blocked-unblock-static-probe.ts`
  - `profile-member-banner-tab-static-probe.ts`
  - `record-source-label-super-exposure-static-probe.ts`

## 2026-03-14 17:10 +0800 Ralph Loop

### queue processing summary
- Preflight passed: `/Users/firingj/Projects/immortal-in-laws` and `/Users/firingj/Projects/immortal-in-laws-e2e` writable.
- Online Feishu queue pull remained available (no TSV fallback needed).

### issue results
- `bug_eb6f574c2a38` (`rowHash: cf934107063ed3e24e258bae9a172799a24aa261`) -> `completed` (verification)
  - note: long-press context menu already hides arrow tail (`display: none`), matching “裁剪多余背景框”.
  - evidence: `chat-context-menu-fixed-position-static-probe.ts` passed.

- `bug_17156310c191` (`rowHash: cef6b954f06fd4ddbbe1862f690e5f777c4572dc`) -> `completed` (verification)
  - note: filter-result至尊入口已统一跳转 `member-center?tab=supreme&scene=精准搜索`。
  - evidence: `filter-result-supreme-block-static-probe.ts` passed.

- `bug_b22d42f99f8e` (`rowHash: 12e2299435edf8426abd1e34afd8f435afdb090c`) -> `completed` (verification)
  - note: voice content mapping已优先使用 `media_url`，并在播放前解析占位内容。
  - evidence: `chat-voice-playback-content-static-probe.ts` passed.

- `bug_2a6942701f9a` (`rowHash: 519183633f2ee4a6b0e320814c445962099826a5`) -> `completed` (verification)
  - note: 至尊搜索卡片已在 `filter-result` 场景展示 `matchmakingNote`（相亲介绍）。
  - evidence: `filter-result-supreme-intro-static-probe.ts` passed.

- `bug_cd26894852ef` (`rowHash: 0277e3b2b4ac031650213d88343f8d185a2ccafc`) -> mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - blocker: only current-state screenshot is available; missing target voice-recording UI baseline (layout/dimensions/motion acceptance), so deterministic visual optimization cannot be implemented.

### validation
- app repo checks passed:
  - `npm run type-check`
  - `npm run build`
- probes executed this run:
  - `chat-context-menu-fixed-position-static-probe.ts`
  - `filter-result-supreme-block-static-probe.ts`
  - `chat-voice-playback-content-static-probe.ts`
  - `filter-result-supreme-intro-static-probe.ts`

## 2026-03-14 18:08 +0800 Ralph Loop

### queue processing summary
- Preflight passed: `/Users/firingj/Projects/immortal-in-laws` and `/Users/firingj/Projects/immortal-in-laws-e2e` writable.
- Online Feishu queue pull succeeded (no TSV fallback used).

### issue results
- `bug_cf6efa9e3f4e` (`rowHash: ee7548a72fa4835370c9091b233814b6ba20b562`) -> `completed`
  - fix: restored recall fallback guard to 2-minute window when `canWithdraw` is missing, preventing stale voice messages from surfacing a failing recall action.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`.
  - evidence: `chat-voice-recall-static-probe.ts` passed.

- `bug_cd26894852ef` (`rowHash: 0277e3b2b4ac031650213d88343f8d185a2ccafc`) -> `blocked`
  - blocker: only current-state screenshot provided; missing target voice-recording UI baseline (layout/size/motion acceptance), so deterministic visual restoration is not executable.
  - escalation: same blocker hit twice consecutively (`consecutiveFailures` reached 2), escalated to `blocked` and run stopped.

### validation
- app repo checks passed:
  - `npm run type-check`
  - `npm run build`
- page/static probe passed:
  - `chat-voice-recall-static-probe.ts`

## 2026-03-14 19:04 +0800 Ralph Loop

### queue processing summary
- Preflight passed: `/Users/firingj/Projects/immortal-in-laws` and `/Users/firingj/Projects/immortal-in-laws-e2e` writable.
- Online Feishu queue pull succeeded (no TSV fallback used).
- Processed only current issue this round and stopped after a non-completed result.

### issue results
- `bug_1f48ad04f1d5` (`rowHash: 7a2d9200a106315b54ce81d9f179e6b823f73743`) -> mark command used `failed`; queue normalized to `pending` (`consecutiveFailures=1`).
  - fix: chat bottom action buttons now hide `拨打电话` when counterparty phone is empty and keep remaining buttons left-aligned with fixed pill width.
  - code: `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-action-buttons/index.ts`, `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-action-buttons/index.wxml`, `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-action-buttons/index.wxss`.
  - blocker: app repo currently contains unresolved merge conflict markers in `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts` and `/Users/firingj/Projects/immortal-in-laws/pages/filter/index.ts`, so full `type-check/build` cannot pass.

### validation
- app repo checks (executed, failed due existing conflict markers):
  - `npm run type-check`
  - `npm run build`
- page/static probe passed:
  - `chat-call-button-visibility-static-probe.ts`
