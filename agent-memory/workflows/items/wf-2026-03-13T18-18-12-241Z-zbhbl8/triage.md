# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 单次购买超级曝光关闭后倒计时应暂停，当前被直接隐藏
## Cleaned Problem
单次购买超级曝光用户在 `pages/exposure/index` 开启 24 小时曝光后，若在倒计时尚未结束时手动关闭超级曝光，页面顶部本应继续显示“剩余曝光次数 + 暂停后的剩余倒计时”，以便用户稍后再次开启时继续消耗未用完的时长。当前现象是：关闭开关后倒计时区域直接消失，用户看不到剩余时长，和 PRD 中“关闭后倒计时暂停，直到下次开启再继续扣减未完倒计时”的规则不一致。

## Source Quality
- 飞书原始缺陷给出了明确的功能模块（超级曝光）、触发动作（倒计时期间关闭开关）、当前错误表现（直接隐藏）和期望行为（暂停倒计时），核心问题表达清晰。
- 但原始输入没有附带截图、录屏、接口日志或可直接复现的账号/订单信息，也没有给出“关闭前后接口返回值”的证据，因此 source quality 评为 `medium` 而不是 `high`。
- 需求文档 `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 的 1.6“超级曝光”章节明确写出暂停规则，足以补齐期望行为定义。

## Product Context
- 页面拓扑显示首页有两条稳定入口进入超级曝光：`pages/index/index -> pages/exposure/index?showGuide=true`（顶部快捷入口）以及 `pages/index/index -> pages/exposure/index?showGuide=false`（曝光专区“查看全部”）。
- PRD 规定：单次购买成功后进入超级曝光列表页，页面顶部需要展示“剩余曝光次数”和“曝光倒计时”；倒计时结束前允许手动关闭，关闭后应暂停，而不是清空或隐藏剩余时长。
- 该问题影响已付费购买单次曝光的用户，是直接关联购买价值感知和剩余权益可见性的高优先级缺陷。
- 首页 `pages/index/index` 也会读取曝光状态用于金刚区/曝光区展示，但本缺陷的主战场仍是 `pages/exposure/index` 顶部控制区。

## Technical Context
- 前端状态模型已经具备“暂停所需字段”：`types/exposure.ts` 与 `services/exposure.ts` 暴露了 `enabled`、`quotaLeft`、`remainingSeconds`、`totalSeconds`。其中 `services/exposure.ts` 只在 `enabled=true` 时计算 `endTime`，说明“暂停态”本来就依赖 `remainingSeconds` 单独渲染。
- 页面编排在 `pages/exposure/index.ts`：`refreshExposureStatus()` 会把接口状态映射为 `isExposureEnabled`、`isExposureActive`、`remainingSeconds`、`exposureEndTime`；`onToggleExposure()` 会调用 `/api/v1/exposure/toggle` 后刷新状态，因此关闭后的展示逻辑应在这一层与组件层衔接完成。
- 直接 UI 落点在 `components/pages/exposure/exposure-control/index.ts` 与 `components/pages/exposure/exposure-control/index.wxml`，这里负责倒计时启停和文案显隐，是最可能导致“关闭后隐藏”的前端表层原因。
- 当前工作区存在重要实现风险：`pages/exposure/index.ts`、`pages/exposure/index.wxml`、`components/pages/exposure/exposure-control/index.ts`、`components/pages/exposure/exposure-control/index.wxml` 均处于未解决冲突状态，页面与组件之间的 prop 契约同时存在“旧版仅看 `isExposureActive/exposureEndTime`”和“新版显式传 `remainingSeconds/showCountdown`”两套写法。后续计划需要先收敛这几处冲突，否则当前源码并不是单一可信实现。
- 后端语义已支持“关闭即暂停”：`/Users/firingj/Projects/GodQinJia/internal/apiserver/service/exposure.go` 中，`disableExposure()` 会在关闭时把剩余秒数写回 `remaining_seconds`，`GetStatus()` 也会在 `enabled=false` 时继续返回 paused `remaining_seconds`。因此该缺陷更像前端状态映射/显隐逻辑问题，而不是后端不支持暂停。

## Missing Context
- 缺少一组真实复现证据来确认当前环境里 `/api/v1/exposure/status` 在关闭后是否确实返回了 `remaining_seconds > 0`；这会决定后续修复是否只落前端，还是要顺带检查联调环境数据异常。
- 缺少“当前正在运行的页面版本”说明：仓库源码有冲突，已生成的 `pages/exposure/index.js` 与 `components/pages/exposure/exposure-control/index.js` 仍是旧契约，和 `.ts/.wxml` 内容不完全一致。后续执行需要明确以哪套文件为准。
- 缺少与该缺陷关联的实际支付链路/测试账号信息，但这不会阻止进入计划阶段，因为核心行为、PRD 规则和主要代码面都已明确。

## Likely Surfaces
- `pages/exposure/index.ts`
  - `refreshExposureStatus()`：关闭后的 `remainingSeconds`、`isExposureActive`、`exposureEndTime` 如何派生。
  - `onToggleExposure()` / `onExposureExpired()`：开关切换后是否误把暂停态当成结束态处理。
- `pages/exposure/index.wxml`
  - 顶部 `exposure-control` 的属性传递；当前冲突显示页面与组件的属性名/形态并未统一。
- `components/pages/exposure/exposure-control/index.ts`
  - observer、`startCountdown()`、`stopCountdown()`、`updateCountdown()` 的暂停态处理。
- `components/pages/exposure/exposure-control/index.wxml`
  - 倒计时文案是否依赖错误的显隐条件，导致关闭开关后整块倒计时被隐藏。
- `services/exposure.ts`
  - `fetchExposureStatus()` 对 paused 状态的归一化，尤其是 `endTime` 仅在 `enabled=true` 时生成这一点。
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/exposure.go`
  - 作为接口语义参考面，确认后续前端修复要遵循“关闭后保留 `remaining_seconds`，下次再继续扣减”的契约。

## Recommended Next Action
建议进入 `generate_plan`。

后续计划应优先按以下思路展开：
- 先清理并统一 `pages/exposure/*` 与 `components/pages/exposure/exposure-control/*` 的冲突内容，明确单一的页面↔组件属性契约。
- 然后沿着“后端 `remaining_seconds` → `services/exposure.ts` → `pages/exposure/index.ts` → `exposure-control` 显隐逻辑”逐层核对暂停态数据链路。
- 修复后至少补一轮针对单次购买场景的验证：购买成功 → 开启曝光 → 倒计时运行中关闭 → 倒计时仍显示且静止 → 再次开启后从暂停值继续扣减。
- 若计划阶段能拿到真实联调环境，再补一次关闭开关后的 `/api/v1/exposure/status` 抓值，以排除环境接口返回异常。
