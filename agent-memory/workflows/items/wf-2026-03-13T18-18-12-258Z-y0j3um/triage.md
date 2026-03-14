# Triage
- readiness: needs_human
- source_quality: medium
- next_action: manual_triage
- normalized_title: 首次进入小程序应以游客身份进入首页，完成注册流程后才登录
## Cleaned Problem
当前小程序首次冷启动会先落到 `pages/login/index`，页面主 CTA 直接拉起微信手机号授权，并在授权成功后立即调用 `/auth/login` 完成登录/注册，再跳转首页。根据现有 PRD，正确行为应是：除分享进入等特殊入口外，新用户首次进入应先以游客身份落到首页；只有当用户主动触发注册流程，并完成“性别 → 出生年份 → 身高 → 学历 → 月收入 → 现居地 → 手机号授权”后，才算注册成功并进入完整登录态。当前实现把“首次进入”“手机号授权”“完成登录”合并为一步，同时缺少游客首页和游客入口拦截链路。

## Source Quality
- 原始飞书缺陷已经给出“期望行为 vs 当前行为”的核心差异，优先级为 `P0`，模块指向清晰，不是纯体验建议。
- 来源文案中的“分享除法”明显更像“分享除外”的笔误；同时没有截图、录屏、测试账号、微信场景值或更细复现步骤，因此原始证据本身不算完整。
- 但仓库内 PRD、待办拆解和当前代码实现能互相印证：期望侧确实是“游客先进入，再完成注册”；当前实现侧确实是“一键手机号直接登录”。
- 仍然缺少“分享例外如何判定”“游客首页具体能看什么”“这次是否要同时补齐完整注册向导”等边界信息，所以 `source_quality` 评为 `medium` 而不是 `high`。

## Product Context
- PRD `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 明确写到：新用户只有在 6 项资料填写完成且完成微信手机号授权后，才算注册成功；否则应以游客状态进入小程序。
- 同一段 PRD 还写到：当性别未填写时，游客点击小程序内任一入口或按钮，应进入性别选择页；另一个项目文档 `docs/飞书验收问题修复方案.md` 则把它落成“游客点击特定入口弹提示”。这说明游客态并不是单独一个登录页，而是会影响首页、消息、我的等入口交互。
- `agent-memory/page-topology.md` 显示 `pages/index/index` 是首页推荐中心页，并承接精准查找、历史推荐、超级曝光等高频分流；若首次进入应先落首页，则影响范围天然不止 `pages/login/`，而是整个首页与入口触发链路。
- `docs/prd-todo.md` 已把注册登录拆成 `AUTH-01 ~ AUTH-07` 七个步骤，并全部落在 `pages/login/`，说明产品意图并不是保留一个单按钮授权页，而是完整的多步注册向导。

## Technical Context
- `app.json` 当前把 `pages/login/index` 放在 pages 数组首位，冷启动默认落到登录页，而不是首页。
- `pages/login/index.wxml` 当前只有一个 `open-type="getPhoneNumber"` 的主按钮；`pages/login/index.ts` 中的登录逻辑会在获取头像昵称与手机号授权后，直接调用 `services/auth.ts` 的 `wechatLogin()`，随后 `wx.switchTab('/pages/index/index')`。
- `services/auth.ts` 会在 `/auth/login` 成功后立刻写入 `token`、`refresh_token`、`user_id`、`family_id/child_id` 等登录态字段，说明前端当前走的是“立即建立真实登录态”的路径，而不是游客态缓存或半注册态。
- 后端 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/auth.go` 的 `LoginByWechat()` 会调用 `GetOrCreateUserByOpenID()`，并在新用户场景执行 `ensureDefaultProfile()`；这进一步确认 `/auth/login` 现在语义上就是“创建/获取正式用户并发 token”，不是游客会话。
- 首页本身并不支持未登录直接打开：`pages/index/index.ts` 在 `onLoad()` 里会立即 `loadData()`；`store/recommendStore.ts` 的 `refreshDailyRecommend()` 会请求 `/api/v1/recommend/daily`；后端 `/Users/firingj/Projects/GodQinJia/internal/apiserver/router.go` 又把 `/api/v1/recommend`、`/api/v1/profile` 都挂在 `authMiddlewares` 下。
- `utils/request.ts` 对 401 的处理是刷新 token，刷新失败则清空登录态并 `reLaunch('/pages/login/index')`。因此即使仅把启动页改成首页，当前未登录用户也会在首页请求受保护接口后被重新打回登录页。
- 结合以上代码现状，这个问题不是一个“调一下默认路由即可”的单点 bug，而是当前简化版一键登录实现与完整游客/注册 PRD 之间的结构性缺口。

## Missing Context
- “分享除外”需要具体定义：哪些 `scene`、分享卡片、邀请链路或参数属于例外，首次进入时应该落在哪个页面、是否仍允许直接授权登录。
- 游客首页的数据策略没有被钉死：游客进入首页后，是应该看到真实推荐数据、受限版推荐卡、还是只有静态壳页与引导文案？当前前后端都没有公开版首页接口。
- PRD里写的是“游客点击任一入口或按钮跳性别选择页”，修复方案摘要里写的是“游客点击特定入口弹‘您还未登记孩子的相亲资料’”。这两个规则粒度不同，需要产品确认本次以哪一个为准。
- 范围边界不清：本工单到底只修“首次进入不应直接登录”，还是要把 `AUTH-01 ~ AUTH-07` 的完整注册向导一起补齐。按现状看，后者几乎整体未实现。
- 若本次只做 P0 止血，还需要明确哪些入口可以先临时拦截，哪些能力可暂缓，否则计划阶段会默认猜测游客态路由矩阵。

## Likely Surfaces
- `app.json`
- `pages/login/index.ts`
- `pages/login/index.wxml`
- `pages/login/index.wxss`
- `pages/index/index.ts`
- `store/recommendStore.ts`
- `utils/request.ts`
- `services/auth.ts`
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/router.go`
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/auth.go`
- `design/1.需求文档/神仙亲家--小程序产品需求文档.md`
- `docs/prd-todo.md`
- `docs/飞书验收问题修复方案.md`

## Recommended Next Action
建议先走 `manual_triage`，不要直接进入 `generate_plan`。

- 先由产品/负责人明确本单范围：是收敛为“首开游客落首页 + 游客入口触发注册”，还是要求一并补齐完整 `AUTH-01 ~ AUTH-07` 注册向导。
- 明确“分享除外”的判定规则，以及游客状态下首页、消息、我的、详情、筛选等入口的允许/拦截矩阵。
- 明确游客首页的数据来源：复用现有推荐接口、补一个公开接口、还是先接受静态首页壳页方案。
- 如果只是 P0 止血，建议至少拆成两类后续任务：① 启动落点/游客态守卫；② 完整注册流程实现。否则单条计划会同时混合路由、鉴权、首页数据和注册向导四类改造。
- 在这些边界未确认前，直接生成修复计划会不可避免地猜测 guest data source、入口矩阵和 share 例外规则，风险较高；因此当前结论应为 `readiness: needs_human`。
