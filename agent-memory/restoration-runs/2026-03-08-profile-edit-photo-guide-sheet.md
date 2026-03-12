# Restoration Run

## Scope

- Date: 2026-03-08 14:30 +0800
- Route: `pages/profile-edit/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `175:1929` (overlay only), content verified via `175:1946`, `175:1947`, `175:1948`, `175:2012`, `175:2013`, `175:1930`, `175:1936`
- Goal: Convert the photo-guide modal on profile-edit from a centered dialog to a bottom sheet and restore the visual style to the current design.

## Inputs

- Figma tools used:
  - `get_design_context(175:1929)`
  - `get_screenshot(175:1929)`
  - `get_metadata(175:1929)`
  - `get_metadata(175:1930)`
  - `get_design_context(175:1930)`
  - `get_metadata(175:1936)`
  - `get_metadata(175:1941)`
  - `get_metadata(175:1946)`
  - `get_metadata(175:1947)`
  - `get_metadata(175:1948)`
  - `get_metadata(175:1949)`
  - `get_screenshot(175:2012)`
  - `get_metadata(175:2013)`
  - `get_screenshot(175:2013)`
- Existing implementation files read:
  - `pages/profile-edit/index.ts`
  - `pages/profile-edit/index.wxml`
  - `pages/profile-edit/index.wxss`
  - `components/pages/chat/chat-photo-modal/index.{ts,wxml,wxss}`
- Relevant tracker docs:
  - `agent-memory/project-knowledge.md`
  - `agent-memory/page-topology.md`
  - `agent-memory/known-issues.md`
  - `figma/data/figma-restoration-status.yaml`
  - `figma/data/figma-page-mapping.json`
- Local design exports used to recover missing bitmap content:
  - `design/3.设计稿/神仙亲家-我的-相亲资料-上传照片-示例图-弹窗1.png`

## Changes

- Files edited:
  - `pages/profile-edit/index.wxml`
  - `pages/profile-edit/index.wxss`
  - `pages/profile-edit/index.ts`
- Files generated:
  - `assets/imgs/profile-edit/guide-row-top.png`
  - `assets/imgs/profile-edit/guide-row-bottom.png`
- Key visual changes:
  - Switched the photo-guide modal from the old centered white card to a bottom-aligned sheet with top-only rounded corners.
  - Replaced the old synthetic six-cell text grid with two design-derived example row images to match the approved/forbidden examples in the design export.
  - Restored the Figma title, subtitle, primary red CTA, and centered cancel text spacing for the guide sheet.
  - Added mask tap close plus inner `noop` handling so tapping inside the sheet does not dismiss it.

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
- Functional checks:
  - TypeScript type-check passed.
- OS screenshots:
  - None captured in this run.

## Findings

- Confirmed improvements:
  - The guide modal now presents as a bottom sheet, matching the product request and the current design export.
  - The example area now uses the actual positive/negative example imagery from the design export instead of placeholder color blocks.
- Remaining gaps:
  - Runtime example-row assets are currently local backup images under `assets/imgs/profile-edit/`; they were not uploaded to the project CDN in this run.
- Blockers / environment quirks:
  - The provided Figma node `175:1929` is only the overlay background rectangle; the content had to be reconstructed from sibling nodes plus the local design export.
  - CDN upload tooling was unavailable in this environment (`tosutil` not installed and no TOS credentials discovered), so the fallback was local runtime assets for the two example-row images.
  - OS validation was not run because there was no confirmed detached/visible WeChat simulator window in this session.

## Durable Knowledge Added

- Page topology learned:
  - None beyond the existing profile-maintenance flow.
- Framework quirks learned:
  - For this design file, modal links can point to an overlay rectangle instead of the actual content group; inspect sibling nodes before assuming the linked node contains the renderable modal structure.

## Follow-up Recommendations

- Upload `assets/imgs/profile-edit/guide-row-top.png` and `assets/imgs/profile-edit/guide-row-bottom.png` to the project CDN and replace the temporary local runtime paths.
- Re-run a profile-edit OS screenshot pass once the WeChat simulator window is available, then decide whether the route status should stay `completed` or be re-marked after the modal delta is visually verified.
