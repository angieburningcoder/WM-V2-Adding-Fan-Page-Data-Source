// `cases` 來自 mock-data.js（需在本檔前載入）。
// 案件以粉絲頁為主體，原始偵測紀錄由案件反推後收進案件詳情。

/* ---------- 日期工具 ---------- */
function parseDetectedDate(value) {
  const [datePart, timePart = '00:00'] = value.split(' ');
  const [year, month, day] = datePart.split('/').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatDetectedDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDateInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/* ---------- 原始偵測歷程（收進案件詳情） ---------- */
function buildDetectionHistory(item) {
  const hitCount = Math.max(item.seenCount, 1);
  const start = parseDetectedDate(item.firstDetected);
  const end = parseDetectedDate(item.lastDetected);
  const spanMs = Math.max(end.getTime() - start.getTime(), 0);
  const fanPageHits = item.sources.includes('fan-page')
    ? Array.from({ length: hitCount }, (_, index) => {
      const ratio = hitCount === 1 ? 1 : index / (hitCount - 1);
      return {
        source: '粉專搜尋',
        detectedAt: formatDetectedDate(new Date(start.getTime() + spanMs * ratio)),
        detail: item.rank == null ? '搜尋排名不適用' : `搜尋排名 ${item.rank + (hitCount - 1 - index)}`
      };
    }).reverse()
    : [];

  const adHits = item.adsData.map((ad) => ({
    source: 'Meta Ads',
    detectedAt: ad.detectedAt,
    detail: `廣告編號 ${ad.id}`
  }));

  return [...fanPageHits, ...adHits];
}

/* ---------- 狀態 ---------- */
const state = {
  source: 'all',
  risk: 'all',
  status: 'all',
  platform: 'all',
  keyword: '',
  ignoredKeyword: '',
  currentCaseId: null,
  page: 1,
  pageSize: 10,
  expanded: new Set(),
  sort: { key: 'risk', dir: 'desc' },
  ignoredSort: { key: 'lastDetected', dir: 'desc' }
};

const ui = {
  sidebar: document.querySelector('#sidebar'),
  sidebarToggle: document.querySelector('#sidebarToggle'),
  tableBody: document.querySelector('#caseTableBody'),
  emptyState: document.querySelector('#emptyState'),
  resultCount: document.querySelector('#resultCount'),
  pageSize: document.querySelector('#pageSize'),
  prevPage: document.querySelector('#prevPage'),
  nextPage: document.querySelector('#nextPage'),
  ignoredTableBody: document.querySelector('#ignoredTableBody'),
  ignoredEmptyState: document.querySelector('#ignoredEmptyState'),
  ignoredResultCount: document.querySelector('#ignoredResultCount'),
  ignoredSearch: document.querySelector('#ignoredSearch'),
  statTotal: document.querySelector('#statTotal'),
  statBoth: document.querySelector('#statBoth'),
  statHigh: document.querySelector('#statHigh'),
  statAds: document.querySelector('#statAds'),
  sourceFilter: document.querySelector('#sourceFilter'),
  riskFilter: document.querySelector('#riskFilter'),
  statusFilter: document.querySelector('#statusFilter'),
  platformFilter: document.querySelector('#platformFilter'),
  caseTable: document.querySelector('#caseTableBody').closest('table'),
  ignoredTable: document.querySelector('#ignoredTableBody').closest('table'),
  tableSearch: document.querySelector('#tableSearch'),
  drawer: document.querySelector('#caseDrawer'),
  drawerBackdrop: document.querySelector('#drawerBackdrop'),
  drawerTitle: document.querySelector('#drawerTitle'),
  drawerContent: document.querySelector('#drawerContent'),
  scheduleButton: document.querySelector('#scheduleButton'),
  ignoreButton: document.querySelector('#ignoreButton'),
  modalBackdrop: document.querySelector('#modalBackdrop'),
  modalSummary: document.querySelector('#modalSummary'),
  toast: document.querySelector('#toast'),
  dateFrom: document.querySelector('#dateFrom'),
  dateTo: document.querySelector('#dateTo'),
  clientName: document.querySelector('#clientName')
};

const labelMap = {
  risk: { high: 'High', medium: 'Medium', low: 'Low' },
  status: { pending: '待審核', confirmed: '已確認', scheduled: '已排程', ignored: '已忽略' },
  source: { 'fan-page': '粉專搜尋', 'meta-ads': 'Meta Ads' },
  platform: { facebook: 'Facebook', instagram: 'Instagram', messenger: 'Messenger', threads: 'Threads', audience_network: 'Audience Network' }
};

/* ---------- 小元件 ---------- */
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function riskTag(risk) {
  const icon = risk === 'low'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 1 21h22L12 2Zm1 14h-2v2h2v-2Zm0-6h-2v4h2v-4Z"/></svg>';
  return `<span class="risk-tag risk-tag--${risk}">${icon}${labelMap.risk[risk]}</span>`;
}

const platformSvg = {
  facebook: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#1877F2"/><path fill="#fff" d="M15.6 12.4h-2.1V19h-2.8v-6.6H9.2v-2.3h1.5V8.7c0-1.9 1.1-2.9 2.9-2.9.8 0 1.6.1 1.6.1v1.8h-.9c-.9 0-1.2.5-1.2 1.1v1.3h2.1l-.3 2.3Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><defs><linearGradient id="ig" x1="0" y1="24" x2="24" y2="0"><stop offset="0" stop-color="#FEDA75"/><stop offset=".35" stop-color="#FA7E1E"/><stop offset=".7" stop-color="#D62976"/><stop offset="1" stop-color="#962FBF"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ig)"/><path fill="none" stroke="#fff" stroke-width="1.6" d="M8.4 5.6h7.2a2.8 2.8 0 0 1 2.8 2.8v7.2a2.8 2.8 0 0 1-2.8 2.8H8.4a2.8 2.8 0 0 1-2.8-2.8V8.4a2.8 2.8 0 0 1 2.8-2.8Z"/><circle cx="12" cy="12" r="3.1" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/></svg>',
  messenger: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="12" fill="#7B4BFF"/><path fill="#fff" d="M12 5.4c-3.8 0-6.7 2.8-6.7 6.5 0 2.1.9 3.9 2.5 5.1v2.5l2.3-1.3c.6.2 1.3.3 1.9.3 3.8 0 6.7-2.8 6.7-6.6S15.8 5.4 12 5.4Zm.7 8.8-1.7-1.8-3.3 1.8 3.6-3.9 1.8 1.8 3.3-1.8-3.7 3.9Z"/></svg>',
  threads: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#000"/><path fill="#fff" d="M12.2 18.6c-3.7 0-5.8-2.4-5.8-6.6s2.1-6.6 5.8-6.6c2.4 0 4.1 1 4.9 2.8l-1.5.7c-.6-1.3-1.7-1.9-3.4-1.9-2.6 0-4 1.7-4 5s1.4 5 4 5c1.7 0 2.8-.7 3.1-1.9.2-.9-.3-1.6-1.3-2-.2 1.6-1.2 2.6-2.8 2.6-1.5 0-2.5-.9-2.5-2.2 0-1.5 1.3-2.4 3.3-2.4h.7c0-.9-.4-1.4-1.3-1.4-.6 0-1.1.3-1.3.8l-1.4-.6c.4-1.1 1.4-1.7 2.7-1.7 1.9 0 2.9 1.1 2.9 3.1v.2c1.6.6 2.4 1.9 2.1 3.5-.4 2.1-2.2 3.4-4.9 3.4Zm-.4-5.3c-1 0-1.6.4-1.6 1s.4.9 1.1.9c.9 0 1.4-.6 1.5-1.9h-1Z"/></svg>',
  audience_network: '<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#0081FB"/><circle cx="12" cy="7" r="2" fill="#fff"/><circle cx="7" cy="16" r="2" fill="#fff"/><circle cx="17" cy="16" r="2" fill="#fff"/><path stroke="#fff" stroke-width="1.3" d="M12 9v3m0 0-4 3m4-3 4 3"/></svg>'
};

function platformIcons(platforms) {
  return `<span class="platforms">${platforms
    .map((p) => `<span class="platform-icon" title="${labelMap.platform[p]}" aria-label="${labelMap.platform[p]}">${platformSvg[p] || ''}</span>`)
    .join('')}</span>`;
}

function adRiskCell(item) {
  if (!item.ads) return '<span class="muted">—</span>';
  const { high, medium, low } = item.adsBreakdown;
  const parts = [];
  if (high) parts.push(`<span class="is-high">高 ${high}</span>`);
  if (medium) parts.push(`<span class="is-medium">中 ${medium}</span>`);
  if (low) parts.push(`<span class="is-low">低 ${low}</span>`);
  return `<span class="ad-risk">${parts.join('')}</span>`;
}

function sourceBadges(item) {
  return `<span class="source-badges">${item.sources
    .map((s) => `<span class="badge badge--source">${labelMap.source[s]}</span>`)
    .join('')}</span>`;
}

function formatNumber(value) {
  return value.toLocaleString('en-US');
}

/* ---------- 排序 ---------- */
const RISK_ORDER = { high: 3, medium: 2, low: 1 };
const STATUS_ORDER = { pending: 1, confirmed: 2, scheduled: 3, ignored: 4 };

const sortAccessors = {
  name: (item) => item.name,
  risk: (item) => RISK_ORDER[item.risk],
  ads: (item) => item.adsBreakdown.high * 10000 + item.adsBreakdown.medium * 100 + item.ads,
  platforms: (item) => item.platforms.length,
  followers: (item) => item.followers,
  sources: (item) => item.sources.length,
  status: (item) => STATUS_ORDER[item.status],
  lastDetected: (item) => parseDetectedDate(item.lastDetected).getTime(),
  reason: (item) => item.reasons[0]
};

function sortRows(rows, sort) {
  const accessor = sortAccessors[sort.key];
  if (!accessor) return rows;
  const factor = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = accessor(a);
    const vb = accessor(b);
    if (typeof va === 'string') return va.localeCompare(vb, 'zh-Hant') * factor;
    return (va - vb) * factor;
  });
}

