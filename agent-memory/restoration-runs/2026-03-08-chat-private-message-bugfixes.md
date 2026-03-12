# Chat Private Message Bugfixes (2026-03-08)

## Scope

- Date: 2026-03-08
- Route: `pages/chat/index`
- Figma fileKey: `WTgcdFVxfCUU2RRtR6ArKq`
- Primary Figma nodeId: `159:1169`
- Related local design references:
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-聊天室2.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-聊天室-语音模式1.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-聊天室-语音模式-说话中1.png`
  - `/Users/firingj/Projects/immortal-in-laws/design/3.设计稿/神仙亲家-消息-聊天室-语音模式-松开取消1.png`
- Goal: 修复私信会话页中家长名称、资料卡、消息时间/状态、头像跳转、长按菜单、撤回、语音、表情包动图等一组问题。

## Inputs

- Figma tools used:
  - `mcp__figma__whoami`
  - `mcp__figma__get_design_context`
  - `mcp__figma__get_screenshot`
- Existing implementation files read:
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-voice-overlay/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/services/message.ts`
  - `/Users/firingj/Projects/immortal-in-laws/services/message-socket.ts`
  - `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`
  - `/Users/firingj/Projects/immortal-in-laws/store/messageStore.ts`
  - `/Users/firingj/Projects/immortal-in-laws/types/message.ts`
  - `/Users/firingj/Projects/immortal-in-laws/config/static.ts`

## Changes

- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-voice-overlay/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/components/emoji-picker/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/services/message.ts`
  - `/Users/firingj/Projects/immortal-in-laws/services/message-socket.ts`
  - `/Users/firingj/Projects/immortal-in-laws/services/api-mapper.ts`
  - `/Users/firingj/Projects/immortal-in-laws/store/messageStore.ts`
  - `/Users/firingj/Projects/immortal-in-laws/types/message.ts`
  - `/Users/firingj/Projects/immortal-in-laws/config/static.ts`
- New asset backups:
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-1.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-2.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-3.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-4.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-5.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-6.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-7.gif`
  - `/Users/firingj/Projects/immortal-in-laws/assets/imgs/chat/stickers/sticker-8.gif`
- Key behavior fixes:
  - 对方非“本人”时，顶部家长名自动补 `家长` 后缀；“本人/先生/女士/父母称谓”保留原样。
  - 聊天页孩子资料卡改为收入优先，并将相亲介绍限制为两行。
  - 自己发出的消息增加发送时间与状态展示，优先显示后端 `read_at`，没有时回退到对方首次回复时间。
  - 会话头像点击补齐跳转：对方头像进详情页，己方头像进资料预览页。
  - 长按菜单改为固定底部左右停靠，去掉跟随触点的遮挡与多余背景问题。
  - 撤回提示统一改为 `超出撤回时间`；WS 发送消息补了 `ack -> 真正 message_id` 写回，修复两分钟内文本/图片/语音/贴图误报撤回失败的问题。
  - 语音播放先下载远端文件再播，修复远端语音 URL 点击播放失败。
  - 录音改为仅长按触发，单击不再误起录；录音浮层和按钮样式按设计稿重调。
  - 表情面板默认切到 emoji tab，并将贴图切到 GIF CDN 地址，发送前后统一显示动态图。

## Validation

- Commands run:
  - `npm run type-check` (app repo) ✅
  - `npm run build` (app repo) ✅
  - `node scripts/upload-to-tos.mjs chat` ✅
  - `curl -I https://static.yilusx.com/assets/imgs/chat/stickers/sticker-1.gif` ✅
  - `curl -I https://static.yilusx.com/assets/imgs/chat/stickers/sticker-8.gif` ✅
- OS screenshots: 无
- Functional checks:
  - TypeScript 构建通过，聊天页新增字段与模板绑定一致。
  - CDN 已返回 `200 OK` 且 `Content-Type: image/gif`，动态图贴图资源可访问。

## Blockers

- 本轮未做微信开发者工具 OS 级截图校对。
- 原因不是构建失败，而是当前只完成了代码/资源闭环，尚未进入分离可见的模拟器窗口做最后一轮视觉与交互回归。

