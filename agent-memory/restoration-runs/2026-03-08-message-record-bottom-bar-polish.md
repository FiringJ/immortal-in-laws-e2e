# Message Record Bottom Bar Polish (2026-03-08)

## Scope

- Date: 2026-03-08
- Route: `pages/message-record/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `154:693`
- Goal: 还原“收藏我”页底部会员栏，并沉淀小程序原生 `button` 导致 CTA 宽度/留白异常的通用处理方式。

## Inputs

- Figma tools used:
  - `mcp__figma__get_design_context`
  - `mcp__figma__get_screenshot`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/app.wxss`
- Local design reference:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-收藏我1.png`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/app.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxss`
- Key structural changes:
  - 为 `message-record-page` 增加按底栏场景切换的底部留白类，避免固定底栏遮挡列表尾部。
  - “收藏我”底部 CTA 从原生 `button` 改成 `view`，彻底移除默认按钮宿主对宽度和内容盒模型的干扰。
  - 新增全局 `.miniapp-button-reset`，供必须保留原生 `button` 能力的场景复用。
- Key visual changes:
  - 收藏我底栏恢复为 `330rpx` 高度、浅色渐变底板、顶部内阴影、Figma 对齐的上下留白。
  - 文案行恢复为 `40rpx / 74rpx` 字级组合，按钮恢复 `690rpx x 110rpx` 红色圆角 CTA。

## Validation

- Commands run:
  - `npm run type-check` (app repo) ✅
  - inline E2E probe via `node --import tsx` (e2e repo) ❌
- OS screenshots: 无（环境阻断）
- Functional checks:
  - 模板与样式改动未引入 TypeScript 错误。
  - 已尝试从消息页进入“收藏我”并截图，但 E2E 初始化前即失败。

## Blockers

- 当前环境仍无法找到分离且可见的微信开发者工具模拟器窗口：
  - `找不到分离的模拟器窗口`
- 在模拟器窗口重新分离并保持前台可见之前，无法拿到这轮底栏修改的 OS 级截图证据。

## Durable Knowledge Added

- 小程序项目内，纯视觉 CTA 应优先使用 `view`，不要用原生 `button` 承担布局。
- 必须保留原生 `button` 能力时，可复用全局 `.miniapp-button-reset`，避免每个页面重复手写 reset。

## Iteration Update (node 154:675)

- Date: 2026-03-08
- Trigger: 用户继续指出“我看过的”会员横幅里的 `开通至尊会员` 按钮也存在原生 `button` 默认样式干扰。
- Adjustments:
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxml`
  - `vip-btn` 增加 `miniapp-button-reset`，保留原生 `button` 点击能力，同时统一去掉默认宿主样式。
- Validation:
  - `npm run type-check` ✅

## Iteration Update (native button selector priority)

- Date: 2026-03-08
- Trigger: 用户在 DevTools 中确认 `.miniapp-button-reset` 已挂载，但 `wx-button:not([size=mini])` 仍覆盖 `vip-btn` 宽度。
- Root cause:
  - 纯 `.vip-btn` 选择器优先级低于微信注入的 `wx-button:not([size=mini])`，导致 `width` 和 `margin` 继续失效。
- Adjustments:
  - `/Users/firingj/Projects/immortal-in-laws/app.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxss`
  - 全局 reset 提升为 `button.miniapp-button-reset`
  - 尺寸类改为 `button.vip-btn:not([size='mini'])` / `button.unlock-empty-btn:not([size='mini'])`
- Validation:
  - `npm run type-check` ✅
