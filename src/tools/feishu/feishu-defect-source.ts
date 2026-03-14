require('../../../setup-env.js');

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';
const DEFAULT_SOURCE_URL = 'https://gcncs1osaunb.feishu.cn/wiki/PlLrwARUNixHOXkpflxcPTi9nLh?table=tblSdvRVaxTpHlRY&view=vewLgt4u2h';
const DEFAULT_TARGET_SECTION = '漏洞跟踪记录';
const CLOSED_STATUSES = new Set(['验收通过', '已关闭', '关闭', '已解决', '完成']);

type BitableRecordResponse = {
  record_id?: string;
  fields?: Record<string, unknown>;
};

export type FeishuDefectAttachment = {
  name: string;
  fileToken?: string;
  downloadUrl?: string;
  tmpDownloadUrl?: string;
  downloadedPath?: string;
  contentType?: string;
};

export type FeishuDefectIssue = {
  issueId: string;
  rowHash: string;
  section: string;
  priority: string;
  status: string;
  reporter: string;
  assignee: string;
  feedbackTime: number;
  feedbackDate: string;
  parentRecord: string;
  description: string;
  notes: string;
  review: string;
  sourceUrl: string;
  recordId?: string;
  attachments: FeishuDefectAttachment[];
};

export type FeishuDefectSyncResult = {
  generatedAt: string;
  sourceUrl: string;
  targetSection: string;
  totalBugCount: number;
  openBugCount: number;
  attachmentCount: number;
  downloadedAttachmentCount: number;
  snapshotPath: string;
  defects: FeishuDefectIssue[];
};

type SyncFeishuDefectSourceInput = {
  sourceUrl?: string;
  targetSection?: string;
  outDir?: string;
  trackerRoot?: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? '').replace(/\r/g, '').trim();
}

function parseDate(feedbackMs: unknown): number {
  const value = Number(feedbackMs);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function formatDate(feedbackMs: unknown): string {
  const ms = parseDate(feedbackMs);
  if (!ms) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(ms));
}

function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.has(normalizeText(status));
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`缺少环境变量 ${name}`);
  }
  return value.trim();
}

