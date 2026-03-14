# Plan
## Problem
- 缺陷聚焦在“我的”页的“其他功能”区块。`HEAD` 基线中的 `pages/profile/index.ts` 仍然配置为 `邀请好友 / 联系管家 / 通知状态 / 防骗指南 / 实名认证 / 设置`，缺少 `相亲红豆`、`账号切换`，且顺序与缺陷要求不一致。
- 同一套“其他功能”在 `pages/invite/index.ts` 已经是目标形态：`邀请好友 / 相亲红豆 / 实名认证 / 通知状态 / 账号切换 / 设置`，说明当前问题更像是“我的”页与已实现页面之间的配置漂移，而不是全局缺页。
- 需求文档与设计资产存在版本不一致：`design/1.需求文档/神仙亲家--小程序产品需求文档.md` 仍列出 `联系管家`、`防骗指南`；`design/3.设计稿/神仙亲家-我的-会员未开通1.png` 也展示旧版入口，而缺陷附件明确要求替换为 `相亲红豆`、`账号切换`。本缺陷应以缺陷附件与最新验收口径为准，而不是按旧 PRD 回退。

## Impact
- 这是 P0 首页信息架构问题，用户在“我的”页无法直接进入 `相亲红豆`，也缺少 `账号切换` 入口；同时看到多余的 `联系管家`、`防骗指南`，会造成入口误导。
- 影响范围主要集中在 `pages/profile/index.ts` 的菜单配置与点击路由，属于高可见度、低耦合改动，但因为是一级入口，验收必须走真实页面校验。
- 若仅改显示文案、不补对应点击处理，会留下“看得到点不了”的二次缺陷；因此需要同时核对菜单顺序和 `onFunctionTap` 分发。

## Reproduction Hypothesis
- 使用干净基线启动小程序并进入“我的”页，滚动到“其他功能”，应能复现旧入口集合：包含 `联系管家`、`防骗指南`，缺少 `相亲红豆`、`账号切换`。
- 问题大概率是 `pages/profile/index.ts` 和 `pages/invite/index.ts` 两处相似页面长期分叉，后者已更新，前者未同步。
- 当前工作区里已经存在一份未提交的候选修复，而且 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/ralph-loop-run-log.md` 记录过一次通过 `profile-other-functions-probe` 的修复闭环；因此更像是“修复未提交/未落入当前基线”而不是缺少实现方案。

## Evidence To Collect
- 代码基线证据：
  - `HEAD:pages/profile/index.ts` 中 `OTHER_FUNCTIONS` 仍是旧入口集合。
  - `pages/invite/index.ts` 已包含目标入口与目标顺序，可作为对照实现。
  - `pages/invite/index.ts` 已包含 `beans -> /pages/beans/index` 和 `switch -> toast` 的点击分发，可直接复用到“我的”页。
- 视觉证据：
  - 缺陷附件 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_5b4c2c4efb2d/image.png` 明确标出了要新增 `相亲红豆`、`账号切换`，并去掉 `联系管家`、`防骗指南`。
  - 历史验证截图 `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-13T18-28-30__profile_other_functions_probe__4__profile_other_functions_state.png` 展示了目标结果，可作为回归对照。
- 自动化证据：
  - `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/profile-other-functions-probe.ts` 已经把验收条件写死为“包含 邀请好友/相亲红豆/实名认证/通知状态/账号切换/设置，且不包含 联系管家/防骗指南”。
- 文档偏差证据：
  - `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 与 `design/3.设计稿/神仙亲家-我的-会员未开通1.png` 仍是旧版入口，后续实现阶段需要避免按旧文档误回归。

## Initial Fix Direction
- 在 `pages/profile/index.ts` 中把 `OTHER_FUNCTIONS` 对齐到 `pages/invite/index.ts`：`邀请好友 / 相亲红豆 / 实名认证 / 通知状态 / 账号切换 / 设置`。
- 同步更新 `onFunctionTap`：补上 `beans` 跳转 `/pages/beans/index`，补上 `switch` 的占位行为（先与 `pages/invite/index.ts` 保持一致），移除菜单层面对 `contact`、`antiFraud` 的依赖。
- 优先做“配置对齐 + 路由对齐”，不在本缺陷里扩散到账号切换完整页面实现；`账号切换` 入口先与现有占位逻辑一致即可。
- 实施后执行最小闭环：`npm run type-check`、`npm run build`、`npx tsx src/tools/probes/profile-other-functions-probe.ts`，并把结果截图与缺陷附件对照确认。
- 若实施时发现 `onContactManagerTap` 等旧逻辑已经完全失联，可作为顺手清理项；但不应阻塞本次入口修复。
