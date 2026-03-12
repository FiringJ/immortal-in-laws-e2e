# Exposure Guide Privileges Restore (2026-03-06)

## Scope

- Date: 2026-03-06
- Route: `pages/exposure/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `382:118` (主页面), `399:1801` (特权区), `382:2283` (查看全部特权介绍按钮)
- Goal: 按最新 UI 还原超级曝光引导页，去掉底部渐隐过渡，并补齐“查看全部特权介绍”按钮。

## Inputs

- Figma tools used:
  - `get_design_context` + `get_screenshot` for `382:118`
  - `get_design_context` + `get_screenshot` for `399:1801`
  - `get_design_context` + `get_screenshot` for `382:2283`
- Existing implementation files read:
  - `components/pages/exposure/exposure-guide/index.ts`
  - `components/pages/exposure/exposure-guide/index.wxml`
  - `components/pages/exposure/exposure-guide/index.wxss`
  - `pages/exposure/index.{ts,wxml,wxss}`
  - `config/static.ts`
- Relevant product/docs:
  - `agent-memory/project-knowledge.md`
  - `agent-memory/page-topology.md`
  - `agent-memory/known-issues.md`
  - `figma/data/figma-restoration-status.yaml`
  - `figma/data/figma-page-mapping.json`

## Changes

- Files edited (app repo):
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/exposure/exposure-guide/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/exposure/exposure-guide/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/exposure/exposure-guide/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/config/static.ts`
- Assets added (app repo backup + CDN runtime source):
  - `assets/imgs/exposure/guide-privilege-clock.png`
  - `assets/imgs/exposure/guide-privilege-bulb.png`
  - `assets/imgs/exposure/guide-privilege-phone.png`
  - `assets/imgs/exposure/guide-privilege-phone-arrow.png`
  - `assets/imgs/exposure/guide-privilege-heart.png`
  - `assets/imgs/exposure/guide-privilege-target.png`
  - `assets/imgs/exposure/guide-privilege-shirt.png`
  - `assets/imgs/exposure/guide-privilege-eye.png`
  - `assets/imgs/exposure/guide-privilege-folder.png`
  - `assets/imgs/exposure/guide-privilege-search.png`
  - `assets/imgs/exposure/guide-privilege-more-arrow.png`
- Key structural changes:
  - 移除 `guide-privileges.png` 的整图渲染，改为结构化“更多至尊会员特权”网格。
  - 新增“查看全部特权介绍”按钮（样式按 `382:2283`），点击触发 `memberfree` 事件。
- Key visual changes:
  - 底部渐隐过渡不再来自旧整图切片，第三行图标按设计独立渲染。
  - 第一/二行特权文案与图标间距按 Figma 节点重排。

## Validation

- Commands run:
  - `npm run build` (app repo) ✅
  - `node --import tsx src/tools/exposure-probe.ts` (e2e repo) ❌ blocked
- OS screenshots:
  - 未产出；`initE2E()` 阶段即因“找不到分离的模拟器窗口”跳过。
- Functional checks:
  - 组件事件链保持原有 `singlepurchase/memberfree`。
  - 新增静态资源已上传并可通过 CDN `200 OK` 访问（抽样验证 `guide-privilege-clock.png`、`guide-privilege-more-arrow.png`）。

## Findings

- Confirmed improvements:
  - 引导页特权区从整图切片改为结构化布局，可避免旧图底部渐隐问题。
  - “查看全部特权介绍”按钮已补齐。
- Follow-up hotfix in same day:
  - 特权区改为固定 3 列 grid（不再流式换成 4 列）。
  - 标题 `更多至尊会员特权` 强制单行，避免折行到第二行。
  - `查看全部特权介绍` 按钮箭头改为向右（对齐 Figma）。
  - 编译验证：`npm run build` 通过。
- Remaining gaps:
  - 尚未完成本轮 OS 级截图比对（需模拟器窗口可分离并可见）。
- Blockers / environment quirks:
  - E2E 当前失败点：微信开发者工具模拟器窗口未分离，`initE2E()` 返回 `skipE2E`。

## Durable Knowledge Added

- Page topology learned:
  - 无新增。
- Framework quirks learned:
  - Figma MCP 导出 SVG 中 `var(--fill-0, ...)` 在本地批量转 PNG 时需先替换为 fallback 色值，否则白色细节可能丢失。
- Follow-up recommendations:
  - 模拟器窗口恢复后，优先重跑 `exposure-probe` 补齐截图，再决定是否微调间距与字号。
