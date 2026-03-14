# Triage
- readiness: ready
- source_quality: high
- next_action: generate_plan
- normalized_title: 私信发送照片未校验人脸，任意图片可发送
## Cleaned Problem
- 模块为私信会话 `pages/chat/index` 的“发送照片”流程。
- 当前现象：在已解锁会话中点击“发送照片”，选择任意图片后都可能继续发送给对方，没有拦截非人脸/不符合平台要求的图片。
- 预期行为：无论是首次上传还是点击更换，系统都应先检测图片是否“符合平台要求且有人脸”；若不符合，则弹窗维持不可发送状态，并提示“照片不符合要求，请点击更换”，效果应与附件截图一致：`/Users/firingj/Projects/immortal-in-laws-e2e/agent-memory/defect-reports/attachments/bug_5fc883436515/image.png`。

## Source Quality
- 结论：`high`。
- 原始描述直接指出了当前错误行为、正确期望行为和对应提示样式，且带有本地截图附件。
- 已给出明确模块线索（私信会话）和页面路由提示（`pages/message/index`、`pages/chat/index`），足以进入后续计划，不需要产品重新解释核心问题。

## Product Context
- `design/1.需求文档/神仙亲家--小程序产品需求文档.md` 已明确“发送照片”规则：
  - 点击“发送照片”弹出照片上传弹框；
  - 若未上传过合规孩子照片，则显示上传入口，发送按钮置灰；
  - 若已上传过符合平台要求的孩子照片，则显示孩子照片和“点击更换”；
  - 无论“首传”还是“更换”，系统都要识别检测“是否符合平台要求且有人脸”；
  - 不符合要求时，发送按钮置灰，并提示“照片不符合要求，请点击更换”；符合要求时才允许发送到会话内。
- 页面拓扑文档 `agent-memory/page-topology.md` 也确认 `pages/message/index -> pages/chat/index` 是私信入口链路，缺陷归属“私信会话”准确。

## Technical Context
- 前端聊天页已存在专门发图弹窗链路：
  - `pages/chat/index.ts`：`onPhotoTap` 打开发图弹窗，`onChoosePhoto` 选择图片后调用 `validateChatPhoto(filePath)`，`onConfirmSendPhoto` 发送前再次调用 `validateChatPhoto(photoPendingPath)`。
  - `components/pages/chat/chat-photo-modal/index.wxml`：已支持无效提示文案“照片不符合要求，请点击更换”，并通过 `photoStatus !== 'ready'` 禁止确认发送。
- 前端当前并不是完全没接校验，而是依赖 `services/user.ts` 的 `validateChatPhoto()`：
  - 先通过 `/object/upload` 获取上传地址并直传文件；
  - 再调用 `POST /api/v1/profile/child/{child_id}/photo` 保存一张临时照片；
  - 成功后返回 URL，并在 finally 中删除这张临时照片。
- `docs/默认模块.openapi.json` 已定义 `POST /api/v1/profile/child/{child_id}/photo`，说明聊天页复用“资料照片上传”接口做校验是当前设计的一部分。
- 同仓库中 `pages/profile-edit/index.ts` 已有成熟的“照片无效 -> 显示相同文案并保持不可确认”参考实现，可作为聊天页对齐基线。
- 需要重点关注的跨仓库事实：
  - 后端 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/profile.go` 在创建孩子照片前会调用 `validatePhotoFace(ctx, req.URL)`；
  - 但 `validatePhotoFace` 在 `faceDetectClient == nil` 或 `!faceDetectClient.IsEnabled()` 时会直接 `return nil`，即环境未启用人脸检测时，接口会放行任意图片；
  - 同文件中启用检测后的拒绝分支会返回照片类错误码，例如未检测到人脸、多人脸等；
  - 后端错误码定义位于 `/Users/firingj/Projects/GodQinJia/internal/pkg/code/biz_profile.go`，其中 `110607` 为无人脸、`110608` 为多人脸、`110609` 为内容不合规；前端 `PHOTO_INVALID_ERROR_CODES` 和正则提示已经尝试消费这类错误。
- 额外风险信号：`utils/image.ts` 里的 `detectFace()` 仍是“默认所有图片都有人脸”的占位实现，虽然聊天页当前未直接使用它，但说明项目里“人脸检测未完全集成”的历史背景确实存在。

## Missing Context
- 缺少一份明确的复现素材说明：附件展示的是“期望的无效提示 UI”，不是本次实际错误现场的录屏；后续复现仍需自备一张无人脸或明显不合规图片。
- 缺少当前测试环境的人脸检测开关/配置状态，暂不能仅凭前端代码断定问题属于前端漏拦截还是后端检测未启用。
- 缺少接口实际返回样本：尚未确认当前环境下 `POST /api/v1/profile/child/{child_id}/photo` 对无效图片是直接成功、还是报错但前端未正确处理。
- 以上缺口不会阻断计划生成，因为核心现象、预期、页面、接口和候选根因面已经足够清晰。

## Likely Surfaces
- `pages/chat/index.ts`：发图入口、选择图片、校验结果状态流转、发送前二次校验。
- `components/pages/chat/chat-photo-modal/index.ts`
- `components/pages/chat/chat-photo-modal/index.wxml`
- `components/pages/chat/chat-photo-modal/index.wxss`
- `services/user.ts`：`validateChatPhoto()` 与 `PHOTO_INVALID_ERROR_CODES`。
- `services/message.ts`、`services/message-socket.ts`：最终图片消息发送链路，需确认不存在绕过校验直接发图的分支。
- `pages/profile-edit/index.ts`：已有同类无效照片交互，可复用作对齐参考。
- `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/profile.go`：孩子照片上传前的人脸校验与开关判断。
- `/Users/firingj/Projects/GodQinJia/internal/pkg/code/biz_profile.go`：照片类错误码定义。

## Recommended Next Action
- 结论：进入 `generate_plan`。
- 建议后续计划优先做三件事：
  - 先复现聊天页上传一张“无人脸/明显不合规”图片，确认 `validateChatPhoto()` 是否被调用，以及 `POST /api/v1/profile/child/{child_id}/photo` 的真实返回；
  - 若接口对无效图仍返回成功，则继续排查后端 `faceDetectClient` 是否未启用，或照片上传链路是否被配置成跳过检测；
  - 若接口已返回 110607/110608/110609 等错误，但前端仍可发送，则聚焦 `pages/chat/index.ts` 的状态流转、按钮禁用条件和发送链路是否存在绕过。
- 该缺陷已具备明确问题定义、期望行为、界面参考和代码/接口落点，后续无需再向产品追问即可展开修复计划。
