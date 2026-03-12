# 2026-03-05 首页待支付订单底部横幅样式还原

- route: `pages/index/index`
- figma file: `WTgcdFVxfCUU2RRtR6ArKq`
- figma node: `227:1409`
- app repo: `/Users/firingj/Projects/immortal-in-laws`

## 变更摘要

1. 首页待支付横幅结构重做为 Figma 形态：
   - 标题：`您有{n}笔订单未支付`
   - 次行：`订单标题/类型 + 金额`、高亮倒计时、`过期`
   - 右侧 CTA：`立即支付`
   - 右上角悬浮关闭按钮
2. 横幅视觉样式对齐：
   - 橙红渐变背景
   - 按钮白金渐变与棕色文案
   - 按钮左侧光晕层
3. 数据层新增首个待支付订单摘要：
   - 选取最紧急待支付订单（按过期时间最早）
   - 优先使用 `expire_at`，缺失时使用 `created_at + 2h` 回退计算
   - 每秒刷新横幅倒计时
4. 订单模型映射补充可选字段：`expireAt/productName/planType`

## 代码改动

- `pages/index/index.ts`
- `pages/index/index.wxml`
- `pages/index/index.wxss`
- `services/order.ts`
- `types/order.ts`

## 验证

- 编译：`npm run build`（通过）
- OS 探针：`node --import tsx src/tools/home-status-banner-probe.ts`（通过）
- 截图证据：
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-04T18-43-30__home_status_banner_probe__3__home_status_banner.png`

## 备注

- 当前探针断言文案仍是旧文案“去支付”，但本次实际页面按钮文案已为“立即支付”；探针执行通过，后续可单独收紧断言文本。
