#!/usr/bin/env npx tsx
export {};
/**
 * 飞书文档抓取工具 - 通过 Open API 获取 Wiki/文档内容
 *
 * 无需人工介入，适合 CI/自动化或 Cursor 对话中直接调用。
 *
 * 使用前配置（一次性）：
 * 1. 在飞书开放平台 https://open.feishu.cn 创建自建应用
 * 2. 在应用「权限管理」中启用：wiki:wiki.readonly、doc:doc.readonly、docx:document.readonly
 *    - 电子表格：sheets:spreadsheet:readonly
 *    - 多维表格：bitable:app:readonly
 *    - 附件下载链接：drive:drive:readonly
 * 3. 将应用添加到目标文档库
 * 4. 设置环境变量：
 *    export FEISHU_APP_ID="your_app_id"
 *    export FEISHU_APP_SECRET="your_app_secret"
 *    或写入 .env.local（需在项目根目录加载）
 *
 * 用法：
 *   npm run feishu:fetch -- "<URL>" [--with-attachments]
 *   或 npx tsx src/tools/feishu/feishu-fetch-doc.ts "<URL>"
 *
 * 输出：文档纯文本内容（stdout），便于管道或程序读取。
 * --with-attachments：对附件字段尝试获取临时下载链接并输出（需 drive:drive:readonly 权限）
 */

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    console.error(`错误：未设置环境变量 ${name}。请在飞书开放平台创建应用后配置。`);
    process.exit(1);
  }
  return v.trim();
}

/** 从飞书 URL 中提取 token（支持 wiki 与 sheets） */
function extractFromUrl(url: string): {
  wikiToken: string | null;
  spreadsheetToken: string | null;
  tableId: string | null;
} {
  try {
    const u = new URL(url);
    const wikiMatch = u.pathname.match(/\/wiki\/([A-Za-z0-9_-]+)/);
    const sheetMatch = u.pathname.match(/\/sheets\/([A-Za-z0-9_-]+)/);
    const tableId = u.searchParams.get('table')?.trim() || null;
    return {
      wikiToken: wikiMatch ? wikiMatch[1] : null,
      spreadsheetToken: sheetMatch ? sheetMatch[1] : null,
      tableId: tableId || null,
    };
  } catch {
    return { wikiToken: null, spreadsheetToken: null, tableId: null };
  }
}

/** 获取 tenant_access_token */
async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const data = (await res.json()) as { code?: number; tenant_access_token?: string; msg?: string };
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取 tenant_access_token 失败: ${data.msg ?? JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

/** 获取 Wiki 节点信息 */
async function getWikiNode(token: string, accessToken: string): Promise<{
  obj_token: string;
  obj_type: string;
}> {
  const res = await fetch(`${FEISHU_BASE}/wiki/v2/spaces/get_node?token=${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as {
    code?: number;
    data?: { node?: { obj_token: string; obj_type: string } };
    node?: { obj_token: string; obj_type: string };
    msg?: string;
  };
  const node = data.data?.node ?? data.node;
  if (data.code !== 0 || !node) {
    const errDetail = data.code !== undefined ? `code=${data.code}` : '';
    const errMsg = data.msg ?? '';
    throw new Error(`获取 Wiki 节点失败: ${[errDetail, errMsg].filter(Boolean).join(' ') || JSON.stringify(data)}`);
  }
  return { obj_token: node.obj_token, obj_type: node.obj_type };
}

/** 获取旧版文档纯文本 */
async function getDocRawContent(docToken: string, accessToken: string): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/doc/v2/${docToken}/raw_content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { code?: number; content?: string; msg?: string };
  if (data.code !== 0) {
    throw new Error(`获取文档内容失败: ${data.msg ?? JSON.stringify(data)}`);
  }
  return data.content ?? '';
}

/** 获取新版文档（docx）纯文本 */
async function getDocxRawContent(docId: string, accessToken: string): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/docx/v1/documents/${docId}/raw_content`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { code?: number; content?: string; msg?: string };
  if (data.code !== 0) {
    throw new Error(`获取 Docx 内容失败: ${data.msg ?? JSON.stringify(data)}`);
  }
  return data.content ?? '';
}

/** 批量获取附件临时下载链接（需 drive:drive:readonly 权限） */
async function getTmpDownloadUrls(
  fileTokens: string[],
  accessToken: string
): Promise<Map<string, string>> {
  try {
    const unique = [...new Set(fileTokens.filter(Boolean))];
    if (unique.length === 0) return new Map();
    const res = await fetch(`${FEISHU_BASE}/drive/v1/medias/batch_get_tmp_download_url`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_tokens: unique }),
    });
    const data = (await res.json()) as {
      code?: number;
      data?: { tmp_download_urls?: Array<{ file_token: string; tmp_download_url?: string }> };
      msg?: string;
    };
    if (data.code !== 0) return new Map();
    const map = new Map<string, string>();
    for (const item of data.data?.tmp_download_urls ?? []) {
      if (item.tmp_download_url) map.set(item.file_token, item.tmp_download_url);
    }
    return map;
  } catch {
    return new Map();
  }
}

