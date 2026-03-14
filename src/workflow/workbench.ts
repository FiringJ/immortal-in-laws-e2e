export function renderWorkbenchHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>神仙亲家 Workflow Workbench</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe5;
        --panel: rgba(255, 251, 245, 0.95);
        --card: #fffdf8;
        --line: rgba(78, 58, 34, 0.14);
        --text: #2c241b;
        --muted: #7c6f62;
        --accent: #b5512d;
        --accent-soft: rgba(181, 81, 45, 0.12);
        --ok: #22663a;
        --warn: #925f19;
        --danger: #9f2f2f;
        --shadow: 0 18px 40px rgba(87, 63, 34, 0.12);
        font-family: "PingFang SC", "Hiragino Sans GB", "Noto Sans CJK SC", sans-serif;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background:
          radial-gradient(circle at top left, rgba(181, 81, 45, 0.16), transparent 32%),
          radial-gradient(circle at right 20%, rgba(77, 125, 94, 0.12), transparent 28%),
          linear-gradient(180deg, #fbf6ee 0%, var(--bg) 52%, #efe6d7 100%);
        color: var(--text);
      }

      .shell {
        display: grid;
        grid-template-columns: minmax(0, 1.7fr) minmax(360px, 0.9fr);
        gap: 18px;
        min-height: 100vh;
        padding: 18px;
      }

      .panel {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: var(--shadow);
        backdrop-filter: blur(14px);
      }

      .main {
        padding: 18px;
        display: grid;
        gap: 18px;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: flex-start;
      }

      .hero h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.1;
      }

      .hero p {
        margin: 8px 0 0;
        color: var(--muted);
        max-width: 760px;
      }

      .hero .meta {
        font-size: 13px;
        color: var(--muted);
        text-align: right;
        min-width: 180px;
      }

      .toolbar {
        display: grid;
        grid-template-columns: repeat(3, minmax(120px, 180px)) 1fr;
        gap: 12px;
        align-items: end;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field label {
        font-size: 12px;
        letter-spacing: 0.03em;
        text-transform: uppercase;
        color: var(--muted);
      }

      input, select, textarea, button {
        font: inherit;
      }

      input, select, textarea {
        width: 100%;
        padding: 10px 12px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.92);
        color: var(--text);
      }

      textarea {
        min-height: 94px;
        resize: vertical;
      }

      button {
        border: 0;
        border-radius: 999px;
        padding: 10px 14px;
        cursor: pointer;
        background: var(--accent);
        color: white;
        transition: transform 0.16s ease, opacity 0.16s ease;
      }

      button:hover { transform: translateY(-1px); }
      button.secondary {
        background: rgba(44, 36, 27, 0.08);
        color: var(--text);
      }

      button.ghost {
        background: transparent;
        color: var(--muted);
        border: 1px solid var(--line);
      }

      button:disabled {
        opacity: 0.52;
        cursor: not-allowed;
        transform: none;
      }

      .create {
        display: grid;
        gap: 12px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.42);
        border: 1px solid var(--line);
        border-radius: 20px;
      }

      .create-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .create-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      .status {
        font-size: 13px;
        color: var(--muted);
      }

      .board {
        display: grid;
        grid-template-columns: repeat(6, minmax(240px, 1fr));
        gap: 14px;
        overflow-x: auto;
        padding-bottom: 6px;
      }

      .column {
        display: grid;
        gap: 10px;
        align-content: start;
        min-height: 300px;
      }

      .column-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.64);
        border: 1px solid var(--line);
        position: sticky;
        top: 0;
        z-index: 1;
      }

      .count {
        min-width: 30px;
        text-align: center;
        padding: 4px 8px;
        border-radius: 999px;
        background: var(--accent-soft);
        color: var(--accent);
        font-size: 12px;
      }

      .card {
        background: var(--card);
        border-radius: 18px;
        border: 1px solid var(--line);
        padding: 14px;
        display: grid;
        gap: 10px;
        cursor: pointer;
      }

      .card:hover,
      .card.active {
        border-color: rgba(181, 81, 45, 0.5);
        box-shadow: 0 12px 30px rgba(181, 81, 45, 0.12);
      }

      .card-top {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
      }

      .tag {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: rgba(44, 36, 27, 0.08);
        color: var(--text);
      }

      .tag.requirement {
        background: rgba(58, 111, 164, 0.12);
        color: #275c90;
      }

      .tag.bug {
        background: rgba(159, 47, 47, 0.12);
        color: var(--danger);
      }

      .stage-pill {
        font-size: 12px;
        color: var(--accent);
        background: var(--accent-soft);
        padding: 4px 8px;
        border-radius: 999px;
      }

      .card h3 {
        margin: 0;
        font-size: 16px;
        line-height: 1.35;
      }

      .meta-list {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
      }

      .detail {
        padding: 18px;
        display: grid;
        grid-template-rows: auto auto auto 1fr;
        gap: 16px;
        min-height: calc(100vh - 36px);
      }

      .detail-empty {
        display: grid;
        place-items: center;
        color: var(--muted);
        border: 1px dashed var(--line);
        border-radius: 18px;
        min-height: 280px;
      }

      .detail-head {
        display: grid;
        gap: 10px;
      }

      .detail-head h2 {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
      }

      .detail-head .row {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }

      .action-bar {
        display: grid;
        gap: 10px;
      }

      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .tab {
        background: rgba(44, 36, 27, 0.06);
        color: var(--muted);
      }

      .tab.active {
        background: var(--text);
        color: white;
      }

      .tab-panel {
        border: 1px solid var(--line);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.56);
        padding: 16px;
        overflow: auto;
      }

      .section {
        display: grid;
        gap: 10px;
      }

      .kv {
        display: grid;
        grid-template-columns: 96px 1fr;
        gap: 6px 10px;
        align-items: start;
        font-size: 14px;
      }

      .kv strong {
        color: var(--muted);
        font-weight: 600;
      }

      pre {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        background: #fff;
        border-radius: 16px;
        border: 1px solid var(--line);
        padding: 14px;
        line-height: 1.5;
      }

      .source-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
      }

      .batch-panel {
        display: grid;
        gap: 14px;
        padding: 16px;
        background: rgba(255, 255, 255, 0.48);
        border: 1px solid var(--line);
        border-radius: 20px;
      }

      .batch-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        align-items: center;
      }

      .batch-stats {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
      }

      .batch-stat {
        padding: 12px;
        border-radius: 16px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.76);
      }

      .batch-stat strong {
        display: block;
        font-size: 22px;
      }

      .batch-runs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .batch-run-button {
        background: rgba(44, 36, 27, 0.06);
        color: var(--text);
      }

      .batch-run-button.active {
        background: var(--text);
        color: white;
      }

      .batch-columns {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .batch-column {
        padding: 12px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.72);
        display: grid;
        gap: 8px;
        align-content: start;
        min-height: 180px;
      }

      .batch-entry {
        padding: 10px;
        border-radius: 14px;
        border: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.9);
        display: grid;
        gap: 6px;
      }

      .batch-entry button {
        justify-self: start;
      }

      .source-attachment {
        display: grid;
        gap: 8px;
        padding: 10px;
        border: 1px solid var(--line);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.75);
      }

      .source-attachment img {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #fff;
      }

      .timeline {
        display: grid;
        gap: 12px;
      }

      .run {
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.72);
      }

      .run-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 10px;
      }

      .run-body {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 13px;
      }

      .good { color: var(--ok); }
      .warning { color: var(--warn); }
      .danger { color: var(--danger); }

      @media (max-width: 1200px) {
        .shell {
          grid-template-columns: 1fr;
        }

        .detail {
          min-height: auto;
        }
      }

      @media (max-width: 800px) {
        .toolbar,
        .create-grid,
        .batch-stats,
        .batch-columns {
          grid-template-columns: 1fr;
        }

        .hero {
          display: grid;
        }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <main class="panel main">
        <section class="hero">
          <div>
            <h1>神仙亲家小程序 Workflow Workbench</h1>
            <p>统一承载需求流和 bug 流。这里可以收任务、审 plan、发起执行、查看验证证据，并把结论落到 agent-memory。</p>
          </div>
          <div class="meta" id="hero-meta">加载中...</div>
        </section>

        <section class="create">
          <div class="create-grid">
            <div class="field">
              <label for="create-kind">类型</label>
              <select id="create-kind">
                <option value="requirement">需求</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div class="field">
              <label for="create-agent">Preferred Agent</label>
              <select id="create-agent">
                <option value="">默认</option>
                <option value="codex">codex</option>
                <option value="claude">claude</option>
                <option value="cursor-agent">cursor-agent</option>
              </select>
            </div>
            <div class="field">
              <label for="create-title">标题</label>
              <input id="create-title" placeholder="例如：聊天页图片发送异常" />
            </div>
            <div class="field">
              <label for="create-cwd">工作目录</label>
              <input id="create-cwd" placeholder="留空则按现有 daemon 规则推断" />
            </div>
          </div>
          <div class="field">
            <label for="create-raw">原始输入</label>
            <textarea id="create-raw" placeholder="贴需求描述、bug 说明或飞书同步内容"></textarea>
          </div>
          <div class="field">
            <label for="create-criteria">验收标准</label>
            <textarea id="create-criteria" placeholder="可选，建议写清通过标准"></textarea>
          </div>
          <div class="create-actions">
            <div class="status" id="form-status">手工入口会创建 workflow item，不会走旧的 /task 调试接口。</div>
            <button id="create-submit" type="button">创建工作项</button>
          </div>
        </section>

        <section class="toolbar">
          <div class="field">
            <label for="filter-kind">类型筛选</label>
            <select id="filter-kind">
              <option value="">全部</option>
              <option value="requirement">需求</option>
              <option value="bug">Bug</option>
            </select>
          </div>
          <div class="field">
            <label for="filter-source">来源筛选</label>
            <select id="filter-source">
              <option value="">全部</option>
              <option value="manual">手工</option>
              <option value="feishu">飞书</option>
            </select>
          </div>
          <div class="field">
            <label for="filter-status">状态筛选</label>
            <select id="filter-status">
              <option value="all">全部</option>
              <option value="active">进行中</option>
              <option value="blocked">阻塞</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div class="field">
            <label>&nbsp;</label>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="refresh-board" type="button" class="secondary">刷新看板</button>
              <button id="sync-feishu-defects" type="button" class="secondary">同步飞书缺陷</button>
              <button id="generate-bug-triage-batch" type="button" class="secondary">批量 Triage 飞书 Bug</button>
              <button id="generate-bug-plan-batch" type="button">批量生成 P0/P1 Bug Plan</button>
            </div>
          </div>
        </section>

        <section id="triage-batch-panel" class="batch-panel"></section>
        <section id="plan-batch-panel" class="batch-panel"></section>
        <section id="board" class="board"></section>
      </main>

      <aside class="panel detail" id="detail"></aside>
    </div>

    <script>
      const state = {
        board: null,
        triageBatchList: null,
        triageBatchDetail: null,
        selectedTriageBatchId: null,
        batchList: null,
        batchDetail: null,
        selectedBatchId: null,
        detail: null,
        selectedId: null,
        tab: 'overview',
        filters: {
          kind: '',
          source: '',
          status: 'all'
        }
      };

      function escapeHtml(value) {
        return String(value || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function formatDate(value) {
        if (!value) return 'n/a';
        try {
          return new Date(value).toLocaleString('zh-CN', { hour12: false });
        } catch {
          return value;
        }
      }

      async function requestJson(url, options) {
        const response = await fetch(url, options);
        const data = await response.json();
        if (!response.ok || data.success === false) {
          throw new Error(data.error || data.message || '请求失败');
        }
        return data;
      }

      async function loadBoard() {
        const params = new URLSearchParams();
        if (state.filters.kind) params.set('kind', state.filters.kind);
        if (state.filters.source) params.set('source', state.filters.source);
        if (state.filters.status) params.set('status', state.filters.status);
        const [boardData, triageBatchListData, batchListData] = await Promise.all([
          requestJson('/workflow/board?' + params.toString()),
          requestJson('/workflow/triage-batches?limit=8'),
          requestJson('/workflow/plan-batches?limit=8')
        ]);
        state.board = boardData;
        state.triageBatchList = triageBatchListData;
        state.batchList = batchListData;
        const nextTriageBatchId = state.selectedTriageBatchId || triageBatchListData.activeBatchId || (triageBatchListData.runs && triageBatchListData.runs[0] ? triageBatchListData.runs[0].id : null);
        if (nextTriageBatchId) {
          await loadTriageBatchDetail(nextTriageBatchId, true);
        } else {
          state.triageBatchDetail = null;
          renderTriageBatchPanel();
        }
        const nextBatchId = state.selectedBatchId || batchListData.activeBatchId || (batchListData.runs && batchListData.runs[0] ? batchListData.runs[0].id : null);
        if (nextBatchId) {
          await loadBatchDetail(nextBatchId, true);
        } else {
          state.batchDetail = null;
          renderBatchPanel();
        }
        renderBoard();
        renderHero();
        if (state.selectedId) {
          await loadDetail(state.selectedId);
        }
      }

      async function loadDetail(id) {
        const data = await requestJson('/workflow/items/' + encodeURIComponent(id));
        state.detail = data;
        state.selectedId = id;
        renderBoard();
        renderDetail();
      }

      async function loadBatchDetail(id, silent) {
        try {
          const data = await requestJson('/workflow/plan-batches/' + encodeURIComponent(id));
          state.batchDetail = data.batch;
          state.selectedBatchId = id;
          renderBatchPanel();
        } catch (error) {
          if (!silent) {
            throw error;
          }
        }
      }

      async function loadTriageBatchDetail(id, silent) {
        try {
          const data = await requestJson('/workflow/triage-batches/' + encodeURIComponent(id));
          state.triageBatchDetail = data.batch;
          state.selectedTriageBatchId = id;
          renderTriageBatchPanel();
        } catch (error) {
          if (!silent) {
            throw error;
          }
        }
      }

      async function syncFeishuDefects() {
        const statusNode = document.getElementById('form-status');
        try {
          statusNode.textContent = '正在拉取飞书缺陷并导入 workbench...';
          const data = await requestJson('/workflow/sources/feishu-defects/sync', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
          });
          statusNode.textContent = '飞书缺陷已同步：新增 ' + data.import.created + '，更新 ' + data.import.updated + '，跳过 ' + data.import.skipped + '，附件下载 ' + data.sync.downloadedAttachmentCount;
          await loadBoard();
          if (!state.selectedId && data.import.itemIds && data.import.itemIds.length > 0) {
            await loadDetail(data.import.itemIds[0]);
          }
        } catch (error) {
          statusNode.textContent = error.message || String(error);
        }
      }

      async function generateBugTriageBatch() {
        const statusNode = document.getElementById('form-status');
        try {
          statusNode.textContent = '正在启动飞书 Bug triage 批量清洗...';
          const data = await requestJson('/workflow/triage-batches', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
          });
          state.selectedTriageBatchId = data.batch.id;
          statusNode.textContent = '已启动 triage 批次：' + data.batch.id;
          await loadBoard();
        } catch (error) {
          statusNode.textContent = error.message || String(error);
        }
      }

      async function generateBugPlanBatch() {
        const statusNode = document.getElementById('form-status');
        try {
          statusNode.textContent = '正在启动 P0/P1 Bug 批量计划生成...';
          const data = await requestJson('/workflow/plan-batches', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({})
          });
          state.selectedBatchId = data.batch.id;
          statusNode.textContent = '已启动批量计划：' + data.batch.id;
          await loadBoard();
        } catch (error) {
          statusNode.textContent = error.message || String(error);
        }
      }

      function renderHero() {
        const meta = document.getElementById('hero-meta');
        if (!state.board) {
          meta.textContent = '加载中...';
          return;
        }
        meta.innerHTML = [
          '<div>工作项总数：' + state.board.total + '</div>',
          '<div>默认 Agent：' + escapeHtml(state.board.defaultAgent || 'unknown') + '</div>',
          '<div>更新时间：' + formatDate(state.board.generatedAt) + '</div>'
        ].join('');
      }

      function renderTriageBatchPanel() {
        const root = document.getElementById('triage-batch-panel');
        if (!state.triageBatchList || !state.triageBatchDetail) {
          root.innerHTML = '<div class="status">暂无 triage 批次。先批量清洗飞书 bug，再进入 plan 生成。</div>';
          return;
        }

        const batch = state.triageBatchDetail;
        const ready = batch.entries.filter(function(entry) { return entry.status === 'ready'; });
        const needsHuman = batch.entries.filter(function(entry) { return entry.status === 'needs_human'; });
        const failed = batch.entries.filter(function(entry) { return entry.status === 'failed'; });
        const skipped = batch.entries.filter(function(entry) { return entry.status === 'skipped'; });
        const runButtons = (state.triageBatchList.runs || []).map(function(run) {
          const active = run.id === batch.id ? 'active' : '';
          return '<button type="button" class="batch-run-button ' + active + '" data-triage-batch-id="' + escapeHtml(run.id) + '">' + escapeHtml(run.id) + '</button>';
        }).join('');

        function renderEntry(entry, kind) {
          const detailButton = (kind === 'ready' || kind === 'needs_human')
            ? '<button type="button" class="secondary" data-triage-item-id="' + escapeHtml(entry.itemId) + '">查看详情</button>'
            : '';
          return [
            '<div class="batch-entry">',
              '<strong>' + escapeHtml(entry.title) + '</strong>',
              '<div class="status">Item: ' + escapeHtml(entry.itemId) + '</div>',
              '<div class="status">优先级: ' + escapeHtml(entry.priority || 'n/a') + ' · 飞书状态: ' + escapeHtml(entry.externalStatus || 'n/a') + '</div>',
              entry.reason ? '<div class="' + (kind === 'failed' ? 'danger' : 'warning') + '">' + escapeHtml(entry.reason) + '</div>' : '',
              detailButton,
            '</div>'
          ].join('');
        }

        root.innerHTML = [
          '<div class="batch-head">',
            '<div>',
              '<h3 style="margin:0;">Triage 结果队列</h3>',
              '<div class="status">批次：' + escapeHtml(batch.id) + ' · 状态：' + escapeHtml(batch.status) + '</div>',
              batch.failedReason ? '<div class="danger">批次异常：' + escapeHtml(batch.failedReason) + '</div>' : '',
            '</div>',
            '<div class="batch-runs">' + runButtons + '</div>',
          '</div>',
          '<div class="batch-stats">',
            '<div class="batch-stat"><span class="status">候选</span><strong>' + batch.candidateCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">Ready</span><strong class="good">' + batch.readyCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">需人工</span><strong class="warning">' + batch.needsHumanCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">失败</span><strong class="danger">' + batch.failedCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">跳过</span><strong>' + batch.skippedCount + '</strong></div>',
          '</div>',
          '<div class="batch-columns">',
            '<section class="batch-column"><strong>Ready</strong>' + (ready.length ? ready.map(function(entry) { return renderEntry(entry, 'ready'); }).join('') : '<div class="status">暂无</div>') + '</section>',
            '<section class="batch-column"><strong>需人工补充</strong>' + (needsHuman.length ? needsHuman.map(function(entry) { return renderEntry(entry, 'needs_human'); }).join('') : '<div class="status">暂无</div>') + '</section>',
            '<section class="batch-column"><strong>失败 / 跳过</strong>' + ((failed.length || skipped.length) ? failed.map(function(entry) { return renderEntry(entry, 'failed'); }).join('') + skipped.map(function(entry) { return renderEntry(entry, 'skipped'); }).join('') : '<div class="status">暂无</div>') + '</section>',
          '</div>'
        ].join('');

        root.querySelectorAll('[data-triage-batch-id]').forEach(function(node) {
          node.addEventListener('click', function() {
            loadTriageBatchDetail(node.getAttribute('data-triage-batch-id'));
          });
        });

        root.querySelectorAll('[data-triage-item-id]').forEach(function(node) {
          node.addEventListener('click', function() {
            loadDetail(node.getAttribute('data-triage-item-id'));
          });
        });
      }

      function renderBatchPanel() {
        const root = document.getElementById('plan-batch-panel');
        if (!state.batchList || !state.batchDetail) {
          root.innerHTML = '<div class="status">暂无计划批次。点击“批量生成 P0/P1 Bug Plan”后，这里会显示本次生成结果队列。</div>';
          return;
        }

        const batch = state.batchDetail;
        const succeeded = batch.entries.filter(function(entry) { return entry.status === 'succeeded'; });
        const failed = batch.entries.filter(function(entry) { return entry.status === 'failed'; });
        const skipped = batch.entries.filter(function(entry) { return entry.status === 'skipped'; });
        const runButtons = (state.batchList.runs || []).map(function(run) {
          const active = run.id === batch.id ? 'active' : '';
          return '<button type="button" class="batch-run-button ' + active + '" data-batch-id="' + escapeHtml(run.id) + '">' + escapeHtml(run.id) + '</button>';
        }).join('');

        function renderEntry(entry, kind) {
          const detailButton = kind === 'succeeded'
            ? '<button type="button" class="secondary" data-batch-item-id="' + escapeHtml(entry.itemId) + '">查看详情</button>'
            : '';
          return [
            '<div class="batch-entry">',
              '<strong>' + escapeHtml(entry.title) + '</strong>',
              '<div class="status">Item: ' + escapeHtml(entry.itemId) + '</div>',
              '<div class="status">优先级: ' + escapeHtml(entry.priority || 'n/a') + ' · 飞书状态: ' + escapeHtml(entry.externalStatus || 'n/a') + '</div>',
              entry.reason ? '<div class="danger">' + escapeHtml(entry.reason) + '</div>' : '',
              detailButton,
            '</div>'
          ].join('');
        }

        root.innerHTML = [
          '<div class="batch-head">',
            '<div>',
              '<h3 style="margin:0;">生成结果队列</h3>',
              '<div class="status">批次：' + escapeHtml(batch.id) + ' · 状态：' + escapeHtml(batch.status) + '</div>',
              batch.failedReason ? '<div class="danger">失败原因：' + escapeHtml(batch.failedReason) + '</div>' : '',
            '</div>',
            '<div class="batch-runs">' + runButtons + '</div>',
          '</div>',
          '<div class="batch-stats">',
            '<div class="batch-stat"><span class="status">候选</span><strong>' + batch.candidateCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">成功</span><strong class="good">' + batch.successCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">失败</span><strong class="danger">' + batch.failedCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">跳过</span><strong>' + batch.skippedCount + '</strong></div>',
            '<div class="batch-stat"><span class="status">当前项</span><strong>' + escapeHtml(batch.currentEntryItemId || '完成') + '</strong></div>',
          '</div>',
          '<div class="batch-columns">',
            '<section class="batch-column"><strong>成功生成</strong>' + (succeeded.length ? succeeded.map(function(entry) { return renderEntry(entry, 'succeeded'); }).join('') : '<div class="status">暂无</div>') + '</section>',
            '<section class="batch-column"><strong>失败停止</strong>' + (failed.length ? failed.map(function(entry) { return renderEntry(entry, 'failed'); }).join('') : '<div class="status">暂无</div>') + '</section>',
            '<section class="batch-column"><strong>跳过</strong>' + (skipped.length ? skipped.map(function(entry) { return renderEntry(entry, 'skipped'); }).join('') : '<div class="status">暂无</div>') + '</section>',
          '</div>'
        ].join('');

        root.querySelectorAll('[data-batch-id]').forEach(function(node) {
          node.addEventListener('click', function() {
            loadBatchDetail(node.getAttribute('data-batch-id'));
          });
        });

        root.querySelectorAll('[data-batch-item-id]').forEach(function(node) {
          node.addEventListener('click', function() {
            loadDetail(node.getAttribute('data-batch-item-id'));
          });
        });
      }

      function renderBoard() {
        const board = document.getElementById('board');
        if (!state.board) {
          board.innerHTML = '';
          return;
        }

        board.innerHTML = state.board.columns.map(function(column) {
          const cards = column.items.length
            ? column.items.map(function(item) {
                const active = item.id === state.selectedId ? 'active' : '';
                const verification = item.lastVerificationSummary ? escapeHtml(item.lastVerificationSummary) : '暂无';
                const pendingAction = item.pendingActionLabel ? escapeHtml(item.pendingActionLabel) : '无';
                const latestRun = item.latestPhaseRun
                  ? '<div>最近 phase：' + escapeHtml(item.latestPhaseRun.phase) + ' / ' + escapeHtml(item.latestPhaseRun.status) + '</div>'
                  : '<div>最近 phase：暂无</div>';
                const sourceExtras = [
                  item.externalIssueId ? '<div>来源单号：' + escapeHtml(item.externalIssueId) + '</div>' : '',
                  item.attachmentCount ? '<div>截图附件：' + item.attachmentCount + '</div>' : '',
                  item.triageStatus ? '<div>Triage：' + escapeHtml(item.triageStatus) + '</div>' : ''
                ].join('');
                return [
                  '<article class="card ' + active + '" data-item-id="' + escapeHtml(item.id) + '">',
                    '<div class="card-top">',
                      '<span class="tag ' + escapeHtml(item.kind) + '">' + (item.kind === 'requirement' ? '需求' : 'Bug') + '</span>',
                      '<span class="stage-pill">' + escapeHtml(item.stageLabel) + '</span>',
                    '</div>',
                    '<h3>' + escapeHtml(item.title) + '</h3>',
                    '<div class="meta-list">',
                      '<div>来源：' + (item.source === 'feishu' ? '飞书' : '手工') + '</div>',
                      '<div>更新时间：' + formatDate(item.updatedAt) + '</div>',
                      '<div>当前审批：' + pendingAction + '</div>',
                      '<div>最近验证：' + verification + '</div>',
                      sourceExtras,
                      latestRun,
                    '</div>',
                  '</article>'
                ].join('');
              }).join('')
            : '<div class="detail-empty">当前列暂无工作项</div>';

          return [
            '<section class="column">',
              '<div class="column-head">',
                '<strong>' + escapeHtml(column.label) + '</strong>',
                '<span class="count">' + column.items.length + '</span>',
              '</div>',
              cards,
            '</section>'
          ].join('');
        }).join('');

        board.querySelectorAll('[data-item-id]').forEach(function(node) {
          node.addEventListener('click', function() {
            loadDetail(node.getAttribute('data-item-id'));
          });
        });
      }

      function renderArtifactByKey(key) {
        if (!state.detail) return '<div class="detail-empty">请选择工作项</div>';
        const match = state.detail.artifacts.find(function(item) { return item.key === key; });
        if (!match || !match.content) {
          return '<div class="detail-empty">暂无 ' + escapeHtml(key) + ' 产物</div>';
        }
        return '<div class="section"><div class="status">路径：' + escapeHtml(match.path) + '</div><pre>' + escapeHtml(match.content) + '</pre></div>';
      }

      function renderTimeline() {
        if (!state.detail || !state.detail.item.phaseRuns.length) {
          return '<div class="detail-empty">暂无执行记录</div>';
        }

        return '<div class="timeline">' + state.detail.item.phaseRuns.slice().reverse().map(function(run) {
          const statusClass = run.status === 'completed'
            ? 'good'
            : run.status === 'failed'
              ? 'danger'
              : 'warning';
          return [
            '<section class="run">',
              '<div class="run-head">',
                '<strong>' + escapeHtml(run.phase) + '</strong>',
                '<span class="' + statusClass + '">' + escapeHtml(run.status) + '</span>',
              '</div>',
              '<div class="run-body">',
                '<div>触发人：' + escapeHtml(run.triggeredBy || 'system') + '</div>',
                '<div>创建时间：' + formatDate(run.createdAt) + '</div>',
                '<div>开始时间：' + formatDate(run.startedAt) + '</div>',
                '<div>完成时间：' + formatDate(run.completedAt) + '</div>',
                '<div>Task ID：' + escapeHtml(run.taskId || 'n/a') + '</div>',
                '<div>stdout：' + escapeHtml(run.stdoutPath || 'n/a') + '</div>',
                '<div>stderr：' + escapeHtml(run.stderrPath || 'n/a') + '</div>',
                '<div>summary：' + escapeHtml(run.summaryPath || 'n/a') + '</div>',
                '<div>artifact：' + escapeHtml(run.artifactPath || 'n/a') + '</div>',
                '<pre>' + escapeHtml(run.summary || run.error || '无摘要') + '</pre>',
              '</div>',
            '</section>'
          ].join('');
        }).join('') + '</div>';
      }

      function renderApprovals() {
        if (!state.detail || !state.detail.item.approvals.length) {
          return '<div class="status">暂无审批记录</div>';
        }

        return '<div class="timeline">' + state.detail.item.approvals.slice().reverse().map(function(approval) {
          return [
            '<section class="run">',
              '<div class="run-head">',
                '<strong>' + escapeHtml(approval.action) + '</strong>',
                '<span>' + formatDate(approval.at) + '</span>',
              '</div>',
              '<div class="run-body">',
                '<div>执行人：' + escapeHtml(approval.actor) + '</div>',
                '<div>阶段流转：' + escapeHtml(approval.fromStage) + ' → ' + escapeHtml(approval.toStage) + '</div>',
                '<div>备注：' + escapeHtml(approval.note || 'n/a') + '</div>',
              '</div>',
            '</section>'
          ].join('');
        }).join('') + '</div>';
      }

      function renderOverview() {
        if (!state.detail) {
          return '<div class="detail-empty">请选择工作项</div>';
        }

        const item = state.detail.item;
        const sourceMeta = item.sourceMeta || null;
        const attachmentHtml = sourceMeta && sourceMeta.attachments && sourceMeta.attachments.length
          ? '<div class="section"><h3>来源截图/附件</h3><div class="source-gallery">' + sourceMeta.attachments.map(function(attachment, index) {
              const isImage = /image/i.test(String(attachment.contentType || '')) || /\.(png|jpe?g|webp|gif)$/i.test(String(attachment.path || attachment.name || ''));
              const img = attachment.path && isImage
                ? '<img src="/workflow/items/' + encodeURIComponent(item.id) + '/source-attachments/' + index + '" alt="' + escapeHtml(attachment.name) + '" />'
                : '<div class="detail-empty">无图片预览</div>';
              return [
                '<div class="source-attachment">',
                  img,
                  '<div class="status">' + escapeHtml(attachment.name) + '</div>',
                  '<div class="status">' + escapeHtml(attachment.path || attachment.url || '未下载') + '</div>',
                '</div>'
              ].join('');
            }).join('') + '</div></div>'
          : '';

        return [
          '<div class="section">',
            '<div class="kv"><strong>ID</strong><span>' + escapeHtml(item.id) + '</span></div>',
            '<div class="kv"><strong>类型</strong><span>' + (item.kind === 'requirement' ? '需求' : 'Bug') + '</span></div>',
            '<div class="kv"><strong>阶段</strong><span>' + escapeHtml(item.stage) + '</span></div>',
            '<div class="kv"><strong>来源</strong><span>' + (item.source === 'feishu' ? '飞书' : '手工') + '</span></div>',
            '<div class="kv"><strong>来源单号</strong><span>' + escapeHtml(sourceMeta?.externalIssueId || '无') + '</span></div>',
            '<div class="kv"><strong>飞书状态</strong><span>' + escapeHtml(sourceMeta?.externalStatus || '无') + '</span></div>',
            '<div class="kv"><strong>Triage状态</strong><span>' + escapeHtml(item.triage?.status || '未执行') + '</span></div>',
            '<div class="kv"><strong>Triage摘要</strong><span>' + escapeHtml(item.triage?.summary || '暂无') + '</span></div>',
            '<div class="kv"><strong>优先级</strong><span>' + escapeHtml(item.priority) + '</span></div>',
            '<div class="kv"><strong>工作目录</strong><span>' + escapeHtml(item.cwd) + '</span></div>',
            '<div class="kv"><strong>创建时间</strong><span>' + formatDate(item.createdAt) + '</span></div>',
            '<div class="kv"><strong>更新时间</strong><span>' + formatDate(item.updatedAt) + '</span></div>',
            '<div class="kv"><strong>阻塞原因</strong><span>' + escapeHtml(item.blocker || '无') + '</span></div>',
            '<div class="kv"><strong>验收标准</strong><span>' + escapeHtml(item.acceptanceCriteria || '未填写') + '</span></div>',
            '<div class="kv"><strong>原始输入</strong><pre>' + escapeHtml(item.rawInput) + '</pre></div>',
          '</div>',
          attachmentHtml,
          '<h3>审批记录</h3>',
          renderApprovals()
        ].join('');
      }

      function renderWriteback() {
        if (!state.detail) {
          return '<div class="detail-empty">请选择工作项</div>';
        }

        const item = state.detail.item;
        return [
          renderArtifactByKey('writeback'),
          '<div class="section">',
            '<h3>知识回写目标</h3>',
            '<div class="status">project-knowledge.md / known-issues.md / user-feedback-ledger.md</div>',
            '<div class="status">关联 daemon task：' + escapeHtml(item.linkedDaemonTaskIds.join(', ') || '暂无') + '</div>',
          '</div>'
        ].join('');
      }

      function renderTabPanel() {
        if (!state.detail) {
          return '<div class="detail-empty">从左侧选择一个工作项以查看详情</div>';
        }

        if (state.tab === 'overview') return renderOverview();
        if (state.tab === 'triage') return renderArtifactByKey('triage');
        if (state.tab === 'plan') {
          const parts = [renderArtifactByKey('plan')];
          const hasReproduction = state.detail.artifacts.some(function(item) { return item.key === 'reproduction' && item.content; });
          if (hasReproduction) {
            parts.push('<h3>Reproduction</h3>');
            parts.push(renderArtifactByKey('reproduction'));
          }
          return parts.join('');
        }
        if (state.tab === 'playback') return renderTimeline();
        if (state.tab === 'verification') return renderArtifactByKey('verification');
        if (state.tab === 'writeback') return renderWriteback();
        return '<div class="detail-empty">未知标签页</div>';
      }

      function renderDetail() {
        const root = document.getElementById('detail');
        if (!state.detail) {
          root.innerHTML = '<div class="detail-empty">从看板中选择一个工作项，右侧会显示 plan、执行回放、验证结果和落盘内容。</div>';
          return;
        }

        const item = state.detail.item;
        const actionButtons = state.detail.availableActions.map(function(action) {
          const label = action === 'run_triage' ? '执行 Triage'
            : action === 'generate_plan' ? '生成 Plan'
            : action === 'approve_plan' ? '批准 Plan'
            : action === 'request_plan_changes' ? '退回修改'
            : action === 'run_reproduction' ? '复现并定位'
            : action === 'approve_fix_plan' ? '批准修复'
            : action === 'run_execution' ? '执行'
            : action === 'run_verification' ? '发起验证'
            : action === 'approve_close' ? '关闭任务'
            : action === 'block' ? '阻塞'
            : '重新打开';
          const secondary = action === 'block' || action === 'request_plan_changes' || action === 'reopen';
          return '<button type="button" class="' + (secondary ? 'secondary' : '') + '" data-action="' + escapeHtml(action) + '">' + label + '</button>';
        }).join('');

        const tabs = [
          ['overview', '概览'],
          ['triage', 'Triage'],
          ['plan', 'Plan'],
          ['playback', '执行回放'],
          ['verification', '验证结果'],
          ['writeback', '落盘反哺']
        ].map(function(entry) {
          const active = state.tab === entry[0] ? 'active' : '';
          return '<button type="button" class="tab ' + active + '" data-tab="' + entry[0] + '">' + entry[1] + '</button>';
        }).join('');

        root.innerHTML = [
          '<section class="detail-head">',
            '<div class="row">',
              '<span class="tag ' + escapeHtml(item.kind) + '">' + (item.kind === 'requirement' ? '需求' : 'Bug') + '</span>',
              '<span class="stage-pill">' + escapeHtml(item.stage) + '</span>',
            '</div>',
            '<h2>' + escapeHtml(item.title) + '</h2>',
            '<div class="status">来源：' + (item.source === 'feishu' ? '飞书' : '手工') + ' · 更新时间：' + formatDate(item.updatedAt) + '</div>',
          '</section>',
          '<section class="action-bar">',
            '<div class="field"><label for="action-note">操作备注</label><textarea id="action-note" placeholder="审批意见、阻塞原因或补充说明"></textarea></div>',
            '<div class="action-buttons">' + (actionButtons || '<div class="status">当前阶段无可执行按钮</div>') + '</div>',
          '</section>',
          '<section class="tabs">' + tabs + '</section>',
          '<section class="tab-panel">' + renderTabPanel() + '</section>'
        ].join('');

        root.querySelectorAll('[data-action]').forEach(function(node) {
          node.addEventListener('click', function() {
            const note = document.getElementById('action-note').value;
            runAction(node.getAttribute('data-action'), note);
          });
        });

        root.querySelectorAll('[data-tab]').forEach(function(node) {
          node.addEventListener('click', function() {
            state.tab = node.getAttribute('data-tab');
            renderDetail();
          });
        });
      }

      async function runAction(action, note) {
        if (!state.selectedId) return;
        try {
          await requestJson('/workflow/items/' + encodeURIComponent(state.selectedId) + '/actions', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: action, actor: 'web-ui', note: note || undefined })
          });
          await loadBoard();
        } catch (error) {
          alert(error.message || String(error));
        }
      }

      async function createItem() {
        const title = document.getElementById('create-title').value.trim();
        const rawInput = document.getElementById('create-raw').value.trim();
        if (!title || !rawInput) {
          alert('标题和原始输入不能为空');
          return;
        }

        const payload = {
          kind: document.getElementById('create-kind').value,
          title: title,
          rawInput: rawInput,
          acceptanceCriteria: document.getElementById('create-criteria').value.trim() || undefined,
          preferredAgent: document.getElementById('create-agent').value || undefined,
          cwd: document.getElementById('create-cwd').value.trim() || undefined
        };

        try {
          document.getElementById('form-status').textContent = '创建中...';
          const data = await requestJson('/workflow/items', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload)
          });
          document.getElementById('form-status').textContent = '已创建工作项 ' + data.item.id;
          document.getElementById('create-title').value = '';
          document.getElementById('create-raw').value = '';
          document.getElementById('create-criteria').value = '';
          document.getElementById('create-cwd').value = '';
          await loadBoard();
          await loadDetail(data.item.id);
        } catch (error) {
          document.getElementById('form-status').textContent = error.message || String(error);
        }
      }

      function bindFilters() {
        document.getElementById('filter-kind').addEventListener('change', function(event) {
          state.filters.kind = event.target.value;
          loadBoard();
        });
        document.getElementById('filter-source').addEventListener('change', function(event) {
          state.filters.source = event.target.value;
          loadBoard();
        });
        document.getElementById('filter-status').addEventListener('change', function(event) {
          state.filters.status = event.target.value;
          loadBoard();
        });
        document.getElementById('refresh-board').addEventListener('click', function() {
          loadBoard();
        });
        document.getElementById('sync-feishu-defects').addEventListener('click', function() {
          syncFeishuDefects();
        });
        document.getElementById('generate-bug-triage-batch').addEventListener('click', function() {
          generateBugTriageBatch();
        });
        document.getElementById('generate-bug-plan-batch').addEventListener('click', function() {
          generateBugPlanBatch();
        });
      }

      function bindCreateForm() {
        document.getElementById('create-submit').addEventListener('click', createItem);
      }

      bindFilters();
      bindCreateForm();
      loadBoard().catch(function(error) {
        document.getElementById('hero-meta').textContent = error.message || String(error);
      });
      renderDetail();
    </script>
  </body>
</html>`;
}
