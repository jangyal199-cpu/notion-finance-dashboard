// Global state
let allNotionItems = [];
let currentDbFilter = 'all'; // 'all', 'economic', 'youtube', 'telegram', 'insights'
let currentSubTab = 'liquidity'; // 'liquidity', 'capitalFlow', 'stockTarget'
let currentViewMode = 'card'; // 'card', 'table'
let searchQuery = '';
let strategyDetailsData = null;
let youtubeInsightsData = null;

// DOM Elements
const syncStatus = document.getElementById('syncStatus');
const syncYoutubeBtn = document.getElementById('syncYoutubeBtn');
const refreshBtn = document.getElementById('refreshBtn');
const kpiTotal = document.getElementById('kpiTotal');
const kpiEconomic = document.getElementById('kpiEconomic');
const kpiYoutube = document.getElementById('kpiYoutube');
const kpiTelegram = document.getElementById('kpiTelegram');
const tabBtns = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const cardViewBtn = document.getElementById('cardViewBtn');
const tableViewBtn = document.getElementById('tableViewBtn');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const cardsGrid = document.getElementById('cardsGrid');
const tableView = document.getElementById('tableView');
const tableBody = document.getElementById('tableBody');
const insightsView = document.getElementById('insightsView');
const videoInsightsGrid = document.getElementById('videoInsightsGrid');
const detailModal = document.getElementById('detailModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalTitle = document.getElementById('modalTitle');
const modalBadge = document.getElementById('modalBadge');
const modalBody = document.getElementById('modalBody');
const lastUpdated = document.getElementById('lastUpdated');
const kpiCards = document.querySelectorAll('.kpi-card');

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchNotionData();
});

