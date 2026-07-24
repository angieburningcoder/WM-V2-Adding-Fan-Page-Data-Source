// `cases` 來自 mock-data.js（需在本檔前載入）。
// 以下由案件資料反推「原始偵測結果」，維持 Fan Page Case 為核心的單一資料來源。
function parseDetectedDate(value) {
  const [datePart, timePart = '00:00'] = value.split(' ');
  const [year, month, day] = datePart.split('/').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

function formatDetectedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hour}:${minute}`;
}

function buildFanPageRecords() {
  return cases
    .filter((item) => item.sources.includes('fan-page'))
    .flatMap((item) => {
      const hitCount = Math.max(item.seenCount, 1);
      const start = parseDetectedDate(item.firstDetected);
      const end = parseDetectedDate(item.lastDetected);
      const spanMs = Math.max(end.getTime() - start.getTime(), 0);
      return Array.from({ length: hitCount }, (_, index) => {
        const ratio = hitCount === 1 ? 1 : index / (hitCount - 1);
        const detectedAt = new Date(start.getTime() + spanMs * ratio);
        const rank = item.rank == null ? null : item.rank + (hitCount - 1 - index);
        return {
          id: `${item.id}-QS-${String(index + 1).padStart(2, '0')}`,
          caseId: item.id,
          name: item.name,
          pageId: item.pageId,
          keyword: item.keyword,
          rank,
          detectedAt: formatDetectedDate(detectedAt)
        };
      }).reverse();
    });
}

function buildMetaAdsRecords() {
  return cases.flatMap((item) => item.adsData.map((ad) => ({
    ...ad,
    caseId: item.id,
    caseName: item.name,
    pageId: item.pageId
  })));
}

const fanPageRecords = buildFanPageRecords();
const metaAdsRecords = buildMetaAdsRecords();

const state = {
  source: 'all',
  risk: 'all',
  status: 'all',
  keyword: '',
  currentCaseId: null,
  view: 'case',
  rawSource: 'fan-page'
};

const ui = {
  tableBody: document.querySelector('#caseTableBody'),
  emptyState: document.querySelector('#emptyState'),
  resultCount: document.querySelector('#resultCount'),
  statTotal: document.querySelector('#statTotal'),
  statBoth: document.querySelector('#statBoth'),
  statHigh: document.querySelector('#statHigh'),
  statAds: document.querySelector('#statAds'),
  riskFilter: document.querySelector('#riskFilter'),
  statusFilter: document.querySelector('#statusFilter'),
  keywordInput: document.querySelector('#keywordInput'),
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
  caseViewPanel: document.querySelector('#caseViewPanel'),
  rawViewPanel: document.querySelector('#rawViewPanel'),
  fanPagePanel: document.querySelector('#fanPagePanel'),
  adsPanel: document.querySelector('#adsPanel'),
  fanPageTableBody: document.querySelector('#fanPageTableBody'),
  adsTableBody: document.querySelector('#adsTableBody'),
  fanPageEmptyState: document.querySelector('#fanPageEmptyState'),
  adsEmptyState: document.querySelector('#adsEmptyState'),
  fanPageResultCount: document.querySelector('#fanPageResultCount'),
  adsResultCount: document.querySelector('#adsResultCount'),
  filterSecondaryGrid: document.querySelector('.filter-grid--secondary'),
  sourceFilterGroup: document.querySelector('.source-filter'),
  riskFilterGroup: document.querySelector('#riskFilterGroup'),
  statusFilterGroup: document.querySelector('#statusFilterGroup')
};

const labelMap = {
  risk: { high: 'High', medium: 'Medium', low: 'Low' },
  status: { pending: '待審核', confirmed: '已確認', scheduled: '已排程', ignored: '已忽略' }
};

function getFilteredCases() {
  const keyword = state.keyword.trim().toLowerCase();
  return cases.filter((item) => {
    const sourceMatch = state.source === 'all'
      || (state.source === 'both' && item.sources.length === 2)
      || (state.source !== 'both' && item.sources.includes(state.source));
    const riskMatch = state.risk === 'all' || item.risk === state.risk;
    const statusMatch = state.status === 'all' || item.status === state.status;
    const keywordMatch = !keyword || [item.name, item.pageId, item.keyword, item.id]
      .some((value) => String(value).toLowerCase().includes(keyword));
    return sourceMatch && riskMatch && statusMatch && keywordMatch;
  });
}

function sourceBadges(item) {
  const badges = [];
  if (item.sources.includes('fan-page')) {
    badges.push('<span class="badge badge--fan"><span class="source-dot"></span>FB 粉專</span>');
  }
  if (item.sources.includes('meta-ads')) {
    badges.push('<span class="badge badge--ads"><span class="source-dot"></span>Meta Ads</span>');
  }
  return badges.join('');
}

function renderTable() {
  const rows = getFilteredCases();
  ui.tableBody.innerHTML = rows.map((item) => `
    <tr>
      <td>
        <button class="case-name-button" type="button" data-open-case="${item.id}">
          ${escapeHtml(item.name)}
          <span class="case-id">${item.pageId}</span>
        </button>
      </td>
      <td><div class="source-badges">${sourceBadges(item)}</div></td>
      <td>${escapeHtml(item.keyword)}</td>
      <td class="number-column"><strong>${item.ads}</strong></td>
      <td>${item.lastDetected}</td>
      <td>
        <div class="risk-cell">
          <span class="badge badge--${item.risk}">${riskIcon(item.risk)} ${labelMap.risk[item.risk]}</span>
          <span class="risk-reason" title="${escapeHtml(item.reasons[0])}">${escapeHtml(item.reasons[0])}</span>
        </div>
      </td>
      <td><span class="badge badge--${item.status}">${labelMap.status[item.status]}</span></td>
      <td class="action-column">
        <button class="row-action" type="button" data-open-case="${item.id}" aria-label="查看 ${escapeHtml(item.name)} 詳情">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v2h6.6L5 17.6 6.4 19 17 8.4V15h2V5H9Z"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  ui.emptyState.hidden = rows.length !== 0;
  ui.tableBody.closest('.table-scroll').hidden = rows.length === 0;
  ui.resultCount.textContent = `共 ${rows.length} 筆`;
  ui.statTotal.textContent = rows.length;
  ui.statBoth.textContent = rows.filter((item) => item.sources.length === 2).length;
  ui.statHigh.textContent = rows.filter((item) => item.risk === 'high').length;
  ui.statAds.textContent = rows.reduce((total, item) => total + item.ads, 0);
}

