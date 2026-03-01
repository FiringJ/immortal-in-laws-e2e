# Restoration Run: Filter Result Page

## Scope

- Date: 2026-03-01
- Route: `pages/filter-result/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `124:2484`
- Goal: restore the filter result page to the Figma result-state layout and finish OS-level visual + functional validation

## Inputs

- Figma tools used:
  - `get_design_context(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="124:2484", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
  - `get_screenshot(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="124:2484", clientFrameworks="wechat-miniprogram", clientLanguages="css,wxml,typescript")`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxss`
- Relevant product docs:
  - `/Users/firingj/Projects/immortal-in-laws/design/1.需求文档/神仙亲家--小程序产品需求文档.md`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-首页-精准查找2.png`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/filter-result/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/guest-card/index.wxss`
- Key structural changes:
  - split the hero headline into the Figma-style title line plus large result-count line
  - flattened the summary row so it no longer renders as a raised white pill
  - converted result-page CTAs away from native `button` styling to `view` wrappers
  - changed `guest-card` `filter-result` scene to the result-specific no-photo layout with a full-width two-column info grid
  - added the result-card divider and single gold membership CTA that matches the non-member design
- Key visual changes:
  - restored the compact red/white requirement pills in the hero
  - tightened card spacing, badge sizing, label/value typography, and footer CTA proportions
  - updated the bottom fixed membership CTA to the Figma pill layout with inline highlighted `6位`

## Validation

- Commands run:
  - `npm run type-check` in `/Users/firingj/Projects/immortal-in-laws`
  - `npm run build` in `/Users/firingj/Projects/immortal-in-laws`
- OS screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T08-47-42__filter_result_after_refine__4__filter_result_after_refine.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T08-48-11__filter_result_after_refine__6__filter_condition_from_result.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T08-51-35__filter_result_flow_validation__8__filter_result_returned_by_search.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-01T08-52-02__filter_result_flow_validation__10__member_center_from_filter_result.png`
- Functional checks:
  - home quick action `精准查找` can still enter the result flow under saved conditions
  - `条件设置` on the result page opens `pages/filter/index`
  - clicking `立即搜索` on the filter page returns to the result page
  - the bottom fixed membership CTA enters the member-center flow

## Findings

- Confirmed improvements:
  - the result page now uses the dedicated non-member result-card structure from Figma instead of reusing the default home-card scene
  - result cards no longer lose content width to a right-side photo block
  - top summary row, hero, and footer CTA are visually much closer to the design screenshot
  - OS-level flow validation passed for `result -> 条件设置 -> filter -> 立即搜索 -> result`
- Remaining gaps:
  - live data differs from the Figma mock, so exact copy such as `1000+` and specific city/year values cannot be forced
  - hero title color separation is visually close but still slightly data/runtime dependent compared with the static design screenshot
- Blockers / environment quirks:
  - using the OS/system back path during iterative validation can be less stable than validating the forward closed loop because simulator state may jump during rebuild or page-state churn

## Durable Knowledge Added

- Page topology learned:
  - `pages/filter-result/index -> 条件设置 -> pages/filter/index -> 立即搜索 -> pages/filter-result/index` is a stable validation loop
- Framework quirks learned:
  - the filter result page should not reuse the default photo-card layout when matching the non-member Figma design
  - native button styling should continue to be avoided on Figma-critical CTA surfaces in this workspace
- Follow-up recommendations:
  - continue with `pages/history/index` next; it is still the next visibly incomplete page in the restoration tracker