function setupEventListeners() {
  refreshBtn.addEventListener('click', () => {
    fetchNotionData(true);
  });

  if (syncYoutubeBtn) {
    syncYoutubeBtn.addEventListener('click', async () => {
      syncYoutubeBtn.disabled = true;
      syncYoutubeBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> YouTube 동기화 중...`;
      updateStatus('YouTube 동기화 실행 중...', true);

      try {
        const res = await fetch('/api/youtube-sync/trigger', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setTimeout(() => {
            syncYoutubeBtn.disabled = false;
            syncYoutubeBtn.innerHTML = `<i class="fa-brands fa-youtube"></i> YouTube 즉시 동기화`;
            updateStatus('동기화 완료', false);
            fetchNotionData(true);
            alert('✅ YouTube 영상 및 본문 동기화가 완료되었습니다!');
          }, 3000);
        } else {
          alert('동기화 실행 실패: ' + (data.message || '오류'));
          syncYoutubeBtn.disabled = false;
          syncYoutubeBtn.innerHTML = `<i class="fa-brands fa-youtube"></i> YouTube 즉시 동기화`;
          updateStatus('동기화 실패', false, true);
        }
      } catch (err) {
        console.error('Sync trigger error:', err);
        syncYoutubeBtn.disabled = false;
        syncYoutubeBtn.innerHTML = `<i class="fa-brands fa-youtube"></i> YouTube 즉시 동기화`;
        updateStatus('동기화 오류', false, true);
      }
    });
  }

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderData();
  });

  cardViewBtn.addEventListener('click', () => {
    currentViewMode = 'card';
    cardViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');
    renderData();
  });

  tableViewBtn.addEventListener('click', () => {
    currentViewMode = 'table';
    tableViewBtn.classList.add('active');
    cardViewBtn.classList.remove('active');
    renderData();
  });

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDbFilter = btn.dataset.db;

      if (currentDbFilter === 'insights') {
        renderInsightsTab();
      } else {
        renderData();
      }
    });
  });

  document.querySelectorAll('.sub-tab-btn').forEach(sbtn => {
    sbtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.sub-tab-btn').forEach(sb => sb.classList.remove('active'));
      sbtn.classList.add('active');
      currentSubTab = sbtn.dataset.subtab;
      switchSubTab(currentSubTab);
    });
  });

  kpiCards.forEach(card => {
    card.addEventListener('click', () => {
      const tabTarget = card.dataset.tab;
      currentDbFilter = tabTarget;
      tabBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.db === tabTarget);
      });
      renderData();
    });
  });

  modalCloseBtn.addEventListener('click', closeModal);
  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeModal();
  });
}

// Fetch Notion Data from backend API
async function fetchNotionData(forceRefresh = false) {
  showLoading(true);
  updateStatus('데이터 로딩 중...', true);

  try {
    const url = forceRefresh ? '/api/notion/all?refresh=true' : '/api/notion/all';
    const res = await fetch(url);
    const data = await res.json();

    if (data.success) {
      allNotionItems = data.items || [];
      updateKPIs(data.summary);
      
      if (currentDbFilter === 'insights') {
        renderInsightsTab();
      } else {
        renderData();
      }

      const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      lastUpdated.textContent = `마지막 업데이트: ${timeStr}`;
      updateStatus('동기화 완료', false);
    } else {
      updateStatus('동기화 실패', false, true);
      alert('노션 데이터를 가져오는데 실패했습니다: ' + (data.error || '알 수 없는 오류'));
    }
  } catch (err) {
    console.error('Fetch error:', err);
    updateStatus('연결 오류', false, true);
  } finally {
    showLoading(false);
  }
}

function updateStatus(text, isLoading = false, isError = false) {
  const statusText = syncStatus.querySelector('.status-text');
  const dot = syncStatus.querySelector('.pulse-dot');
  
  statusText.textContent = text;
  if (isError) {
    dot.style.backgroundColor = '#ef4444';
    dot.style.boxShadow = '0 0 8px #ef4444';
  } else if (isLoading) {
    dot.style.backgroundColor = '#eab308';
    dot.style.boxShadow = '0 0 8px #eab308';
  } else {
    dot.style.backgroundColor = '#10b981';
    dot.style.boxShadow = '0 0 8px #10b981';
  }
}

function updateKPIs(summary) {
  if (!summary) return;
  kpiTotal.textContent = summary.total || 0;
  kpiEconomic.textContent = summary.economic?.count || 0;
  kpiYoutube.textContent = summary.youtube?.count || 0;
  kpiTelegram.textContent = summary.telegram?.count || 0;
}

function renderData() {
  insightsView.classList.add('hidden');

  let filtered = allNotionItems;

  if (currentDbFilter !== 'all') {
    filtered = filtered.filter(item => item.dbType === currentDbFilter);
  }

  if (searchQuery) {
    filtered = filtered.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const dbMatch = item.dbName.toLowerCase().includes(searchQuery);
      const summaryMatch = (item.shortSummary || '').toLowerCase().includes(searchQuery);
      return titleMatch || dbMatch || summaryMatch;
    });
  }

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    cardsGrid.classList.add('hidden');
    tableView.classList.add('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  if (currentViewMode === 'card') {
    cardsGrid.classList.remove('hidden');
    tableView.classList.add('hidden');
    renderCards(filtered);
  } else {
    tableView.classList.remove('hidden');
    cardsGrid.classList.add('hidden');
    renderTable(filtered);
  }
}

// Render Strategy Insights Tab
async function renderInsightsTab() {
  cardsGrid.classList.add('hidden');
  tableView.classList.add('hidden');
  emptyState.classList.add('hidden');
  insightsView.classList.remove('hidden');

  switchSubTab(currentSubTab);

  if (!strategyDetailsData) {
    await fetchStrategyDetails();
  } else {
    renderStrategyContent(strategyDetailsData);
  }

  // Always ensure video grid renders using allNotionItems if available
  if (allNotionItems && allNotionItems.length > 0) {
    renderYouTubeVideoGrid(allNotionItems);
  }
}

async function fetchStrategyDetails() {
  try {
    const stratRes = await fetch('/api/notion/strategy/details');
    const sData = await stratRes.json();

    if (sData.success) {
      strategyDetailsData = sData;
      renderStrategyContent(sData);
    }
  } catch (err) {
    console.error('Error fetching strategy details:', err);
  }

  try {
    const ytRes = await fetch('/api/notion/youtube/insights');
    const yData = await ytRes.json();
    if (yData.success && yData.videos) {
      youtubeInsightsData = yData;
      renderYouTubeVideoGrid(yData.videos);
    }
  } catch (err) {
    console.error('Error fetching youtube insights:', err);
  }
}

function switchSubTab(subtab) {
  const subLiquidity = document.getElementById('subtabLiquidity');
  const subCapitalFlow = document.getElementById('subtabCapitalFlow');
  const subStockTarget = document.getElementById('subtabStockTarget');

  if (subLiquidity) subLiquidity.classList.add('hidden');
  if (subCapitalFlow) subCapitalFlow.classList.add('hidden');
  if (subStockTarget) subStockTarget.classList.add('hidden');

  if (subtab === 'liquidity' && subLiquidity) {
    subLiquidity.classList.remove('hidden');
  } else if (subtab === 'capitalFlow' && subCapitalFlow) {
    subCapitalFlow.classList.remove('hidden');
  } else if (subtab === 'stockTarget' && subStockTarget) {
    subStockTarget.classList.remove('hidden');
    setTimeout(() => {
      if (typeof renderAdvancedAnalysisChart === 'function') {
        renderAdvancedAnalysisChart();
      }
    }, 50);
  }
}

function renderStrategyContent(data) {
  if (!data) return;
  switchSubTab(currentSubTab);

  if (data.stockRecommendations && data.stockRecommendations.recommendations) {
    renderStockRecommendations(data.stockRecommendations.recommendations);
  }
}

function renderStockRecommendations(recs) {
  const grid = document.getElementById('stockRecommendationsGrid');
  if (!grid || !recs) return;

  grid.innerHTML = recs.map(rec => {
    const tvSymbol = rec.ticker || 'KRX:005930';
    const tvUrl = rec.tradingViewUrl || `https://kr.tradingview.com/chart/?symbol=${tvSymbol}`;
    const currentPriceHtml = rec.currentPrice ? `
      <div style="font-size: 0.85rem; color: #38bdf8; font-weight: 700; margin-top: 0.2rem;">
        <i class="fa-solid fa-chart-line"></i> 현재 시세: ${escapeHtml(rec.currentPrice)}
      </div>
    ` : '';

    return `
      <div style="background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <span style="font-size: 0.75rem; background: rgba(99, 102, 241, 0.2); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600;">
              ${escapeHtml(rec.sector)}
            </span>
            <h4 style="font-size: 1.2rem; font-weight: 700; color: #f8fafc; margin-top: 0.4rem;">
              ${escapeHtml(rec.name)} <span style="font-size: 0.85rem; color: #94a3b8; font-weight: 400;">(${escapeHtml(rec.ticker)})</span>
            </h4>
            ${currentPriceHtml}
          </div>
          <div style="text-align: right;">
            <span style="background: ${rec.badgeColor || '#10b981'}22; color: ${rec.badgeColor || '#10b981'}; border: 1px solid ${rec.badgeColor || '#10b981'}44; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700;">
              ${escapeHtml(rec.badge)}
            </span>
            <div style="font-size: 0.78rem; color: #cbd5e1; margin-top: 0.3rem;">권장 비중: <strong>${escapeHtml(rec.allocation)}</strong></div>
          </div>
        </div>

        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 0.75rem;">
          <div style="font-size: 0.8rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 0.35rem; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-circle-question"></i> 왜 이 종목을 추천하는가? (Why this stock?)
          </div>
          <div style="font-size: 0.82rem; color: #e2e8f0; line-height: 1.5;">
            ${escapeHtml(rec.whyRecommended || rec.entryReason)}
          </div>
        </div>

        <div style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 0.8rem;">
          <div style="font-size: 0.78rem; color: #fca5a5; font-weight: 600; margin-bottom: 0.2rem;">
            <i class="fa-solid fa-bullseye"></i> 1차/2차 추천 진입 매수가 (Target Entry Range)
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: #f87171;">
            ${escapeHtml(rec.targetEntryRange)}
          </div>
          <div style="font-size: 0.78rem; color: #e2e8f0; margin-top: 0.4rem; line-height: 1.4;">
            💡 <strong>기술적 타깃 근거:</strong> ${escapeHtml(rec.entryReason)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; font-size: 0.8rem;">
          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.5rem 0.7rem; border-radius: 6px;">
            <span style="color: #6ee7b7; font-weight: 600;">🎯 목표가:</span>
            <div style="font-size: 0.95rem; font-weight: 700; color: #10b981; margin-top: 0.1rem;">${escapeHtml(rec.takeProfitTarget)}</div>
          </div>
          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); padding: 0.5rem 0.7rem; border-radius: 6px;">
            <span style="color: #fca5a5; font-weight: 600;">🛑 손절선:</span>
            <div style="font-size: 0.95rem; font-weight: 700; color: #ef4444; margin-top: 0.1rem;">${escapeHtml(rec.stopLossLine)}</div>
          </div>
        </div>

        <div style="font-size: 0.78rem; color: #94a3b8; background: rgba(15, 23, 42, 0.6); padding: 0.5rem 0.7rem; border-radius: 6px;">
          <strong style="color: #cbd5e1;">분할 매수 규칙:</strong> ${escapeHtml(rec.buyRule)}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.4rem;">
          <button onclick="if(typeof loadTradingViewSymbol==='function') loadTradingViewSymbol('${tvSymbol}'); window.scrollTo({top: 400, behavior: 'smooth'});" class="btn btn-secondary" style="padding: 0.35rem 0.5rem; font-size: 0.78rem; background: rgba(59, 130, 246, 0.15); color: #60a5fa; border-color: rgba(59, 130, 246, 0.3); justify-content: center;">
            <i class="fa-solid fa-chart-candlestick"></i> 차트 상단 띄우기
          </button>
          <a href="${escapeHtml(tvUrl)}" target="_blank" class="btn btn-secondary" style="padding: 0.35rem 0.5rem; font-size: 0.78rem; background: rgba(255, 255, 255, 0.08); color: #f8fafc; border-color: rgba(255, 255, 255, 0.2); justify-content: center;">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> TradingView 보기
          </a>
        </div>

        <div style="margin-top: 0.2rem;">
          <a href="${escapeHtml(rec.videoUrl)}" target="_blank" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem; background: #ef4444; width: 100%; justify-content: center;">
            <i class="fa-brands fa-youtube"></i> ▶️ 분석 근거 영상 시청하기
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderYouTubeVideoGrid(videos) {
  if (!videos || !videoInsightsGrid) return;
  videoInsightsGrid.innerHTML = videos.map(vid => {
    const createdDate = vid.createdTime ? new Date(vid.createdTime).toLocaleDateString('ko-KR') : '';
    const videoTarget = vid.videoUrl || vid.properties?.URL || '#';
    const hasVideo = videoTarget && videoTarget !== '#';
    const summaryText = vid.shortSummary || (vid.keyPoints && vid.keyPoints.length > 0 ? vid.keyPoints.join(' · ') : '노션 본문 정리 내용 확인 가능');
    const keyPoints = vid.keyPoints || [];

    const keyPointsHtml = keyPoints.length > 0 ? `
      <ul style="padding-left: 1rem; margin-top: 0.5rem; font-size: 0.82rem; color: #cbd5e1; display: flex; flex-direction: column; gap: 0.25rem;">
        ${keyPoints.slice(0, 3).map(kp => `<li>${escapeHtml(kp)}</li>`).join('')}
      </ul>
    ` : '';

    return `
      <div class="video-insight-card" onclick="openModal('${vid.id}')">
        <div class="video-insight-header">
          <i class="fa-brands fa-youtube"></i> YouTube DB · ${createdDate}
        </div>
        <h4 class="video-insight-title">${escapeHtml(vid.title)}</h4>

        <div class="card-summary-box" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 8px; padding: 0.75rem; margin: 0.5rem 0;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.3rem;">
            <i class="fa-solid fa-sparkles"></i> Gemini Pro 지능형 노션 영상 요약
          </div>
          <p style="font-size: 0.85rem; color: #e2e8f0; line-height: 1.5; font-weight: 500;">
            ${escapeHtml(summaryText.slice(0, 160))}${summaryText.length > 160 ? '...' : ''}
          </p>
          ${keyPointsHtml}
        </div>

        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: auto; display: flex; flex-direction: column; gap: 0.5rem;">
          ${hasVideo ? `<a href="${escapeHtml(videoTarget)}" target="_blank" onclick="event.stopPropagation();" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; background: #ef4444; width: 100%; justify-content: center;"><i class="fa-brands fa-youtube"></i> ▶️ 원본 영상 시청하기</a>` : ''}
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
            <span>전체 노션 본문 읽기</span>
            <span style="color: var(--accent-telegram); font-weight: 600;">상세보기 <i class="fa-solid fa-chevron-right"></i></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderCards(items) {
  cardsGrid.innerHTML = items.map(item => {
    const dbColor = item.badgeColor || '#6366f1';
    const createdDate = item.createdTime ? new Date(item.createdTime).toLocaleDateString('ko-KR') : '';
    const videoTarget = item.videoUrl || item.properties?.URL || null;
    const summaryText = item.shortSummary || (item.keyPoints && item.keyPoints.length > 0 ? item.keyPoints.join(' · ') : null);

    const propChips = Object.entries(item.properties)
      .filter(([k, v]) => k !== item.titleKey && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0))
      .slice(0, 4)
      .map(([k, v]) => {
        let valStr = '';
        if (typeof v === 'object' && v.name) valStr = v.name;
        else if (Array.isArray(v)) valStr = v.map(i => i.name || i).join(', ');
        else if (typeof v === 'object' && v.start) valStr = v.start;
        else valStr = String(v);

        return `<span class="prop-chip"><span class="chip-key">${escapeHtml(k)}:</span> ${escapeHtml(valStr)}</span>`;
      }).join('');

    const summaryBlock = summaryText ? `
      <div class="card-summary-box" style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 0.7rem; margin: 0.6rem 0;">
        <div style="font-size: 0.75rem; font-weight: 700; color: #ef4444; display: flex; align-items: center; gap: 0.3rem; margin-bottom: 0.25rem;">
          <i class="fa-solid fa-brain"></i> Gemini Pro 영상 요약
        </div>
        <p style="font-size: 0.83rem; color: #cbd5e1; line-height: 1.45;">
          ${escapeHtml(summaryText.slice(0, 140))}${summaryText.length > 140 ? '...' : ''}
        </p>
      </div>
    ` : '';

    return `
      <div class="card" onclick="openModal('${item.id}')">
        <div class="card-header">
          <span class="db-tag" style="background: ${dbColor}22; color: ${dbColor}; border: 1px solid ${dbColor}44;">
            ${escapeHtml(item.dbName)}
          </span>
          <span class="card-date">${createdDate}</span>
        </div>
        
        <h3 class="card-title">${escapeHtml(item.title)}</h3>
        
        ${summaryBlock}

        <div class="card-props">
          ${propChips}
        </div>
        
        <div class="card-footer">
          ${videoTarget ? `<a href="${escapeHtml(videoTarget)}" target="_blank" onclick="event.stopPropagation();" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);"><i class="fa-brands fa-youtube"></i> 영상 시청</a>` : ''}
          <span class="view-link">본문 상세보기 <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>
    `;
  }).join('');
}

function renderTable(items) {
  tableBody.innerHTML = items.map(item => {
    const dbColor = item.badgeColor || '#6366f1';
    const createdDate = item.createdTime ? new Date(item.createdTime).toLocaleDateString('ko-KR') : '';
    const videoTarget = item.videoUrl || item.properties?.URL || null;

    const propChips = Object.entries(item.properties)
      .slice(0, 3)
      .map(([k, v]) => {
        let valStr = '';
        if (typeof v === 'object' && v.name) valStr = v.name;
        else if (Array.isArray(v)) valStr = v.map(i => i.name || i).join(', ');
        else if (typeof v === 'object' && v.start) valStr = v.start;
        else valStr = String(v);
        return `<span class="prop-chip"><span class="chip-key">${escapeHtml(k)}:</span> ${escapeHtml(valStr)}</span>`;
      }).join('');

    return `
      <tr onclick="openModal('${item.id}')" style="cursor: pointer;">
        <td>
          <span class="db-tag" style="background: ${dbColor}22; color: ${dbColor}; border: 1px solid ${dbColor}44;">
            ${escapeHtml(item.dbName)}
          </span>
        </td>
        <td style="font-weight: 600; color: var(--text-main);">
          ${escapeHtml(item.title)}
        </td>
        <td>
          <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
            ${propChips}
          </div>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${createdDate}
        </td>
        <td>
          <div style="display: flex; gap: 0.4rem; align-items: center;">
            ${videoTarget ? `<a href="${escapeHtml(videoTarget)}" target="_blank" onclick="event.stopPropagation();" class="btn btn-secondary" style="padding: 0.2rem 0.4rem; font-size: 0.72rem; color: #ef4444;"><i class="fa-brands fa-youtube"></i> 영상</a>` : ''}
            <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;">보기</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function openModal(pageId) {
  const item = allNotionItems.find(i => i.id === pageId);
  if (!item) return;

  modalTitle.textContent = item.title;
  modalBadge.textContent = item.dbName;
  modalBadge.style.background = `${item.badgeColor || '#6366f1'}22`;
  modalBadge.style.color = item.badgeColor || '#6366f1';
  modalBadge.style.border = `1px solid ${item.badgeColor || '#6366f1'}44`;

  detailModal.classList.remove('hidden');
  modalBody.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>노션 데이터베이스 본문 및 영상 리포트를 읽어오는 중입니다...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/notion/page/${pageId}/content`);
    const data = await res.json();

    const videoTarget = item.videoUrl || item.properties?.URL || null;
    const embedHtml = item.embedUrl ? `
      <div style="margin-bottom: 1.5rem; border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
        <iframe src="${escapeHtml(item.embedUrl)}" style="width: 100%; height: 360px; border: none;" allowfullscreen></iframe>
      </div>
    ` : '';

    const directVideoBtn = videoTarget ? `
      <div style="margin-bottom: 1rem; text-align: right;">
        <a href="${escapeHtml(videoTarget)}" target="_blank" class="btn btn-primary" style="background: #ef4444;">
          <i class="fa-brands fa-youtube"></i> YouTube 원본 영상 바로가기
        </a>
      </div>
    ` : '';

    if (data.success && data.html) {
      modalBody.innerHTML = `
        ${embedHtml}
        ${directVideoBtn}
        <div class="notion-rendered-content">
          ${data.html}
        </div>
      `;
    } else {
      modalBody.innerHTML = `
        ${embedHtml}
        ${directVideoBtn}
        <div class="empty-state" style="padding: 2rem 0;">
          <i class="fa-solid fa-file-circle-exclamation"></i>
          <p>노션 본문 내용이 없거나 읽어올 수 없습니다.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error('Modal content error:', err);
    modalBody.innerHTML = `
      <div class="empty-state" style="padding: 2rem 0; color: #ef4444;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>본문 로딩 중 오류가 발생했습니다.</p>
      </div>
    `;
  }
}

function closeModal() {
  detailModal.classList.add('hidden');
}

function showLoading(isLoading) {
  if (isLoading) {
    loadingState.classList.remove('hidden');
    emptyState.classList.add('hidden');
    cardsGrid.classList.add('hidden');
    tableView.classList.add('hidden');
  } else {
    loadingState.classList.add('hidden');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
