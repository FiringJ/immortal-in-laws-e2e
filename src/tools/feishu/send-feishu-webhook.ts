require('../../../setup-env.js');

type Args = {
  title: string;
  text: string;
};

function readArg(flag: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return '';
  }
  return process.argv[index + 1] || '';
}

function buildArgs(): Args {
  return {
    title: readArg('--title') || 'Ralph Loop Notification',
    text: readArg('--text') || 'No details provided.',
  };
}

async function main() {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  const { title, text } = buildArgs();

  if (!webhook) {
    console.warn('[Feishu] FEISHU_WEBHOOK_URL is not set. Skip notification.');
    return;
  }

  const body = {
    msg_type: 'post',
    content: {
      post: {
        zh_cn: {
          title,
          content: text
            .split('\n')
            .filter(Boolean)
            .map((line) => [{ tag: 'text', text: line }]),
        },
      },
    },
  };

  const response = await fetch(webhook, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`[Feishu] webhook failed: ${response.status} ${detail}`);
  }

  console.log('[Feishu] notification sent');
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack || error.message : String(error);
  console.error(message);
  process.exit(1);
});
