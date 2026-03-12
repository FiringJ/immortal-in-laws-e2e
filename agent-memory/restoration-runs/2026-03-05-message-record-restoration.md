# Message Record Restoration Run (2026-03-05)

## Scope

- Date: 2026-03-05
- Route: `pages/message-record/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Figma nodeId: `154:711`, `154:849`, `154:751`, `419:649`
- Goal: 按 Figma 还原消息记录页（收藏我 / 我收藏的 / 我解锁的空态）的视觉与结构。

## Inputs

- Figma tools used:
  - `mcp__figma__whoami`
  - `mcp__figma__get_design_context` x4
  - `mcp__figma__get_screenshot` x4
- Existing implementation files read:
  - `pages/message-record/index.{ts,wxml,wxss,json}`
  - `pages/message-record/helpers.ts`
  - `components/pages/message-record/record-card/index.{ts,wxml,wxss,json}`
  - `components/guest-card/index.{ts,wxml,wxss}`
  - `services/record.ts`
  - `services/api-mapper.ts`
- Relevant docs:
  - `figma/data/figma-restoration-status.yaml`
  - `figma/data/figma-page-mapping.json`
  - `agent-memory/{project-knowledge,page-topology,known-issues}.md`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-card/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-card/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-card/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/message-record/record-card/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/helpers.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.json`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/message-record/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/services/record.ts`
  - `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`
  - `/Users/firingj/Projects/immortal-in-laws/types/member.ts`
- Key structural changes:
  - `record-card` 从 `guest-card` 复用改为 Figma 对齐的专用结构。
  - 新增“我解锁的空态”专用布局与“去相亲广场”按钮。
  - 收藏我底部会员栏按 Figma 改成浅色渐变底板 + 红色 CTA。
- Key visual changes:
  - 顶部 tab 字号/间距/激活下划线按设计稿重置。
  - 卡片头部日期胶囊、右上 `···` 圆按钮、置顶印章、暂停遮罩样式重做。
  - 卡片正文改成“编号 + 信息行 + 文案 + 双按钮”视觉结构。

## Validation

- Commands run:
  - `npm run build` (app repo) ✅
  - `npm run verify:e2e` (e2e repo) ❌
- OS screenshots: 无（被环境阻断）
- Functional checks:
  - TypeScript 编译通过。
  - 由于模拟器窗口未分离，未完成 OS 级截图校验。

## Findings

- Confirmed improvements:
  - 样式实现已对齐四个 Figma 节点的关键布局与视觉层级。
- Remaining gaps:
  - 尚缺最新一轮“真实模拟器截图”证据。
- Blockers / environment quirks:
  - E2E 报错：未检测到分离的微信模拟器窗口，无法执行 OS 级验证。

## Durable Knowledge Added

- Page topology learned:
  - `pages/message-record/index` 为记录页统一入口，通过 `type/direction` 切换收藏/解锁等视图。
- Framework quirks learned:
  - 该页使用通用 `guest-card` 时很难达到记录页设计稿 fidelity，独立 `record-card` 更稳定。
- Follow-up recommendations:
  - 分离 DevTools 模拟器窗口后补跑一次 `verify:e2e`，并保存截图到 `screenshots/`。

## Iteration Update (node 154:797)

- Date: 2026-03-05
- Trigger: 用户继续要求按 `154:797` 还原“我收藏的”卡片。
- Adjustments:
  - 交互列表映射头像来源从 `mapParentInfo(null)` 改为 `mapParentInfo(item.parent_info)`。
  - `record-card` 新增 `recordType/direction` 属性，收藏-我收藏的（`favorite + me_to_other`）有图布局字段改为：`年龄/身高/现居/职业`。
  - 卡片容器改为外层统一边框与圆角，头部日期胶囊高度/字号按节点值收敛。
  - 底部按钮区恢复左侧占位（不显示头像），保证按钮位置与节点相对坐标更一致。
- Validation:
  - `npm run build` ✅

## Iteration Update (node 154:900)

- Date: 2026-03-08
- Trigger: 用户指出 `pages/message-record/index` 卡片顶部横幅背景应为“浅橙色到白色”的横向渐变。
- Figma confirmation:
  - `mcp__figma__get_design_context(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="154:900")`
  - `mcp__figma__get_screenshot(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="154:900")`
  - 横幅节点 `154:901` 为 `linear-gradient(90deg, #fff5eb 0%, #ffffff 100%)`。
- Adjustments:
  - 将 `components/pages/message-record/record-card/index.wxss` 中 `.record-time-chip` 的渐变终点色从 `#fff9f5` 修正为 `#ffffff`。
- Validation:
  - `npm run type-check` ✅
  - `node --import tsx src/tests/run-e2e.ts` ❌
- Blocker:
  - E2E 仍因“找不到分离的模拟器窗口”提前退出，未取得最新 OS 截图。

## Iteration Update (node 154:797 button position)

- Date: 2026-03-08
- Trigger: 用户要求将卡片右上角 `...` 按钮改为距卡片上边 30、右边 30。
- Figma confirmation:
  - `mcp__figma__get_metadata(fileKey="WTgcdFVxfCUU2RRtR6ArKq", nodeId="154:797")`
  - 按钮节点 `154:808` 相对卡片节点 `154:797` 的外边距为 `top=30`、`right=30`。
- Adjustments:
  - 由于 `.record-card` 已有 `10rpx` 外层内边距，按钮自身定位改为 `top: 20rpx; right: 20rpx;`，对应最终视觉外边距 `30rpx / 30rpx`。
