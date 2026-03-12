# Known Issues

## Active

- `pages/chat/index`
  - current loop status: `blocked`
  - member/unlocked validation is now available and confirms:
    - bottom action pills + input row render in the unlocked state
    - `交换微信 / 拨打电话 / 发送照片` three-button path all open the expected modal states
    - sending a short test message creates the expected green outgoing bubble
    - the black long-press menu can now be OS-validated with the new hold gesture
  - remaining gaps:
    - the actual first viewport still anchors too low; the white guest summary card from the mapped Figma frame is not fully visible on the initial member-state screen
    - the current validated call-modal branch on this conversation shows `暂未获取到号码 / 数据加载中...`, so phone-number-full-state still needs a data-complete conversation if pixel-level matching is required

- `pages/member-center/index`
  - current loop status: `blocked`
  - user flagged residual visual polish issues that should be revisited later:
    - top marquee strip style still needs closer Figma alignment
    - the `开通至尊会员可享受` section still has remaining style gaps
    - the compare element position still needs adjustment

## Framework / Tooling

- Home page validation can be affected by dynamic banners such as unpaid-order prompts and membership banners; these can shift quick-action hit areas.
- Broad AI-driven E2E navigation is slower and less reliable than deterministic local actions once the exact page topology is known.
- Save/hot reload behavior can invalidate the current simulator page unexpectedly during iterative styling work.
- `initE2E()` can fail before any page actions if the Swift window-enumeration helper cannot resolve a visible simulator window.
  - One failure mode is `Fatal error: Unexpectedly found nil while unwrapping an Optional value` from the inline `CGWindowListCopyWindowInfo` script.
  - Setting `HOME=/tmp` and redirecting the Swift/Clang module cache fixes cache-permission errors, but it does not fix the missing-window crash itself.
  - When this happens, treat it as an OS-validation blocker until WeChat DevTools is visible as a separable simulator window again.
- Some Codex sandbox runs can read `/Users/firingj/Projects/immortal-in-laws` but cannot write to it. When that happens, Ralph loop pages that require app-repo edits, builds, and OS probes must be marked failed/blocked instead of retrying in the tracker repo.
- In the current sandbox, `tsx` CLI can fail with `listen EPERM` on its IPC pipe. For loop utilities in this repo, `node --import tsx ...` is the reliable fallback.
- Figma MCP asset URLs can return SVG files that use `var(--fill-0, ...)` / `var(--stroke-0, ...)`. If converting to PNG offline, replace `var(...)` with fallback colors first, otherwise white details (icons/arrow strokes) can disappear.
- On message-list validation, an AI tap on the first conversation can accidentally become a double-tap. The first tap opens chat, and the second tap can land on the chat header card and jump again into the guest profile page.
- Broad AI-driven assertions on chat can still perturb the page state. For the chat route, prefer direct coordinate actions plus targeted assertions after the page is already stable.
- In WeChat Mini Program, native `button` applies default pseudo-style and layout behavior (including implicit max-width/line-height side effects in custom dialogs). For pixel-fidelity modals on `guest-detail`, prefer `view` as CTA container unless `open-type` is required.
