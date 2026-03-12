#!/usr/bin/env npx tsx
require('../../setup-env.js');

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type CliCommand = 'snapshot';

type CliArgs = {
  command: CliCommand;
  fileKey?: string;
  mappingPath?: string;
  outPath?: string;
  pretty: boolean;
  silent: boolean;
};

type MappingFile = {
  fileKey?: string;
  pages?: Array<{
    nodeId?: string;
  }>;
};

type FigmaNode = {
  id: string;
  name?: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  absoluteBoundingBox?: BoundingBox;
  absoluteRenderBounds?: BoundingBox;
  layoutMode?: string;
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  fills?: unknown;
  strokes?: unknown;
  opacity?: number;
  style?: Record<string, unknown>;
  componentId?: string;
  componentProperties?: Record<string, unknown>;
  variantProperties?: Record<string, unknown>;
};

type BoundingBox = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type FigmaFileResponse = {
  name?: string;
  lastModified?: string;
  document?: FigmaNode;
};

type ResolvedConfig = {
  command: CliCommand;
  fileKey: string;
  mappingPath: string;
  outPath: string;
  pretty: boolean;
  silent: boolean;
  mappingNodeIds: string[];
};

type NodeAnnotation = {
  nodeId: string;
  name: string;
  type: string;
  visible: boolean;
  x: number | null;
  y: number | null;
  width: number | null;
  height: number | null;
  layoutMode: string | null;
  padding: {
    left: number | null;
    right: number | null;
    top: number | null;
    bottom: number | null;
  };
  itemSpacing: number | null;
  fills: unknown;
  strokes: unknown;
  opacity: number | null;
  text: {
    fontFamily: string | null;
    fontWeight: number | null;
    fontSize: number | null;
    lineHeight: number | null;
    letterSpacing: number | null;
  };
  component: {
    componentId: string | null;
    componentProperties: Record<string, unknown> | null;
    variant: Record<string, unknown> | null;
  };
  fingerprint: string;
};

type CacheSnapshot = {
  generatedAt: string;
  fileKey: string;
  fileName: string | null;
  lastModified: string | null;
  stats: {
    topLevelFrameCount: number;
    totalNodeCount: number;
    keyNodeCount: number;
    missingKeyNodeCount: number;
  };
  keyNodeIds: string[];
  missingKeyNodeIds: string[];
  keyNodes: NodeAnnotation[];
};

class CliError extends Error {
  exitCode: number;

  constructor(message: string, exitCode: number) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

const DEFAULT_MAPPING_PATH = path.resolve(__dirname, '../../figma/data/figma-page-mapping.json');
const DEFAULT_OUT_PATH = path.resolve(__dirname, '../../figma/cache/figma-cache.json');
const FIGMA_REST_BASE_URL = 'https://api.figma.com/v1';

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: 'snapshot',
    pretty: true,
    silent: false,
  };

  let index = 0;
  if (argv[index] && !argv[index].startsWith('--')) {
    if (argv[index] !== 'snapshot') {
      throw new CliError(`Unsupported command: ${argv[index]}. Only "snapshot" is supported.`, 2);
    }
    args.command = 'snapshot';
    index += 1;
  }

  while (index < argv.length) {
    const token = argv[index];
    switch (token) {
      case '--file-key': {
        const value = argv[index + 1];
        if (!value) {
          throw new CliError('Missing value for --file-key', 2);
        }
        args.fileKey = value;
        index += 2;
        break;
      }
      case '--mapping': {
        const value = argv[index + 1];
        if (!value) {
          throw new CliError('Missing value for --mapping', 2);
        }
        args.mappingPath = value;
        index += 2;
        break;
      }
      case '--out': {
        const value = argv[index + 1];
        if (!value) {
          throw new CliError('Missing value for --out', 2);
        }
        args.outPath = value;
        index += 2;
        break;
      }
      case '--pretty':
        args.pretty = true;
        index += 1;
        break;
      case '--silent':
        args.silent = true;
        index += 1;
        break;
      default:
        throw new CliError(`Unknown argument: ${token}`, 2);
    }
  }

  return args;
}

function resolvePathFromCwd(target: string): string {
  if (path.isAbsolute(target)) {
    return target;
  }
  return path.resolve(process.cwd(), target);
}

function parseMappingFile(mappingPath: string): MappingFile {
  if (!fs.existsSync(mappingPath)) {
    throw new CliError(`Mapping file not found: ${mappingPath}`, 1);
  }

  const raw = fs.readFileSync(mappingPath, 'utf8');
  try {
    return JSON.parse(raw) as MappingFile;
  } catch (error: any) {
    throw new CliError(`Failed to parse mapping JSON: ${error.message}`, 1);
  }
}

