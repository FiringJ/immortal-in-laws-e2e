# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 系统消息入口点击无效，无法进入系统消息列表
## Cleaned Problem
消息页首屏存在单独的“系统消息”入口。当前缺陷反馈表明，用户点击该入口后没有产生预期结果；按产品意图，点击后应进入系统消息列表页，并能看到当前账号下已有的系统消息内容，而不是停留在原页或进入后无有效内容。该问题同时覆盖两层用户感知失败：一是入口点击无响应/无跳转，二是即使进入目标页，也未满足“展示相应系统消息”的核心目的。

## Source Quality
- 原始描述虽然简短，但核心现象明确：入口是“系统消息”，异常是“点击无效”，期望是“点击进去后有相应的系统消息”。
- 附件截图直接标出了消息页中的系统消息入口位置，能够准确定位到 `pages/message/index` 首屏对应区域，不属于模糊的体验建议。
- 仓库中已能找到对应入口页、目标页、消息 store 和接口封装，说明该问题不是“模块未实现”的纯产品需求，而是已有链路的实现/联调缺陷。
- 仍缺少最小复现步骤、测试账号状态、控制台日志和实际接口返回样例，因此 source quality 评为 `medium` 而不是 `high`。

## Product Context
- `agent-memory/page-topology.md` 已确认 `pages/message/index` 是消息主入口，当前截图也来自该页：顶部是“看过我的 / 收藏我的 / 解锁我的”金刚区，系统消息入口位于其下、精准搜索入口之上。
- 仓库路由 `app.json` 已注册独立页面 `pages/system-message/index`，说明产品意图不是把系统消息混入会话列表，而是提供单独的系统通知列表页。
- 系统消息属于消息中心的一级入口，若点击无效，会直接破坏高频消息路径；反馈优先级为 `P0`，可视为阻断类交互问题。
- 当前缺陷不依赖复杂业务前提：用户只需进入消息 tab 并点击系统消息入口即可触发，因此适合进入后续计划与复现阶段。

## Technical Context
- 消息页入口已在前端代码中显式实现：`pages/message/index.wxml` 存在 `bindtap="onSystemMessageTap"` 的 `.system-message-row`，`pages/message/index.ts` 中 `onSystemMessageTap()` 直接调用 `wx.navigateTo({ url: '/pages/system-message/index' })`。
- 目标页也已存在：`pages/system-message/index.ts` 会在 `onLoad()` 中调用 `messageStore.refreshMessageList()`，随后读取 `messageStore.getSystemMessages()` 渲染列表；`pages/system-message/index.wxml` 已具备加载态、空态和消息卡片列表结构。
- 系统消息数据链路已接通到接口层：`services/message.ts` 的 `fetchMessageList()` 会请求 `/api/v1/system-messages`，并通过 `store/messageStore.ts` 写入 `systemMessages`；目标页点击消息项时还会调用 `/api/v1/system-message/${messageId}/read` 标记已读。
- 因此前端仓库现状表明：该缺陷更像是“已有链路在真实运行时未生效”，而不是“没有页面/没有接口”。后续计划应优先排查三类面：
  1. 入口点击事件在真机/DevTools 运行态是否被遮挡、未触发或使用了陈旧编译产物；
  2. 跳转到 `pages/system-message/index` 后是否发生页面初始化异常或数据刷新失败；
  3. `/api/v1/system-messages` 当前账号是否返回空列表、字段不兼容，导致用户体感为“点击进去也没有相应消息”。
- 另有一个相邻数据风险值得记录：`services/api-mapper.ts` 的 `mapSystemMessageItem()` 当前用 `Boolean(item?.is_read)` 解析已读状态；若后端返回字符串 `'0'/'1'`，未读态会被错误映射为 `true`。这更偏向未读徽标/状态准确性问题，不足以单独解释“点击无效”，但建议在后续计划里顺手纳入校验范围。

## Missing Context
- 缺少一组可复现账号条件：当前账号是否本应存在系统消息、系统消息数量大约多少、是否只在某些账号下出现。
- 缺少运行时现象拆分：是“完全不跳转”，还是“跳转后白屏/空白/空列表”，还是“只能点击某些区域才生效”。
- 缺少控制台报错、网络请求记录和 `/api/v1/system-messages` 的真实返回样例，尚不能提前断言问题落在前端事件层还是接口数据层。
- 当前仓库基线 `npm run type-check` 失败于其他无关文件（`services/api-mapper.ts`、`utils/filter-flow.ts` 的现存问题），说明全局类型检查并不能作为本缺陷是否存在的判断依据，但不构成本次 triage 的阻塞。

## Likely Surfaces
- `pages/message/index.wxml`
  - 系统消息入口 DOM 和点击命中区域，需确认是否有布局覆盖、点击冒泡/拦截或可点区域异常。
- `pages/message/index.ts`
  - `onSystemMessageTap()` 的跳转逻辑，是“点击无效”最直接的入口代码面。
- `pages/system-message/index.ts`
  - 目标页初始化、消息列表加载、已读标记和 `actionUrl` 处理逻辑。
- `pages/system-message/index.wxml`
  - 空态/列表态切换逻辑，决定用户进入后是否能看到“相应系统消息”。
- `store/messageStore.ts`
  - `refreshMessageList()`、`getSystemMessages()` 和系统消息缓存更新。
- `services/message.ts`
  - `/api/v1/system-messages` 拉取、`/api/v1/system-message/{id}/read` 标记已读，是前端数据来源。
- `services/api-mapper.ts`
  - `mapSystemMessageItem()` 的字段映射，尤其是 `message_id / publish_at / created_at / is_read / link_url`。
- 后端消息接口（联调面）
  - `/api/v1/system-messages` 是否在当前环境返回非空列表、字段名是否与前端映射一致。

## Recommended Next Action
- 结论：该项可以直接进入 `generate_plan`，不需要先做人工澄清才能继续。
- 建议后续计划按“先复现、再分层收敛”执行：
  1. 在 DevTools/真机下复现系统消息入口点击，确认是“不跳转”还是“跳转但无数据”；
  2. 抓取点击时的控制台日志和网络请求，核对是否真正进入 `pages/system-message/index`、是否发起 `/api/v1/system-messages`；
  3. 若跳转正常但列表为空，优先检查接口返回和 `mapSystemMessageItem()` 字段映射；
  4. 若点击不触发跳转，优先检查消息页命中区域、覆盖层、构建产物同步和运行态事件绑定；
  5. 回归标准应至少包含：点击系统消息入口可稳定进入 `pages/system-message/index`，且当前账号存在系统消息时列表可见、消息项可打开/标记已读。
