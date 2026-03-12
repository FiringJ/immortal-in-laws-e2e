require('../../../setup-env.js');

import { initE2E } from '../../core/e2e-setup';

const MESSAGE_TAB_POINT = { x: 186, y: 831 };
const FIRST_CONVERSATION_POINT = { x: 147, y: 448 };
const BACK_POINT = { x: 25, y: 123 };
const WECHAT_BUTTON_POINT = { x: 66, y: 768 };
const CALL_BUTTON_POINT = { x: 187, y: 768 };
const PHOTO_BUTTON_POINT = { x: 306, y: 768 };
const MODAL_MASK_POINT = { x: 188, y: 140 };
const GREEN_MESSAGE_POINT = { x: 282, y: 571 };

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollDown(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i++) {
    await device.scroll('down', 3);
    await sleep(220);
  }
}

async function scrollUp(device: Awaited<ReturnType<typeof initE2E>>['device'], rounds: number) {
  for (let i = 0; i < rounds; i++) {
    await device.scroll('up', 3);
    await sleep(220);
  }
}

async function backToTabPage(device: Awaited<ReturnType<typeof initE2E>>['device']) {
  for (let i = 0; i < 2; i++) {
    await device.tapAt(BACK_POINT.x, BACK_POINT.y);
    await sleep(1400);
  }
}

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('chat_probe');

  await backToTabPage(ctx.device);
  await ctx.device.tapAt(MESSAGE_TAB_POINT.x, MESSAGE_TAB_POINT.y);
  await sleep(2600);
  await e2e.assert('当前页面是标题为“消息”的消息列表页，顶部有“看过我的”“收藏我的”“解锁我的”三个入口，下方有会话列表');
  await ctx.device.tapAt(FIRST_CONVERSATION_POINT.x, FIRST_CONVERSATION_POINT.y);
  await sleep(2600);

  await sleep(1200);
  await e2e.screenshot('chat_top');

  await scrollDown(ctx.device, 2);
  await sleep(1000);
  await e2e.screenshot('chat_mid');

  await ctx.device.tapAt(WECHAT_BUTTON_POINT.x, WECHAT_BUTTON_POINT.y);
  await sleep(1200);
  await e2e.assert('当前页面底部弹出微信确认弹窗，标题是“确认您的微信号”，底部有“确认发送”按钮');
  await e2e.screenshot('chat_wechat_modal');
  await ctx.device.tapAt(MODAL_MASK_POINT.x, MODAL_MASK_POINT.y);
  await sleep(1000);

  await ctx.device.tapAt(CALL_BUTTON_POINT.x, CALL_BUTTON_POINT.y);
  await sleep(1200);
  await e2e.assert('当前页面底部弹出联系方式弹窗，标题中包含“联系方式”，并且弹窗主体展示电话号码或“暂未获取到号码”，底部有“拨打电话”按钮或“数据加载中...”按钮');
  await e2e.screenshot('chat_call_modal');
  await ctx.device.tapAt(MODAL_MASK_POINT.x, MODAL_MASK_POINT.y);
  await sleep(1000);

  await ctx.device.tapAt(PHOTO_BUTTON_POINT.x, PHOTO_BUTTON_POINT.y);
  await sleep(1200);
  await e2e.assert('当前页面中间弹出标题为“孩子照片资料”的弹窗，里面有上传区域和“发送照片”按钮');
  await e2e.screenshot('chat_photo_modal');
  await ctx.device.tapAt(MODAL_MASK_POINT.x, MODAL_MASK_POINT.y);
  await sleep(1000);

  await e2e.act(
    '如果当前聊天中还没有绿色的我方消息气泡，则点击底部输入框，输入“您好”，再点击右侧发送按钮，生成一条绿色消息；如果已经有绿色消息气泡，则保持当前页面不变'
  );
  await sleep(1800);

  await ctx.device.longPressAt(GREEN_MESSAGE_POINT.x, GREEN_MESSAGE_POINT.y, 950);
  await sleep(1500);
  await e2e.assert('当前绿色消息气泡上方显示黑色悬浮菜单，其中包含“删除”“撤回”“复制”');
  await e2e.screenshot('chat_context_menu');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
