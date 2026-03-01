# Figma MCP 方案：获取标注数据

用 **Figma 官方 MCP Server** 通过「链接 + 工具调用」获取设计标注，替代旧的 spec 提取和 OS 点击方案。

## 为什么用 MCP

| 方式 | 问题 |
|------|------|
| 旧 spec / 本地 JSON | 容易过期，且与当前设计稿脱节 |
| OS 级点击 Figma 页面 | 点击不够精准，错误率高 |
| **Figma MCP** | 无需坐标点击；用 Figma 链接 + 工具调用拿设计数据，不受 REST 限流影响（走 OAuth） |

## 在 Cursor 里启用 Figma MCP

1. 打开 Cursor 的 MCP 安装入口：  
   [cursor://anysphere.cursor-deeplink/mcp/install?name=Figma&config=eyJ1cmwiOiJodHRwczovL21jcC5maWdtYS5jb20vbWNwIn0%3D](cursor://anysphere.cursor-deeplink/mcp/install?name=Figma&config=eyJ1cmwiOiJodHRwczovL21jcC5maWdtYS5jb20vbWNwIn0%3D)
2. 点 **Install**，再点 **Connect** 完成 Figma OAuth 登录。
3. 安装并连接后，Agent 即可调用 Figma MCP 的 tools。

或手动写配置（例如项目级）：在 `.cursor/mcp.json` 中增加：

```json
{
  "mcpServers": {
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

然后重启 Cursor，并在 MCP 面板里对 Figma 做一次 Connect / 登录。

## MCP 提供的与标注相关的工具

- **get_design_context**：根据「画板/图层链接」拉取设计上下文，包含布局与样式；可指定输出为 HTML+CSS 等，便于对照写 wxss。
- **get_metadata**：返回选中范围的稀疏 XML（节点 id、名称、类型、位置、尺寸），适合先看结构再对关键节点调 `get_design_context`。
- **get_variable_defs**：返回选中范围内用到的变量与样式（颜色、间距、字重等），适合做设计 token 与 wxss 变量对齐。
- **get_screenshot**：对当前选中范围截图，辅助核对还原效果。

官方说明：<https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/>

## 推荐工作流（消息页等改样式）

1. 在 Figma 中选中目标画板或图层（如「神仙亲家-消息1」），复制链接（链接里会带 `node-id=xxx`）。
2. 在 Cursor 里对 Agent 说：「用 Figma MCP 获取这个链接的设计标注，并据此修改 `pages/message/index.wxss`」。
3. Agent 会调用 `get_design_context`（或先 `get_metadata` 再按需 `get_design_context`），拿到字号、颜色、间距等，再按 750 画板 1px=1rpx 的约定写入 wxss。
4. 用 E2E agent 或真机/模拟器截图验证点击与样式（避免再用不精准的坐标点击）。

## 批量页面：先拿标注再修样式

**约定：所有页面（含后续批量）均须先通过 Figma MCP `get_design_context` 获取准确标注，再基于该标注修改对应 wxss。** 不再使用旧的本地 spec、Lanhu、auto-style-fix 或历史提取脚本作为样式来源。

流程如下：

0. **先看状态台账**：页面基线和当前完成情况统一记录在 `figma/data/figma-restoration-status.yaml`。后续只对其中 `status: pending` 的页面继续做还原和校对；完成后把对应页面改为 `completed`。

1. **页面与节点映射**：`figma/data/figma-page-mapping.json` 中已维护各页面路由与 Figma `fileKey`、`nodeId` 的对应关系。**fileKey 以 mapping 为准**（当前为 `EpzS4EPvKTGBUIpwc5uPkp`）；若你的设计文件链接是其他 fileKey，请修改 mapping 中的 `fileKey`。
2. **逐页拉取标注**：对每个需要修复的页面，调用 **get_design_context**：
   - `fileKey`: 从 `figma-page-mapping.json` 的 `fileKey` 字段取
   - `nodeId`: 从 mapping 中该页面对应的 `nodeId` 取（如 `110:21`）
   - 参数：`clientFrameworks: "wechat-miniprogram"`, `clientLanguages: "css,wxml"`
3. **解析并修 wxss**：根据 MCP 返回的布局与样式（字号、颜色、圆角等），按 **750 画板 1px = 1rpx** 写入对应页面的 wxss（路径：小程序根目录下 `pages/<route>/index.wxss`，route 中 `/` 对应一层目录）。
4. **验证**：用 E2E 截图或真机核对效果。
5. **与 UI 稿视觉比对（必做）**：仅断言通过不足以判断还原度，必须与 Figma 设计稿并排对比后再收尾：
   - 用 Figma MCP **get_screenshot**（同一 `fileKey` + 该页 `nodeId`）拉取设计稿截图；若工具返回的图片可另存，保存为 `screenshots/figma-<页面简名>.png`（如 `figma-history.png`）。
   - 用 E2E agent **screenshot** 对当前模拟器该页截图，保存到 `screenshots/`（如带时间戳的 `*__mcp__*.png`）。
   - 在浏览器中打开 **`figma/docs/design-vs-implement-compare.html`**，在页面内填写或通过 URL 参数传入两个截图路径（相对 `screenshots/`），左右并排对比设计稿与当前实现。
   - 对比标题/正文字号、颜色、圆角、间距、底部栏渐变与按钮样式等，列出差异并回头改 wxss；热重载后重新截图、再对比，直到还原度达标。

## 本地存储约定

- 旧的页面级 spec 和相关脚本已清理，不再作为可信标注来源。
- 后续如需本地存储或备份，只能保存**当次通过 Figma MCP 新获取**的数据。
- 页面是否已经完成还原/校对，以 `figma/data/figma-restoration-status.yaml` 为准。

### 批量页面 MCP 调用清单

以下为 mapping 中的页面与 MCP 调用参数，Agent 应**按此清单逐页调用 get_design_context 后再修样式**。实际推进时，以 `figma/data/figma-restoration-status.yaml` 的状态为准，优先处理 `pending` 页面（清单生成自 `figma-page-mapping.json`，可用 `npx tsx figma/data/figma-mcp-pages-list.ts` 重新生成）：

| 页面 route | nodeId | wxss 路径（小程序根目录） |
|------------|--------|---------------------------|
| pages/index/index | 103:1082 | pages/index/index.wxss |
| pages/login/index | 381:1258 | pages/login/index.wxss |
| pages/message/index | 463:136 | pages/message/index.wxss |
| pages/guest-detail/index | 110:21 | pages/guest-detail/index.wxss |
| pages/filter/index | 124:1699 | pages/filter/index.wxss |
| pages/filter-result/index | 124:2484 | pages/filter-result/index.wxss |
| pages/history/index | 129:146 | pages/history/index.wxss |
| pages/chat/index | 159:1169 | pages/chat/index.wxss |
| pages/profile/index | 211:80 | pages/profile/index.wxss |
| pages/profile-edit/index | 175:1082 | pages/profile-edit/index.wxss |
| pages/profile-preview/index | 183:1603 | pages/profile-preview/index.wxss |
| pages/member-center/index | 211:1708 | pages/member-center/index.wxss |
| pages/exposure/index | 382:118 | pages/exposure/index.wxss |
| pages/settings/index | 188:392 | pages/settings/index.wxss |
| pages/beans/index | 270:74 | pages/beans/index.wxss |
| pages/realname-auth/index | 236:553 | pages/realname-auth/index.wxss |
| pages/invite/index | 333:139 | pages/invite/index.wxss |
| pages/settings-blocked/index | 149:3005 | pages/settings-blocked/index.wxss |
| pages/settings-orders/index | 198:1183 | pages/settings-orders/index.wxss |

调用示例（以聊天室为例）：`get_design_context(fileKey: mapping.fileKey, nodeId: "159:1169", clientFrameworks: "wechat-miniprogram", clientLanguages: "css,wxml")`，再根据返回内容修改 `pages/chat/index.wxss`。

若 MCP 返回的是 **plans-access-and-permissions 文档链接**而非设计数据，说明当前 Figma MCP 受权限/套餐限制，无法返回标注。请检查：

- Figma 账号是否已连接 MCP（Cursor MCP 面板中 Figma 是否已 Connect）
- 是否需升级 Figma 套餐或开通 MCP 相关权限
- 当前节点链接是否正确，且包含 `node-id`

## Figma MCP 调用限制

### Figma MCP 限制（官方文档：<https://developers.figma.com/docs/figma-mcp-server/plans-access-and-permissions/>）

| 计划/座位 | 每日上限 | 每分钟上限 |
|-----------|----------|------------|
| Starter 或 View/Collab 座位 | **6 次/月** | — |
| Pro / Organization + Full 或 Dev | **200 次/天** | 10/min (Starter)、15/min (Pro)、20/min (Org) |
| Enterprise + Full 或 Dev | **600 次/天** | 同上（按资源所在计划） |

- **豁免工具**（不计入限额）：`whoami`、`generate_figma_design`、`add_code_connect_map`。
- **额度按「访问的文件所在计划」计**：即使用 Enterprise Full 的 token，访问 Starter 计划里的文件，MCP 仍按 6 次/月。
- 超限后需升级座位（View/Collab → Full/Dev）或计划以提升额度。

#### 怎么判断「被访问文件所在计划」

文件的计划 = **该文件所在团队（Team）或组织（Organization）的订阅计划**，不是你的账号计划。文件在某个项目里，项目属于某个团队，团队有 Starter / Professional / Organization / Enterprise。

**在 Figma 里怎么看：**

1. **左侧边栏**  
   - 若是 **All projects**：说明你在用「按团队」的结构。点进 **All projects**，看团队名旁边有没有 **Professional** 标签；没有且底部也没有 Education 横幅 → 该团队是 **Starter**（免费）。  
   - 若是 **All teams** 或 **All workspaces**：说明是 **Organization** 或 **Enterprise**（All workspaces = Enterprise）。

2. **具体某个文件**  
   文件在某个项目下，项目属于某个团队 → 该团队的计划就是「被访问文件所在计划」。你打开的文件属于哪个团队/项目，在文件浏览器里看项目/团队层级即可。

3. **别人分享的链接**  
   你通过链接打开的文件，仍然属于**创建者所在团队**的计划。你用 MCP 或 REST 访问该文件时，限额按**那个团队的计划**算（例如对方是 Starter，你就只有 6 次/月）。

参考：<https://help.figma.com/hc/en-us/articles/28598881240087-Which-plan-am-I-on>。

#### 免费套餐具体额度（Starter 或 View/Collab）

| 项目 | 具体数值 |
|------|----------|
| **MCP 工具调用** | **6 次/月**（总计，非每日） |

免费套餐下做批量拉取会很快用尽，建议按 `figma-restoration-status.yaml` 逐页推进；长期用需 Pro/Org + Full 或 Dev 座位（200/天 MCP）。

### Figma Dev Mode 是什么

**Dev Mode**（开发模式）是 Figma 里面向开发者的**只读界面**，用来做设计到代码的交接，不是 API/MCP 的替代品。

- **作用**：在 Figma 内查看标注、盒模型、样式列表、多语言代码片段（CSS/React 等）、导出切图、标注「Ready for dev」、与 VS Code 插件联动等；支持 Code Connect（把设计组件映射到代码组件，仅 Org/Enterprise）。
- **谁能用**：**所有付费计划**（Pro / Organization / Enterprise），且账号需为 **Full 座位**或 **Dev 座位**。免费 Starter 或仅有 View/Collab 座位无法使用 Dev Mode。
- **Dev 座位 vs Full 座位**：
  - **Full**：完整设计编辑权限，价格更高。
  - **Dev**：仅开发相关能力（Dev Mode、检查、导出等），不能编辑设计，约 **$15/月**，比 Full 便宜。
  - 在 **API / MCP 额度上**，Dev 与 Full 待遇相同（例如 Pro/Org 下都是 200 次/天 MCP、同一套每分钟限制）。

参考：<https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode>、<https://figma.com/dev-mode>。

## 注意

- **Remote MCP** 必须用「链接」指定节点，不能像桌面版那样依赖「当前选区」。所以一定要复制带 `node-id` 的 Figma 链接。
- 画板宽度以设计稿为准（如 750px），标注中的 px 与小程序 rpx 的换算在 skill / 规则里已约定（如 1px = 1rpx）。
