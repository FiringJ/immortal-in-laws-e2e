require('../../setup-env.js');

import { initE2E } from '../core/e2e-setup';

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

async function run() {
  const ctx = await initE2E();
  if (ctx.skipE2E) {
    throw new Error('E2E skipped');
  }

  const e2e = ctx.observable('chat_probe');

  await e2e.act(
    '如果当前页面不是消息列表页，也不是标题为“聊天室”的页面，则点击底部导航栏的“消息”Tab进入消息列表页；如果当前页面已经是消息列表页或聊天室，则保持当前页面不变'
  );
  await sleep(1200);

  await e2e.act(
    '如果当前页面是消息列表页，则只点击一次会话列表中的第一条会话进入聊天室，不要重复点击；如果当前页面已经是标题为“聊天室”的页面，则保持当前页面不变'
  );
  await sleep(2400);

  await e2e.assert(
    '当前页面是标题为“聊天室”的页面，顶部有家长头像和编号信息，中间有白色嘉宾摘要卡，底部固定有“交换微信”“拨打电话”“发送照片”三个按钮以及输入区'
  );

  await scrollUp(ctx.device, 6);
  await sleep(1000);
  await e2e.screenshot('chat_top');

  await scrollDown(ctx.device, 3);
  await sleep(1000);
  await e2e.screenshot('chat_mid');

  await e2e.act(
    '如果当前聊天中还没有绿色的我方消息气泡，则点击底部输入框，输入“您好”，再点击右侧发送按钮，生成一条绿色消息；如果已经有绿色消息气泡，则保持当前页面不变'
  );
  await sleep(1800);

  await e2e.act('长按绿色消息气泡，显示黑色悬浮菜单，其中包含“删除”“撤回”“复制”');
  await sleep(1500);
  await e2e.screenshot('chat_context_menu');
}

run().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
