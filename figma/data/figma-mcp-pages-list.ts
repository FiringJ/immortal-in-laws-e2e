/**
 * 从 figma-page-mapping.json 生成「Figma MCP 批量调用清单」。
 * 用于确保后续页面均通过 Figma MCP get_design_context 获取标注后再修样式。
 *
 * 用法：
 *   npx tsx figma/data/figma-mcp-pages-list.ts           # 打印 Markdown 表格
 *   npx tsx figma/data/figma-mcp-pages-list.ts --json   # 打印 JSON（fileKey, route, nodeId, wxssPath）
 */

import * as fs from 'fs';
import * as path from 'path';

const MAPPING_PATH = path.join(__dirname, 'figma-page-mapping.json');

interface FigmaPageMapping {
  fileKey: string;
  pages: Array<{ route: string; figmaName: string; nodeId: string; description?: string }>;
}

function main(): void {
  if (!fs.existsSync(MAPPING_PATH)) {
    console.error('未找到 figma-page-mapping.json');
    process.exit(1);
  }

  const mapping: FigmaPageMapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
  const jsonOut = process.argv.includes('--json');

  if (jsonOut) {
    const list = mapping.pages.map((p) => ({
      fileKey: mapping.fileKey,
      route: p.route,
      nodeId: p.nodeId,
      figmaName: p.figmaName,
      wxssPath: `${p.route}.wxss`,
    }));
    console.log(JSON.stringify(list, null, 2));
    return;
  }

  console.log('| 页面 route | nodeId | wxss 路径（小程序根目录） |');
  console.log('|------------|--------|---------------------------|');
  for (const p of mapping.pages) {
    const wxssPath = `${p.route}.wxss`;
    console.log(`| ${p.route} | ${p.nodeId} | ${wxssPath} |`);
  }
  console.log('');
  console.log('fileKey（所有页面共用）:', mapping.fileKey);
}

main();
