# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 记录页看过我/我看过/收藏我嘉宾卡片资料字段与 UI 稿不一致
## Cleaned Problem
缺陷集中在记录页 `pages/message-record/index` 的嘉宾卡片信息区，范围至少覆盖以下 3 个场景：`看过我`、`我看过的`、`收藏我`。当前卡片资料字段与 UI 稿不一致，表现为部分字段缺失、部分字段多出，示例包括：应展示的年龄/出生年份样式、相亲介绍（相亲说明）未出现，或在无照片卡片中出现了不该出现的字段。

结合缺陷截图与本地设计稿可进一步归纳为：
- 记录卡片存在“无照片”和“有照片”两种版式，二者字段矩阵不同。
- 当前实现对 `view` / `favorite` 记录复用了同一套字段拼装逻辑，但无照片卡片的字段组合与设计稿不一致。
- 相亲介绍文案在设计稿中应作为卡片底部摘要出现；缺陷截图中该区域缺失，需确认是前端渲染遗漏，还是接口映射未取到 `match_desc` / `match_desc_label`。

本条缺陷适合继续进入实现计划阶段，但后续执行时应把“字段矩阵对齐 UI 稿”和“相亲介绍字段来源核对”一起处理。

## Source Quality
优点：
- 缺陷标题明确指出了页面范围和问题类型（记录页卡片信息缺失/多出）。
- 附带了本地截图，可直接看到当前异常态。
- 仓库内已有对应设计稿，可离线对照：`design/3.设计稿/神仙亲家-消息-看过我1.png`、`design/3.设计稿/神仙亲家-消息-收藏我1.png`。
- 页面路由和主要实现位置可直接定位到 `pages/message-record/index` 与其专用卡片组件。

不足：
- 原始描述未逐一列出每个 tab、每种卡片形态（有图/无图）的完整字段期望。
- 未提供真实接口 payload，无法仅凭工单判断“相亲介绍缺失”是前端布局问题还是后端列表接口未返回字段。
- 标题只点名了 `收藏我`，但同一组件也服务于 `我收藏的`，后续实现时建议顺带做同组件自查。

综合判断：信息质量为 `medium`，但已足以进入后续计划生成。

## Product Context
根据 PRD 与设计稿，记录页属于“消息 -> 浏览/收藏/解锁记录”流转：
- `看过我` / `我看过的` 属于浏览记录页的两个方向 tab。
- `收藏我` 属于收藏记录页的对方收藏我方向；其卡片视觉与浏览记录卡片保持同一风格。
- PRD 明确记录页“嘉宾资料卡，资料展示规则同【首页--嘉宾资料】”，说明字段展示不是自由发挥，而是应遵循统一的资料卡规则。
- 设计稿显示记录卡片至少有两种信息布局：
  - 无照片卡：两列 8 个资料项，并展示相亲介绍摘要。
  - 有照片卡：左侧 4 个资料项 + 右侧照片，并展示相亲介绍摘要。
- 本地设计图中可见的典型字段顺序包括：
  - 无照片卡：`现居 / 身高 / 学历 / 收入 / 房产 / 车产 / 家乡 / 职业`
  - 有照片卡：`年龄(设计表现为“92年”样式) / 身高 / 现居 / 职业`
  - 两类卡片底部均应有相亲介绍摘要。

## Technical Context
已定位到的前端实现链路如下：
- 页面入口：`pages/message-record/index.ts`
  - 通过 `type` 和 `direction` 区分 `view` / `favorite` / `unlock` 以及 `other_to_me` / `me_to_other`。
  - 列表项在 `loadData()` 中统一转为 `RecordViewModel`。
- 纯函数拼装层：`pages/message-record/helpers.ts`
  - `buildRecordViewModel()` 负责头部文案、按钮态、`cardGuest` 等统一视图模型构建。
  - `buildCardGuest()` 把记录接口返回的 guest 信息转成卡片消费结构。
- 卡片组件：`components/pages/message-record/record-card/index.ts` + `index.wxml`
  - `syncDisplay()` 根据 `recordType` 和是否有照片，手工拼装 `leftInfoRows` / `rightInfoRows`。
  - 当前逻辑对 `view` / `favorite` 无照片卡使用了 `年龄 / 现居 / 学历 / 房产` + `身高 / 收入 / 车产 / 职业` 的组合，这与设计稿的无照片卡字段矩阵不一致，表现为“多出年龄、缺少家乡”。
  - `noteText` 仅取 `record.cardGuest.matchmakingNote || record.description`；若接口侧字段未映射到这里，则摘要会直接消失。
- 接口映射：`services/record.ts` + `services/api-mapper.ts`
  - `fetchViewRecords()` / `fetchFavoriteRecords()` 调用交互记录接口并统一走 `mapInteractionItemToGuestSummary()`。
  - `mapInteractionItemToGuestSummary()` 已尝试从多个位置提取 `match_desc` / `match_desc_label`，但记录类接口文档示例中是否稳定返回该字段并不明确。

补充观察：
- `mapChildBasicProfile()` 已可解析 `age`、`birth_year`、`hometown_label`、`occupation` 等资料字段，说明“资料缺失”不一定都是接口没给，也可能是卡片层取值矩阵不对。
- 当前卡片中“年龄”文案实际由 `birthYear` 生成 `92年` 样式，而不是用真实年龄整数；这与设计稿样式接近，但与字段命名存在语义偏差，后续修复时应顺手确认是否继续沿用该展示规则。

## Missing Context
仍建议在进入修复前补充或核对以下信息：
- 3 个 tab 的最终验收范围是否仅为 `看过我` / `我看过的` / `收藏我`，还是同组件承载的 `我收藏的` 也需要一起对齐。
- 是否所有卡片都必须展示相亲介绍；若某些真实数据确实无 `match_desc`，空态应该隐藏还是展示占位。
- 真实线上/测试环境交互记录接口返回体里，是否稳定包含 `match_desc` / `match_desc_label`。
- 是否还要同步对齐头部时间文案、会员阻断态、暂停相亲遮罩等周边视觉项；当前工单重点仍然是资料字段区。

这些缺口不会阻塞计划生成，但会影响后续是否只改前端、还是需要联动后端字段补齐。

## Likely Surfaces
高概率改动面：
- `components/pages/message-record/record-card/index.ts`
- `components/pages/message-record/record-card/index.wxml`
- `pages/message-record/helpers.ts`
- `pages/message-record/index.ts`
- `services/api-mapper.ts`
- `services/record.ts`

高价值对照物：
- `design/3.设计稿/神仙亲家-消息-看过我1.png`
- `design/3.设计稿/神仙亲家-消息-收藏我1.png`
- `design/1.需求文档/神仙亲家--小程序产品需求文档.md`

## Recommended Next Action
建议进入 `generate_plan`。

建议后续计划聚焦以下顺序：
1. 先按设计稿整理记录卡片“有图/无图”两套字段矩阵，并明确哪些 tab 共用同一矩阵。
2. 调整 `record-card` 的字段拼装逻辑，优先修正“无图卡多出年龄、缺少家乡”等确定性问题。
3. 抓取/核对真实记录接口 payload，确认 `match_desc` 是否已返回；若已返回则补前端映射/渲染，若未返回则登记为后端依赖。
4. 在微信开发者工具中逐个验证 `看过我`、`我看过的`、`收藏我`，并覆盖有图/无图两类卡片样式。

结论：本单 `readiness=ready`，可以安全进入计划生成阶段。
