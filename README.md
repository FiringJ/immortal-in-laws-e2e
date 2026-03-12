# Immortal In-Laws E2E - Message-Driven Agent System

一个基于消息驱动的 Agent 系统，用于自动化 Figma UI 还原任务。

## 核心理念

**不重复造轮子，让 Agent CLI 直接执行**

- ✅ 复用现有 MCP 工具（E2E Agent、Figma MCP）
- ✅ Daemon 接收消息后自动串行执行任务
- ✅ 支持 `codex`、`claude`、`cursor-agent` 三种 CLI executor
- ✅ 保留状态、日志、健康检查接口
- ✅ 任务结束自动回传飞书结果（默认仅飞书来源任务，优先 reply 原消息）

## 架构

```
远端消息（HTTP/飞书）
    ↓
Message Daemon（消息接收 + 执行器）
    ↓
串行任务队列
    ↓
codex / claude / cursor-agent CLI
    ↓
在本地工作区执行任务
    ├─ 直接改代码 / 跑命令
    ├─ 使用已有 MCP 工具
    └─ 输出摘要、日志、状态
```

## 快速开始

### 1. 启动 Daemon

```bash
npm run daemon
```

Daemon 监听 `http://localhost:3000`

### 2. 提交任务

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"task":"还原 pages/settings/index 页面的样式","agent":"codex"}'
```

### 3. 查看执行状态

```bash
curl http://localhost:3000/tasks
```

### 4. 飞书里直接选 Agent

飞书消息支持前缀选择 executor：

```text
/codex 修复 pages/settings/index 页面
/claude 分析为什么设置页布局错位
/cursor-agent 重构 daemon 文档
```

## 可用工具

### MCP 工具

已在 `.cursor/mcp.json` 中配置：

```json
{
  "mcpServers": {
    "e2e-agent": {
      "command": "npx",
      "args": ["tsx", "src/tools/mcp/e2e-mcp-server.ts"]
    },
    "figma": {
      "url": "https://mcp.figma.com/mcp",
      "type": "http"
    }
  }
}
```

### Probe 脚本

页面验证工具：
- `npm run chat-probe` - 聊天页面
- `npm run history-probe` - 历史推荐页面
- `npm run exposure-probe` - 超级曝光页面
- `npm run settings-probe` - 设置页面
- `npm run member-center-probe` - 会员中心页面
- `npm run profile-flow-probe` - 个人资料流程

飞书文档抓取：
- `npm run feishu:fetch -- "<飞书 Wiki 链接>"` - 抓取 Wiki/文档/表格文本内容

### Daemon 管理

- `npm run daemon:start` - 启动 daemon
- `npm run daemon:status` - 查看健康状态
- `npm run daemon:tasks` - 查看最近任务

## API 文档

### POST /task
提交任务到队列并自动执行

**请求：**
```json
{
  "task": "还原 pages/settings/index 页面",
  "agent": "codex",
  "cwd": "/Users/firingj/Projects/immortal-in-laws-e2e",
  "source": "http",
  "userId": "user123"
}
```

**响应：**
```json
{
  "success": true,
  "message": "任务已加入队列并等待执行",
  "queueSize": 1,
  "task": {
    "id": "2026-03-03T10-00-00-000Z-ab12cd",
    "status": "queued",
    "agent": "codex"
  }
}
```

### GET /task/next
兼容旧接口，只返回下一个任务预览，不会 claim 任务

**响应：**
```json
{
  "success": true,
  "deprecated": true,
  "task": {
    "id": "2026-03-03T10-00-00-000Z-ab12cd",
    "task": "还原 pages/settings/index 页面",
    "source": "http",
    "status": "queued"
  }
}
```

### GET /queue
查看当前队列

**响应：**
```json
{
  "success": true,
  "queueSize": 2,
  "runningTask": null,
  "tasks": [...]
}
```

### GET /tasks
查看最近任务和执行结果

### GET /tasks/:id
查看单个任务详情、日志路径和摘要

### GET /health
健康检查

**响应：**
```json
{
  "status": "ok",
  "uptime": 12345,
  "queueSize": 0,
  "defaultAgent": "codex",
  "installedAgents": {
    "codex": true,
    "claude": true,
    "cursor-agent": false
  }
}
```

### POST /feishu/webhook
飞书机器人回调（自动处理）

## 使用场景

### 场景 1：手动提交任务

```bash
# 1. 启动 Daemon
npm run daemon

