# Daemon 架构说明

## 现状

当前 Daemon 已从“消息接收器”升级为“消息接收 + CLI executor”：

```text
远端消息（HTTP / 飞书）
        ↓
Message Daemon
        ↓
串行任务队列
        ↓
codex / claude / cursor-agent CLI
        ↓
本地工作区执行 + 日志/摘要落盘
```

任务执行结束后会自动回传结果到飞书（默认仅回传 `source=feishu` 的任务，优先 reply 原消息，同会话回传）。

## 支持的 Agent

- `codex`
- `claude`
- `cursor-agent`

默认使用 `DAEMON_DEFAULT_AGENT`，没有显式指定时回退到 `codex`。

## 启动

```bash
npm run daemon:start
```

Daemon 默认监听 `http://localhost:3000`。

## 提交任务

### HTTP

```bash
curl -X POST http://localhost:3000/task \
  -H "Content-Type: application/json" \
  -d '{
    "task": "修复设置页布局错位",
    "agent": "codex",
    "cwd": "/Users/firingj/Projects/immortal-in-laws-e2e"
  }'
```

可用字段：

- `task`: 自然语言任务描述
- `agent`: `codex | claude | cursor-agent`
- `cwd`: 执行目录
- `addDirs`: 额外可访问目录数组
- `timeoutMs`: 单任务超时
- `model`: 可选模型名
- `source`, `userId`, `metadata`: 来源信息

### 飞书

飞书消息正文支持 agent 前缀：

```text
/codex 修复 settings 页面样式
/claude 分析为什么会员页 probe 失败
/cursor-agent 整理 daemon 文档
```

收到消息后，Daemon 会自动入队并开始执行。

## 查询接口

### `GET /health`

返回健康状态、当前运行任务、默认 agent、已安装 agent。

### `GET /queue`

返回等待中的任务和当前运行中的任务。

### `GET /tasks`

返回最近任务，支持：

- `?status=queued|running|completed|failed`
- `?limit=20`

### `GET /tasks/:id`

返回单个任务详情，包括：

- 状态
- 退出码
- 摘要
- `stdoutPath`
- `stderrPath`
- `summaryPath`

### `GET /task/next`

兼容旧接口，只做预览，不再 claim 任务。

## 日志目录

每个任务的日志写到：

```text
logs/daemon-runs/<task-id>/
  ├─ stdout.log
  ├─ stderr.log
  └─ summary.txt
```

其中 `summary.txt` 仅在对应 CLI 支持显式最终消息输出时生成；否则 Daemon 会从 stdout/stderr 尾部提取摘要。

## 环境变量

```bash
DAEMON_PORT=3000
DAEMON_DEFAULT_AGENT=codex
DAEMON_WORKSPACE_ROOT=/Users/firingj/Projects/immortal-in-laws-e2e
DAEMON_TASK_TIMEOUT_MS=2700000
DAEMON_ADD_DIRS=/Users/firingj/Projects/immortal-in-laws
DAEMON_PLAN_ONLY_RETRY_MAX=0
DAEMON_FEISHU_DEFAULT_CWD=app
DAEMON_FEISHU_EVENT_DEDUP_WINDOW_MS=600000

CODEX_BIN=codex
CLAUDE_BIN=claude
CURSOR_AGENT_BIN=cursor-agent

DAEMON_NOTIFY_FEISHU=true
DAEMON_NOTIFY_ALL=false
DAEMON_NOTIFY_SUMMARY_MAX=600

FEISHU_APP_ID=cli_xxx
FEISHU_APP_SECRET=your-feishu-app-secret
FEISHU_OPEN_BASE_URL=https://open.feishu.cn
FEISHU_WEBHOOK_URL=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

可选高级配置：

- `DAEMON_CODEX_APPROVAL_MODE=full-auto`
- `DAEMON_CODEX_EXTRA_ARGS=--search`
- `DAEMON_CLAUDE_PERMISSION_MODE=bypassPermissions`
- `DAEMON_CLAUDE_EXTRA_ARGS=--allowedTools Bash,Edit,Read`
- `DAEMON_CURSOR_FORCE=false`
- `DAEMON_CURSOR_EXTRA_ARGS=--model gpt-5`

## PM2

仓库根目录的 `ecosystem.config.js` 已指向 `src/daemon/message-daemon.ts`。

```bash
pm2 start ecosystem.config.js
pm2 logs ralph-daemon
```

## 注意事项

- `cursor-agent` 若未安装，任务会以明确错误结束，不会卡死。
- `codex` 与 `claude` 默认按无人工确认模式运行，适合守护进程，但风险也更高。
- 当前队列仍是内存态；Daemon 重启后历史任务状态会丢失，但日志文件会保留。