function getFilteredFanPageRecords() {
  const keyword = state.keyword.trim().toLowerCase();
  return fanPageRecords.filter((item) => !keyword
    || [item.name, item.pageId, item.keyword, item.caseId].some((value) => String(value).toLowerCase().includes(keyword)));
}

function getFilteredAdsRecords() {
  const keyword = state.keyword.trim().toLowerCase();
  return metaAdsRecords.filter((item) => !keyword
    || [item.title, item.id, item.caseId, item.caseName, item.pageId].some((value) => String(value).toLowerCase().includes(keyword)));
}

function renderFanPageTable() {
  const rows = getFilteredFanPageRecords();
  ui.fanPageTableBody.innerHTML = rows.map((item) => {
    const caseItem = cases.find((c) => c.id === item.caseId);
    return `
    <tr>
      <td>
        <button class="case-name-button" type="button" data-open-case="${item.caseId}">
          ${escapeHtml(item.name)}
          <span class="case-id">${item.pageId}</span>
        </button>
      </td>
      <td>${escapeHtml(item.keyword)}</td>
      <td class="number-column">${item.rank ?? '不適用'}</td>
      <td>${item.detectedAt}</td>
      <td><span class="badge badge--${caseItem.risk}">${riskIcon(caseItem.risk)} ${labelMap.risk[caseItem.risk]}</span></td>
      <td><span class="badge badge--${caseItem.status}">${labelMap.status[caseItem.status]}</span></td>
    </tr>
  `;
  }).join('');

  ui.fanPageEmptyState.hidden = rows.length !== 0;
  ui.fanPageTableBody.closest('.table-scroll').hidden = rows.length === 0;
  ui.fanPageResultCount.textContent = `共 ${rows.length} 筆`;
}