/** 判断是否为附件字段值 */
function isAttachmentValue(v: unknown): v is Array<{ file_token?: string; name?: string; url?: string; tmp_url?: string }> {
  if (!Array.isArray(v)) return false;
  try {
    return v.length > 0 && v.every(
      (x) => typeof x === 'object' && x !== null && ('file_token' in x || 'name' in x || 'url' in x)
    );
  } catch {
    return false;
  }
}

/** 列出多维表格的所有表 */
async function listBitableTables(
  appToken: string,
  accessToken: string
): Promise<Array<{ table_id: string; name: string }>> {
  const res = await fetch(`${FEISHU_BASE}/bitable/v1/apps/${appToken}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as {
    code?: number;
    data?: { items?: Array<{ table_id: string; name: string }> };
    msg?: string;
  };
  if (data.code !== 0) {
    throw new Error(`列出多维表格失败: ${data.msg ?? JSON.stringify(data)}`);
  }
  return data.data?.items ?? [];
}

/** 获取多维表格（bitable）纯文本 */
async function getBitableRawContent(
  appToken: string,
  tableId: string | null,
  accessToken: string,
  withAttachments = false
): Promise<string> {
  const tables = await listBitableTables(appToken, accessToken);
  const targetTable = tableId
    ? tables.find((t) => t.table_id === tableId)
    : tables[0];
  if (!targetTable) {
    if (tableId && tables.length > 0) {
      throw new Error(
        `未找到表 ${tableId}，当前多维表格中的表：${tables.map((t) => `${t.name}(${t.table_id})`).join(', ')}`
      );
    }
    return '[多维表格无数据表]';
  }
  const items: Array<Record<string, unknown>> = [];
  let pageToken: string | undefined;
  const effectiveTableId = targetTable.table_id;
  do {
    const q = pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : '';
    const res = await fetch(
      `${FEISHU_BASE}/bitable/v1/apps/${appToken}/tables/${effectiveTableId}/records?page_size=100${q}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = (await res.json()) as {
      code?: number;
      data?: { items?: Array<Record<string, unknown>>; has_more?: boolean; page_token?: string };
      msg?: string;
    };
    if (data.code !== 0) {
      throw new Error(`获取多维表格失败: ${data.msg ?? JSON.stringify(data)}`);
    }
    items.push(...(data.data?.items ?? []));
    pageToken = data.data?.has_more ? data.data.page_token : undefined;
  } while (pageToken);
  if (items.length === 0) return '[多维表格无记录或需 bitable:app 权限]';
  const allFields = items.reduce(
    (acc, r) => Object.assign(acc, r.fields as Record<string, unknown>),
    {} as Record<string, unknown>
  );
  const header = Object.keys(allFields);

  let urlMap = new Map<string, string>();
  if (withAttachments) {
    try {
      const tokens: string[] = [];
      for (const r of items) {
        const f = (r.fields ?? {}) as Record<string, unknown>;
        for (const h of header) {
          const v = f[h];
          if (isAttachmentValue(v)) {
            for (const att of v) {
              if (att?.file_token) tokens.push(String(att.file_token));
            }
          }
        }
      }
      urlMap = await getTmpDownloadUrls(tokens, accessToken);
    } catch {
      urlMap = new Map();
    }
  }

  const cellStr = (
    v: unknown,
    urlMapRef: Map<string, string>
  ): string => {
    if (v == null) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (isAttachmentValue(v)) {
      return v
        .map((att) => {
          const name = att.name ?? att.file_token ?? '附件';
          const url = att.url ?? att.tmp_url ?? urlMapRef.get(att.file_token ?? '');
          if (withAttachments && url) return `${name} [${url}]`;
          return name;
        })
        .join(', ');
    }
    if (Array.isArray(v)) return v.map((x) => cellStr(x, urlMapRef)).join(', ');
    if (typeof v === 'object' && v !== null) {
      const o = v as Record<string, unknown>;
      if ('text' in o && o.text != null) return String(o.text);
      if ('name' in o && o.name != null) return String(o.name);
      if ('record_id' in o || 'recordId' in o) return '';
    }
    const s = String(v);
    return s === '[object Object]' ? '' : s;
  };

  const lines = [header.join('\t')];
  for (const r of items) {
    const f = (r.fields ?? {}) as Record<string, unknown>;
    lines.push(header.map((h) => cellStr(f[h], urlMap)).join('\t'));
  }
  return lines.join('\n');
}

