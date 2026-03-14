# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 会员中心黄金会员季度/年度/永久套餐权益图片未随档位切换
## Cleaned Problem
在 `pages/member-center/index` 的黄金会员页中，季度、年度、永久三个套餐切换时，底部“会员权益”图片区（轮播卡片和权益列表点按预览图）仍复用同一组黄金会员素材，导致年度/永久档位也显示季度档的内容。附件截图中的当前图片文案为“有效期3个月 / 开通后93天内免费解锁并联系家长”，这说明当前展示的是季卡图；但页面默认会优先选中年卡档位，且用户反馈指出年度、永久页也沿用了同一张/同一组图片。期望行为是：黄金会员权益图片必须随当前选中套餐联动，至少在“有效期”和“每天推荐人数”上与对应档位一致；至尊会员页不受影响。

## Source Quality
- 原始飞书缺陷已经明确指出异常对象（黄金会员季度、年度、永久档位）和错误现象（有效期、每天推荐人数使用了同一个权益图片）。
- 本地附件可直接看出当前素材是季度档图片：`有效期3个月`、`93天` 等信息与“多档位复用同一图”的主诉一致。
- 仓库内可补足足够的产品和技术上下文：
  - `agent-memory/project-knowledge.md` 已明确记录黄金会员权益应按档位切换。
  - `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 已明确列出季卡、年卡、永久卡的权益差异。
- 仍存在一处轻微文案不一致：`agent-memory/project-knowledge.md` 将年卡写为 `有效期12个月`，而需求文档文字写为 `372天`。不过两份资料都明确说明年卡/永久卡不应继续显示季卡的 `93天` 内容，因此不影响进入后续计划阶段。

## Product Context
- 问题页面是会员中心 `pages/member-center/index`，属于“我的”主路径里的核心付费转化页。
- `pages/profile/index.ts` 中 `onMemberCenterTap()` / `onMemberBannerTap()` 都会进入该页，因此该缺陷会影响“我的”页会员入口和会员 banner 两条高频路径。
- 产品文档说明黄金会员有三档：季卡（3个月）、年卡（12个月）、永久卡；进入页面默认选中年卡档位，因此如果图片区始终显示季卡内容，首屏就会出现默认选中档位与图片内容不一致的问题。
- `agent-memory/project-knowledge.md` 已沉淀出当前项目对黄金会员权益的期望：
  - 季卡：`有效期93天` + `每天推荐8位对象`
  - 年卡：`有效期12个月` + `每天推荐18位对象`
  - 永久：`有效期不限时间` + `每天推荐26位对象`

## Technical Context
- 后端套餐数据已经足够区分三档黄金会员：`services/member.ts` 调用 `/api/v1/membership/plans`，`services/api-mapper.ts` 会把接口中的 `days` 映射为前端 `MemberPlan.duration`。
- `pages/member-center/index.ts` 已存在按套餐档位识别的逻辑：
  - `resolveGoldPlanTier()` 会基于 `duration / planId / label` 区分 `quarter | year | permanent`。
  - `buildGoldBenefitView()` 已能正确生成文字权益：季卡 `93天/8位`、年卡 `12个月/18位`、永久 `不限时间/26位`。
- 当前真正的异常点在图片状态管理，而不是接口层：
  - 黄金会员图片区素材被硬编码为单一数组 `EXPLAIN_CARDS_GOLD`，统一指向 `https://static.yilusx.com/assets/imgs/member-center/page-explain/gold/01-06.png`。
  - `applySelectedTab()` 在切到黄金会员时，总是把 `explainCards` 和 `benefitPreviewImages` 设为这同一组 `EXPLAIN_CARDS_GOLD`。
  - `onSelectPlan()` 切换季卡/年卡/永久卡时，只更新了 `selectedPlanId`、`selectedPlan`、`benefitTitle`、`benefitRows`，没有同步更新 `explainCards` 或 `benefitPreviewImages`。
- 受影响的两个展示位是同一个数据源：
  - `components/pages/member-center/member-center-explain-cards/index.wxml` 的 swiper 直接渲染 `cards`。
  - `components/pages/member-center/member-center-benefits/index.ts` 点击权益行时会用 `previewImages` 打开大图预览。
- 这说明问题基本可以定位为：黄金会员的“文字权益”已按档位联动，但“权益图片/预览图片”仍是静态季度素材，属于页面状态与图片资源映射缺失，而非后端返回错误。

## Missing Context
- 目前仓库里尚未看到按 `quarter/year/permanent` 明确拆分的黄金会员权益图 URL 或本地切图命名；后续计划阶段需要先盘点或确认年度、永久档位应使用的具体素材。
- “年卡”图片文案需在执行阶段确认最终口径：需求文档写的是 `372天`，而项目知识与当前文字权益实现写的是 `12个月`。
- 飞书原始描述提到“如截图1 prd所示”，但当前工单附件只有一张能证明“现状错误”的截图，没有直接附上年度/永久的 PRD 对照图。
- 这些缺口不影响进入 `generate_plan`，因为核心缺陷、影响范围和代码落点都已经足够明确。

## Likely Surfaces
- `pages/member-center/index.ts`
  - 新增或改造黄金会员权益图片配置，使其按 `quarter | year | permanent` 分组。
  - 在 `loadData()` 默认选中套餐时，同步设置正确的 `explainCards` 和 `benefitPreviewImages`。
  - 在 `onSelectPlan()` 切换套餐时，同步刷新图片组，而不只刷新文字权益。
- `components/pages/member-center/member-center-explain-cards/index.wxml`
  - 当前只是渲染层，大概率不需要结构性改动，但会直接受 `cards` 数据变化影响。
- `components/pages/member-center/member-center-benefits/index.ts`
  - 需要确保权益列表点击预览的大图与当前套餐保持一致，避免 swiper 切换对了但预览仍是旧图。
- `services/member.ts`
  - 更像只读验证面，确认套餐数据中的 `duration` 足以驱动前端分档；当前看不像根因。
- `services/api-mapper.ts`
  - 更像只读验证面，确认 `days -> duration` 的映射无需额外修正；当前看不像根因。

## Recommended Next Action
建议进入 `generate_plan`。后续计划应优先：
- 先确认黄金会员三档权益图的最终素材来源（现有 CDN、设计切图或 PRD 导出图）。
- 再把黄金会员图片区与预览图改为按套餐档位联动，而不是共享单一 `EXPLAIN_CARDS_GOLD`。
- 最后回归验证以下场景：默认年卡首屏、手动切换季卡/年卡/永久卡、权益列表点击预览、切到至尊会员页后不受影响。