function renderAdsTable() {
  const rows = getFilteredAdsRecords();
  ui.adsTableBody.innerHTML = rows.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.title)}</strong>
        <span class="case-id">${item.id}</span>
      </td>
      <td><span class="badge badge--${item.risk.toLowerCase()}">${riskIcon(item.risk.toLowerCase())} ${item.risk}</span></td>
      <td>${item.detectedAt}</td>
      <td>
        ${escapeHtml(item.caseName)}
        <span class="case-id">${item.pageId}</span>
      </td>
      <td class="action-column">
        <button class="row-action" type="button" data-open-case="${item.caseId}" aria-label="查看 ${escapeHtml(item.caseName)} 案件">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5v2h6.6L5 17.6 6.4 19 17 8.4V15h2V5H9Z"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  ui.adsEmptyState.hidden = rows.length !== 0;
  ui.adsTableBody.closest('.table-scroll').hidden = rows.length === 0;
  ui.adsResultCount.textContent = `共 ${rows.length} 筆`;
}

function render() {
  if (state.view === 'case') {
    renderTable();
  } else if (state.rawSource === 'fan-page') {
    renderFanPageTable();
  } else {
    renderAdsTable();
  }
}

function riskIcon(risk) {
  if (risk === 'high') return '▲';
  if (risk === 'medium') return '◆';
  return '●';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getCurrentCase() {
  return cases.find((item) => item.id === state.currentCaseId);
}

function openDrawer(id) {
  state.currentCaseId = id;
  const item = getCurrentCase();
  if (!item) return;

  ui.drawerTitle.textContent = item.name;
  ui.drawerContent.innerHTML = `
    <section class="drawer-section">
      <div class="source-badges">${sourceBadges(item)} <span class="badge badge--${item.status}">${labelMap.status[item.status]}</span></div>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">粉專資訊</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">Fan Page ID</span>
          <span class="detail-value">${item.pageId}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">命中關鍵字</span>
          <span class="detail-value">${escapeHtml(item.keyword)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">首次偵測</span>
          <span class="detail-value">${item.firstDetected}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">最後偵測</span>
          <span class="detail-value">${item.lastDetected}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">搜尋排名</span>
          <span class="detail-value">${item.rank ?? '不適用'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">累積命中次數</span>
          <span class="detail-value">${item.seenCount} 次</span>
        </div>
        <div class="detail-item detail-item--full">
          <span class="detail-label">粉專連結</span>
          <a class="detail-value detail-link" href="${item.pageUrl}" target="_blank" rel="noreferrer">${item.pageUrl}</a>
        </div>
      </div>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">風險判斷 <span class="badge badge--${item.risk}">${labelMap.risk[item.risk]}</span></h3>
      <div class="risk-summary">
        <div class="risk-score">${item.score}</div>
        <div class="risk-copy">
          <strong>${labelMap.risk[item.risk]} Risk</strong>
          <span>分數為 Prototype 展示值；正式版應由可解釋規則計算。</span>
        </div>
      </div>
      <ul class="reason-list">
        ${item.reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join('')}
      </ul>
    </section>

    <section class="drawer-section">
      <h3 class="section-title">關聯 Meta Ads <span>${item.ads} 則</span></h3>
      ${item.adsData.length ? `
        <div class="ad-list">
          ${item.adsData.map((ad) => `
            <article class="ad-item">
              <div>
                <strong>${escapeHtml(ad.title)}</strong>
                <small>${ad.id} · ${ad.detectedAt} · ${ad.risk}</small>
              </div>
              <a href="#" onclick="event.preventDefault()">查看廣告</a>
            </article>
          `).join('')}
          ${item.ads > item.adsData.length ? `<div class="empty-mini">另有 ${item.ads - item.adsData.length} 則廣告未於 Prototype 展開</div>` : ''}
        </div>
      ` : '<div class="empty-mini">目前未找到可關聯的 Meta Ads</div>'}
    </section>

    <section class="drawer-section">
      <h3 class="section-title">案件紀錄</h3>
      <div class="timeline">
        <div class="timeline-item">
          <strong>${item.status === 'scheduled' ? '已加入 Internal Console 檢舉排程' : '目前狀態：' + labelMap.status[item.status]}</strong>
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
  requestAnimationFrame(() => ui.drawer.classList.add('is-open'));
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

function openScheduleModal() {
  const item = getCurrentCase();
  if (!item || item.status === 'scheduled') return;
  ui.modalSummary.innerHTML = `
    <div class="modal-summary-row"><span>粉專</span><strong>${escapeHtml(item.name)}</strong></div>
    <div class="modal-summary-row"><span>Fan Page ID</span><strong>${item.pageId}</strong></div>
    <div class="modal-summary-row"><span>關聯廣告</span><strong>${item.ads} 則</strong></div>
    <div class="modal-summary-row"><span>風險程度</span><strong>${labelMap.risk[item.risk]}</strong></div>
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
  showToast('已將粉專與關聯廣告加入 Internal Console 檢舉排程（Prototype）');
}

function markIgnored() {
  const item = getCurrentCase();
  if (!item || item.status === 'ignored') return;
  item.status = 'ignored';
  render();
  openDrawer(item.id);
  showToast('案件已標記為忽略（Prototype）');
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

function syncKeyword(value, origin) {
  state.keyword = value;
  if (origin !== 'keyword') ui.keywordInput.value = value;
  if (origin !== 'table') ui.tableSearch.value = value;
  render();
}

function setQuickRange(range) {
  const end = new Date('2026-07-24T12:00:00+08:00');
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

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function exportCsv() {
  const rows = getFilteredCases();
  const headers = ['Case ID','粉專名稱','Page ID','資料來源','命中關鍵字','關聯廣告數','最後偵測','風險','處理狀態'];
  const lines = [headers, ...rows.map((item) => [
    item.id,
    item.name,
    item.pageId,
    item.sources.join(' + '),
    item.keyword,
    item.ads,
    item.lastDetected,
    labelMap.risk[item.risk],
    labelMap.status[item.status]
  ])].map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(','));

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'watchmen-v2-cases.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('已匯出目前篩選結果 CSV');
}

document.querySelectorAll('[data-source]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-source]').forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    state.source = button.dataset.source;
    render();
  });
});