/** 按 sheetId 获取电子表格指定工作表的纯文本（URL 中 table= 可能为 sheetId） */
async function getSheetRawContentBySheetId(
  spreadsheetToken: string,
  sheetId: string,
  accessToken: string
): Promise<string> {
  const range = `${sheetId}!A1:ZZ2000`;
  const res = await fetch(
    `${FEISHU_BASE}/sheets/v2/spreadsheets/${spreadsheetToken}/values_batch_get?ranges=${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = (await res.json()) as {
    code?: number;
    data?: { valueRanges?: Array<{ values?: string[][] }> };
    msg?: string;
  };
  if (data.code !== 0) {
    throw new Error(`获取电子表格数据失败: ${data.msg ?? JSON.stringify(data)}`);
  }
  const values = data.data?.valueRanges?.[0]?.values ?? [];
  if (values.length === 0) return '[该工作表无数据]';
  return values.map((row) => row.join('\t')).join('\n');
}

/** 获取电子表格（sheet）纯文本 */
async function getSheetRawContent(
  spreadsheetToken: string,
  accessToken: string,
  withAttachments = false
): Promise<string> {
  const metaRes = await fetch(
    `${FEISHU_BASE}/sheets/v2/spreadsheets/${spreadsheetToken}/metainfo`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const metaData = (await metaRes.json()) as {
    code?: number;
    data?: {
      sheets?: Array<{
        sheetId: string;
        title: string;
        blockInfo?: { blockToken?: string; blockType?: string };
      }>;
    };
    msg?: string;
  };
  if (metaData.code !== 0) {
    const hint = metaData.msg?.toLowerCase().includes('permission') || metaData.code === 99991663
      ? '（需在开放平台开通 sheets:spreadsheet:readonly 权限并重新发布应用）'
      : '';
    throw new Error(`获取表格元数据失败: ${metaData.msg ?? metaData.code}${hint}`);
  }
  const sheets = metaData.data?.sheets ?? [];
  if (sheets.length === 0) {
    return '[表格无工作表或需开通 sheets:spreadsheet:readonly 权限]';
  }
  const lines: string[] = [];
  for (const sh of sheets) {
    const blockInfo = sh.blockInfo;
    if (blockInfo?.blockType === 'BITABLE_BLOCK' && blockInfo.blockToken) {
      const bt = blockInfo.blockToken;
      const underscoreIdx = bt.lastIndexOf('_');
      const appToken =
        underscoreIdx > 0 ? bt.slice(0, underscoreIdx) : bt;
      const tableId = underscoreIdx > 0 ? bt.slice(underscoreIdx + 1) : undefined;
      if (tableId && appToken) {
        try {
          const bitableContent = await getBitableRawContent(
            appToken,
            tableId,
            accessToken,
            withAttachments
          );
          lines.push(`## ${sh.title}`);
          lines.push(bitableContent);
          lines.push('');
        } catch {
          /* 嵌入的 bitable 可能需单独权限，忽略 */
        }
        continue; /* BITABLE_BLOCK 不尝试 values 读取 */
      }
    }
    const range = `${sh.sheetId}!A1:ZZ2000`;
    const valRes = await fetch(
      `${FEISHU_BASE}/sheets/v2/spreadsheets/${spreadsheetToken}/values/${encodeURIComponent(range)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const valData = (await valRes.json()) as {
      code?: number;
      data?: { valueRange?: { values?: string[][] }; valueRanges?: Array<{ values?: string[][] }> };
      msg?: string;
    };
    if (valData.code !== 0) {
      throw new Error(`获取表格数据失败: ${valData.msg ?? JSON.stringify(valData)}`);
    }
    const dr = valData.data;
    const values =
      dr?.valueRange?.values ?? dr?.valueRanges?.[0]?.values ?? [];
    if (values.length > 0) {
      lines.push(`## ${sh.title}`);
      for (const row of values) {
        lines.push(row.join('\t'));
      }
      lines.push('');
    }
  }
  return lines.join('\n').trim() || '[表格无数据]';
}

