# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 相亲资料页移除“户籍”资料项
## Cleaned Problem
飞书缺陷反馈“户籍项已去掉，辛苦在资料页去掉该资料项”。附件截图显示 `相亲资料` 页面基础信息区仍外显一行 `户籍：浙江省杭州市萧山区`，与当前产品口径“神仙亲家不再展示/填写户籍”不一致。期望是资料页基础信息仅保留 `现居`、`家乡` 等字段，不再显示 `户籍`。

## Source Quality
- 有 1 张直接截图，问题点明确，能看到目标字段、页面标题和页面结构。
- 原始文字中的“资料页”未明确是 `pages/guest-detail/index` 还是 `pages/profile-preview/index`，但截图样式更接近 `pages/guest-detail/index`（顶部返回、自定义导航、右侧实名角标、主卡片内“转发”按钮）。
- 缺少复现路径、账号信息、分支/构建版本，因此无法仅靠单句描述判断是源码回归还是线上/编译产物滞后。

## Product Context
- `agent-memory/page-topology.md` 显示资料相关链路集中在 `pages/guest-detail/index`、`pages/profile-preview/index`、`pages/profile-edit/index`。
- 截图页面标题为 `相亲资料`，属于资料展示链路，不是编辑页。
- 历史缺陷记录 `agent-memory/defect-reports/feishu-defects-latest.tsv` 已出现过同类口径：“区别于完美亲家，神仙亲家无‘户籍’填写项，故嘉宾详情页无此项外显”，说明当前产品口径已明确为不展示该字段。

## Technical Context
- 当前源码中未发现资料展示页仍显式渲染 `户籍`：
  - `pages/guest-detail/index.ts` 的基础信息仅组装 `年龄 / 学历 / 职业 / 现居 / 家乡`。
  - `pages/profile-preview/index.ts` 的资料预览基础信息仅组装 `年龄 / 学历 / 职业 / 现居 / 家乡 / 身高 / 收入`。
  - `pages/profile-edit/index.wxml` 也未提供 `户籍` 编辑项，只保留 `现居地` 与 `家乡`。
- `hukou` 数据链路仍残留在接口映射与类型中：
  - `services/guest.ts` 仍会从接口读取 `hukou_city_code / hukou_label` 并回填到 `detail.child.hukou`。
  - `types/guest.ts` 仍保留 `hukou?: string` 字段。
- Tracker 仓库已有对应静态探针，且当前源码通过：
  - `src/tools/probes/guest-detail-remove-hukou-static-probe.ts`
  - `src/tools/probes/profile-preview-remove-hukou-static-probe.ts`
- 历史运行日志 `agent-memory/defect-reports/ralph-loop-run-log.md` 已记录过一次“removed 户籍 field rendering from profile preview basic info”，说明这类问题可能是重复提报、回归，或运行环境未同步最新产物。
- 文档仍存在与产品口径不一致的陈旧描述，例如 `docs/实现现状分析.md` 仍写有“嘉宾详情‘户籍’字段暂用‘籍贯’替代”；PRD / OpenAPI 也仍保留 `hukou` 相关字段定义，可能继续误导后续实现或联调。

## Missing Context
- 缺少明确失败页面路由：是 `pages/guest-detail/index`、`pages/profile-preview/index`，还是某个旧编译页面。
- 缺少问题发生环境：开发工具本地、测试包、还是线上版本。
- 缺少最新运行时证据：当前仓库源码和静态探针均显示“已移除”，但附件截图显示“仍存在”，存在源码与运行态不一致的冲突。
- 缺少是否需要同步移除接口/类型层 `hukou` 残留字段的产品确认；当前缺陷只要求“资料页去掉该资料项”。

## Likely Surfaces
- `pages/guest-detail/index.ts`
- `pages/profile-preview/index.ts`
- `pages/profile-edit/index.wxml`
- `services/guest.ts`
- `types/guest.ts`
- `docs/实现现状分析.md`
- `src/tools/probes/guest-detail-remove-hukou-static-probe.ts`
- `src/tools/probes/profile-preview-remove-hukou-static-probe.ts`

## Recommended Next Action
进入 `generate_plan`。后续计划应优先：
1. 先做运行态核验，确认截图对应的实际路由和当前构建是否仍显示 `户籍`。
2. 若运行态仍有问题，优先排查 `pages/guest-detail/index` / `pages/profile-preview/index` 的源码与已编译 `.js` / 发布包是否存在不同步。
3. 若运行态已正常，则将该项转为“重复/已修复待发版验证”方向处理，并补清理陈旧文档或残留数据映射说明，避免后续再次误提。