## Durable Knowledge Added

- 聊天页 WS 本地临时消息必须在 `ack` 到达后回写真实 `message_id`，否则撤回会持续命中假 ID。
- 小程序聊天贴图若要支持动图预览与发送后展示，可直接走 CDN GIF 资源；本地 `assets/imgs/chat/stickers/*.gif` 仅作为备份，不作为运行时路径。

## OS Validation Update

- Date: 2026-03-08
- Simulator window: `immortal-in-laws的模拟器`（分离窗口，OS 级截图可用）
- Screenshots captured:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T07-52-34__chat_nav_recover__3__message_list_recovered.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T07-57-37__chat_visual_final__2__chat_top.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-00-54__chat_send_check__1__chat_after_send.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-02-40__chat_avatar_ai_tap__2__after_avatar_ai_tap.png`
- Validated behaviors:
  - 已恢复并确认消息列表页可正常进入首个会话。
  - 聊天页顶部资料区已正常渲染，家长名称不再重复显示 `（母亲）（母亲）`。
  - 自己发送文本后，气泡下方已出现发送时间与 `未读` 状态。
  - 点击左侧消息头像可进入对方 `相亲资料` 页。
- Remaining gaps:
  - 会话数据首屏不是瞬时出现，当前自动化回归需要额外等待约 8 秒后再截图，否则会误判为空白页。
  - 自动化链路里 `longPressAt` 暂未稳定触发聊天消息长按菜单，现有 OS 截图未覆盖“己方/对方长按菜单”最终视觉。
  - 交换微信 / 拨打电话 / 发送照片弹窗的坐标化脚本在关闭时容易误触顶部资料区，当前没有留下可作为最终证据的稳定截图。

## Follow-up Polish Update

- Date: 2026-03-08
- Related Figma nodes:
  - `162:505` 已读样式
  - `162:469` 未读样式
- Goal: 修复输入栏图标外层错误边框、去掉消息状态里的发送时间、将已读改为“对勾 + 已读”、并把长按快捷菜单恢复到消息气泡附近定位。
- Files edited:
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.ts`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxml`
  - `/Users/firingj/Projects/immortal-in-laws/pages/chat/index.wxss`
  - `/Users/firingj/Projects/immortal-in-laws/components/pages/chat/chat-input-bar/index.wxss`
- Code changes:
  - 输入栏左右图标按钮移除黑色描边，只保留白底圆形容器。
  - 我方消息 footer 改为仅展示状态；未读使用深灰 `未读`，已读使用浅灰对勾 + `已读`。
  - 长按消息时，先测量当前消息气泡的 `boundingClientRect`，再按气泡中心计算快捷菜单的 `left/top` 和箭头偏移，避免继续固定在页面底部。
- Commands run:
  - `npm run type-check` (app repo) ✅
  - `npm run build` (app repo) ✅
- OS probe attempt:
  - `npm run chat-probe` ❌
  - 失败原因：模拟器起始状态停在 `屏蔽的人` 页面，且存在 `取消屏蔽` 弹窗，导致预设的“返回消息列表 -> 进入会话”路径失效。
- Additional screenshots:
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-18-50__chat_probe__1__before_assert.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-20-10__chat_manual_recover__0__after_modal_cancel.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-20-12__chat_manual_recover__0__after_back_1.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-20-13__chat_manual_recover__0__after_back_2.png`
  - `/Users/firingj/Projects/immortal-in-laws-e2e/screenshots/2026-03-08T08-20-16__chat_manual_recover__0__after_message_tab.png`
- OS validation blocker details:
  - 手动恢复链路已把模拟器从 `屏蔽的人` 页退回首页，但首页底部绿色运营横幅会抬高 tab 命中区域，旧的 `消息` tab 坐标没有实际进入消息页。
  - 随后再次初始化 E2E 时，分离模拟器窗口短暂不可枚举，无法继续产出新的聊天页截图。
  - 因此本轮新增修正已完成代码与构建闭环，但还没有拿到对应的最新聊天页 OS 级证据。
