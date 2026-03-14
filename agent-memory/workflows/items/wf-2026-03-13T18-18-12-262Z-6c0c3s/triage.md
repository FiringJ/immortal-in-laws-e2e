# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 消息页精准搜索入口在非会员已用搜索机会后错误进入筛选页，应进入搜索结果页
## Cleaned Problem

非会员用户在首页已经使用过一次精准搜索后，首页入口会进入搜索结果/解锁页，但消息页的“精准搜索”入口仍会进入筛选条件页。该入口应与首页及同类记录入口保持一致：当用户已有已保存的筛选条件或既有搜索记录/已用机会状态时，应直接进入 `pages/filter-result/index`，而不是回到 `pages/filter/index`。

本条缺陷的本质是“精准搜索入口流转规则未统一”，而不是单纯的消息页文案或样式问题。附件截图已明确指向消息页中的“精准搜索”入口：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_d1fd9fefe899/image.png`。

## Source Quality

- 缺陷描述清楚：明确了用户身份（非会员）、错误入口（消息页精准搜索）、正确对标行为（首页/记录入口）和期望结果（进入搜索结果页）。
- 证据充分：有本地截图附件，仓库内也能直接定位到消息页精准搜索入口和对应跳转代码。
- PRD 可对齐：产品文档已明确“点击精准查找/搜索框时，若保存过择偶要求则进入搜索结果页，否则进入筛选页”。
- 仅剩少量非阻塞歧义：原文中的“记录保持一致”未明确具体是哪个记录入口，但不影响后续制定修复方案。

## Product Context

- `agent-memory/page-topology.md` 已定义首页 `pages/index/index` 的“精准查找”流转：存在已保存搜索条件时进入 `pages/filter-result/index`，否则进入 `pages/filter/index`。
- PRD `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 1.4“筛选嘉宾”明确要求：点击“精准查找”或“搜索框”时，需要先判断用户是否填写并保存过择偶要求；若保存过则进入搜索结果页，否则进入筛选条件页。
- 同一份 PRD 还明确“红豆择偶搜索”和“首页精准搜索”的搜索数据、操作记录互通，因此入口判断不应依赖单一页面瞬时内存态。
- 非会员使用过搜索机会后，搜索结果页同时承担“搜索结果/解锁承接页”的角色，因此从消息页再次进入时，预期也应回到该结果页，而不是重新打开筛选页。

## Technical Context

- `pages/message/index.ts` 的 `onFilterTap` 当前直接使用本地态判断：`recommendStore.getFilterResultList().length > 0 || Boolean(recommendStore.getFilterRequirements())`；命中后跳 `'/pages/filter-result/index?from=message'`，否则跳 `'/pages/filter/index?from=message'`。
- `pages/index/index.ts` 的 `onFilterTap` 使用了同样的重复逻辑，只是 `from=index`。这说明当前“首页/消息页一致性”并没有通过统一入口能力保障，而是依赖两处重复实现。
- `store/recommendStore.ts` 目前只持久化了 `filter_requirements`，并未持久化“最近一次精准搜索历史是否存在”“最近结果摘要”“已用机会状态”等入口判断所需元数据；`app.ts` 启动时也只恢复了该基础条件。
- 仓库中已经存在一个明显用于统一入口判断的草稿工具：`utils/filter-flow.ts`。该文件意图在本地结果缺失时，继续依据“最近一次精准搜索历史”决定是否进入结果页；但它当前并未被页面接入，且调用了不存在的 `recommendStore.refreshLatestFilterSearchHistory`。
- 运行 `npm run type-check` 可直接看到该未完成链路：`utils/filter-flow.ts(28,48): error TS2339: Property 'refreshLatestFilterSearchHistory' does not exist on type 'RecommendStore'.`
- 同次类型检查还存在一个无关但已存在的仓库噪音：`services/api-mapper.ts(797,5): error TS1117: An object literal cannot have multiple properties with the same name.` 这不阻塞本缺陷进入计划阶段，但会影响后续“全量 type-check 通过”的验证基线。
- `pages/filter/index.ts` 的 `onSubmit` 已包含“非至尊会员已有筛选历史时，toast 后直接进入 `pages/filter-result/index`”的保护逻辑，进一步说明产品预期本就是“重复进入结果承接页”，只是入口判断没有统一封装。

## Missing Context

- 缺少明确复现链路说明：尚未写明这是“同一会话内复现”还是“冷启动/重新进入小程序后复现”。
- “记录保持一致”指向的具体页面未明示，可能是搜索记录页，也可能是其他记录类入口；需要在计划阶段补一次点位确认。
- 前端当前未能从现有代码中直接确认“最近精准搜索历史”的正式服务接口名；如需做稳态修复，可能要补齐 `services/guest.ts` / `store/recommendStore.ts` 的历史查询能力。
- 尚未从附件中确认异常发生时页面栈与本地 store 内容，但这不影响本条缺陷的核心修复方向判断。

## Likely Surfaces

- `pages/message/index.ts`：消息页“精准搜索”入口，当前问题直接发生点。
- `pages/index/index.ts`：首页同类入口，需与消息页统一到同一套跳转判定。
- `utils/filter-flow.ts`：现有但未接入的统一流转工具，且当前存在缺失方法问题。
- `store/recommendStore.ts`：需要承接“最近一次精准搜索历史/已用机会状态”的统一读取能力。
- `services/guest.ts`、`types/guest.ts`：若前端当前没有可复用的历史搜索查询能力，这里很可能需要补齐接口封装和类型。
- `pages/filter/index.ts`、`pages/filter-result/index.ts`：可能需要在计划阶段复核 from 参数、返回逻辑和非会员结果承接行为是否和新入口判定一致。

## Recommended Next Action

建议进入 `generate_plan`。当前信息足以支持后续实现计划，无需人工补充核心事实。

建议后续计划聚焦以下修复方向：

1. 抽出唯一的“精准搜索入口决策”能力，统一供首页、消息页及相关记录入口复用，避免再次出现页面间分叉逻辑。
2. 入口决策不要只依赖当前内存中的 `filterResultList`；至少需要覆盖“已保存筛选条件”“最近一次精准搜索历史存在”“非会员已用搜索机会”这几类状态。
3. 处理 `utils/filter-flow.ts` 当前未完成的问题：要么实现 `recommendStore.refreshLatestFilterSearchHistory` 及其服务层封装，要么用已存在的正确数据源改写该工具。
4. 修复后重点验证 4 类路径：
   - 非会员首次从消息页进入精准搜索，应进 `pages/filter/index`
   - 非会员已搜索过一次后，再从消息页进入，应进 `pages/filter-result/index`
   - 首页与消息页在同一账号、同一状态下行为一致
   - 冷启动后再次进入，行为仍一致，不依赖单次会话内存态
