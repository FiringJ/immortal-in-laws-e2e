# Triage
- readiness: ready
- source_quality: medium
- next_action: generate_plan
- normalized_title: 编辑资料页首次上传孩子照片时错误展示上传弹层，应先展示示例引导弹层
## Cleaned Problem
- 问题页面可归一到 `pages/profile-edit/index` 的“相亲资料 / 孩子照片”上传流程，入口位于 `pages/profile/index` / `pages/profile-preview/index` 的资料维护链路中。
- 当前现象：当用户还没有孩子照片、首次点击上传区域时，运行时直接弹出“上传照片”弹层（中间为上传框、底部为 `确认上传` 按钮），对应设计稿 `design/3.设计稿/神仙亲家-我的-相亲资料-上传照片-弹窗1.png`。
- 预期行为：首次上传不应直接进入上传框，而应先展示“照片示例引导”弹层，给出正反示例（正面照/生活照/旅行照 vs 非本人/背影照/遮挡面部），再由用户点击 `从相册上传` 进入上传框，对应设计稿 `design/3.设计稿/神仙亲家-我的-相亲资料-上传照片-示例图-弹窗1.png`。
- 缺陷附件中的 `image.png` 与“示例图弹层”视觉一致，能作为预期态证据；题述中的“图 1 / 图 2”虽然未直接标明文件名，但可与本地设计稿一一对应。

## Source Quality
- 优点：缺陷标题明确表达了“首次上传孩子照片”这一触发条件，以及“当前弹框 / 正确弹框”的对比关系。
- 优点：本地设计目录中同时存在 `上传照片-弹窗1` 与 `上传照片-示例图-弹窗1` 两张原稿，且附件截图与后者一致，足以补齐题述里的图号映射。
- 优点：仓库内代码也明确实现了两套不同弹层状态，能够快速收敛到具体页面和状态机。
- 不足：原始缺陷单没有写清入口页面与复现步骤；附件列表里两条都指向同一张 `image.png`，缺少“当前错误态”的独立截图。
- 结论：原始表达不算完整，但结合设计稿与代码上下文后，问题定义已经足够具体，可直接进入计划生成。

## Product Context
- `agent-memory/page-topology.md` 已明确 `pages/profile-edit/index` 属于 `pages/profile/index` / `pages/profile-preview/index` 同一资料维护链路。
- `agent-memory/project-knowledge.md` 专门记录了 `pages/profile-edit/index` 的“photo-guide modal”设计映射，说明“示例图引导弹层”是该页面的正式设计面，而不是临时补充说明。
- 设计目录 `design/DESIGN_DIRECTORY_STRUCTURE.md` 已列出以下两张相邻设计稿：
  - `design/3.设计稿/神仙亲家-我的-相亲资料-上传照片-弹窗1.png`
  - `design/3.设计稿/神仙亲家-我的-相亲资料-上传照片-示例图-弹窗1.png`
- 这两张图名本身就对应题述里的“图 1 / 图 2”语义，因此该缺陷的预期是稳定产品设计，不需要额外 PM 澄清核心意图。

## Technical Context
- `pages/profile-edit/index.wxml` 同时定义了两套弹层：
  - `photoModalVisible`：上传框 + `确认上传` 按钮的上传弹层；
  - `photoGuideVisible`：包含正反照片示例、`从相册上传` 和 `取消` 的引导弹层。
- `pages/profile-edit/index.ts` 的当前源码已经包含“首次上传先看引导”的分支：`onPhotoTap()` 在 `!photoUrl && !photoPendingPath` 时，会先设置 `photoGuideVisible: true`，只有已有照片/待上传照片时才调用 `openPhotoModal()`。
- 但运行时产物 `pages/profile-edit/index.js` 仍保留旧逻辑：`onPhotoTap()` 直接执行 `this.openPhotoModal()`，没有首次上传判断。
- 这意味着：源代码与实际运行的 `.js` 已经不一致；如果小程序当前加载的是已提交的 `index.js`，就会稳定复现缺陷描述中的“首次上传直接弹出图 1”。
- `agent-memory/project-knowledge.md` 也明确提示：该项目修改 `.ts` 后必须重新执行 `npm run build`，否则不要相信模拟器/运行时结果。结合本缺陷，最可能的根因就是 `pages/profile-edit/index.ts` 修过了，但对应 `pages/profile-edit/index.js` 尚未重新生成或未同步提交。
- 补充：`onGuideUploadTap()` 的实现会在引导弹层点击 `从相册上传` 后继续走 `openPhotoModal(true)`，这与“图 2 -> 图 1”的目标交互链路一致。

## Missing Context
- 缺陷单没有写明复现入口是从 `我的` 首页点击“上传照片”，还是进入 `相亲资料` 页后点击孩子照片区域；不过两条路径最终都会落到 `pages/profile-edit/index`。
- 缺少当前错误态截图；现有附件只展示了预期的“示例图弹层”。
- 缺少环境信息：不确定线上包、测试包还是本地 DevTools 运行；如果不同环境打包方式不同，问题也可能只存在于未重编译的包体中。
- 若后续在重新构建后仍能复现，则需要补查是否还有其他上传入口绕过了 `onPhotoTap()` 的首次上传判断。

## Likely Surfaces
- `pages/profile-edit/index.ts`
- `pages/profile-edit/index.js`
- `pages/profile-edit/index.wxml`
- `pages/profile/index.ts`（入口链路，仅用于复现验证）
- `package.json` / `npm run build` 对应的编译产物同步流程

## Recommended Next Action
- 进入 `generate_plan`。
- 计划阶段建议优先做三件事：
  1. 以 `pages/profile/index` -> `pages/profile-edit/index` 的空照片用户路径复现一次，确认当前运行时确实先弹出错误的上传框；
  2. 让 `pages/profile-edit/index.js` 与 `pages/profile-edit/index.ts` 的首次上传逻辑保持一致，优先通过正式编译链路重建产物，而不是手改运行时代码；
  3. 在修复后验证完整链路：首次点击上传区应先显示“示例图弹层”，点击 `从相册上传` 后才进入上传框弹层。
- 当前证据已经足以支撑计划生成，因为页面归属、设计对照和最可能根因都已明确，无需再猜测核心事实。
