import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

type IssueRow = {
  section: string;
  [key: string]: string;
};

type StatsRecord = {
  key: string;
  count: number;
};

const CLOSED_STATUSES = new Set(['验收通过', '已关闭', '关闭', '已解决', '完成']);
const PRIORITY_ORDER: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };

function getArgValue(flag: string): string {
  const index = process.argv.indexOf(flag);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

function getPositionalArgs(): string[] {
  return process.argv.slice(2).filter((arg, idx, arr) => {
    if (arg.startsWith('--')) return false;
    const prev = arr[idx - 1];
    if (prev === '--out-dir') return false;
    return true;
  });
}

function normalizeText(value: string): string {
  return value.replace(/\r/g, '').trim();
}

function toIssueRows(raw: string): IssueRow[] {
  const lines = raw.replace(/\r/g, '').split('\n');
  const rows: IssueRow[] = [];
  let section = '';
  let headers: string[] | null = null;
  let pending: string[] | null = null;

  const flushPending = () => {
    if (!headers || !pending) return;
    const row: IssueRow = { section };
    headers.forEach((header, index) => {
      row[header] = pending?.[index] ?? '';
    });
    const hasValue = headers.some((header) => (row[header] || '').trim().length > 0);
    if (hasValue) rows.push(row);
    pending = null;
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushPending();
      headers = null;
      section = line.slice(3).trim();
      continue;
    }

    if (line.includes('\t') && line.includes('问题描述') && line.includes('优先级') && line.includes('当前状态')) {
      flushPending();
      headers = line.split('\t');
      continue;
    }

    if (!headers) continue;

    if (!line.trim()) {
      continue;
    }

    const parts = line.split('\t');
    if (parts.length >= headers.length) {
      flushPending();
      pending = parts.slice(0, headers.length);
      if (parts.length > headers.length && pending.length > 0) {
        pending[headers.length - 1] = `${pending[headers.length - 1]}\t${parts.slice(headers.length).join('\t')}`;
      }
      continue;
    }

    if (pending) {
      const last = headers.length - 1;
      const current = pending[last] || '';
      pending[last] = current ? `${current}\n${line}` : line;
    }
  }

  flushPending();
  return rows;
}

function isDefect(row: IssueRow): boolean {
  const issueType = normalizeText(row['类型'] || '');
  return /bug|缺陷/i.test(issueType);
}

function parseFeedbackDate(feedbackMs: string): string {
  const timestamp = Number(feedbackMs);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date(timestamp));
}

function countBy(rows: IssueRow[], key: string): StatsRecord[] {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    const raw = normalizeText(row[key] || '') || '未填写';
    map.set(raw, (map.get(raw) || 0) + 1);
  });
  return [...map.entries()]
    .map(([k, v]) => ({ key: k, count: v }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key, 'zh-Hans-CN'));
}

function escapeMdCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br/>');
}

function buildRowsTable(rows: IssueRow[]): string {
  const lines = [
    '| # | 优先级 | 当前状态 | 反馈日期 | 跟进人 | 问题描述 |',
    '|---|---|---|---|---|---|',
  ];

  rows.forEach((row, index) => {
    const description = normalizeText(row['问题描述'] || '');
    lines.push(
      `| ${index + 1} | ${escapeMdCell(row['优先级'] || '')} | ${escapeMdCell(row['当前状态'] || '')} | ${parseFeedbackDate(row['反馈时间'] || '')} | ${escapeMdCell(row['跟进人'] || '')} | ${escapeMdCell(description)} |`
    );
  });

  return lines.join('\n');
}

function buildStatsTable(stats: StatsRecord[], title: string): string {
  const lines = [`## ${title}`, '', '| 分类 | 数量 |', '|---|---|'];
  stats.forEach((item) => {
    lines.push(`| ${escapeMdCell(item.key)} | ${item.count} |`);
  });
  lines.push('');
  return lines.join('\n');
}

function sortIssues(rows: IssueRow[]): IssueRow[] {
  return [...rows].sort((a, b) => {
    const pA = PRIORITY_ORDER[normalizeText(a['优先级'] || '').toUpperCase()] ?? 99;
    const pB = PRIORITY_ORDER[normalizeText(b['优先级'] || '').toUpperCase()] ?? 99;
    if (pA !== pB) return pA - pB;

    const tA = Number(a['反馈时间'] || 0);
    const tB = Number(b['反馈时间'] || 0);
    return tB - tA;
  });
}