/** 根据 obj_type 获取文档内容 */
async function getContentByObjType(
  objToken: string,
  objType: string,
  accessToken: string,
  withAttachments = false
): Promise<string> {
  switch (objType) {
    case 'doc':
      return getDocRawContent(objToken, accessToken);
    case 'docx':
      return getDocxRawContent(objToken, accessToken);
    case 'sheet':
      return getSheetRawContent(objToken, accessToken, withAttachments);
    default:
      return `[当前仅支持 doc/docx/sheet/bitable，节点类型为 ${objType}，obj_token=${objToken}]`;
  }
}

/** 当 table 参数不是 sheetId（常见 tbl*）时，自动回退到整表读取 */
async function getSheetContentWithTableHint(
  spreadsheetToken: string,
  tableId: string | null,
  accessToken: string,
  withAttachments = false
): Promise<string> {
  if (!tableId) {
    return getSheetRawContent(spreadsheetToken, accessToken, withAttachments);
  }
  try {
    return await getSheetRawContentBySheetId(spreadsheetToken, tableId, accessToken);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fallback = tableId.startsWith('tbl') || /not found sheetId/i.test(message);
    if (!fallback) throw error;
    return getSheetRawContent(spreadsheetToken, accessToken, withAttachments);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  const flags = process.argv.slice(2).filter((a) => a.startsWith('-'));
  const url = args[0];
  const withAttachments = flags.includes('--with-attachments');
  if (!url) {
    console.error('用法: npm run feishu:fetch -- "<URL>" [--with-attachments]');
    process.exit(1);
  }

  const { wikiToken, spreadsheetToken, tableId } = extractFromUrl(url);
  if (!wikiToken && !spreadsheetToken) {
    console.error('无法从 URL 解析 token，请确保是 feishu.cn/wiki/xxx 或 feishu.cn/sheets/xxx 格式。');
    process.exit(1);
  }

  // 加载 .env.local（若存在）
  try {
    const fs = await import('fs');
    const path = await import('path');
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch {
    // 忽略
  }

  const appId = getEnv('FEISHU_APP_ID');
  const appSecret = getEnv('FEISHU_APP_SECRET');

  const accessToken = await getTenantAccessToken(appId, appSecret);

  let content: string;
  if (spreadsheetToken) {
    content = await getSheetContentWithTableHint(spreadsheetToken, tableId, accessToken, withAttachments);
  } else {
    const { obj_token, obj_type } = await getWikiNode(wikiToken as string, accessToken);
    if (obj_type === 'bitable') {
      content = await getBitableRawContent(obj_token, tableId, accessToken, withAttachments);
    } else if (obj_type === 'sheet') {
      content = await getSheetContentWithTableHint(obj_token, tableId, accessToken, withAttachments);
    } else {
      content = await getContentByObjType(obj_token, obj_type, accessToken, withAttachments);
    }
  }

  // 输出到 stdout，便于管道使用
  process.stdout.write(content);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
