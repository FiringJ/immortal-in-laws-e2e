import type { TaskRecord } from './agent-executor';

const MAX_SUMMARY_LENGTH = parseInt(process.env.DAEMON_NOTIFY_SUMMARY_MAX || '600', 10) || 600;
const FEISHU_OPEN_BASE_URL = (process.env.FEISHU_OPEN_BASE_URL || 'https://open.feishu.cn').replace(/\/+$/, '');

type FeishuMessageContext = {
  messageId?: string;
  chatId?: string;
};

type FeishuTokenCache = {
  token: string;
  expiresAt: number;
};

type FeishuTokenResponse = {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
};

type FeishuApiResponse = {
  code?: number;
  msg?: string;
};

let tokenCache: FeishuTokenCache | null = null;

function isNotifyEnabled(): boolean {
  return process.env.DAEMON_NOTIFY_FEISHU !== 'false';
}

function hasWebhookChannel(): boolean {
  return Boolean(process.env.FEISHU_WEBHOOK_URL);
}

function hasOpenApiChannel(): boolean {
  return Boolean(process.env.FEISHU_APP_ID && process.env.FEISHU_APP_SECRET);
}

function hasAnyNotifyChannel(): boolean {
  return hasOpenApiChannel() || hasWebhookChannel();
}

function shouldNotifyTask(task: TaskRecord): boolean {
  if (!isNotifyEnabled()) {
    return false;
  }

  if (!hasAnyNotifyChannel()) {
    return false;
  }

  if (process.env.DAEMON_NOTIFY_ALL === 'true') {
    return true;
  }

  return task.source === 'feishu';
}

function trimSummary(summary: string | undefined): string {
  const value = (summary || '').trim();
  if (!value) {
    return '无摘要';
  }

  if (value.length <= MAX_SUMMARY_LENGTH) {
    return value;
  }

  return `${value.slice(0, MAX_SUMMARY_LENGTH)}...`;
}

function buildTitle(task: TaskRecord): string {
  const statusLabel = task.status === 'completed' ? '成功' : '失败';
  return `Daemon 任务${statusLabel} (${task.agent})`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function extractMessageContext(task: TaskRecord): FeishuMessageContext {
  const metadata = asRecord(task.metadata);
  const event = asRecord(metadata?.event);
  const message = asRecord(event?.message);

  const messageId = typeof message?.message_id === 'string' ? message.message_id : undefined;
  const chatId = typeof message?.chat_id === 'string' ? message.chat_id : undefined;
  return { messageId, chatId };
}

function buildText(task: TaskRecord): string {
  const lines = [
    buildTitle(task),
    `任务ID: ${task.id}`,
    `状态: ${task.status}`,
    `来源: ${task.source || 'unknown'}`,
    `Agent: ${task.agent || 'unknown'}`,
    `耗时: ${task.durationMs ?? 0}ms`,
    `任务: ${task.task}`,
    `摘要: ${trimSummary(task.summary || task.error)}`,
  ];

  if (task.exitCode !== undefined) {
    lines.push(`退出码: ${task.exitCode}`);
  }
  if (task.stderrPath) {
    lines.push(`stderr: ${task.stderrPath}`);
  }
  if (task.summaryPath) {
    lines.push(`summary: ${task.summaryPath}`);
  }

  return lines.join('\n');
}

async function parseJson<T>(response: Response): Promise<T | undefined> {
  const raw = await response.text();
  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`[Feishu] unexpected non-JSON response (${response.status}): ${raw.slice(0, 300)}`);
  }
}

async function getTenantAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token;
  }

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error('[Feishu] FEISHU_APP_ID / FEISHU_APP_SECRET 未配置');
  }

  const response = await fetch(`${FEISHU_OPEN_BASE_URL}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`[Feishu] get token failed: ${response.status} ${detail}`);
  }

  const data = await parseJson<FeishuTokenResponse>(response);
  if (!data || data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`[Feishu] get token failed: code=${data?.code ?? 'unknown'} msg=${data?.msg || 'unknown'}`);
  }

  const expireSeconds = Number(data.expire || 7200);
  tokenCache = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + Math.max(expireSeconds - 120, 60) * 1000,
  };
  return tokenCache.token;
}

async function assertFeishuApiOk(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`[Feishu] ${action} failed: ${response.status} ${detail}`);
  }

  const data = await parseJson<FeishuApiResponse>(response);
  if (!data || data.code !== 0) {
    throw new Error(`[Feishu] ${action} failed: code=${data?.code ?? 'unknown'} msg=${data?.msg || 'unknown'}`);
  }
}

async function replyOriginalMessage(task: TaskRecord, messageId: string, text: string): Promise<void> {
  const token = await getTenantAccessToken();
  const response = await fetch(
    `${FEISHU_OPEN_BASE_URL}/open-apis/im/v1/messages/${encodeURIComponent(messageId)}/reply`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        msg_type: 'text',
        content: JSON.stringify({ text }),
        uuid: `${task.id}-reply`,
      }),
    },
  );
  await assertFeishuApiOk(response, 'reply original message');
}

async function sendToOriginalChat(task: TaskRecord, chatId: string, text: string): Promise<void> {
  const token = await getTenantAccessToken();
  const body = {
    receive_id: chatId,
    msg_type: 'text',
    content: JSON.stringify({ text }),
    uuid: `${task.id}-chat`,
  };
  const response = await fetch(`${FEISHU_OPEN_BASE_URL}/open-apis/im/v1/messages?receive_id_type=chat_id`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  await assertFeishuApiOk(response, 'send message to chat');
}

async function notifyWebhook(text: string): Promise<void> {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    throw new Error('[Feishu] FEISHU_WEBHOOK_URL 未配置');
  }

  const body = {
    msg_type: 'text',
    content: {
      text,
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
}

export async function sendFeishuText(context: FeishuMessageContext, text: string, uuidPrefix: string = 'daemon-note'): Promise<void> {
  if (hasOpenApiChannel()) {
    if (context.messageId) {
      const taskLike = {
        id: uuidPrefix,
      } as TaskRecord;
      try {
        await replyOriginalMessage(taskLike, context.messageId, text);
        return;
      } catch (error) {
        console.warn('[Feishu] reply 原消息失败，尝试回退到同会话发送。', error);
      }
    }

    if (context.chatId) {
      const taskLike = {
        id: uuidPrefix,
      } as TaskRecord;
      try {
        await sendToOriginalChat(taskLike, context.chatId, text);
        return;
      } catch (error) {
        console.warn('[Feishu] 发送到同会话失败，尝试回退到 webhook。', error);
      }
    }
  }

  if (hasWebhookChannel()) {
    await notifyWebhook(text);
    return;
  }

  throw new Error('[Feishu] 无可用通知通道，请配置 FEISHU_APP_ID/FEISHU_APP_SECRET 或 FEISHU_WEBHOOK_URL');
}

export async function notifyTaskResult(task: TaskRecord): Promise<void> {
  if (!shouldNotifyTask(task)) {
    return;
  }

  const text = buildText(task);
  const context = extractMessageContext(task);
  await sendFeishuText(context, text, `${task.id}-notify`);
}
