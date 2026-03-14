# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 历史推荐页会员阻断不一致：卡片主体错误弹框且卡片 CTA 无响应
## Cleaned Problem
- 问题落点可明确清洗为 `pages/history/index` 的非至尊会员受限态，而不是泛指全站会员中心或详情页问题。
- 同页已经存在一个可作为基准的正确交互：点击 `日期筛选` 时，非至尊用户应弹出会员开通阻断弹层，并默认落在 `至尊会员` tab；当前实现位于 `pages/history/index.ts:114`。
- 本条缺陷要求把历史推荐卡片上的其他受限触点与该基准行为统一：点击嘉宾卡片主体、以及点击卡片内 CTA，都应走同一套至尊会员开通阻断流程。
- 当前异常被拆成两类：1）点击卡片主体时，出现了与 `日期筛选` 不一致的“错误弹框/错误流程”；2）点击卡片 CTA 时，没有任何可感知反馈。
- 附件截图与同批相邻缺陷都指向历史推荐受限卡片上的橙色提示条 `至尊会员才能查看/联系过往嘉宾`；因此飞书里说的“卡片按钮”大概率至少包含这个 CTA，但也不排除同时包含 `guest-card` 内部的 `详细资料/照片` / `联系对方` 两个按钮。
## Source Quality
- 结论：`medium`。
- 优点：页面明确（历史推荐）、对照基准明确（日期筛选）、本地截图可用，且仓库中能直接定位到对应页面、会员判断和两套弹窗组件。
- 不足：飞书文案提到“图 1 / 图 2”但附件目录里只有 1 张截图；“莫名弹框”未说明具体长相；“卡片按钮”也存在歧义，可能指橙色会员提示条，也可能指卡片底部按钮。
- 这些缺口不会阻塞后续计划，因为问题页、目标交互和主要代码面已经足够明确，后续可通过复现进一步压缩歧义。
## Product Context
- 页面拓扑明确：`pages/index/index` 的“历史推荐”入口进入 `pages/history/index`，见 `../immortal-in-laws-e2e/agent-memory/page-topology.md`。
- 产品待办里把历史推荐拆成两个相关规则：`docs/prd-todo.md:87` 要求“非至尊弹阻断”的日期筛选；`docs/prd-todo.md:90` 要求“3天内可正常查看；超过3天显示阻断与跳转”。
- 当前会员规则中，`store/memberStore.ts:212` 的 `canViewHistory()` 仅对至尊会员返回 `true`，说明历史推荐确实属于至尊能力面，而不是“模块未实现”。
- 当前 `member-unlock-modal` 已把 `查看历史推荐` 识别为至尊场景，并默认切换到至尊 tab，见 `components/member-unlock-modal/index.ts:241` 与 `components/member-unlock-modal/index.ts:272`。
- tracker 内已有相邻单 `wf-2026-03-13T18-18-12-272Z-xqsym5`，聚焦“历史推荐卡片内会员提示条点击无响应”；本条是在同一页面上进一步补充“卡片主体错误弹框、卡片 CTA 需与日期筛选统一”的更完整版本，属于同一实现面的 sibling bug。
## Technical Context
- 现行历史页已把 `日期筛选` 的非至尊拦截统一收口到 `showHistoryMemberUnlockModal()`，见 `pages/history/index.ts:114`、`pages/history/index.ts:375`，并通过 `pages/history/index.wxml:111` 挂载 `member-unlock-modal`。
- 历史卡片区域同时存在两套触点：一是 `guest-card` 自定义事件链（`pages/history/index.wxml:30` 绑定 `cardtap/contact`，对应 `pages/history/index.ts:222`、`pages/history/index.ts:244`）；二是历史页额外挂载的橙色提示条 `.history-lock`（`pages/history/index.wxml:40`）。
- `guest-card` 组件自身会把点击主体和底部按钮统一 `triggerEvent` 出 `guestId`，见 `components/guest-card/index.ts:201`、`components/guest-card/index.ts:211`，以及按钮绑定 `components/guest-card/index.wxml:120`、`components/guest-card/index.wxml:123`。
- 但 `pages/history/index.ts:227` 与 `pages/history/index.ts:249` 当前只从 `e.currentTarget.dataset.guestid` 取值，没有像 `pages/index/index.ts:516`、`pages/index/index.ts:541` 或 `pages/exposure/index.ts:249` 那样优先读取 `e.detail.guestId`。如果自定义事件链上的 dataset 不稳定，历史页会更容易出现“点了但没命中正确 guestId / 走错分支”的问题。
- 历史页仍保留了一套旧的 `block-dialog` 状态与挂载点，见 `pages/history/index.wxml:103`、`pages/history/index.ts:331`；但当前 `pages/history/index.ts` 内已无 `showBlockDialog(...)` 调用。这说明页面上同时存在“新阻断弹层”和“旧阻断弹层”的残留结构，后续复现时要重点确认“莫名弹框”是否来自旧路径、误跳详情后的二次弹层，或只是运行时残留。
- 样式层面，橙色提示条 `.history-lock` 位于卡片底部且 `z-index: 3`（`pages/history/index.wxss:114`），底部常驻购买栏 `.history-footer` 是固定定位且 `z-index: 20`（`pages/history/index.wxss:272`）。若问题只发生在屏幕下半区，还要排查固定底栏是否覆盖了局部点击热区。
- 附件截图中的推荐日期为 `2026年3月6日推荐`，反馈日期为 `2026-03-08`；结合 `pages/history/index.ts:419` 的 3 天预览逻辑，这更像“非至尊最近 3 天预览态”上的触点不一致，而不是“超 3 天完全锁定态”。这是基于截图日期与现有代码的推断。
## Missing Context
- 缺少“图 1 / 图 2”中的第 2 张图，无法直接比对“正确弹框”和“错误弹框”的具体 UI 差异。
- 缺少提报账号的会员身份、所选历史日期、以及点击的是卡片主体、橙色提示条、`详细资料/照片` 还是 `联系对方` 的明确说明。
- 缺少运行态证据，暂时无法区分 3 类情况：事件未触发、事件触发但 `showMemberUnlockModal` 未生效、或事件触发后误跳到了其他页面/旧弹框路径。
- 这些缺口不影响计划生成，因为核心事实已经足够稳定：同页同场景下存在一个已知正确基准（日期筛选），而其他触点没有保持一致。
## Likely Surfaces
- `pages/history/index.ts:114`、`pages/history/index.ts:222`、`pages/history/index.ts:244`、`pages/history/index.ts:367`、`pages/history/index.ts:375`、`pages/history/index.ts:412`。
- `pages/history/index.wxml:30`、`pages/history/index.wxml:40`、`pages/history/index.wxml:90`、`pages/history/index.wxml:103`、`pages/history/index.wxml:111`。
- `pages/history/index.wxss:114`、`pages/history/index.wxss:272`。
- `components/guest-card/index.ts:201`、`components/guest-card/index.ts:211`、`components/guest-card/index.wxml:120`、`components/guest-card/index.wxml:123`。
- `components/member-unlock-modal/index.ts:241`、`components/block-dialog/index.ts:20`。
## Recommended Next Action
- `generate_plan`。
- 计划阶段应优先把历史推荐页所有非至尊受限触点统一收口到 `showHistoryMemberUnlockModal()`：`日期筛选`、卡片主体、橙色提示条、以及卡片内部按钮都应落到同一至尊会员开通路径。
- 第一优先级排查项是历史页事件取值方式：在 `onGuestCardTap` / `onContactTap` 中优先读取 `e.detail.guestId`，再回退到 dataset，以避免自定义组件事件在历史页上出现“按钮无响应/错分支”。
- 第二优先级排查项是清理或隔离 `pages/history/index` 中已悬空的 `block-dialog` 路径，防止页面继续保留与 `member-unlock-modal` 并存的旧阻断结构，造成“错误弹框”或后续回归歧义。
- 第三优先级排查项是检查 `.history-lock` 与 `.history-footer` 的点击层级和覆盖范围，尤其是在最近 3 天预览态下，避免卡片下半区被固定底栏抢占命中区域。
- 复现时建议把 4 个触点分开验：卡片主体、橙色提示条、`详细资料/照片`、`联系对方`；并同时记录点击后 `showMemberUnlockModal` 是否置为 `true`，以快速区分“逻辑没走到”还是“视觉没显示”。