const sortIconPaths = {
  none: 'M10 18h4v-2h-4v2ZM3 6v2h18V6H3Zm3 7h12v-2H6v2Z',
  asc: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8Z',
  desc: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8Z'
};

function applySortIcons(table, sort) {
  table.querySelectorAll('.th-sort').forEach((button) => {
    const isActive = button.dataset.sort === sort.key;
    const kind = isActive ? sort.dir : 'none';
    button.classList.toggle('is-active', isActive);
    button.closest('th').setAttribute('aria-sort', isActive ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none');
    button.querySelector('.sort-icon').innerHTML =
      `<svg viewBox="0 0 24 24"><path d="${sortIconPaths[kind]}"/></svg>`;
  });
}

function bindSortHandlers(table, sortKey, onChange) {
  table.querySelectorAll('.th-sort').forEach((button) => {
    button.addEventListener('click', () => {
      const sort = state[sortKey];
      if (sort.key === button.dataset.sort) {
        sort.dir = sort.dir === 'asc' ? 'desc' : 'asc';
      } else {
        sort.key = button.dataset.sort;
        sort.dir = 'desc';
      }
      onChange();
    });
  });
}

/* ---------- 篩選 ---------- */
function matchKeyword(item, keyword) {
  if (!keyword) return true;
  const haystack = [item.name, item.pageId, item.id, ...item.adsData.map((ad) => ad.id), ...item.adsData.map((ad) => ad.title)];
  return haystack.some((value) => String(value).toLowerCase().includes(keyword));
}

function getActiveCases() {
  const keyword = state.keyword.trim().toLowerCase();
  const rows = cases.filter((item) => {
    if (item.status === 'ignored') return false;
    const sourceMatch = state.source === 'all'
      || (state.source === 'both' && item.sources.length === 2)
      || (state.source !== 'both' && item.sources.includes(state.source));
    const riskMatch = state.risk === 'all' || item.risk === state.risk;
    const statusMatch = state.status === 'all' || item.status === state.status;
    const platformMatch = state.platform === 'all' || item.platforms.includes(state.platform);
    return sourceMatch && riskMatch && statusMatch && platformMatch && matchKeyword(item, keyword);
  });
  return sortRows(rows, state.sort);
}

function getIgnoredCases() {
  const keyword = state.ignoredKeyword.trim().toLowerCase();
  const rows = cases.filter((item) => item.status === 'ignored' && matchKeyword(item, keyword));
  return sortRows(rows, state.ignoredSort);
}

/* ---------- 主表 ---------- */
function renderTable() {
  const rows = getActiveCases();
  const totalPages = Math.max(Math.ceil(rows.length / state.pageSize), 1);
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  ui.tableBody.innerHTML = pageRows.map((item) => {
    const isExpanded = state.expanded.has(item.id);
    const mainRow = `
      <tr class="${isExpanded ? 'is-expanded' : ''}">
        <td class="expand-column">
          <button class="expand-button" type="button" data-toggle-case="${item.id}"
            aria-expanded="${isExpanded}" ${item.adsData.length ? '' : 'disabled'}
            aria-label="展開 ${escapeHtml(item.name)} 的關聯廣告">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v14l10-7L9 5Z"/></svg>
          </button>
        </td>
        <td>
          <button class="page-name" type="button" data-open-case="${item.id}">
            ${escapeHtml(item.name)}
            <span class="page-id">${item.pageId}</span>
          </button>
        </td>
        <td>${riskTag(item.risk)}</td>
        <td>${adRiskCell(item)}</td>
        <td>${platformIcons(item.platforms)}</td>
        <td class="number-column">${formatNumber(item.followers)}</td>
        <td>${sourceBadges(item)}</td>
        <td><span class="badge badge--${item.status}">${labelMap.status[item.status]}</span></td>
        <td>${item.lastDetected}</td>
        <td class="action-column">
          <button class="row-action" type="button" data-open-case="${item.id}" aria-label="查看 ${escapeHtml(item.name)} 詳情">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v2h6.6L5 17.6 6.4 19 17 8.4V15h2V5H9Z"/></svg>
          </button>
        </td>
      </tr>`;

    if (!isExpanded || !item.adsData.length) return mainRow;

    const remaining = item.ads - item.adsData.length;
    return `${mainRow}
      <tr class="ad-subrow">
        <td colspan="10">
          <div class="ad-sublist">
            ${item.adsData.map((ad) => `
              <div class="ad-subitem">
                <span class="ad-subitem-title">
                  ${escapeHtml(ad.title)}
                  <span class="ad-subitem-id">${ad.id}</span>
                </span>
                ${riskTag(ad.risk)}
                <span class="ad-subitem-date">${ad.detectedAt}</span>
                <a href="${ad.adUrl}" target="_blank" rel="noreferrer">查看廣告</a>
              </div>
            `).join('')}
            ${remaining > 0 ? `<div class="ad-sublist-more">另有 ${remaining} 則廣告未於 Prototype 展開</div>` : ''}
          </div>
        </td>
      </tr>`;
  }).join('');

  applySortIcons(ui.caseTable, state.sort);
  ui.emptyState.hidden = rows.length !== 0;
  ui.tableBody.closest('.table-scroll').hidden = rows.length === 0;
  ui.resultCount.textContent = rows.length
    ? `${start + 1}-${start + pageRows.length} 之 ${rows.length}`
    : '0-0 之 0';
  ui.prevPage.disabled = state.page <= 1;
  ui.nextPage.disabled = state.page >= totalPages;

  ui.statTotal.textContent = rows.length;
  ui.statHigh.textContent = rows.filter((item) => item.risk === 'high').length;
  ui.statBoth.textContent = rows.filter((item) => item.sources.length === 2).length;
  ui.statAds.textContent = rows.reduce((total, item) => total + item.ads, 0);
}

/* ---------- 忽略清單 ---------- */
function renderIgnoredTable() {
  const rows = getIgnoredCases();
  ui.ignoredTableBody.innerHTML = rows.map((item) => `
    <tr>
      <td>
        <button class="page-name" type="button" data-open-case="${item.id}">
          ${escapeHtml(item.name)}
          <span class="page-id">${item.pageId}</span>
        </button>
      </td>
      <td>${platformIcons(item.platforms)}</td>
      <td class="number-column">${formatNumber(item.followers)}</td>
      <td>${escapeHtml(item.reasons[0])}</td>
      <td>${item.lastDetected}</td>
      <td class="action-column">
        <button class="row-action" type="button" data-open-case="${item.id}" aria-label="查看 ${escapeHtml(item.name)} 詳情">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v2h6.6L5 17.6 6.4 19 17 8.4V15h2V5H9Z"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  applySortIcons(ui.ignoredTable, state.ignoredSort);
  ui.ignoredEmptyState.hidden = rows.length !== 0;
  ui.ignoredTableBody.closest('.table-scroll').hidden = rows.length === 0;
  ui.ignoredResultCount.textContent = `共 ${rows.length} 筆`;
}

function render() {
  renderTable();
  renderIgnoredTable();
}

/* ---------- 案件詳情 ---------- */
function getCurrentCase() {
  return cases.find((item) => item.id === state.currentCaseId);
}

function evidencePlaceholder(caption, link, linkLabel) {
  return `
    <div class="evidence-item">
      <div class="evidence-caption">
        <span>${caption}</span>
      </div>
      <div class="evidence-placeholder">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 5H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Zm-1 12H4V7h16v10ZM8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM6 15.5l3.2-3.2 2.1 2.1 3.4-3.4L18 14.4v1.1H6v-.5Z"/></svg>
        <span>此欄位將顯示截圖</span>
      </div>
      <a class="evidence-link" href="${link}" target="_blank" rel="noreferrer">${linkLabel}</a>
    </div>`;
}

function openDrawer(id) {
  state.currentCaseId = id;
  const item = getCurrentCase();
  if (!item) return;

  const history = buildDetectionHistory(item);
  const firstAd = item.adsData[0];

  ui.drawerTitle.textContent = item.name;
  ui.drawerContent.innerHTML = `
    <section class="drawer-section">
      <div class="source-badges">
        ${riskTag(item.risk)}
        ${sourceBadges(item)}
        <span class="badge badge--${item.status}">${labelMap.status[item.status]}</span>
      </div>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">截圖證據</h3>
      <div class="evidence-grid">
        ${evidencePlaceholder('帳號截圖', item.pageUrl, '開啟粉絲頁 ↗')}
        ${firstAd
          ? evidencePlaceholder('廣告截圖', firstAd.adUrl, '開啟廣告 ↗')
          : `<div class="evidence-item">
               <div class="evidence-caption"><span>廣告截圖</span></div>
               <div class="empty-mini">此案件目前無關聯廣告</div>
             </div>`}
      </div>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">粉絲頁資訊</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">粉絲頁編號</span>
          <span class="detail-value">${item.pageId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">粉絲頁追蹤者數</span>
          <span class="detail-value">${formatNumber(item.followers)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">投放平台</span>
          <span class="detail-value">${platformIcons(item.platforms)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">搜尋排名</span>
          <span class="detail-value">${item.rank ?? '不適用'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">首次偵測</span>
          <span class="detail-value">${item.firstDetected}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">最後偵測</span>
          <span class="detail-value">${item.lastDetected}</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">粉絲頁連結</span>
          <a class="detail-value detail-link" href="${item.pageUrl}" target="_blank" rel="noreferrer">${item.pageUrl}</a>
        </div>
      </div>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">風險判斷 ${riskTag(item.risk)}</h3>
      <div class="risk-summary">
        <div class="risk-copy">
          <strong>${labelMap.risk[item.risk]} Risk</strong>
          <span>由偵測規則與 LLM 判斷產生，以下為命中的判斷理由。</span>
        </div>
      </div>
      <ul class="reason-list">
        ${item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
      </ul>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">關聯廣告 <span>${item.ads} 則</span></h3>
      ${item.adsData.length ? `
        <div class="ad-list">
          ${item.adsData.map((ad) => `
            <article class="ad-item">
              <div>
                <strong>${escapeHtml(ad.title)}</strong>
                <small>${ad.id} · ${ad.detectedAt} · ${labelMap.risk[ad.risk]}</small>
              </div>
              <a href="${ad.adUrl}" target="_blank" rel="noreferrer">查看廣告 ↗</a>
            </article>
          `).join('')}
          ${item.ads > item.adsData.length ? `<div class="empty-mini">另有 ${item.ads - item.adsData.length} 則廣告未於 Prototype 展開</div>` : ''}
        </div>
      ` : '<div class="empty-mini">目前未找到可關聯的廣告</div>'}
    </section>

    <section class="drawer-section">
      <h3 class="section-title">原始偵測紀錄 <span>${history.length} 筆</span></h3>
      <table class="history-table">
        <thead>
          <tr>
            <th scope="col">偵測來源</th>
            <th scope="col">偵測時間</th>
            <th scope="col">內容</th>
          </tr>
        </thead>
        <tbody>
          ${history.map((row) => `
            <tr>
              <td>${row.source}</td>
              <td>${row.detectedAt}</td>
              <td>${escapeHtml(row.detail)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">案件紀錄</h3>
      <div class="timeline">
        <div class="timeline-item">
          <strong>${item.status === 'scheduled' ? '已加入 Internal Console 檢舉排程' : `目前狀態：${labelMap.status[item.status]}`}</strong>
          <span>${item.lastDetected}</span>
        </div>
        <div class="timeline-item">
          <strong>最近一次偵測資料更新</strong>
          <span>${item.lastDetected}</span>
        </div>
        <div class="timeline-item">
          <strong>建立 Watchmen Case</strong>
          <span>${item.firstDetected}</span>
        </div>
      </div>
    </section>
  `;

  ui.scheduleButton.disabled = item.status === 'scheduled';
  ui.scheduleButton.textContent = item.status === 'scheduled' ? '已加入檢舉排程' : '加入檢舉排程';
  ui.ignoreButton.disabled = item.status === 'ignored';
  ui.ignoreButton.textContent = item.status === 'ignored' ? '已標記忽略' : '標記忽略';
  ui.drawerBackdrop.hidden = false;
  ui.drawer.setAttribute('aria-hidden', 'false');
  // 強制 reflow，讓 transform 動畫確實從關閉狀態開始（同步，不依賴 rAF）
  void ui.drawer.offsetWidth;
  ui.drawer.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  ui.drawer.classList.remove('is-open');
  ui.drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  window.setTimeout(() => {
    ui.drawerBackdrop.hidden = true;
  }, 230);
}

/* ---------- 排程 / 忽略 ---------- */
function openScheduleModal() {
  const item = getCurrentCase();
  if (!item || item.status === 'scheduled') return;
  ui.modalSummary.innerHTML = `
    <div class="modal-summary-row"><span>粉絲頁</span><strong>${escapeHtml(item.name)}</strong></div>
    <div class="modal-summary-row"><span>粉絲頁編號</span><strong>${item.pageId}</strong></div>
    <div class="modal-summary-row"><span>關聯廣告</span><strong>${item.ads} 則</strong></div>
    <div class="modal-summary-row"><span>偽冒風險程度</span><strong>${labelMap.risk[item.risk]}</strong></div>
  `;
  ui.modalBackdrop.hidden = false;
}

function closeModal() {
  ui.modalBackdrop.hidden = true;
}

function confirmSchedule() {
  const item = getCurrentCase();
  if (!item) return;
  item.status = 'scheduled';
  closeModal();
  render();
  openDrawer(item.id);
  showToast('已將粉絲頁與關聯廣告加入 Internal Console 檢舉排程（Prototype）');
}

function markIgnored() {
  const item = getCurrentCase();
  if (!item || item.status === 'ignored') return;
  item.status = 'ignored';
  render();
  openDrawer(item.id);
  showToast('案件已移至「可忽略社群廣告清單」（Prototype）');
}

let toastTimer;
function showToast(message) {
  window.clearTimeout(toastTimer);
  ui.toast.textContent = message;
  ui.toast.setAttribute('aria-hidden', 'false');
  ui.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => {
    ui.toast.classList.remove('is-visible');
    ui.toast.setAttribute('aria-hidden', 'true');
  }, 2600);
}

/* ---------- 快速日期 ---------- */
function setQuickRange(range) {
  const end = new Date('2026-08-21T12:00:00+08:00');
  const start = new Date(end);
  if (range === 'yesterday') {
    start.setDate(end.getDate() - 1);
    end.setDate(end.getDate() - 1);
  } else if (range === 'week') {
    start.setDate(end.getDate() - 6);
  } else if (range === 'month') {
    start.setDate(end.getDate() - 29);
  }
  ui.dateFrom.value = formatDateInput(start);
  ui.dateTo.value = formatDateInput(end);
  showToast('已更新日期範圍；Prototype 使用固定假資料');
}

/* ---------- CSV 匯出（當下 filter 結果 + 案件詳情） ---------- */
function exportCsv() {
  const rows = getActiveCases();
  if (!rows.length) {
    showToast('目前篩選結果為空，沒有可匯出的資料');
    return;
  }

  const headers = [
    '粉絲頁名稱', '粉絲頁編號', '粉絲頁追蹤者數', '偽冒風險程度', '風險判斷理由',
    '資料來源', '投放平台', '處理狀態', '首次偵測', '最後偵測', '累積命中次數', '搜尋排名', '粉絲頁連結',
    '廣告編號', '廣告文案', '廣告風險', '廣告偵測日期', '廣告連結'
  ];

  const lines = [headers];
  rows.forEach((item) => {
    const base = [
      item.name,
      item.pageId,
      item.followers,
      labelMap.risk[item.risk],
      item.reasons.join('；'),
      item.sources.map((s) => labelMap.source[s]).join(' + '),
      item.platforms.map((p) => labelMap.platform[p]).join(' / '),
      labelMap.status[item.status],
      item.firstDetected,
      item.lastDetected,
      item.seenCount,
      item.rank ?? '不適用',
      item.pageUrl
    ];
    if (!item.adsData.length) {
      lines.push([...base, '', '', '', '', '']);
      return;
    }
    item.adsData.forEach((ad) => {
      lines.push([...base, ad.id, ad.title, labelMap.risk[ad.risk], ad.detectedAt, ad.adUrl]);
    });
  });

  const csv = lines
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    .join('\n');

  const client = ui.clientName.textContent.trim();
  const fileName = `${ui.dateFrom.value} 至 ${ui.dateTo.value} ${client}-可疑社群廣告清單.csv`;

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast(`已匯出目前篩選結果：${fileName}`);
}

/* ---------- 事件 ---------- */
ui.sidebarToggle.addEventListener('click', () => {
  const collapsed = ui.sidebar.classList.toggle('is-collapsed');
  ui.sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  ui.sidebarToggle.setAttribute('aria-label', collapsed ? '展開選單' : '收合選單');
});

ui.sourceFilter.addEventListener('change', (event) => {
  state.source = event.target.value;
  state.page = 1;
  render();
});

ui.riskFilter.addEventListener('change', (event) => {
  state.risk = event.target.value;
  state.page = 1;
  render();
});

ui.statusFilter.addEventListener('change', (event) => {
  state.status = event.target.value;
  state.page = 1;
  render();
});

ui.platformFilter.addEventListener('change', (event) => {
  state.platform = event.target.value;
  state.page = 1;
  render();
});

bindSortHandlers(ui.caseTable, 'sort', () => {
  state.page = 1;
  renderTable();
});

bindSortHandlers(ui.ignoredTable, 'ignoredSort', renderIgnoredTable);

ui.tableSearch.addEventListener('input', (event) => {
  state.keyword = event.target.value;
  state.page = 1;
  render();
});

ui.ignoredSearch.addEventListener('input', (event) => {
  state.ignoredKeyword = event.target.value;
  renderIgnoredTable();
});

ui.pageSize.addEventListener('change', (event) => {
  state.pageSize = Number(event.target.value);
  state.page = 1;
  renderTable();
});

ui.prevPage.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    renderTable();
  }
});

ui.nextPage.addEventListener('click', () => {
  state.page += 1;
  renderTable();
});

function handleTableClick(event) {
  const toggle = event.target.closest('[data-toggle-case]');
  if (toggle) {
    const id = toggle.dataset.toggleCase;
    if (state.expanded.has(id)) state.expanded.delete(id);
    else state.expanded.add(id);
    renderTable();
    return;
  }
  const trigger = event.target.closest('[data-open-case]');
  if (trigger) openDrawer(trigger.dataset.openCase);
}

ui.tableBody.addEventListener('click', handleTableClick);
ui.ignoredTableBody.addEventListener('click', handleTableClick);

document.querySelector('#closeDrawer').addEventListener('click', closeDrawer);
ui.drawerBackdrop.addEventListener('click', closeDrawer);
ui.scheduleButton.addEventListener('click', openScheduleModal);
ui.ignoreButton.addEventListener('click', markIgnored);
document.querySelector('#closeModal').addEventListener('click', closeModal);
document.querySelector('#cancelSchedule').addEventListener('click', closeModal);
document.querySelector('#confirmSchedule').addEventListener('click', confirmSchedule);
ui.modalBackdrop.addEventListener('click', (event) => {
  if (event.target === ui.modalBackdrop) closeModal();
});
document.querySelector('#exportButton').addEventListener('click', exportCsv);
document.querySelector('#searchButton').addEventListener('click', () => showToast('已套用搜尋條件；Prototype 使用固定假資料'));
document.querySelectorAll('[data-range]').forEach((button) => button.addEventListener('click', () => setQuickRange(button.dataset.range)));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!ui.modalBackdrop.hidden) closeModal();
    else if (ui.drawer.classList.contains('is-open')) closeDrawer();
  }
});

render();