# 2. 提交任务
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{"task":"还原 pages/settings/index 页面","agent":"codex"}'

# 3. 查看执行结果
curl http://localhost:3000/tasks
```

### 场景 2：飞书机器人

```bash
# 1. 启动 Daemon
npm run daemon

# 2. 配置飞书机器人 Webhook
#    指向: http://your-server:3000/feishu/webhook

# 3. 在飞书群发消息
#    "/claude 分析 pages/settings/index 页面"

# 4. Daemon 自动接收并执行
```

## 项目结构

```
immortal-in-laws-e2e/
├── src/
│   ├── daemon/
│   │   ├── message-daemon.ts    # 消息接收器
│   │   └── README.md            # Daemon 文档
│   ├── tools/
│   │   ├── e2e-mcp-server.ts    # E2E MCP Server
│   │   ├── *-probe.ts           # 验证脚本
│   │   ├── restoration-loop-runner.ts
│   │   └── restoration-loop-mark.ts
│   └── core/                    # E2E 核心功能
├── agent-memory/                # Agent 记忆库
│   ├── project-knowledge.md
│   ├── known-issues.md
│   └── page-topology.md
├── figma/data/                  # Figma 数据
│   └── figma-restoration-status.yaml
└── .cursor/
    └── mcp.json                 # MCP 配置
```

## 环境变量

```bash
# 飞书 App 凭证（优先 reply 原消息）
FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=your-feishu-app-secret
FEISHU_OPEN_BASE_URL=https://open.feishu.cn

# 飞书 Webhook（回退通道）
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx

# Midscene AI 模型
MIDSCENE_MODEL_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
MIDSCENE_MODEL_API_KEY=your-key
MIDSCENE_MODEL_NAME=qwen3.5-plus

# Figma
FIGMA_ACCESS_TOKEN=your-token

# 项目路径
APP_REPO_PATH=/Users/firingj/Projects/immortal-in-laws
TRACKER_REPO_PATH=/Users/firingj/Projects/immortal-in-laws-e2e

# Daemon 端口
DAEMON_PORT=3000

# 默认 executor
DAEMON_DEFAULT_AGENT=codex

# 工作区根目录
DAEMON_WORKSPACE_ROOT=/Users/firingj/Projects/immortal-in-laws-e2e
DAEMON_PLAN_ONLY_RETRY_MAX=0
DAEMON_FEISHU_DEFAULT_CWD=app
DAEMON_FEISHU_EVENT_DEDUP_WINDOW_MS=600000

# 可选：覆盖 CLI 路径
CODEX_BIN=codex
CLAUDE_BIN=claude
CURSOR_AGENT_BIN=cursor-agent
```

## 工作原理

1. **Daemon 接收消息**
   - HTTP API 或飞书 Webhook
   - 解析 agent 类型和工作目录

2. **自动执行**
   - 任务入队后由后台 worker 串行消费
   - 根据任务选择 `codex` / `claude` / `cursor-agent`

3. **记录结果**
   - 写入 stdout/stderr 日志
   - 保存最终摘要和退出码
   - 通过 `/tasks` 暴露状态
   - 自动回传结果到飞书（优先 reply 原消息；失败时回退 webhook）

## 文档

- [快速测试指南](docs/QUICK_TEST.md) - 5 分钟快速测试
- [Daemon 架构说明](src/daemon/README.md) - 详细架构和 API 文档
- [飞书机器人配置](docs/FEISHU_SETUP.md) - 如何配置飞书机器人接收消息
- [飞书文档抓取指南](docs/飞书文档抓取指南.md) - 如何抓取 Wiki/多维表格问题列表
- [E2E MCP Server](src/tools/mcp/e2e-mcp-server.ts) - E2E 工具实现

## 许可证

MIT