function extractFromUrl(url: string): {
  wikiToken: string | null;
  spreadsheetToken: string | null;
  tableId: string | null;
} {
  try {
    const parsed = new URL(url);
    const wikiMatch = parsed.pathname.match(/\/wiki\/([A-Za-z0-9_-]+)/);
    const sheetMatch = parsed.pathname.match(/\/sheets\/([A-Za-z0-9_-]+)/);
    return {
      wikiToken: wikiMatch ? wikiMatch[1] : null,
      spreadsheetToken: sheetMatch ? sheetMatch[1] : null,
      tableId: parsed.searchParams.get('table')?.trim() || null,
    };
  } catch {
    return { wikiToken: null, spreadsheetToken: null, tableId: null };
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const text = await response.text();
  let data: T | undefined;
  try {
    data = text ? JSON.parse(text) as T : undefined;
  } catch {
    throw new Error(`Feishu API 返回了非 JSON 内容: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`Feishu API 请求失败 ${response.status}: ${text.slice(0, 200)}`);
  }
  if (!data) {
    throw new Error('Feishu API 返回空响应');
  }
  return data;
}

async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const data = await fetchJson<{ code?: number; tenant_access_token?: string; msg?: string }>(
    `${FEISHU_BASE}/auth/v3/tenant_access_token/internal`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    },
  );

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`获取 tenant_access_token 失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.tenant_access_token;
}

async function getWikiNode(token: string, accessToken: string): Promise<{
  obj_token: string;
  obj_type: string;
}> {
  const data = await fetchJson<{
    code?: number;
    data?: { node?: { obj_token: string; obj_type: string } };
    node?: { obj_token: string; obj_type: string };
    msg?: string;
  }>(`${FEISHU_BASE}/wiki/v2/spaces/get_node?token=${encodeURIComponent(token)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const node = data.data?.node ?? data.node;
  if (data.code !== 0 || !node) {
    throw new Error(`获取 Wiki 节点失败: ${data.msg || JSON.stringify(data)}`);
  }
  return { obj_token: node.obj_token, obj_type: node.obj_type };
}

async function listBitableTables(appToken: string, accessToken: string): Promise<Array<{ table_id: string; name: string }>> {
  const data = await fetchJson<{
    code?: number;
    data?: { items?: Array<{ table_id: string; name: string }> };
    msg?: string;
  }>(`${FEISHU_BASE}/bitable/v1/apps/${appToken}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (data.code !== 0) {
    throw new Error(`列出多维表格失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.data?.items ?? [];
}

async function getSheetMetainfo(spreadsheetToken: string, accessToken: string): Promise<Array<{
  sheetId: string;
  title: string;
  blockInfo?: { blockToken?: string; blockType?: string };
}>> {
  const data = await fetchJson<{
    code?: number;
    data?: {
      sheets?: Array<{
        sheetId: string;
        title: string;
        blockInfo?: { blockToken?: string; blockType?: string };
      }>;
    };
    msg?: string;
  }>(`${FEISHU_BASE}/sheets/v2/spreadsheets/${spreadsheetToken}/metainfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (data.code !== 0) {
    throw new Error(`获取电子表格元数据失败: ${data.msg || JSON.stringify(data)}`);
  }
  return data.data?.sheets ?? [];
}

function parseBitableBlockToken(blockToken: string | undefined): { appToken?: string; tableId?: string } {
  if (!blockToken) {
    return {};
  }
  const underscoreIndex = blockToken.lastIndexOf('_');
  if (underscoreIndex <= 0) {
    return { appToken: blockToken };
  }
  return {
    appToken: blockToken.slice(0, underscoreIndex),
    tableId: blockToken.slice(underscoreIndex + 1),
  };
}

async function resolveBitableLocation(
  sourceUrl: string,
  accessToken: string,
): Promise<{ appToken: string; tableId: string }> {
  const { wikiToken, spreadsheetToken, tableId } = extractFromUrl(sourceUrl);

  if (spreadsheetToken) {
    const sheets = await getSheetMetainfo(spreadsheetToken, accessToken);
    const matchingSheet = sheets.find((sheet) => {
      const parsed = parseBitableBlockToken(sheet.blockInfo?.blockToken);
      return sheet.blockInfo?.blockType === 'BITABLE_BLOCK'
        && (!tableId || parsed.tableId === tableId || sheet.sheetId === tableId);
    }) || sheets.find((sheet) => sheet.blockInfo?.blockType === 'BITABLE_BLOCK');

    if (!matchingSheet?.blockInfo?.blockToken) {
      throw new Error('在电子表格中未找到嵌入的多维表格 block');
    }

    const parsed = parseBitableBlockToken(matchingSheet.blockInfo.blockToken);
    if (!parsed.appToken || !parsed.tableId) {
      throw new Error(`无法从 blockToken 解析 bitable 信息: ${matchingSheet.blockInfo.blockToken}`);
    }
    return {
      appToken: parsed.appToken,
      tableId: parsed.tableId,
    };
  }

  if (!wikiToken) {
    throw new Error('无法从飞书链接解析 wiki token');
  }

  const node = await getWikiNode(wikiToken, accessToken);
  if (node.obj_type === 'bitable') {
    const tables = await listBitableTables(node.obj_token, accessToken);
    const targetTable = tableId
      ? tables.find((table) => table.table_id === tableId)
      : tables[0];

    if (!targetTable) {
      throw new Error(`未找到目标 bitable table: ${tableId || 'first table'}`);
    }
    return {
      appToken: node.obj_token,
      tableId: targetTable.table_id,
    };
  }

  if (node.obj_type === 'sheet') {
    const sheets = await getSheetMetainfo(node.obj_token, accessToken);
    const matchingSheet = sheets.find((sheet) => {
      const parsed = parseBitableBlockToken(sheet.blockInfo?.blockToken);
      return sheet.blockInfo?.blockType === 'BITABLE_BLOCK'
        && (!tableId || parsed.tableId === tableId || sheet.sheetId === tableId);
    }) || sheets.find((sheet) => sheet.blockInfo?.blockType === 'BITABLE_BLOCK');

    if (!matchingSheet?.blockInfo?.blockToken) {
      throw new Error('在 wiki sheet 节点中未找到嵌入的多维表格 block');
    }
    const parsed = parseBitableBlockToken(matchingSheet.blockInfo.blockToken);
    if (!parsed.appToken || !parsed.tableId) {
      throw new Error(`无法从 blockToken 解析 bitable 信息: ${matchingSheet.blockInfo.blockToken}`);
    }
    return {
      appToken: parsed.appToken,
      tableId: parsed.tableId,
    };
  }

  throw new Error(`当前节点类型 ${node.obj_type} 不支持缺陷同步`);
}

function isAttachmentValue(value: unknown): value is Array<{
  file_token?: string;
  name?: string;
  type?: string;
  size?: number;
  tmp_url?: string;
  url?: string;
}> {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null);
}

function cellToText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (isAttachmentValue(value)) {
      return value.map((item) => normalizeText(item.name || item.file_token || '')).filter(Boolean).join(', ');
    }
    return value.map((item) => cellToText(item)).filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if (typeof record.name === 'string') return record.name;
    if (typeof record.value === 'string') return record.value;
    if (Array.isArray(record.text_arr)) return record.text_arr.map((item) => cellToText(item)).filter(Boolean).join(', ');
    if (Array.isArray(record.record_ids)) return record.record_ids.map((item) => cellToText(item)).filter(Boolean).join(', ');
  }
  return normalizeText(value);
}

async function listBitableRecords(appToken: string, tableId: string, accessToken: string): Promise<BitableRecordResponse[]> {
  const items: BitableRecordResponse[] = [];
  let pageToken: string | undefined;

  do {
    const suffix = pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : '';
    const data = await fetchJson<{
      code?: number;
      data?: {
        items?: BitableRecordResponse[];
        has_more?: boolean;
        page_token?: string;
      };
      msg?: string;
    }>(`${FEISHU_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500${suffix}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (data.code !== 0) {
      throw new Error(`获取多维表格记录失败: ${data.msg || JSON.stringify(data)}`);
    }

    items.push(...(data.data?.items ?? []));
    pageToken = data.data?.has_more ? data.data.page_token : undefined;
  } while (pageToken);

  return items;
}

async function getTmpDownloadUrls(fileTokens: string[], accessToken: string): Promise<Map<string, string>> {
  const uniqueTokens = [...new Set(fileTokens.filter(Boolean))];
  if (uniqueTokens.length === 0) {
    return new Map();
  }

  const data = await fetchJson<{
    code?: number;
    data?: {
      tmp_download_urls?: Array<{
        file_token: string;
        tmp_download_url?: string;
      }>;
    };
    msg?: string;
  }>(`${FEISHU_BASE}/drive/v1/medias/batch_get_tmp_download_url`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ file_tokens: uniqueTokens }),
  });

  if (data.code !== 0) {
    throw new Error(`获取附件临时下载链接失败: ${data.msg || JSON.stringify(data)}`);
  }

  const map = new Map<string, string>();
  for (const item of data.data?.tmp_download_urls ?? []) {
    if (item.tmp_download_url) {
      map.set(item.file_token, item.tmp_download_url);
    }
  }
  return map;
}

function buildIssueId(fields: Record<string, unknown>, section: string): string {
  const key = [
    section,
    cellToText(fields['问题描述']),
    cellToText(fields['父记录']),
    cellToText(fields['提报人']),
    cellToText(fields['反馈时间']),
  ].join('|');
  return `bug_${crypto.createHash('sha1').update(key).digest('hex').slice(0, 12)}`;
}

function buildRowHash(fields: Record<string, unknown>): string {
  const key = [
    cellToText(fields['优先级']),
    cellToText(fields['当前状态']),
    cellToText(fields['跟进人']),
    cellToText(fields['问题描述']),
    cellToText(fields['备注说明']),
    cellToText(fields['反馈时间']),
    cellToText(fields['log/截图']),
  ].join('|');
  return crypto.createHash('sha1').update(key).digest('hex');
}

function sanitizeFileName(name: string, fallback: string): string {
  const trimmed = name.trim() || fallback;
  return trimmed
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 120);
}

async function downloadAttachment(url: string, outputPath: string, accessToken: string): Promise<{ contentType?: string }> {
  const headers: Record<string, string> = {};
  if (url.startsWith('https://open.feishu.cn/open-apis/')) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`下载附件失败: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  return {
    contentType: response.headers.get('content-type') || undefined,
  };
}

function toDefectIssue(
  record: BitableRecordResponse,
  sourceUrl: string,
  targetSection: string,
  urlMap: Map<string, string>,
): FeishuDefectIssue | null {
  const fields = record.fields || {};
  const section = normalizeText(fields['section'] || fields['分组'] || fields['模块'] || targetSection);
  const issueType = normalizeText(fields['类型']);
  const description = normalizeText(fields['问题描述']);
  if (!description || !/bug|缺陷/i.test(issueType)) {
    return null;
  }

  const rawAttachments = isAttachmentValue(fields['log/截图'])
    ? fields['log/截图']
    : [];
  const attachments: FeishuDefectAttachment[] = rawAttachments.map((item) => ({
    name: normalizeText(item.name || item.file_token || '附件'),
    fileToken: normalizeText(item.file_token),
    downloadUrl: normalizeText(item.url),
    tmpDownloadUrl: normalizeText((item.file_token ? urlMap.get(item.file_token) : '') || item.tmp_url),
    contentType: normalizeText(item.type),
  }));

  const reporter = cellToText(fields['提报人']);
  const assignee = cellToText(fields['跟进人']);
  const parentRecord = cellToText(fields['父记录']);
  const priority = normalizeText(fields['优先级']);
  const status = normalizeText(fields['当前状态']);
  const notes = normalizeText(fields['备注说明']);
  const review = normalizeText(fields['问题复核']);
  const feedbackTime = parseDate(fields['反馈时间']);
  const feedbackDate = formatDate(fields['反馈时间']);
  const hasRichSignals = Boolean(
    priority
    || status
    || reporter
    || assignee
    || parentRecord
    || notes
    || review
  );
  const hasDetailedDescription = description.length >= 12 || /[：:，,；;。]/.test(description);
  const hasIssueSignals = hasRichSignals || hasDetailedDescription;

  if (!hasIssueSignals) {
    return null;
  }

  return {
    issueId: buildIssueId(fields, section),
    rowHash: buildRowHash(fields),
    section,
    priority,
    status,
    reporter,
    assignee,
    feedbackTime,
    feedbackDate,
    parentRecord,
    description,
    notes,
    review,
    sourceUrl,
    recordId: record.record_id,
    attachments,
  };
}

async function downloadIssueAttachments(issue: FeishuDefectIssue, attachmentRoot: string, accessToken: string): Promise<number> {
  let downloaded = 0;
  const issueDir = path.join(attachmentRoot, issue.issueId);

  for (let index = 0; index < issue.attachments.length; index += 1) {
    const attachment = issue.attachments[index];
    const downloadUrl = attachment.downloadUrl || attachment.tmpDownloadUrl;
    if (!downloadUrl) {
      continue;
    }
    const fallbackName = `${issue.issueId}-${index + 1}`;
    const fileName = sanitizeFileName(attachment.name, fallbackName);
    const outputPath = path.join(issueDir, fileName);

    try {
      const result = await downloadAttachment(downloadUrl, outputPath, accessToken);
      attachment.downloadedPath = outputPath;
      attachment.contentType = result.contentType;
      downloaded += 1;
    } catch (error) {
      attachment.contentType = error instanceof Error ? error.message : String(error);
    }
  }

  return downloaded;
}

function buildSnapshotPath(outDir: string): string {
  return path.join(outDir, 'feishu-defect-workbench-source.json');
}

export async function syncFeishuDefectSource(input: SyncFeishuDefectSourceInput = {}): Promise<FeishuDefectSyncResult> {
  const trackerRoot = path.resolve(input.trackerRoot || process.cwd());
  const outDir = path.resolve(input.outDir || path.join(trackerRoot, 'agent-memory/defect-reports'));
  const sourceUrl = input.sourceUrl || DEFAULT_SOURCE_URL;
  const targetSection = normalizeText(input.targetSection || DEFAULT_TARGET_SECTION);

  fs.mkdirSync(outDir, { recursive: true });

  const accessToken = await getTenantAccessToken(getEnv('FEISHU_APP_ID'), getEnv('FEISHU_APP_SECRET'));
  const { appToken, tableId } = await resolveBitableLocation(sourceUrl, accessToken);
  const records = await listBitableRecords(appToken, tableId, accessToken);

  const attachmentTokens = records.flatMap((record) => {
    const fields = record.fields || {};
    return isAttachmentValue(fields['log/截图'])
      ? fields['log/截图'].map((item) => normalizeText(item.file_token)).filter(Boolean)
      : [];
  });
  let urlMap = new Map<string, string>();
  try {
    urlMap = await getTmpDownloadUrls(attachmentTokens, accessToken);
  } catch {
    urlMap = new Map<string, string>();
  }

  const allBugDefects = records
    .map((record) => toDefectIssue(record, sourceUrl, targetSection, urlMap))
    .filter((issue): issue is FeishuDefectIssue => Boolean(issue))
    .filter((issue) => issue.section === targetSection);

  const defects = allBugDefects
    .filter((issue) => !isClosedStatus(issue.status))
    .sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority.localeCompare(right.priority, 'en');
      }
      return right.feedbackTime - left.feedbackTime;
    });

  const attachmentRoot = path.join(outDir, 'attachments');
  let downloadedAttachmentCount = 0;
  for (const issue of defects) {
    downloadedAttachmentCount += await downloadIssueAttachments(issue, attachmentRoot, accessToken);
  }

  const generatedAt = new Date().toISOString();
  const snapshotPath = buildSnapshotPath(outDir);
  const payload: FeishuDefectSyncResult = {
    generatedAt,
    sourceUrl,
    targetSection,
    totalBugCount: allBugDefects.length,
    openBugCount: defects.length,
    attachmentCount: defects.reduce((sum, issue) => sum + issue.attachments.length, 0),
    downloadedAttachmentCount,
    snapshotPath,
    defects,
  };

  fs.writeFileSync(snapshotPath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

async function main(): Promise<void> {
  const sourceUrl = process.argv.includes('--source-url')
    ? process.argv[process.argv.indexOf('--source-url') + 1]
    : undefined;
  const section = process.argv.includes('--section')
    ? process.argv[process.argv.indexOf('--section') + 1]
    : undefined;
  const outDir = process.argv.includes('--out-dir')
    ? process.argv[process.argv.indexOf('--out-dir') + 1]
    : undefined;

  const result = await syncFeishuDefectSource({
    sourceUrl,
    targetSection: section,
    outDir,
  });

  process.stdout.write(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  });
}
