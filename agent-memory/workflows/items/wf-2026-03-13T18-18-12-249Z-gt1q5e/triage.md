# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 看过我页非会员点击嘉宾卡片或详细资料按钮会进入详情页，应弹会员开通阻断弹窗
## Cleaned Problem
在 `pages/message-record/index` 的“看过我”视图中（`type=view`，默认 `direction=other_to_me`），非会员用户点击嘉宾卡片主体或“详细资料/照片”按钮时，当前会直接跳转到 `pages/guest-detail/index`。该页是会员受限场景，期望行为应与页面底部“开通会员 查看全部资料”按钮保持一致：不允许直接进入详情页，而是弹出会员开通阻断弹窗，引导用户进入会员购买流程。问题只针对“看过我”这一特殊记录页，不是通用的嘉宾卡详情跳转规则。

## Source Quality
- 缺陷描述给出了明确页面范围（“看过我”页）、明确用户身份条件（非会员）、明确触发动作（点击嘉宾卡片、点击“详细资料/照片”按钮）、明确错误行为（跳转详情页）和明确期望行为（弹出会员阻断弹窗）。
- 附件截图直接证明该页面存在底部会员引导条，能够支撑“应同底部按钮逻辑一样处理”的预期，不是抽象体验建议。
- 仓库内可以直接定位到对应路由、记录卡组件、会员弹窗组件和会员状态判断逻辑，说明该问题具备充分的仓库上下文，适合进入计划阶段。

## Product Context
- 页面拓扑与消息页实现显示，用户从 `pages/message/index` 的金刚区点击“看过我的”后，会进入 `pages/message-record/index?type=view`；该页面默认方向就是 `other_to_me`，即“看过我”。
- 产品文档中，会员权益明确包含“查看谁看过我 / 查看谁收藏我”，说明这类“他人对我的交互记录”属于会员价值点，不应让非会员通过卡片点击绕过限制直接看详情。
- 附件截图和当前页面结构都表明，这个页面已经存在针对非会员的底部开通引导，因此用户预期是：卡片主体、详情按钮、底部按钮三者的会员门槛应该一致。
- 此问题位于消息/记录高频路径，且用户反馈优先级为 `P0`，进入后续修复计划是合理的。

## Technical Context
- 直接入口在 `pages/message/index.ts` 的 `onKingKongTap()`：点击金刚区后跳转到 `/pages/message-record/index?type=${type}`；当 `type=view` 时，记录页默认就是“看过我”。
- `components/pages/message-record/record-card/index.wxml` 中，卡片主体 `record-panel` 和底部“详细资料/照片”按钮都绑定到同一个 `onRecordTap` 事件；`components/pages/message-record/record-card/index.ts` 再统一向页面抛出 `cardtap`。这意味着页面层只要修正一个入口，就能同时覆盖“点卡片”和“点详情按钮”两个触发动作。
- `HEAD` 版本的 `pages/message-record/index.ts` 中，`onRecordTap()` 当前仅做了空值和屏蔽态判断，随后直接 `wx.navigateTo('/pages/guest-detail/index?id=...')`，没有针对 `recordType=view + direction=other_to_me + 非会员` 的拦截逻辑；这与缺陷描述完全一致。
- 同一页面的其他入口已经有会员限制思路：`onContactTap()` 会在非会员时弹出 `member-unlock-modal`，页面 WXML 也已挂载 `member-unlock-modal`。因此本问题更像是“详情入口漏加特殊门槛”，不是缺少基础设施。
- `store/memberStore.ts` 已提供会员状态判断；`components/member-unlock-modal/index.ts` 也已具备按场景默认切换 Gold/Supreme 的能力。对“看过我”场景而言，复用现有 Gold 会员阻断路径即可，不需要新建弹窗体系。
- 额外上下文：当前 app 仓库工作区不是干净状态，`pages/message-record/index.ts` / `pages/message-record/index.wxml` 已存在未提交改动，且这些本地改动正好触及“看过我”底部条和 `onRecordTap` 会员拦截。后续执行计划时应先确认以 `HEAD` 为基准修复，还是在现有本地 WIP 上继续，避免覆盖同事未提交工作。

## Missing Context
- 缺少本次缺陷对应的目标代码基线说明：当前 `HEAD` 明确存在问题，但本地工作区已有未提交的同区域改动，尚不清楚这些改动是否就是该缺陷的待提交修复。
- 缺少一次最新构建/真机复现记录，用于确认问题发生在 `HEAD`、某个历史包，还是仅发生在未同步最新代码的测试包上。
- 缺少“弹窗文案/scene 值必须完全复用底部按钮哪一种”的明确要求；不过用户已经明确“同底部按钮逻辑一样”，这足以指导后续实现复用同类会员阻断路径，而不会阻塞计划生成。
- 上述缺口不影响进入 `generate_plan`，但后续执行第一步应先处理“工作区脏状态”和“目标基线”问题。

## Likely Surfaces
- `pages/message-record/index.ts`
  - `onRecordTap()` 是主缺陷点；当前直接跳详情，应该在“非会员 + 看过我”时改为走会员阻断逻辑。
- `components/pages/message-record/record-card/index.ts`
  - 统一分发 `cardtap` 事件，确认“卡片主体”和“详细资料/照片”按钮共享同一个页面处理入口。
- `components/pages/message-record/record-card/index.wxml`
  - `record-panel` 与 `record-action-detail` 都绑定 `onRecordTap`，是双触发点的结构证据。
- `pages/message-record/index.wxml`
  - 已挂载 `member-unlock-modal`，并存在底部会员引导区域；后续应保证卡片点击与底部 CTA 的阻断行为一致。
- `store/memberStore.ts`
  - 会员状态/权益判断可复用，避免在页面里硬编码新的身份判断分支。
- `components/member-unlock-modal/index.ts`
  - 现有会员阻断弹窗承载购买引导；若要“同底部按钮逻辑”，这里是复用目标，而不是新增弹窗组件。

## Recommended Next Action
建议进入 `generate_plan`。后续计划建议先做两件事：
- 先确认修复基线：比较 `HEAD` 与当前本地未提交改动，决定是补齐现有 WIP 还是在干净基线上重做，避免误覆盖工作区内容。
- 再围绕单一入口修复：把 `pages/message-record/index.ts` 的 `onRecordTap()` 改为复用与底部 CTA 同类的会员阻断分支，在 `recordType=view`、`direction=other_to_me`、非会员条件下弹出会员开通弹窗，而不是直接 `navigateTo` 详情页。
