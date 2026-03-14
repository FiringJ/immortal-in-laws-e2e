# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 至尊会员权益入口点击无响应，应弹出权益图片弹框
## Cleaned Problem

在 `会员中心` 的 `至尊会员` 页签中，点击权益列表入口当前无任何反馈。根据缺陷描述、截图和本地 UI 稿，正确行为应为：点击对应权益项后，弹出该权益对应的图片说明弹框（蒙层 + 居中图片卡片 + 关闭入口），而不是保持静态无响应。

当前可明确的范围是 `pages/member-center/index?tab=supreme` 下的至尊会员权益区，至少包含：

- 上方 4 个主权益卡片：`1.不限时间`、`2.精准搜索`、`3.超级曝光`、`4.红娘管家`
- 下方 8 个次级权益入口：`5.每天推荐26位` 至 `12.尊享资料皮肤`

本地设计稿中存在 `神仙亲家-我的-至尊会员-弹窗1.png` 到 `神仙亲家-我的-至尊会员-弹窗12.png` 共 12 张弹窗稿，和页面上的 12 个权益入口一一对应，说明需求不是“进入新页面”，而是“页内弹出对应权益图片弹框”。

## Source Quality

结论：`high`

原因：

- 飞书标题和问题描述都明确指向 `至尊会员`、`点击列表各个权益入口无反应`、`应弹出权益图片弹框`
- 附件截图明确标记了至尊会员权益区中的多个入口，问题定位不模糊
- 本地设计稿同时包含页面稿 `design/3.设计稿/神仙亲家-我的-至尊会员1.png` 和 12 张对应弹窗稿，预期行为有直接视觉依据
- 仓库代码中已存在 12 张至尊说明图的数据源常量，说明资源侧不是空白需求，而是前端交互未接通

## Product Context

- 模块：会员中心
- 主路由：`pages/member-center/index`
- 目标页签：`tab=supreme`
- 典型入口：`pages/profile/index`、`pages/history/index`、`pages/filter-result/index`、`pages/exposure/index` 等均可跳到会员中心，其中多处直接携带 `?tab=supreme`
- 页面拓扑与项目知识文档已覆盖会员中心属于购买/升级闭环的一部分，当前缺陷属于纯前端交互缺失，不涉及后端业务规则确认

设计证据：

- 页面稿：`design/3.设计稿/神仙亲家-我的-至尊会员1.png`
- 弹窗稿：`design/3.设计稿/神仙亲家-我的-至尊会员-弹窗1.png` ~ `design/3.设计稿/神仙亲家-我的-至尊会员-弹窗12.png`
- 缺陷附件：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_35384028f48c/image.png`

## Technical Context

已确认的仓库现状：

- `pages/member-center/index.wxml` 在至尊会员页签只渲染了 `<member-center-supreme-cards />` 与下方 `<member-center-explain-cards cards="{{explainCards}}" />`，但没有权益弹框组件挂载位，也没有与权益点击相关的事件绑定
- `pages/member-center/index.ts` 已定义 `EXPLAIN_CARDS_SUPREME`（12 张图），但页面状态里只有 `showSuccessModal`，没有“权益说明弹框”的显隐状态、当前权益索引或点击处理函数
- `components/pages/member-center/member-center-supreme-cards/index.ts` 只维护 `majorBenefits` 和 `minorBenefits` 静态数据，没有 `methods`
- `components/pages/member-center/member-center-supreme-cards/index.wxml` 中主权益卡片和次级权益入口都只是普通 `view` 循环节点，没有 `bindtap` / `catchtap`，因此当前点击无响应是代码层面的直接结果
- `components/pages/member-center/member-center-explain-cards/index.wxml` 现状是“页面内嵌 swiper 轮播图”，并非设计稿里的“点击权益后弹出浮层卡片”

可复用/相邻实现线索：

- `components/member-unlock-modal/index.ts` 已存在同类会员说明图资源组织方式，且同样维护了 `EXPLAIN_CARDS_SUPREME`（12 张）
- 当前会员中心页使用的图片路径是 `https://static.yilusx.com/assets/imgs/member-center/page-explain/...`
- `member-unlock-modal` 使用的图片路径是 `https://static.yilusx.com/assets/imgs/member-center/explain/...` 并带版本号
- 后续计划阶段需要确认应复用哪组资源路径，避免修复交互时引入错误素材或重复维护

## Missing Context

以下信息尚不完全明确，但不足以阻塞进入计划阶段：

- 点击权益后是否只展示“对应单张图片 + 关闭”，还是允许在弹框内左右滑动切换其它权益图
- 弹框关闭方式是否需要支持点击遮罩关闭，还是仅支持关闭按钮
- 会员中心页当前下方内嵌 `member-center-explain-cards` 轮播区域在修复后应保留、替换还是删除；从 UI 稿看，更像应以弹框为主，但仍建议在实施前对照完整设计稿再确认
- `page-explain` 与 `explain` 两套 CDN 路径哪一套是最新素材源，需要在实施时选择单一真源

## Likely Surfaces

- `pages/member-center/index.ts`
- `pages/member-center/index.wxml`
- `components/pages/member-center/member-center-supreme-cards/index.ts`
- `components/pages/member-center/member-center-supreme-cards/index.wxml`
- `components/pages/member-center/member-center-explain-cards/index.wxml`
- `components/member-unlock-modal/index.ts`（可作为资源组织/弹层交互参考，不一定需要修改）

高概率修复方向：

- 给至尊权益项补充点击事件和权益编号映射
- 在会员中心页新增或挂载权益图片弹框状态
- 依据点击项定位到对应 `EXPLAIN_CARDS_SUPREME[n]`
- 对照设计稿完成弹框样式与关闭交互

## Recommended Next Action

`generate_plan`

建议按“纯前端交互缺失”进入计划阶段，按以下思路推进：

1. 明确至尊权益 12 个入口与 12 张弹窗图的映射关系
2. 在 `member-center-supreme-cards` 输出点击事件（主权益 1-4、次级权益 5-12）
3. 在 `pages/member-center/index` 增加权益弹框状态和当前选中图片索引
4. 新增或复用轻量弹框组件，按设计稿实现蒙层、居中图片卡片、关闭按钮
5. 复核是否保留当前页内 `member-center-explain-cards` 轮播区，避免与设计重复/冲突
6. 在微信开发者工具验证：点击每个权益项均有响应，且弹出的图片与设计稿编号一致
