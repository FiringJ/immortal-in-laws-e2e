# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 搜索结果页非至尊会员点击嘉宾卡片与联系按钮阻断方式不一致
## Cleaned Problem
- 问题范围：`pages/filter-result/index`（精准查找 / 搜索结果页）。
- 目标行为：对“非至尊会员”用户（包含黄金会员、普通用户、已过期会员），点击嘉宾卡片本体和卡片内 CTA 按钮时，阻断策略必须一致，并统一跳转到至尊会员开通页。
- 当前反馈行为：点击嘉宾卡片会进入资料页；点击“卡片按钮”会出现会员阻断弹框。
- 期望行为：两个入口都不要进入资料页或出现不同阻断样式，而是统一跳转到 `pages/member-center/index?tab=supreme` 对应的至尊会员开通流。
- 现有截图可确认问题页面确为搜索结果页，且卡片 CTA 文案已经是“开通至尊会员—优选版 联系对方”。

## Source Quality
- 质量评估：`high`。
- 原因：缺陷描述同时包含“实际行为”和“期望行为”，指定了页面模块（搜索结果 / 精准查找），并附带截图证据，足以进入后续修复规划。
- 仍有轻微缺口：截图没有直接录到点击后的跳转/弹框结果，且未明确受影响账号是普通用户还是黄金会员；但这不影响进入计划阶段。

## Product Context
- 页面流转上，首页 `精准查找` 会进入 `pages/filter/index` 或直接进入 `pages/filter-result/index`，搜索结果页是本问题的直接承载页：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/page-topology.md:3`。
- 搜索结果列表中的交互都来自同一个 `guest-card` 组件实例，说明“卡片点击”和“按钮点击”本应受同一页面层权限策略约束：`pages/filter-result/index.wxml:46`。
- 页面底部和页内已有明确的至尊会员导流入口，当前代码目标路由也是 `pages/member-center/index?tab=supreme`：`pages/filter-result/index.ts:418`。
- `memberStore.isMember()` 覆盖所有未过期会员，而 `memberStore.isSupremeMember()` 仅覆盖至尊会员，因此产品描述中的“非至尊会员”明确包含黄金会员：`store/memberStore.ts:102`、`store/memberStore.ts:116`。

## Technical Context
- `components/guest-card/index.ts` 分别发出 `cardtap` 与 `contact` 两个事件，页面层再各自处理：`components/guest-card/index.ts:201`。
- `pages/filter-result/index.wxml` 将这两个事件分别绑定到 `onGuestCardTap` / `onContactTap`，因此只要两个 handler 的判定不一致，就会直接出现“卡片”和“按钮”行为分叉：`pages/filter-result/index.wxml:52`。
- TypeScript 源码里，这两个 handler 当前都先做 `!memberStore.isSupremeMember()` 的早返回跳转，看起来已尝试统一阻断：`pages/filter-result/index.ts:431`、`pages/filter-result/index.ts:453`。
- 但同一份页面的已生成运行文件 `pages/filter-result/index.js` 与 `index.ts` 存在明显逻辑漂移：
  - 卡片点击使用 `guest.canViewDetail ?? this.data.isMemberView` 作为是否可进详情的依据：`pages/filter-result/index.js:404`。
  - 按钮点击使用 `guest.canContact ?? this.data.isMemberView` 作为是否可继续的依据：`pages/filter-result/index.js:427`。
  - 这意味着“详情查看权限”和“联系权限”被拆成了两套判断，只要后端返回 `can_view_detail` 与 `can_contact` 不一致，就会天然出现行为不统一。
- 后端映射层已经把这两个权限字段分别挂到了 `Guest` 上：`types/guest.ts:148`、`types/guest.ts:150`，对应映射位置在 `services/api-mapper.ts:716` 与 `services/api-mapper.ts:765`。这进一步说明当前实现确实存在“同一卡片两个入口走不同权限字段”的技术土壤。
- TypeScript 源码里按钮分支还保留了 `showMemberUnlockModal` 的弹框路径：`pages/filter-result/index.ts:473`。因此当前仓库实际存在两套阻断形态（跳会员中心、弹会员弹框），只要运行时吃到不同版本逻辑或早返回条件被绕过，就会复现反馈中的“不一致阻断”。

## Missing Context
- 缺少明确复现账号类型：普通用户、黄金会员、还是会员已过期用户。
- 缺少当次复现时接口返回样本，尤其是 `can_view_detail`、`can_contact`、会员等级这几个字段。
- 缺少确认当前提测包实际使用的是 `pages/filter-result/index.ts` 对应新产物，还是仓库内已有漂移的 `pages/filter-result/index.js`。
- 缺少点击按钮后弹出的具体弹框截图/录屏，用于区分是 `member-unlock-modal` 还是其他会员阻断组件。

## Likely Surfaces
- `pages/filter-result/index.ts`
- `pages/filter-result/index.wxml`
- `pages/filter-result/index.js`
- `components/guest-card/index.ts`
- `store/memberStore.ts`
- `types/guest.ts`
- `services/api-mapper.ts`
- `components/member-unlock-modal/index.*`

## Recommended Next Action
- 结论：`generate_plan`，可安全进入修复规划。
- 建议后续修复计划聚焦三件事：
  - 先确认运行时实际生效的是哪套页面逻辑（`index.ts` 编译产物是否已同步到 `index.js`）。
  - 将搜索结果页“卡片点击”和“按钮点击”的非至尊会员阻断收敛为同一个权限入口，不再分别依赖 `canViewDetail` / `canContact` 或按钮专属弹框分支。
  - 修复后至少用“普通用户 + 黄金会员”两种账号回归，验证两个入口都统一跳至尊会员开通页。
