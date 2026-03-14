# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 会员中心返回按钮未触发挽留弹框
## Cleaned Problem
- 缺陷页面可定位为 `pages/member-center/index` 会员中心页，截图明确指向左上角返回按钮。
- 当前点击返回按钮时，页面未出现挽留弹框；从用户反馈看，现象至少包括“没有弹框”，可能表现为直接返回上一页或直接无弹层反馈。
- 按产品要求，点击返回后应先弹出挽留弹框，用户可选择离开当前页或继续留在会员中心。
- 本条并非“待测点”或需求澄清项：PRD 已明确描述该交互，且已有截图证据支持页面定位。

## Source Quality
- 质量评估为 `high`：来源单句虽然简短，但包含明确的动作（点击返回）、明确的异常（未触发弹框）、明确的期望（应弹出挽留弹框）。
- 附件截图 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_4e6775761a11/image.png` 清楚标识了会员中心页左上角返回按钮。
- 仓库内 PRD 在 `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 已写明“挽留弹框”交互，因此不是仅凭主观反馈推断。

## Product Context
- 该问题属于“我的 -> 会员中心”购买/升级流程的一部分；主入口在 `pages/profile/index.ts:281`，会跳转到 `pages/member-center/index?tab=...`。
- 会员中心也是多个会员阻断路径的落点，例如首页、曝光页、历史推荐、记录页等都可跳入该页，因此返回交互异常会影响多个付费转化入口。
- PRD 对会员中心的返回行为有明确规定：点击“返回”应出现挽留弹框，文案为“真的要放弃会员特权吗？”，按钮为“残忍放弃 / 再想想”，且底部应有滚动弹幕提醒。
- 截图显示当前场景位于会员中心黄金会员视图；由于返回按钮和挽留弹框是页面级公共逻辑，同类问题大概率会同时影响黄金/至尊两个 tab。

## Technical Context
- 页面模板 `pages/member-center/index.wxml:3` 已将 `custom-navbar` 的返回事件绑定到 `onBackTap`，且 `pages/member-center/index.wxml:79` 已存在 `showRetainModal` 对应的 `confirm-modal`。
- 页面逻辑 `pages/member-center/index.ts:419` 已实现 `onBackTap()`，会先走 `shouldShowRetainModal()`，满足条件时通过 `setData({ showRetainModal: true })` 试图展示挽留弹框。
- 当前展示条件是“用户不是有效会员”——`pages/member-center/index.ts:428` 里通过 `memberStatus` + `isExpired` 决定是否展示；会员状态来自 `services/member.ts:16` 的 `membership/status` 接口，再由 `services/api-mapper.ts:1010` 做映射。
- 当前页面上的挽留弹框文案与 PRD 不一致：实现中是“会员特权马上就能解锁，确定现在离开吗？ / 再看看 / 忍痛离开”，而 PRD 要求是“真的要放弃会员特权吗？ / 再想想 / 残忍放弃”；PRD 还要求底部滚动弹幕，当前模板中未见对应结构。
- 现有逻辑里还有一个明确风险点：`pages/member-center/index.ts:421` 会把 `_retainPromptShown` 置为 `true`，但 `onRetainClose()` 与 `onRetainStay()` 仅关闭弹框，没有重置该标记。这意味着只要本页实例里弹框出现过一次，后续再次点返回就会直接绕过弹框。

## Missing Context
- 仍需补充复现账号状态：当前缺陷是否发生在“未开通会员”“已过期会员”还是“有效会员”场景。现有代码仅对“非有效会员”展示挽留弹框，这个门槛是否符合最终业务规则需要确认。
- 仍需确认用户反馈描述的是“首次点击返回就没有弹框”，还是“关闭一次弹框后再次点击返回没有弹框”。后者与 `_retainPromptShown` 未重置高度相关。
- 仍需确认问题是否同时覆盖黄金/至尊两个 tab，以及是否与具体入口路径相关；不过这些都属于回归范围，不阻塞进入修复计划。
- 还缺少一份运行态证据说明当前实际表现究竟是“直接返回上一页”还是“事件触发了但弹框未显示到可视层”。

## Likely Surfaces
- `pages/member-center/index.ts`
- `pages/member-center/index.wxml`
- `components/custom-navbar/index.ts`
- `components/confirm-modal/index.ts`
- `components/confirm-modal/index.wxml`
- `components/confirm-modal/index.wxss`
- `services/member.ts`
- `services/api-mapper.ts`

## Recommended Next Action
- 进入 `generate_plan`，优先围绕会员中心返回链路做一次定点复现与修复设计。
- 计划阶段应先验证 `onBackTap -> shouldShowRetainModal -> showRetainModal` 这条链路是否真正执行，并记录 `memberStatus`、`isExpired`、`_retainPromptShown` 的运行态值。
- 修复方案至少应覆盖两类风险：一是首次返回未触发挽留弹框；二是用户点击“再想想/关闭”后再次返回时仍应继续出现挽留弹框。
- 若按 PRD 一并收口，建议同时把弹框文案、按钮文案与滚动弹幕提醒对齐产品定义，避免只修“出现/不出现”而留下明显的规格偏差。