ui.riskFilter.addEventListener('change', (event) => {
  state.risk = event.target.value;
  render();
});

ui.statusFilter.addEventListener('change', (event) => {
  state.status = event.target.value;
  render();
});

ui.keywordInput.addEventListener('input', (event) => syncKeyword(event.target.value, 'keyword'));
ui.tableSearch.addEventListener('input', (event) => syncKeyword(event.target.value, 'table'));

ui.tableBody.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-case]');
  if (trigger) openDrawer(trigger.dataset.openCase);
});

ui.fanPageTableBody.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-case]');
  if (trigger) openDrawer(trigger.dataset.openCase);
});

ui.adsTableBody.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-case]');
  if (trigger) openDrawer(trigger.dataset.openCase);
});

function setupTabs(container, onChange) {
  const tabs = Array.from(container.querySelectorAll('[role="tab"]'));

  function activateTab(index, { focusTab = false } = {}) {
    tabs.forEach((tab, i) => {
      const isActive = i === index;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    if (focusTab) tabs[index].focus();
    onChange(tabs[index].dataset);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(index));
    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = tabs.length - 1;
      if (nextIndex !== null) {
        event.preventDefault();
        activateTab(nextIndex, { focusTab: true });
      }
    });
  });
}

function setView(view) {
  state.view = view;
  ui.caseViewPanel.hidden = view !== 'case';
  ui.rawViewPanel.hidden = view !== 'raw';
  ui.sourceFilterGroup.hidden = view !== 'case';
  ui.riskFilterGroup.hidden = view !== 'case';
  ui.statusFilterGroup.hidden = view !== 'case';
  ui.filterSecondaryGrid.classList.toggle('is-raw-mode', view === 'raw');
  render();
}

function setRawSource(rawSource) {
  state.rawSource = rawSource;
  ui.fanPagePanel.hidden = rawSource !== 'fan-page';
  ui.adsPanel.hidden = rawSource !== 'meta-ads';
  render();
}

setupTabs(document.querySelector('#viewToggle'), (dataset) => setView(dataset.view));
setupTabs(document.querySelector('#rawSubTabs'), (dataset) => setRawSource(dataset.rawSource));

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
