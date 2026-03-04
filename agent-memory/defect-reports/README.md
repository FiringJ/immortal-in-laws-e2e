# 飞书缺陷报告数据

> 最后更新时间：2026-03-04 23:09

## 📊 数据概览

- **总缺陷数**：84个（类型=BUG）
- **未关闭缺陷**：40个
- **已验收通过**：52个

## 📁 文件说明

### 主要数据文件

| 文件名 | 说明 | 更新时间 |
|---|---|---|
| `feishu-defects-latest.tsv` | 最新的飞书缺陷原始数据（TSV格式） | 2026-03-04 23:09 |
| `feishu-defects-latest-all.csv` | 所有缺陷的CSV格式（84个） | 2026-03-04 23:09 |
| `feishu-defects-latest-open.csv` | 未关闭缺陷的CSV格式（40个） | 2026-03-04 23:09 |
| `defect-processing-plan-2026-03-04.md` | 缺陷处理计划（分批次） | 2026-03-04 23:00 |

### 数据来源

- **飞书Wiki链接**：https://gcncs1osaunb.feishu.cn/wiki/PlLrwARUNixHOXkpflxcPTi9nLh?table=tblSdvRVaxTpHlRY&view=vewLgt4u2h
- **抓取工具**：`npm run feishu:fetch`
- **飞书应用**：飞书MCP（cli_a916a8341778dcd5）

## 📈 统计信息

### 按优先级分布

| 优先级 | 数量 |
|---|---|
| P0（最高） | 65个 |
| P1（高） | 27个 |
| P2（中） | 36个 |
| 未标记 | 78个 |

### 按状态分布

| 状态 | 数量 |
|---|---|
| 验收通过 | 52个 |
| 新增 | 60个 |
| 待验收 | 15个 |
| 验收未通过 | 4个 |
| 修复中 | 1个 |
| 未填写 | 76个 |

## 🔄 更新流程

### 手动更新

```bash
# 1. 抓取最新数据
npm run feishu:fetch -- "https://gcncs1osaunb.feishu.cn/wiki/PlLrwARUNixHOXkpflxcPTi9nLh?table=tblSdvRVaxTpHlRY&view=vewLgt4u2h" > agent-memory/defect-reports/feishu-defects-latest.tsv

# 2. 生成CSV文件（所有缺陷）
cd agent-memory/defect-reports
echo "recordId,优先级,当前状态,反馈日期,提报人,跟进人,类型,问题描述,备注说明" > feishu-defects-latest-all.csv
awk -F'\t' 'NR>1 && $7=="BUG" {...}' feishu-defects-latest.tsv >> feishu-defects-latest-all.csv

# 3. 生成CSV文件（未关闭缺陷）
echo "recordId,优先级,当前状态,反馈日期,提报人,跟进人,类型,问题描述,备注说明" > feishu-defects-latest-open.csv
awk -F'\t' 'NR>1 && $4!="验收通过" && $7=="BUG" {...}' feishu-defects-latest.tsv >> feishu-defects-latest-open.csv
```

### 自动更新

可以通过 Cursor Agent 或 Daemon 定期执行更新。

## 🔗 相关文档

- [缺陷处理计划](./defect-processing-plan-2026-03-04.md) - 分批次处理计划
- [飞书文档抓取指南](../../docs/飞书文档抓取指南.md) - 配置说明

## 📝 注意事项

1. **数据格式**：TSV文件使用Tab分隔，CSV文件使用逗号分隔
2. **字段说明**：
   - `recordId`：飞书记录ID
   - `优先级`：P0/P1/P2
   - `当前状态`：新增/待验收/验收通过/验收未通过/修复中
   - `类型`：BUG/优化/新需求/建议/UI页面还原度
3. **过滤规则**：
   - `feishu-defects-latest-all.csv`：包含所有类型为"BUG"的记录
   - `feishu-defects-latest-open.csv`：仅包含状态不是"验收通过"的BUG

## 🔧 飞书API配置

当前使用的飞书应用配置（`.env.local`）：

```bash
# 飞书MCP应用（用于文档抓取）
FEISHU_APP_ID="cli_a916a8341778dcd5"
FEISHU_APP_SECRET="oNirGCVf2PXRgXIo4UxkffneJzCW16B5"

# AI Bot应用（用于消息推送）
FEISHU_BOT_APP_ID="cli_a92f7f6938f8dbd1"
FEISHU_BOT_APP_SECRET="qGuDctFnfOcnNTl3w4kcCcwjdH7ATUZB"
```

## 📊 重要缺陷追踪

### 待验收缺陷（15个）

包括：
- `recvaVILA9yltK` - 嘉宾资料显示不全（P0，待验收）
- 其他待验收问题...

详见 [feishu-defects-latest-open.csv](./feishu-defects-latest-open.csv)
