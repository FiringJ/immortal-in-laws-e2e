# Triage
- readiness: needs_human
- source_quality: low
- next_action: manual_triage
- normalized_title: 资料编辑页：多个资料项交互/弹框与 UI 稿不一致
## Cleaned Problem
- 缺陷可归一为：`pages/profile-edit/index` 中“资料编辑页”多个资料项的触发方式、弹框形态或弹框内容与设计稿不一致。
- 当前源码显示页面混用了原生 `picker`、自定义文本编辑全屏弹层、照片引导/上传弹层、择偶条件多选弹层；但原始描述没有指出具体是哪几个字段异常，也没有给出现状/期望差异。
- 由于同批次已拆出更具体子问题（首次上传照片引导、滚筒下拉框样式/交互），这条更像“父问题/总括问题”，不能直接进入实现计划，否则容易重复或误改。

## Source Quality
- 原始信息只有一句泛化描述，无附件、无截图、无操作步骤、无具体字段名称。
- 飞书源数据中 `attachments: []`，无法从现有工单直接定位到对应 UI 图或复现证据。
- 问题描述同时包含“交互能力”和“交互弹框”两个维度，范围过大，无法判断是视觉问题、交互逻辑问题，还是字段编辑权限/能力问题。

## Product Context
- 路径属于 `我的 -> 预览资料 -> 编辑资料` 维护流，页面为 `pages/profile-edit/index`。
- 页面分组包含：孩子照片、联系方式、基本信息、更多信息、相亲说明、择偶标准。
- `docs/prd-todo.md` 已将该页拆成 `PEDIT-01` 到 `PEDIT-08` 多个验收点，覆盖头像、家长资料、孩子基础资料、详细资料、照片、择偶标准、AI 帮填。
- `design/3.设计稿/` 下存在 20+ 张 `神仙亲家-我的-相亲资料-*-弹窗1.png`，说明该页多个字段都有单独的设计态，而不是统一复用原生 `picker`。

## Technical Context
- 实现集中在 `pages/profile-edit/index.ts`、`pages/profile-edit/index.wxml`、`pages/profile-edit/index.wxss`。
- 当前 `index.wxml` 仍包含 19 个 `<picker>`，覆盖关系、性别、出生年份、身高、现居地、家乡、学历、收入、房车、宗教、民族、体型、属相、婚姻状态、婚期、年份要求、身高要求、择偶地区等。
- 当前页面只明确实现了 5 类自定义弹层：文本编辑、照片上传、照片示例引导、学历要求多选、收入要求多选。
- Tracker 仓库已有静态 probe：
  - `src/tools/probes/profile-edit-interaction-static-probe.ts`：校验称呼/职业/毕业院校改为自定义文本编辑。
  - `src/tools/probes/profile-edit-first-photo-guide-static-probe.ts`：校验首次无照片时先弹照片引导层。
- 上述两类 probe 已通过，说明这两个已知交互点大概率已落地；剩余风险更集中在仍使用原生 `picker` 的字段和其视觉/联动逻辑。
- `services/user.ts` 负责资料读取、保存和照片上传；若“交互能力不一致”实际包含可编辑性或保存行为，也可能需联查此文件。

## Missing Context
- 具体是哪些字段有问题？需明确字段名，例如“孩子性别/婚姻状态/房车/年份要求”等。
- 每个字段的“当前行为”与“期望行为”分别是什么？例如：是否应由原生 `picker` 改为自定义底部弹层、是否需要多选、是否有默认值/禁用态/联动限制。
- 是否仅是视觉稿不一致，还是包含业务规则不一致（默认选中、不限逻辑、范围联动、可编辑限制）？
- 该工单是否应作为父问题关闭/拆分，并与以下已独立成项的问题去重：
  - `bug_c8b0ad4d605c` 上传无人脸照片英文报错
  - `bug_8d618b6c9f9b` 首次上传照片应先弹引导层
  - `bug_1882b361f30f` 滚筒下拉框样式和交互需对照截图实现
- 缺少截图、设计节点/Figma node、或至少“图 1/图 2”对照，当前无法无猜测地比对全页。

## Likely Surfaces
- `pages/profile-edit/index.wxml`
- `pages/profile-edit/index.ts`
- `pages/profile-edit/index.wxss`
- `services/user.ts`
- `docs/prd-todo.md`
- `design/3.设计稿/神仙亲家-我的-相亲资料-*-弹窗1.png`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/profile-flow-probe.ts`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/profile-edit-interaction-static-probe.ts`
- `/Users/firingj/Projects/immortal-in-laws-e2e/src/tools/probes/profile-edit-first-photo-guide-static-probe.ts`

## Recommended Next Action
- 进入人工补充/拆单，而不是直接生成实现计划。
- 先向提报人或产品补齐：
  1. 具体异常字段清单；
  2. 每个字段的当前表现 vs 期望表现；
  3. 对应截图或设计图文件名/Figma 节点；
  4. 是否仅改视觉，还是连同交互规则一并调整。
- 若补充后发现只是“滚筒下拉框统一改造”，建议将本工单并入/关联 `bug_1882b361f30f`；若包含照片或文本编辑问题，则与现有子问题拆分去重后再分别生成计划。
- 只有在字段范围、对照图和去重关系明确后，才建议进入 `generate_plan`。
