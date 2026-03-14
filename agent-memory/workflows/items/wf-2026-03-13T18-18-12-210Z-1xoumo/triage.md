# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 实名认证成功后重新进入已认证页时姓名和身份证号消失
## Cleaned Problem
- 缺陷发生在 `pages/realname-auth/index` 的“已完成实名认证”状态页。
- 现象：用户完成实名认证后，离开实名页并再次进入已认证状态页，页面仍显示“已完成实名认证”，但“真实姓名”“身份证号”字段变成 `--`。附件 `/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_b1defc9f1265/image.png` 已直接显示该状态。
- 期望：重新进入已认证页时，仍显示此前认证成功的姓名和脱敏身份证号，表现应与首次认证完成后保持一致，而不是丢失为占位符。

## Source Quality
- 质量判断为 `high`：原始描述同时给出了现象、期望结果、优先级 `P0`，并附带本地截图证据。
- 截图直接对应前端的 completed UI：页面底部按钮为“已完成实名认证”，且两个展示字段为空，说明这不是抽象“待测点”，而是可观察的现网/现包缺陷。
- 仓库内已能定位到实名 completed 页的展示绑定、实名认证状态查询、以及本地缓存/Store 回填逻辑，后续计划不需要再猜核心页面或模块归属。

## Product Context
- `agent-memory/page-topology.md` 显示 `pages/profile/index` 的“实名认证”入口会进入 `pages/realname-auth/index`；设置页里的“开启实名相亲”在未实名时也可能引导到同一路由，因此该页既是独立实名入口，也是设置能力的前置条件页。
- `docs/prd-todo.md` 中 `REAL-01` 的验收要求是“成功后返回并显示已实名；失败可重新认证”，与该缺陷的期望完全一致：认证成功后的回访/重进不应退化为空白展示。
- 设计目录中存在实名完成态与成功态稿件：`design/3.设计稿/神仙亲家-我的-实名认证-填写信息-已完成1.png`、`design/3.设计稿/神仙亲家-我的-实名认证-填写信息-认证成功1.png`。这说明产品上确实区分“认证成功过程页”与“已完成展示页”，后者应继续展示已认证信息而非 `--`。

## Technical Context
- `pages/realname-auth/index.wxml` 的 completed 态直接渲染 `{{displayRealName || '--'}}` 与 `{{displayIdCard || '--'}}`；只要页面未成功回填显示字段，就会立即暴露成截图中的 `--`。
- `pages/realname-auth/index.ts` 的 `initData()` 会先执行 `userStore.refreshProfile()`，再读取 `userStore.getRealnameInfo()`；若检测到实名认证已完成但当前 store 里没有实名详情，则继续调用 `fetchRealnameInfo()` 尝试回填 completed 页展示数据。
- `services/user.ts` 的 `fetchRealnameInfo()` 实际仍是请求 `/api/v1/verification/status`。但接口文档 `design/2.接口文档/接口文档.md` / `docs/默认模块.openapi.json` 对该接口定义的核心字段只有 `can_verify`、`need_pay`、`id_card_status`、`phone_status`、`verify_result`、`fail_reason`，并没有保证返回 `real_name` 或 `id_card_masked`。源码里已经写了“部分环境下状态接口只返回 verifyResult，不返回实名字段；优先回退到本地缓存”的注释，说明这里正是已知风险面。
- `store/userStore.ts` 会把 `realname_info` 持久化到本地，并在 `app.ts` 启动时恢复；但 `refreshProfile()` 只要拿到的 `fetchProfile()` 结果是 `isRealnameVerified=false`，就会把内存中的 `realnameInfo` 置空。这意味着 completed 页展示是否稳定，取决于资料接口实名布尔值是否及时同步，以及本地缓存是否仍可用。
- `services/api-mapper.ts` 对 `fetchProfile()` 使用的 profile preview/detail 数据只映射 `isRealnameVerified` 布尔值，并不会把实名姓名/身份证号映射进 `MyProfile`。因此当 store 详情被清掉后，页面不能依赖 profile 数据重新恢复姓名和身份证号。
- 综上，缺陷的高概率根因面是：已认证页依赖的姓名/身份证号详情没有稳定的后端读取源，当前实现主要靠本地 `realname_info` 兜底；一旦 `refreshProfile()`、页面重进时序、或缓存丢失让这份兜底数据不可用，completed 页就会退化成 `--`。

## Missing Context
- 仍需在计划阶段确认缺陷的触发边界：
  - 仅在同一次会话里“离开实名页再返回”发生；
  - 还是小程序冷启动 / 重新登录后再次进入也会发生。
- 需要补一轮运行态证据，确认当问题出现时：
  - `/api/v1/profile/child/{child_id}/preview` 返回的 `is_real_name` 是否短暂为 `false`；
  - `/api/v1/verification/status` 在该环境下是否确实不返回 `real_name` / `id_card_masked`。
- 这些都是实现层确认项，不构成当前 triage 的阻塞，因为页面、症状、数据依赖面已经足够明确。

## Likely Surfaces
- `pages/realname-auth/index.ts`
- `pages/realname-auth/index.wxml`
- `services/user.ts`
- `store/userStore.ts`
- `services/api-mapper.ts`
- `pages/profile/index.ts`

## Recommended Next Action
- 进入 `generate_plan`。
- 计划应优先覆盖三件事：
  1. 复现并记录 completed 页在“返回重进”和“冷启动重进”两个路径下的实名信息回填行为；
  2. 加固已认证页的数据来源，避免 completed 展示依赖一个通常不返回姓名/证件号的状态接口；
  3. 检查 `refreshProfile()` 对 `realnameInfo` 的清理时机，避免在实名已完成但资料布尔值短暂不同步时把本地实名详情提前清空。
- 当前材料已经包含清晰缺陷描述、截图证据、产品意图、技术表面和初步根因方向，可直接进入后续计划阶段，无需先做人工澄清。
