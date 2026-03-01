# Known Issues

## Active

- `pages/chat/index`
  - member/unlocked validation is now available and confirms:
    - bottom action pills + input row render in the unlocked state
    - sending a short test message creates the expected green outgoing bubble
  - remaining gaps:
    - the actual first viewport still anchors too low; the white guest summary card from the mapped Figma frame is not visible on the initial member-state screen
    - the current E2E device abstraction only supports tap/scroll, not a real press-and-hold gesture, so the black long-press menu cannot be fully OS-validated yet

- `pages/member-center/index`
  - user flagged residual visual polish issues that should be revisited later:
    - top marquee strip style still needs closer Figma alignment
    - the `开通至尊会员可享受` section still has remaining style gaps
    - the compare element position still needs adjustment

## Framework / Tooling

- Home page validation can be affected by dynamic banners such as unpaid-order prompts and membership banners; these can shift quick-action hit areas.
- Broad AI-driven E2E navigation is slower and less reliable than deterministic local actions once the exact page topology is known.
- Save/hot reload behavior can invalidate the current simulator page unexpectedly during iterative styling work.
- On message-list validation, an AI tap on the first conversation can accidentally become a double-tap. The first tap opens chat, and the second tap can land on the chat header card and jump again into the guest profile page.
- The current miniprogram OS device helper does not expose a true long-press gesture. AI long-press attempts on chat bubbles degrade into repeated taps, so `bindlongpress` interactions need either a lower-level device primitive or manual verification.
