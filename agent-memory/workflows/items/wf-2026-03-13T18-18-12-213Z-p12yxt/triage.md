# Triage
- readiness: needs_human
- source_quality: low
- next_action: manual_triage
- normalized_title: 我收藏的中非会员剩余免费解锁次数≥1时，点击“联系对方”应显示免费解锁确认并继续解锁联系流程
## Cleaned Problem
当前条目更像一条“待测点/期望行为说明”，而不是已经确认的缺陷：在 `我收藏的` 记录页中，若当前用户为非会员且剩余免费解锁次数 ≥ 1，点击卡片上的“联系对方”后，应先弹出确认框，文案为“您有 xx 次免费解锁机会，可解锁并查看对方号码”；点击“立即解锁”后，应继续执行与“可解锁联系”一致的后续流程（解锁联系方式、扣减剩余次数、进入后续联系场景）。

但原始来源没有说明当前实际错误表现：不清楚是“没有弹框”“弹框文案不对”“点击立即解锁无效”“扣次错误”，还是只是提醒测试同学补测该场景。因此当前不足以直接进入修复计划。

## Source Quality
- 质量评估为 `low`：原始描述只有期望行为，没有明确的实际异常现象。
- 原文明确写了“此为待测点”，按流程应优先视为验证/补测项，而非已确认 bug。
- 缺少截图、录屏、复现步骤、测试账号、剩余次数值、接口返回样本等关键证据。
- 虽然标题包含了页面范围和条件（`我收藏的`、非会员、剩余次数 ≥ 1），但仍不足以支撑不带猜测的修复计划。

## Product Context
- 目标模块是记录页 `pages/message-record/index`，其中“我收藏的”入口已在 `pages/profile/index.ts` 和 `pages/invite/index.ts` 中通过 `type=favorite&direction=me_to_other` 跳转。
- PRD 在 `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 中定义了“联系对方”需按“会员状态 / 剩余联系次数”判定，剩余次数足够时应允许继续联系流程。
- `我收藏的` 场景与首页/曝光页不同，当前实现使用的是“解锁并查看对方号码”文案，而不是“解锁和对方的聊天”，说明这里是记录页下的专门变体。
- 该场景属于付费/免费解锁转化链路，若确有问题，会直接影响非会员用户在收藏记录中的触达与联系转化。

## Technical Context
- 当前仓库里，这条路径已经有专门实现，不像“未开发功能”：
  - `pages/message-record/index.ts` 的 `onContactTap` 对 `recordType === favorite && direction === me_to_other` 做了单独处理。
  - 当用户不是会员但 `memberStore.getRemainingUnlockCount() > 0` 时，会设置 `showContactUnlockConfirm = true`，并将文案设为 `您有${remainingUnlockCount}次免费解锁机会，可解锁并查看对方号码`；会员则使用 `您是会员，可免费解锁并查看对方号码`。
  - `pages/message-record/index.wxml` 已为该状态绑定独立 `confirm-modal`，确认按钮文案就是 `立即解锁`。
  - 点击确认后，`pages/message-record/index.ts` 的 `onConfirmContactUnlock` 会调用 `services/record.ts` 的 `unlockContact()`，成功后更新 `memberStore` 中的剩余次数、记录已解锁/已联系状态，toast `成功解锁联系方式`，再跳转 `/pages/chat/index?guestId=...`。
- 剩余免费解锁次数来自 `memberStore.getRemainingUnlockCount()`；其数据源是 `services/member.ts` 中的 `fetchMemberBenefits()`，而 `freeUnlockCount` 来自 `/api/v1/interaction/unlock-quota`，不是前端写死值。
- `services/member.spec.ts` 已覆盖“非会员且 remaining_quota > 0 时 canContact/canUnlock 为 true”的单测，说明仓库对这一业务规则已有明确约束。
- 基于当前源码，仓库实现与飞书描述的期望行为基本一致；若线上仍有问题，更像运行态回归、分支未同步、接口返回异常，或测试结论尚未补充到缺陷单中。

## Missing Context
- 缺少“实际现象”描述：到底是未弹确认框、文案不匹配、按钮点了没反应、接口报错，还是扣减次数/跳转结果不符合预期。
- 缺少复现前置条件：测试账号是否真为非会员、`unlock-quota.remaining_quota` 是否确实 ≥ 1、目标嘉宾此前是否已建立联系/已解锁。
- 缺少运行版本信息：无法判断飞书反馈针对的是当前仓库代码、旧包、还是其他分支构建。
- 缺少接口日志：未见 `/api/v1/interaction/unlock-quota` 与 `/api/v1/interaction/unlock` 的实际响应，无法判断是前端分支判断错误还是后端数据问题。
- 缺少 UI 证据：没有截图/录屏证明当前页面实际走到了 `showContactUnlockConfirm`、`showContactLimitModal` 还是 `showMemberUnlockModal`。

## Likely Surfaces
- `pages/message-record/index.ts`
- `pages/message-record/index.wxml`
- `components/pages/message-record/record-card/index.ts`
- `components/pages/message-record/record-card/index.wxml`
- `store/memberStore.ts`
- `services/member.ts`
- `services/record.ts`
- `pages/chat/index.ts`

## Recommended Next Action
建议先走 `manual_triage`，不要直接进入 `generate_plan`。优先补齐以下信息后，再判断是否需要实施修复：
- 用一组明确测试数据复现：非会员账号、`remaining_quota >= 1`、进入 `pages/message-record/index?type=favorite&direction=me_to_other`、选择一个此前未联系/未解锁的收藏对象。
- 记录实际表现：
  - 是否出现“您有 xx 次免费解锁机会，可解锁并查看对方号码”；
  - 点击“立即解锁”后是否调用了解锁接口；
  - 是否成功扣减剩余次数；
  - 是否 toast “成功解锁联系方式”；
  - 是否进入聊天页且后续能力与预期一致。
- 若复现失败，再补充运行态证据：`remaining_quota` 返回值、`unlock` 接口返回、页面命中的弹窗类型、是否已有本地 `isUnlocked/hasContacted` 状态。
- 若验证结果表明当前实现已符合预期，应将该条从“缺陷”转为“测试检查项/关闭”；只有在拿到明确异常现象后，才适合进入修复计划。
