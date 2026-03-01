# immortal-in-laws-e2e

当前仓库只保留两类能力：

- 基础 E2E：通过 Midscene Agent + nut.js 操作微信开发者工具模拟器
- Figma MCP 页面样式还原：维护页面映射、还原状态和视觉对比

## 运行

```bash
npm install

# 运行 YAML 驱动的 E2E
npm test

# 坐标校准
npm run test:calibrate

# 启动 E2E MCP Server
npm run mcp:server

# 打印 Figma 页面清单
npm run figma:pages
```

## 环境

- 在仓库根目录创建 `.env.local`
- 填入视觉模型所需的环境变量
- 确保微信开发者工具已打开，且模拟器窗口已分离
- 如小程序项目不在默认位置，设置 `MINIPROGRAM_ROOT`

## 结构

```text
src/core   E2E 核心能力
src/tests  Jest 测试入口和 YAML 用例
src/tools  校准和 MCP server
figma/docs Figma MCP 说明和视觉对比页
figma/data 页面映射、状态台账、页面清单脚本
```

## Figma

- 说明文档：`figma/docs/FIGMA_MCP.md`
- 页面映射：`figma/data/figma-page-mapping.json`
- 还原状态：`figma/data/figma-restoration-status.yaml`
- 视觉对比页：`figma/docs/design-vs-implement-compare.html`
