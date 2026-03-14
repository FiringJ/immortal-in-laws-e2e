# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 编辑资料页上传无人脸头像时出现英文错误提示，应显示中文合规提示
## Cleaned Problem
- 问题页面为 `pages/profile-edit/index` 的孩子照片上传弹窗。
- 当前现象：用户选择一张“无人脸”的头像/照片后，点击 `确认上传`，页面弹出英文错误提示 `Photo upload failed, please try again`。
- 预期行为：当照片未检测到人脸或不符合平台要求时，不应直接暴露英文后端错误；应进入前端既有的“无效照片”状态，提示中文文案 `照片不符合要求，请点击更换`，并保持 `确认上传` 不可继续提交。
- 该问题属于资料编辑主流程中的阻断性体验问题，且源单优先级为 `P0`。

## Source Quality
- 优点：缺陷单明确给出了页面、操作步骤、错误现象，并附带了当前异常截图。
- 优点：仓库内已有 PRD/需求文档能直接确认“无人脸照片”的目标交互和目标文案，预期并非只能依赖截图猜测。
- 不足：附件列表里两条都指向同一个 `image.png`，实际只看到当前异常截图，缺少题述中的“图 1”预期截图。
- 不足：缺陷单没有附上实际接口返回的错误码/错误消息，也未说明出错环境（测试/生产、是否接真后端）。
- 结论：虽然证据不算完整，但问题和预期都足够明确，可直接进入计划生成。

## Product Context
- 页面链路位于“我的资料维护”流：`pages/profile/index` → `pages/profile-edit/index`。
- `agent-memory/page-topology.md` 已明确 `pages/profile-edit/index` 属于 `Profile / Profile Preview / Profile Edit` 同一维护链路。
- PRD 在 `/Users/firingj/Projects/GodQinJia/docs/xuqiu.md` 中明确要求：无论首次上传还是更换照片，上传后都要做“符合平台要求且有人脸”的检测；若不符合要求，则 `确认上传` 按钮置灰，并提示 `照片不符合要求，请点击更换`。
- 同样的产品文案也出现在本仓库需求文档 `design/1.需求文档/神仙亲家--小程序产品需求文档.md`，说明该预期是稳定需求，不是临时口头描述。

## Technical Context
- 前端页面 `pages/profile-edit/index.wxml` 已经存在无效照片态：当 `photoStatus === 'invalid'` 时，会显示文案 `照片不符合要求，请点击更换`，同时将 `确认上传` 置为不可用。这说明 UI 目标态已经实现过。
- 前端页面 `pages/profile-edit/index.ts` 的 `handlePhotoUploadError` 会在命中 `PHOTO_INVALID_ERROR_CODES` 时，将错误文案统一替换为 `照片不符合要求，请点击更换`；否则会透传后端原始 `message`，或回退为 `上传失败，请重试`。
- `services/user.ts` 的 `uploadChildPhoto()` 负责对象存储上传后再调用 `/api/v1/profile/child/{childId}/photo` 保存资料照片；当前截图中的英文 toast 说明这条链路最终返回/暴露了英文错误消息。
- 后端 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/profile.go` 的 `validatePhotoFace()` 对“无人脸”本应返回 `ErrPhotoNoFace`，并带中文消息 `照片中未检测到人脸，请上传清晰正脸照`；只有地址无效或人脸检测服务异常才会走 `ErrPhotoUploadFailed`。
- 后端错误码定义 `/Users/firingj/Projects/GodQinJia/internal/pkg/code/biz_profile.go` / `code_generated.go` 中，`ErrPhotoUploadFailed` 的默认注册文案正是英文 `Photo upload failed, please try again`，与截图一致。
- 对比可见：聊天页 `pages/chat/index.ts` 对照片异常做得更稳健，除了按错误码识别外，还会用 `人脸|face|审核失败|不合规` 等关键词兜底，将异常统一归类为无效照片并显示中文提示。编辑资料页目前缺少这层兜底，因此更容易把英文原始错误直接暴露给用户。
- 补充观察：前端当前的 `PHOTO_INVALID_ERROR_CODES` 包含 `110604`~`110609`，但若测试环境实际在“无人脸”场景下返回的是通用 `ErrPhotoUploadFailed`（`110602`）或英文 message，则编辑资料页现有判定会失效。

## Missing Context
- 缺少失败请求的真实响应样本：至少需要知道 `code`、`message`、HTTP 状态，才能确认是前端映射漏判，还是后端在该环境返回了错误的业务码。
- 缺少题述中的“图 1”预期截图；不过该缺口已可由 PRD 文案补齐，不构成阻塞。
- 缺少复现素材说明：当前“无人脸头像”是纯 logo、风景图，还是卡通头像，可能影响后端人脸识别结果与错误码。
- 缺少环境信息：是否为测试环境、是否启用了腾讯云人脸检测、是否存在网关层错误消息改写。

## Likely Surfaces
- `pages/profile-edit/index.ts`
- `pages/profile-edit/index.wxml`
- `services/user.ts`
- `pages/chat/index.ts`（可作为已有正确兜底逻辑的参考实现）
- 如复现证明后端对“无人脸”场景返回了通用上传失败码，则还需联动核查 `/Users/firingj/Projects/GodQinJia/internal/apiserver/service/profile.go`

## Recommended Next Action
- 进入 `generate_plan`。
- 计划阶段建议优先补两件事：
  1. 先复现并记录资料照片上传接口在“无人脸”场景下的真实返回 `code/message`；
  2. 前端在 `pages/profile-edit/index.ts` 中对该类错误做和聊天页一致的归一化处理，确保即便后端返回英文默认文案，也统一显示 `照片不符合要求，请点击更换` 并进入 `invalid` 状态。
- 若复现确认后端对“无人脸”场景错误地返回了 `ErrPhotoUploadFailed`，应补一个后端跟踪项；但这不应阻塞前端先兜住用户可见文案。
