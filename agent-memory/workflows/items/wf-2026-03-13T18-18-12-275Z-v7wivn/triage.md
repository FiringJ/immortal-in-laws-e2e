# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 精准查找页默认选中态错误：仅年份和身高应默认“不限”，其他条件应默认不选中
## Cleaned Problem
`pages/filter/index` 的默认态与产品预期不一致。当前反馈指出：进入精准查找页时，多个筛选组会默认处于已选中状态，其中“不限”被默认选中；截图还显示地区项存在默认选中地区。期望行为是：只有“年份要求”和“身高要求”默认展示为“不限”，其余离散选项组——至少包括学历、地区、收入、婚姻、房产、购车——初始都应为未选中状态。缺陷描述同时说明“选中后的交互无误”，因此问题范围集中在页面初始化/重置时的默认选中态，而不是用户手动点选后的交互逻辑。

## Source Quality
- 飞书原始缺陷直接给出了“当前行为 vs 正确行为”的对比，明确指出只有年份和身高允许默认“不限”，并附带了页面截图，问题表达本身比较清晰。
- 但原始信息没有明确“默认”对应的是哪一种进入条件：首次打开筛选页、清空历史条件后进入、点击“重置”后，还是带有本地缓存条件时重新进入；这会影响后续修复边界。
- 截图能证明页面存在默认选中异常，但不足以单独判定所有选中态都来自同一代码路径，尤其当前仓库源码与已生成 `.js` 存在差异，因此 `source_quality` 评为 `medium`。

## Product Context
- 页面拓扑显示精准查找主入口为 `pages/index/index -> 精准查找 -> pages/filter/index`；若存在已保存筛选条件，则可能先进入 `pages/filter-result/index`，再通过“条件设置”回到 `pages/filter/index`。
- 该页是精准搜索链路的条件配置页，默认态会直接影响用户首次搜索的感知，也会影响“未操作即带条件搜索”的结果可信度。
- 现有前端校验要求提交前必须选择地区；如果本缺陷按描述修正为“地区默认不选中”，用户首次搜索时将需要显式选择地区，这与缺陷描述本身是一致的，但会改变当前首屏顺手程度，后续计划中应把这点纳入验证。
- 该缺陷优先级为 P0，属于搜索入口的默认行为错误，适合进入计划阶段处理。

## Technical Context
- 主要实现面在 `pages/filter/index.ts`。页面数据模型中，年份/身高范围默认文本就是 `'不限'`，而学历、收入、婚姻、房产、购车等选项使用数组维护选中值，并通过 `syncOptionStates()` 把数据态映射为 UI 选中态。
- `pages/filter/index.ts` 的“无历史条件”路径会调用 `buildRegionOptions()` 和 `resolveSelectedCity()`，随后把 `cities` 直接设置为当前城市/偏好城市；`onReset()` 也会重新走同样的地区默认选中逻辑。这与缺陷中“除年份和身高外其余项默认不选中”的要求明显冲突，地区项是当前最明确的命中面。
- “不限”本身作为各组选项常量的一部分定义在 `config/constants.ts`，UI 渲染由 `components/pages/filter/filter-card/index.wxml` 根据 `item.active` 决定。若后续需要统一“空数组 ≠ 默认选中不限”的语义，优先应在页面初始化状态和 `syncOptionStates()` 的派生逻辑收敛，而不是在组件层硬改样式判断。
- `store/recommendStore.ts` 会把 `filter_requirements` 持久化到本地存储并在下次进入时恢复；因此排查和验证时必须区分“真正的默认空白态”与“恢复上次筛选条件”两条链路。
- 当前仓库存在额外实现风险：`pages/filter/index.ts` 与已生成的 `pages/filter/index.js` 明显不同步。`.ts` 中已经引入 `educationUnlimitedSelected` / `incomeUnlimitedSelected` 等显式标记，但 `index.js` 仍保留旧版“把 `unlimited` 当成实际选中值写入数组”的逻辑，且文件内可见未清理的冲突标记片段。后续修复即使只改 `.ts`，也必须重新 `npm run build` 并验证生成产物是否与源码一致，否则运行态现象可能继续偏离源码判断。

## Missing Context
- 仍缺少一个被产品/测试确认的标准复现场景：应以“无历史筛选条件的新开页面”为准，还是“点击重置后的页面状态”也必须完全一致。当前代码这两条路径都参与默认态构造，但缺陷原文没有显式拆分。
- 缺少对“恢复历史筛选条件”链路的产品口径：如果用户上次保存过空数组/不限类条件，重新进入时是否应该恢复历史选中，还是仍按新的默认空白态展示。
- 缺少一轮真实运行态证据来确认截图对应的是 `.ts` 源码行为、旧的已生成 `.js` 行为，还是缓存恢复导致的结果；不过这不会阻止进入计划阶段，因为主要代码面已足够明确。

## Likely Surfaces
- `pages/filter/index.ts`
  - `onLoad()`：无历史条件时的默认态装配。
  - `buildRegionOptions()` / `resolveSelectedCity()` / `updateUserCity()`：地区项被自动预选的主要来源。
  - `onReset()`：重置后是否仍错误地重新选中地区或“不限”。
  - `syncOptionStates()`：空值如何映射为 UI 是否高亮“不限”。
- `store/recommendStore.ts`
  - `initFromStorage()` / `getFilterRequirements()` / `clearFilterRequirements()`：区分默认态与历史恢复态。
- `config/constants.ts`
  - 各筛选组选项中都包含 `unlimited` 选项，是默认语义与展示语义的共同来源。
- `components/pages/filter/filter-card/index.wxml`
  - 纯渲染层，负责把 `active` 状态映射为红框高亮，可作为验证面但不像根因。
- `pages/filter/index.js`
  - 运行态生成文件当前与 `.ts` 不一致，是后续修复落地与验证时必须同步确认的高风险面；不应手改，但必须通过构建刷新。

## Recommended Next Action
建议进入 `generate_plan`。

后续计划建议明确以下执行边界：
- 先定义“默认态”的唯一口径：至少覆盖“无已保存筛选条件首次进入”和“点击重置后”两条路径。
- 把年份、身高保留为默认“不限”，其余条件默认改为未选中，并重点处理地区不再自动带入当前城市。
- 保持用户手动点选后的交互逻辑不变，只修初始化与重置链路。
- 修复后执行 `npm run build`，并分别验证“无缓存首次进入”“已有历史条件恢复进入”“点击重置后”三种场景，避免源码与生成产物再次偏离。
