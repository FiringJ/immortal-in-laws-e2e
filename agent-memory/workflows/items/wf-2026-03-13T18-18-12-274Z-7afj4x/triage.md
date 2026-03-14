# Triage
- readiness: needs_human
- source_quality: medium
- next_action: manual_triage
- normalized_title: 精准查找购车要求选项与资料匹配口径不一致
## Cleaned Problem
缺陷聚焦于 `pages/filter/index` 的“购车要求”筛选项。按 PRD，筛选侧正确口径应为：
- 仅提供 2 个可选项：`不限`、`已购车/近期购车`。
- 用户资料侧仍保留 3 种车产状态：`已购车`、`近期购车`、`无车`。
- 当筛选项选择 `已购车/近期购车` 时，应同时匹配资料侧的 `已购车` 与 `近期购车`。
- 当筛选项为 `不限` 时，应放开为匹配 `已购车`、`近期购车`、`无车` 全部 3 类资料。

结合仓库 PRD、接口文档和当前源码，问题本质不是“资料侧枚举只有两项”，而是“筛选侧 UI 与请求映射必须把 2 项择偶口径正确折叠到 3 项资料口径上”。

但当前 triage 发现：应用仓库里这条核心逻辑已经基本落地，且已有静态探针通过，因此该工作单更像“待发版验证 / 需确认是否重复单”而不是新的待实施编码项。

## Source Quality
优点：
- 原始描述已经明确给出正确口径：筛选侧 2 项、资料侧 3 项、以及二者的匹配关系。
- 附件截图能作为期望态参考，指向“购车要求”区域。
- 仓库内 PRD 与接口文档都能交叉验证该需求，不需要靠主观猜测补全业务规则。

不足：
- 附件更像“参考图 / 期望态”，没有直接展示“当前错误态”到底是多出选项、错误匹配，还是仅文案不对。
- 飞书状态已是“待发版验证”，且代码仓库已有相同方向修复痕迹，说明该单可能是已修复待验证、重复拆分项，或和当前待发版包版本不一致。
- 缺少实际复现环境信息（测试包版本、复现路径、失败请求样本），无法仅凭工单判断线上是否仍有回归。

综合判断：信息足以理解需求本身，但不足以直接推动新的实现计划，因此记为 `medium`。

## Product Context
该问题属于“首页 -> 精准查找 -> 择偶要求填写页”链路：
- 页面拓扑：`pages/index/index` 的“精准查找”入口进入 `pages/filter/index`，提交后进入 `pages/filter-result/index`。
- PRD 对筛选嘉宾明确规定：`购车要求项，含：不限、已购车/近期购车`，即筛选侧只有 2 个口径。
- 用户资料侧仍展示真实资料状态，仓库中的车产资料标签为：`已购车`、`近期购车`、`无车`。
- 因此产品语义是“筛选口径折叠资料口径”，而非“直接复用资料枚举作为筛选枚举”。

这也解释了为什么该单和房产要求单、婚姻要求单一起出现：它们都属于精准查找页中“择偶项口径需按 PRD 单独定义”的一组问题。

## Technical Context
已确认的前端实现与证据如下：
- 筛选选项定义：`config/constants.ts`
  - `FILTER_CAR_OPTIONS` 当前仅保留 `不限` 与 `已购车/近期购车` 两项，已符合 PRD。
- 筛选页交互：`pages/filter/index.ts` + `pages/filter/index.wxml`
  - `onCarToggle()` 已按单选逻辑处理车产要求。
  - `normalizeCarList()` 会把历史遗留值 `recent_purchase` 归一为统一的 `owned` 选项，说明兼容过旧数据。
- 请求参数映射：`services/guest.ts`
  - `buildMatchSearchCriteria()` 中 `car_status` 只发送 `0` 或 `1`。
  - 其中 `owned` 与 `recent_purchase` 都会映射为 `1`，正好对应“已购车/近期购车”折叠匹配。
- 类型与显示层：
  - `types/guest.ts` 中资料枚举 `CarStatus` 仍保留 `owned / recent_purchase / none` 三态，符合资料侧语义。
  - `config/labels.ts` 中 `MATE_CAR_LABELS` 已存在统一标签 `已购车/近期购车`，说明项目里已区分“资料标签”和“择偶标签”。
- 静态验证：
  - 运行 `npx tsx src/tools/probes/filter-car-criteria-static-probe.ts` 已通过，探针明确检查了“仅两项”“历史值归一”“请求继续兼容映射”三件事。

补充观察：
- `pages/filter-result/index.ts` 的条件摘要仍使用 `CAR_LABELS` 渲染 `requirements.car`，而不是使用 `MATE_CAR_LABELS` 或单独的 display label。若后续有人继续处理这条链路，需要额外确认结果页标签是否应显示为 `车产已购车/近期购车`，避免 UI 文案仍落回 `车产已购车`。
- `types/guest.ts` 中 `FilterRequirements.car?: CarStatus[]` 注释仍写的是“可多选”，这更像历史类型漂移，不一定影响当前运行，但会增加后续误解成本。

## Missing Context
进入真正实施前，仍缺以下关键信息：
- 这条工单对应的“失败版本/测试包”具体是哪一个？当前源码已经满足核心规则，需确认缺陷是否只存在于未发版包。
- 当前工单是否是之前总问题“婚姻/房产/购车要求应按 PRD 修正”的拆分子项或重复项？
- 真实失败现象究竟是哪一种：
  - 仍出现多余选项；
  - 请求过滤结果不正确；
  - 结果页摘要标签文案不一致；
  - 还是仅待回归验证。
- 若测试同学仍能复现，需要补充失败截图或失败请求日志，明确是 UI 层还是接口筛选层问题。

## Likely Surfaces
如果后续确认仍需处理，最可能相关的代码面如下：
- `config/constants.ts`
- `pages/filter/index.ts`
- `pages/filter/index.wxml`
- `services/guest.ts`
- `config/labels.ts`
- `pages/filter-result/index.ts`（结果页文案/摘要的相邻风险面）
- `types/guest.ts`（类型注释与单选语义漂移）

高价值对照物：
- `design/1.需求文档/神仙亲家--小程序产品需求文档.md`
- `design/2.接口文档/接口文档.md`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/filter-car-criteria-static-probe.ts`
- `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/ralph-loop-run-log.md`

## Recommended Next Action
建议先走 `manual_triage`，不要直接进入新的编码计划。

建议动作：
1. 由人工确认该工单是否对应未发版测试包、是否为重复/拆分项。
2. 若当前待验证包仍可复现，补充失败截图或请求日志，明确失败点是在“筛选项数量”“筛选结果映射”还是“结果页文案”。
3. 若只是发版前回归项，可直接转为验证任务；若确认是新回归，再进入计划生成。

结论：本单需求语义本身很清楚，但当前仓库已经具备核心实现且静态探针通过，因此 `readiness=needs_human` 更合适，下一步应先做人工核验，而不是再次生成实现计划。