function main() {
  const [inputUrl] = getPositionalArgs();
  const rawFileArg = getArgValue('--raw-file');
  const sourceUrl = getArgValue('--source-url') || inputUrl || 'N/A';

  if (!rawFileArg && !inputUrl) {
    console.error(
      '用法: npm run feishu:defects -- "<飞书 Wiki/Sheets 链接>" [--out-dir agent-memory/defect-reports]\n' +
      '或: npm run feishu:defects -- --raw-file "<raw.tsv路径>" [--source-url "<原始链接>"] [--out-dir ...]',
    );
    process.exit(1);
  }

  if (!inputUrl) {
    // 允许仅用 raw 文件分析
  }

  const outDir = getArgValue('--out-dir') || 'agent-memory/defect-reports';
  const absOutDir = path.resolve(process.cwd(), outDir);
  fs.mkdirSync(absOutDir, { recursive: true });

  let rawText = '';
  if (rawFileArg) {
    const absRawFile = path.resolve(process.cwd(), rawFileArg);
    if (!fs.existsSync(absRawFile)) {
      console.error(`raw 文件不存在：${absRawFile}`);
      process.exit(1);
    }
    rawText = fs.readFileSync(absRawFile, 'utf8');
  } else {
    const childEnv = { ...process.env };
    delete childEnv.FEISHU_APP_ID;
    delete childEnv.FEISHU_APP_SECRET;

    const fetchResult = spawnSync(
      'node',
      ['--import', 'tsx', 'src/tools/feishu/feishu-fetch-doc.ts', inputUrl],
      { cwd: process.cwd(), env: childEnv, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );

    if (fetchResult.status !== 0) {
      const errorText = (fetchResult.stderr || fetchResult.stdout || '').trim();
      console.error(errorText || '抓取飞书文档失败。');
      process.exit(fetchResult.status || 1);
    }
    rawText = fetchResult.stdout || '';
  }

  const rows = toIssueRows(rawText);
  const defects = rows.filter(isDefect);
  const sortedDefects = sortIssues(defects);
  const openDefects = sortedDefects.filter((row) => !CLOSED_STATUSES.has(normalizeText(row['当前状态'] || '')));

  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
  const baseName = `feishu-defects-${day}`;
  const rawFile = path.join(absOutDir, `${baseName}.raw.tsv`);
  const jsonFile = path.join(absOutDir, `${baseName}.json`);
  const mdFile = path.join(absOutDir, `${baseName}.md`);

  fs.writeFileSync(rawFile, rawText, 'utf8');
  fs.writeFileSync(
    jsonFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceUrl,
        totalRows: rows.length,
        totalDefects: sortedDefects.length,
        totalOpenDefects: openDefects.length,
        defects: sortedDefects.map((row) => ({
          ...row,
          反馈日期: parseFeedbackDate(row['反馈时间'] || ''),
        })),
      },
      null,
      2,
    ),
    'utf8',
  );

  const report = [
    `# 飞书缺陷清单（${day}）`,
    '',
    `- 来源链接：${sourceUrl}`,
    `- 总记录数：${rows.length}`,
    `- 缺陷记录数（类型=BUG）：${sortedDefects.length}`,
    `- 未关闭缺陷数：${openDefects.length}`,
    '',
    buildStatsTable(countBy(sortedDefects, '优先级'), '按优先级统计'),
    buildStatsTable(countBy(sortedDefects, '当前状态'), '按状态统计'),
    '## 未关闭缺陷',
    '',
    openDefects.length > 0 ? buildRowsTable(openDefects) : '当前无未关闭缺陷。',
    '',
    '## 全量缺陷',
    '',
    sortedDefects.length > 0 ? buildRowsTable(sortedDefects) : '未识别到类型为 BUG 的记录。',
    '',
    `> 原始抓取文件：${path.relative(process.cwd(), rawFile)}`,
    `> JSON 明细：${path.relative(process.cwd(), jsonFile)}`,
  ].join('\n');

  fs.writeFileSync(mdFile, report, 'utf8');

  console.log(`缺陷报告已生成：${path.relative(process.cwd(), mdFile)}`);
  console.log(`JSON 明细：${path.relative(process.cwd(), jsonFile)}`);
  console.log(`原始数据：${path.relative(process.cwd(), rawFile)}`);
}

main();