function resolveConfig(args: CliArgs): ResolvedConfig {
  const mappingPath = resolvePathFromCwd(args.mappingPath ?? DEFAULT_MAPPING_PATH);
  const mapping = parseMappingFile(mappingPath);

  const fileKey = (args.fileKey ?? mapping.fileKey ?? '').trim();
  if (!fileKey) {
    throw new CliError('Missing fileKey. Provide --file-key or ensure mapping file contains fileKey.', 2);
  }

  const mappingNodeIds = (mapping.pages ?? [])
    .map((page) => (page.nodeId ?? '').trim())
    .filter((nodeId) => nodeId.length > 0);

  const outPath = resolvePathFromCwd(args.outPath ?? DEFAULT_OUT_PATH);

  return {
    command: args.command,
    fileKey,
    mappingPath,
    outPath,
    pretty: args.pretty,
    silent: args.silent,
    mappingNodeIds,
  };
}

function getFigmaToken(): string {
  const token = process.env.FIGMA_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new CliError('Missing FIGMA_ACCESS_TOKEN in environment.', 1);
  }
  return token;
}

async function fetchFigmaFileTree(fileKey: string, token: string): Promise<FigmaFileResponse> {
  const url = `${FIGMA_REST_BASE_URL}/files/${encodeURIComponent(fileKey)}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Figma-Token': token,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    const snippet = body.length > 400 ? `${body.slice(0, 400)}...` : body;
    throw new CliError(`Figma API request failed (${response.status}): ${snippet}`, 1);
  }

  const payload = (await response.json()) as FigmaFileResponse;
  if (!payload.document) {
    throw new CliError('Figma API response missing document tree.', 1);
  }

  return payload;
}

function walkTree(node: FigmaNode, fn: (value: FigmaNode) => void): void {
  fn(node);
  for (const child of node.children ?? []) {
    walkTree(child, fn);
  }
}

function buildNodeIndex(root: FigmaNode): Map<string, FigmaNode> {
  const index = new Map<string, FigmaNode>();
  walkTree(root, (node) => {
    index.set(node.id, node);
  });
  return index;
}

function collectTopLevelFrames(root: FigmaNode): FigmaNode[] {
  const frames: FigmaNode[] = [];
  const canvases = root.children ?? [];
  for (const canvas of canvases) {
    for (const child of canvas.children ?? []) {
      if (child.type === 'FRAME') {
        frames.push(child);
      }
    }
  }
  return frames;
}

function computeStats(root: FigmaNode): { topLevelFrameCount: number; totalNodeCount: number } {
  let totalNodeCount = 0;
  walkTree(root, () => {
    totalNodeCount += 1;
  });

  const topLevelFrameCount = collectTopLevelFrames(root).length;
  return { topLevelFrameCount, totalNodeCount };
}

function getBounding(node: FigmaNode): BoundingBox | null {
  return node.absoluteBoundingBox ?? node.absoluteRenderBounds ?? null;
}

function getStyleNumber(style: Record<string, unknown> | undefined, key: string): number | null {
  if (!style) {
    return null;
  }
  const value = style[key];
  if (typeof value === 'number') {
    return value;
  }
  return null;
}

function getStyleString(style: Record<string, unknown> | undefined, key: string): string | null {
  if (!style) {
    return null;
  }
  const value = style[key];
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

function normalizeForHash(input: unknown): unknown {
  if (input === null || input === undefined) {
    return null;
  }
  if (typeof input === 'number') {
    return Number(input.toFixed(4));
  }
  if (Array.isArray(input)) {
    return input.map((item) => normalizeForHash(item));
  }
  if (typeof input === 'object') {
    const value = input as Record<string, unknown>;
    const keys = Object.keys(value).sort();
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      result[key] = normalizeForHash(value[key]);
    }
    return result;
  }
  return input;
}

function buildFingerprint(input: unknown): string {
  const normalized = normalizeForHash(input);
  const serialized = JSON.stringify(normalized);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

function toAnnotation(node: FigmaNode): NodeAnnotation {
  const bounds = getBounding(node);
  const style = node.style;
  const text = {
    fontFamily: getStyleString(style, 'fontFamily'),
    fontWeight: getStyleNumber(style, 'fontWeight'),
    fontSize: getStyleNumber(style, 'fontSize'),
    lineHeight: getStyleNumber(style, 'lineHeightPx'),
    letterSpacing: getStyleNumber(style, 'letterSpacing'),
  };

  const component = {
    componentId: node.componentId ?? null,
    componentProperties: node.componentProperties ?? null,
    variant: node.variantProperties ?? null,
  };

  const annotationWithoutFingerprint = {
    nodeId: node.id,
    name: node.name ?? '',
    type: node.type,
    visible: node.visible !== false,
    x: bounds?.x ?? null,
    y: bounds?.y ?? null,
    width: bounds?.width ?? null,
    height: bounds?.height ?? null,
    layoutMode: node.layoutMode ?? null,
    padding: {
      left: node.paddingLeft ?? null,
      right: node.paddingRight ?? null,
      top: node.paddingTop ?? null,
      bottom: node.paddingBottom ?? null,
    },
    itemSpacing: node.itemSpacing ?? null,
    fills: node.fills ?? null,
    strokes: node.strokes ?? null,
    opacity: node.opacity ?? null,
    text,
    component,
  };

  return {
    ...annotationWithoutFingerprint,
    fingerprint: buildFingerprint(annotationWithoutFingerprint),
  };
}

function collectKeyNodes(params: {
  root: FigmaNode;
  nodeIndex: Map<string, FigmaNode>;
  mappingNodeIds: string[];
}): {
  keyNodeIds: string[];
  missingKeyNodeIds: string[];
  keyNodes: NodeAnnotation[];
} {
  const topLevelFrameIds = collectTopLevelFrames(params.root).map((node) => node.id);
  const keyNodeIds = Array.from(new Set([...topLevelFrameIds, ...params.mappingNodeIds]));

  const missingKeyNodeIds: string[] = [];
  const keyNodes: NodeAnnotation[] = [];

  for (const nodeId of keyNodeIds) {
    const node = params.nodeIndex.get(nodeId);
    if (!node) {
      missingKeyNodeIds.push(nodeId);
      continue;
    }
    keyNodes.push(toAnnotation(node));
  }

  return {
    keyNodeIds,
    missingKeyNodeIds,
    keyNodes,
  };
}

function writeCacheFile(filePath: string, payload: CacheSnapshot, pretty: boolean): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });

  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);
  const content = pretty ? `${JSON.stringify(payload, null, 2)}\n` : JSON.stringify(payload);

  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, filePath);
}

async function runSnapshot(config: ResolvedConfig): Promise<CacheSnapshot> {
  const token = getFigmaToken();
  const figmaFile = await fetchFigmaFileTree(config.fileKey, token);
  const root = figmaFile.document as FigmaNode;
  const nodeIndex = buildNodeIndex(root);

  const stats = computeStats(root);
  const keyNodeResult = collectKeyNodes({
    root,
    nodeIndex,
    mappingNodeIds: config.mappingNodeIds,
  });

  return {
    generatedAt: new Date().toISOString(),
    fileKey: config.fileKey,
    fileName: figmaFile.name ?? null,
    lastModified: figmaFile.lastModified ?? null,
    stats: {
      topLevelFrameCount: stats.topLevelFrameCount,
      totalNodeCount: stats.totalNodeCount,
      keyNodeCount: keyNodeResult.keyNodes.length,
      missingKeyNodeCount: keyNodeResult.missingKeyNodeIds.length,
    },
    keyNodeIds: keyNodeResult.keyNodeIds,
    missingKeyNodeIds: keyNodeResult.missingKeyNodeIds,
    keyNodes: keyNodeResult.keyNodes,
  };
}

function printSummary(config: ResolvedConfig, payload: CacheSnapshot): void {
  if (config.silent) {
    return;
  }

  console.log('[figma-cache] Snapshot completed');
  console.log(`- fileKey: ${payload.fileKey}`);
  console.log(`- fileName: ${payload.fileName ?? 'n/a'}`);
  console.log(`- lastModified: ${payload.lastModified ?? 'n/a'}`);
  console.log(`- topLevelFrameCount: ${payload.stats.topLevelFrameCount}`);
  console.log(`- totalNodeCount: ${payload.stats.totalNodeCount}`);
  console.log(`- keyNodeCount: ${payload.stats.keyNodeCount}`);
  console.log(`- missingKeyNodeCount: ${payload.stats.missingKeyNodeCount}`);
  console.log(`- output: ${config.outPath}`);
}

async function main(): Promise<void> {
  const cliArgs = parseArgs(process.argv.slice(2));
  const config = resolveConfig(cliArgs);

  if (config.command !== 'snapshot') {
    throw new CliError(`Unsupported command: ${config.command}`, 2);
  }

  const snapshot = await runSnapshot(config);
  writeCacheFile(config.outPath, snapshot, config.pretty);
  printSummary(config, snapshot);
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(`[figma-cache] ${error.message}`);
    process.exit(error.exitCode);
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error(`[figma-cache] ${message}`);
  process.exit(1);
});
