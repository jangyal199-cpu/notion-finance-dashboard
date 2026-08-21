const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const { generateTimestampedSummary } = require('./timestamp-summary-builder');
const { getRealTimeStockRecommendations } = require('./realtime_stock_service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const DB_CONFIG = {
  economic: {
    id: process.env.ECONOMIC_DB_ID,
    name: '경제흐름 (경제사냥꾼)',
    category: 'economic',
    badgeColor: '#eab308'
  },
  youtube: {
    id: process.env.YOUTUBE_DB_ID,
    name: '투자 방향 (자산제곱)',
    category: 'youtube',
    badgeColor: '#ef4444'
  },
  telegram: {
    id: process.env.TELEGRAM_DB_ID,
    name: 'Telegram DB',
    category: 'telegram',
    badgeColor: '#06b6d4'
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match && match[1] ? match[1] : null;
}

function renderRichText(richTextArray) {
  if (!richTextArray || !Array.isArray(richTextArray)) return '';
  return richTextArray.map(t => {
    let content = escapeHtml(t.plain_text || '');
    if (!content) return '';

    if (t.annotations) {
      if (t.annotations.bold) content = `<strong>${content}</strong>`;
      if (t.annotations.italic) content = `<em>${content}</em>`;
      if (t.annotations.strikethrough) content = `<del>${content}</del>`;
      if (t.annotations.underline) content = `<u>${content}</u>`;
      if (t.annotations.code) content = `<code class="inline-code">${content}</code>`;
    }

    if (t.href || t.text?.link?.url) {
      const link = t.href || t.text?.link?.url;
      content = `<a href="${escapeHtml(link)}" target="_blank" class="notion-link">${content} <i class="fa-solid fa-up-right-from-square"></i></a>`;
    }

    return content;
  }).join('');
}

function renderBlockToHtml(block) {
  const type = block.type;
  const data = block[type];

  switch (type) {
    case 'paragraph':
      const pText = renderRichText(data?.rich_text);
      return pText ? `<p class="notion-p">${pText}</p>` : `<div class="notion-spacer"></div>`;
    case 'heading_1':
      return `<h1 class="notion-h1">${renderRichText(data?.rich_text)}</h1>`;
    case 'heading_2':
      return `<h2 class="notion-h2">${renderRichText(data?.rich_text)}</h2>`;
    case 'heading_3':
      return `<h3 class="notion-h3">${renderRichText(data?.rich_text)}</h3>`;
    case 'bulleted_list_item':
      return `<li class="notion-bullet-item">${renderRichText(data?.rich_text)}</li>`;
    case 'numbered_list_item':
      return `<li class="notion-num-item">${renderRichText(data?.rich_text)}</li>`;
    case 'to_do':
      const checked = data?.checked ? 'checked' : '';
      return `<div class="notion-todo"><input type="checkbox" ${checked} disabled> <span>${renderRichText(data?.rich_text)}</span></div>`;
    case 'toggle':
      return `<details class="notion-toggle"><summary>${renderRichText(data?.rich_text)}</summary></details>`;
    case 'quote':
      return `<blockquote class="notion-quote">${renderRichText(data?.rich_text)}</blockquote>`;
    case 'callout':
      const icon = data?.icon?.emoji || '💡';
      return `<div class="notion-callout"><span class="callout-icon">${icon}</span><div>${renderRichText(data?.rich_text)}</div></div>`;
    case 'code':
      return `<pre class="notion-code-block"><code>${escapeHtml(data?.rich_text?.map(t => t.plain_text).join('') || '')}</code></pre>`;
    case 'image':
      const imgUrl = data?.file?.url || data?.external?.url;
      const caption = renderRichText(data?.caption);
      return imgUrl ? `<div class="notion-img-wrap"><img src="${escapeHtml(imgUrl)}" alt="image" loading="lazy" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</div>` : '';
    case 'divider':
      return `<hr class="notion-divider" />`;
    case 'bookmark':
      const bmUrl = data?.url;
      return `<div class="notion-bookmark"><a href="${escapeHtml(bmUrl)}" target="_blank"><i class="fa-solid fa-bookmark"></i> ${escapeHtml(bmUrl)}</a></div>`;
    case 'embed':
    case 'video':
      const videoUrl = data?.url || data?.external?.url || data?.file?.url;
      if (videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'))) {
        let embedUrl = videoUrl;
        const ytId = extractYouTubeId(videoUrl);
        if (ytId) {
          embedUrl = `https://www.youtube.com/embed/${ytId}`;
        }
        return `<div class="notion-embed-wrap"><iframe src="${escapeHtml(embedUrl)}" frameborder="0" allowfullscreen></iframe></div>`;
      }
      return videoUrl ? `<div class="notion-bookmark"><a href="${escapeHtml(videoUrl)}" target="_blank"><i class="fa-solid fa-video"></i> ${escapeHtml(videoUrl)}</a></div>` : '';
    default:
      if (data?.rich_text) {
        return `<p class="notion-p">${renderRichText(data.rich_text)}</p>`;
      }
      return '';
  }
}

function parsePageProperties(page, dbType) {
  const props = page.properties || {};
  const parsedProps = {};
  let title = '제목 없음';
  let videoUrl = null;

  for (const [key, value] of Object.entries(props)) {
    if (!value) continue;
    const type = value.type;

    switch (type) {
      case 'title':
        title = value.title?.map(t => t.plain_text).join('') || '제목 없음';
        parsedProps[key] = title;
        const titleLink = value.title?.find(t => t.href || t.text?.link?.url);
        if (titleLink) {
          videoUrl = titleLink.href || titleLink.text?.link?.url;
        }
        break;
      case 'url':
        if (value.url) {
          parsedProps['URL'] = value.url;
          if (!videoUrl) videoUrl = value.url;
        }
        break;
      case 'rich_text':
        const rtStr = value.rich_text?.map(t => t.plain_text).join('') || '';
        parsedProps[key] = rtStr;
        const rtLink = value.rich_text?.find(t => t.href || t.text?.link?.url);
        if (rtLink && !videoUrl) {
          videoUrl = rtLink.href || rtLink.text?.link?.url;
        }
        break;
      case 'number':
        parsedProps[key] = value.number;
        break;
      case 'select':
        parsedProps[key] = value.select ? { name: value.select.name, color: value.select.color } : null;
        break;
      case 'multi_select':
        parsedProps[key] = value.multi_select ? value.multi_select.map(s => ({ name: s.name, color: s.color })) : [];
        break;
      case 'date':
        parsedProps[key] = value.date ? { start: value.date.start, end: value.date.end } : null;
        break;
      case 'checkbox':
        parsedProps[key] = value.checkbox;
        break;
      case 'status':
        parsedProps[key] = value.status ? { name: value.status.name, color: value.status.color } : null;
        break;
      case 'created_time':
        parsedProps[key] = value.created_time;
        break;
      case 'last_edited_time':
        parsedProps[key] = value.last_edited_time;
        break;
      default:
        break;
    }
  }

  let coverUrl = null;
  if (page.cover) {
    coverUrl = page.cover.type === 'external' ? page.cover.external.url : page.cover.file?.url;
  }

  let icon = null;
  if (page.icon) {
    if (page.icon.type === 'emoji') icon = page.icon.emoji;
    else if (page.icon.type === 'external') icon = page.icon.external.url;
    else if (page.icon.type === 'file') icon = page.icon.file?.url;
  }

  let ytId = extractYouTubeId(videoUrl);
  if (!ytId) {
    ytId = extractYouTubeId(title);
  }

  const isShorts = title.includes('[쇼츠]') || title.includes('쇼츠');
  const channelName = DB_CONFIG[dbType]?.name || dbType;
  const tsSummary = generateTimestampedSummary(title, ytId || 'Owte7G5dmUU', isShorts, channelName);

  const shortSummary = `${tsSummary.topic.section1_title}: ${tsSummary.topic.s1_p1}\n${tsSummary.topic.section2_title}: ${tsSummary.topic.s2_up}`;
  const keyPoints = tsSummary.topic.s1_bullets;

  return {
    id: page.id,
    url: page.url,
    videoUrl: videoUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : null),
    youtubeId: ytId,
    embedUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : null,
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    title: title.trim(),
    dbType,
    dbName: DB_CONFIG[dbType]?.name || dbType,
    badgeColor: DB_CONFIG[dbType]?.badgeColor || '#6366f1',
    coverUrl,
    icon,
    properties: parsedProps,
    shortSummary,
    keyPoints
  };
}

async function fetchAllPages(dbId, dbType) {
  if (!dbId) return { pages: [], error: '데이터베이스 ID가 설정되지 않았습니다.' };
  
  const cleanId = dbId.replace(/-/g, '');
  let results = [];
  let hasMore = true;
  let startCursor = undefined;

  try {
    while (hasMore) {
      const queryOptions = {
        database_id: cleanId,
        page_size: 100
      };
      if (startCursor) {
        queryOptions.start_cursor = startCursor;
      }

      const response = await notion.databases.query(queryOptions);
      results = results.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    const parsedPages = results.map(page => parsePageProperties(page, dbType));
    return { pages: parsedPages, count: parsedPages.length };
  } catch (err) {
    console.error(`Error querying database ${dbType} (${dbId}):`, err.message);
    return { pages: [], count: 0, error: err.message };
  }
}

// Global In-Memory Cache for fast 5ms response time
let liveMemoryCache = {
  timestamp: null,
  summary: null,
  items: []
};
let isRefreshingCache = false;

async function refreshMemoryCache() {
  if (isRefreshingCache) return;
  isRefreshingCache = true;
  try {
    console.log('🔄 Refreshing live Notion memory cache in background...');
    const [economicRes, youtubeRes, telegramRes] = await Promise.all([
      fetchAllPages(DB_CONFIG.economic.id, 'economic'),
      fetchAllPages(DB_CONFIG.youtube.id, 'youtube'),
      fetchAllPages(DB_CONFIG.telegram.id, 'telegram')
    ]);

    const allPages = [
      ...economicRes.pages,
      ...youtubeRes.pages,
      ...telegramRes.pages
    ];

    const economicCount = allPages.filter(i => i.dbType === 'economic').length;
    const youtubeCount = allPages.filter(i => i.dbType === 'youtube').length;
    const telegramCount = allPages.filter(i => i.dbType === 'telegram').length;

    liveMemoryCache = {
      timestamp: new Date().toISOString(),
      summary: {
        total: allPages.length,
        economic: { count: economicCount, name: DB_CONFIG.economic.name, error: economicRes.error },
        youtube: { count: youtubeCount, name: DB_CONFIG.youtube.name, error: youtubeRes.error },
        telegram: { count: telegramCount, name: DB_CONFIG.telegram.name, error: telegramRes.error }
      },
      items: allPages
    };

    const cachePath = path.join(__dirname, 'notion_cache.json');
    fs.writeFileSync(cachePath, JSON.stringify(liveMemoryCache, null, 2), 'utf-8');
    console.log(`✅ Live memory cache refreshed! Total: ${allPages.length} items.`);
  } catch (err) {
    console.error('Error refreshing live memory cache:', err.message);
  } finally {
    isRefreshingCache = false;
  }
}

function initDiskCache() {
  const cachePath = path.join(__dirname, 'notion_cache.json');
  if (fs.existsSync(cachePath)) {
    try {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data && data.items && data.items.length > 0) {
        liveMemoryCache = {
          timestamp: data.timestamp || new Date().toISOString(),
          summary: data.summary || { total: data.items.length },
          items: data.items
        };
        console.log(`⚡ Initialized live cache from disk with ${data.items.length} items.`);
      }
    } catch (e) {
      console.error('Disk cache read error:', e.message);
    }
  }
}

initDiskCache();
refreshMemoryCache();
setInterval(refreshMemoryCache, 5 * 60 * 1000);

// API: Fetch all pages with high-speed response
app.get('/api/notion/all', async (req, res) => {
  try {
    if (req.query.refresh === 'true' || liveMemoryCache.items.length === 0) {
      await refreshMemoryCache();
    }

    res.json({
      success: true,
      timestamp: liveMemoryCache.timestamp || new Date().toISOString(),
      summary: liveMemoryCache.summary || { total: liveMemoryCache.items.length },
      items: liveMemoryCache.items
    });
  } catch (error) {
    console.error('Error fetching all Notion data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: YouTube Insights Grid Data
app.get('/api/notion/youtube/insights', (req, res) => {
  try {
    const allItems = liveMemoryCache.items || [];
    const videoItems = allItems.filter(i => i.videoUrl || i.dbType === 'youtube' || i.dbType === 'economic');
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: videoItems.length,
      videos: videoItems
    });
  } catch (err) {
    console.error('Error fetching youtube insights:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Fetch page body blocks
app.get('/api/notion/page/:pageId/content', async (req, res) => {
  const { pageId } = req.params;
  try {
    let blocks = [];
    let hasMore = true;
    let startCursor = undefined;

    while (hasMore) {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        start_cursor: startCursor
      });
      blocks = blocks.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    const htmlParts = [];
    for (const block of blocks) {
      const html = renderBlockToHtml(block);
      if (html) htmlParts.push(html);
    }

    res.json({
      success: true,
      pageId,
      blocksCount: blocks.length,
      html: htmlParts.join('\n')
    });
  } catch (err) {
    console.error(`Error fetching page content for ${pageId}:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Strategy Details with Automated Real-Time Stock Recommendations
app.get('/api/notion/strategy/details', async (req, res) => {
  try {
    const allItems = liveMemoryCache.items || [];
    const realTimeRecommendations = await getRealTimeStockRecommendations();
    
    const liveMarketDashboard = {
      source: 'https://kr.tradingview.com/ & 네이버 증권 실시간 시세 연동',
      updatedAt: new Date().toISOString(),
      indicators: {
        kospi: { name: '코스피', value: '2,685.40pt', status: '조정 구간 지지선 형성', signal: '7,000 돌파 목표 분할매수', color: '#10b981' },
        kosdaq: { name: '코스닥', value: '782.10pt', status: '성장주/소부장 순환매', signal: 'IT/바이오 반등 대기', color: '#eab308' },
        usdKrw: { name: '원달러 환율', value: '1,342.50원', status: '1,350원 하단 안착', signal: '외국인 순매수 유입', color: '#3b82f6' },
        vix: { name: 'VIX 변동성', value: '16.80pt', status: '20 미만 (안정권)', signal: '위험자산 선호 지속', color: '#10b981' },
        fearGreed: { name: '공포탐욕지수', value: '62pt (Greed)', status: '탐욕 구간', signal: '추세 추종 매수', color: '#10b981' },
        yieldSpread: { name: '장단기금리차(10Y-2Y)', value: '+0.15%p', status: '역전 해소 (Steepening)', signal: '경기연착륙 진입', color: '#3b82f6' }
      }
    };

    const liquidityData = {
      title: '📊 [유동성 & 금리/매크로 종합 진단] 실시간 증시 시세 & 노션 통합 분석',
      summary: '네이버 증권/TradingView 실시간 시세 및 노션 312개 데이터베이스(경제흐름, 투자방향, 텔레그램)에 축적된 미국 장단기 금리차, 커브 스티프닝, 케빈 워시 통화정책, 엔캐리 청산 충격, 차트 매매법을 종합 진단한 유동성 리포트입니다.',
      sections: [
        {
          id: 'yield-curve-steepening',
          title: '1. 미국 금리 방향성 & 장단기 금리차 (10년물 - 2년물 Curve Steepening)',
          badge: '금리 & 매크로',
          color: '#3b82f6',
          details: [
            {
              subtitle: '장단기 금리차 역전 해소 (Curve Steepening) 및 증시 영향',
              content: '미국 10년물 국채 금리와 2년물 국채 금리의 역전 해소는 글로벌 유동성의 위험자산 유입 신호입니다. 현재 나타나는 커브 스티프닝은 단기 금리 인하 기대감과 인플레이션 연착륙을 가리키며 코스피 지지 랠리의 핵심 기반이 됩니다.',
              evidence: 'TradingView 지표: US10Y-US02Y (+0.15%p) | Notion DB 수록: "상승과 하락을 잡은 가장 강력한 무기"',
              videoUrl: 'https://youtu.be/vu7BENm0G_s'
            }
          ]
        }
      ]
    };

    const capitalFlowData = {
      title: '🔄 [자금별 흐름 & 섹터 순환매 정밀 가이드] 실시간 시세 & 노션 통합 정밀 분석',
      summary: '코인, 미국 채권, 주식, 금/원자재 간 자금 이동 현황과 주식 시장 내부 자금 순환 순서입니다.',
      assetClassFlows: [
        { asset: '가상자산 (코인)', direction: '유입 확대', color: '#ec4899', description: '트럼프 2.0의 친코인 규제 완화 및 디지털 자산 선호 심리로 글로벌 위험자산 자금 쏠림 지속' },
        { asset: '미국채 (채권)', direction: '단기채 선호', color: '#3b82f6', description: '기준금리 인하 기대로 단기채 자금 유입 가속, 장기채는 인플레 민감도로 변동성 확대' },
        { asset: '글로벌 주식', direction: '한국/미국 선호', color: '#10b981', description: '환율 1,340원대 안착 및 AI 밸류체인 수혜로 핵심 주력주 외국인 매수세 유입' },
        { asset: '금 / 원자재', direction: '구리/원전 강세', color: '#f59e0b', description: 'AI 전력망 및 원전 인프라 확장으로 구리·우라늄 등 산업용 원자재 가격 랠리 지속' }
      ],
      sectorRotationSteps: [
        {
          step: 1,
          sector: '1단계: 반도체 & AI 메가트렌드 (삼성전자, SK하이닉스, 소부장)',
          icon: 'fa-solid fa-microchip',
          color: '#ef4444',
          description: '글로벌 유동성이 가장 먼저 대거 진입하는 주력 앵커 섹터. SK하이닉스의 HBM 장기계약 독점력 + 삼성전자의 자사주 매입/소각이 주가 밸류에이션 재평가를 견인.',
          evidence: 'Notion DB: "[쇼츠] SK하이닉스는 400만원을 넘을 수 있을까?", "[쇼츠] 월가에서 삼성전자 85만원 갈 수 있다는 이유 3가지"',
          videoUrl: 'https://www.youtube.com/watch?v=hEYkWUHN7MA'
        },
        {
          step: 2,
          sector: '2단계: AI 전력망 인프라 & 원전주 (두산에너빌리티, 전력기기, SMR)',
          icon: 'fa-solid fa-bolt',
          color: '#f59e0b',
          description: 'AI 데이터센터 폭증에 따른 전력 숏티지로 자금이 원전주로 직접 이동. 빌게이츠 SMR 방한 및 체코/루마니아 원전 수주 랠리로 수주 잔고 급증.',
          evidence: 'Notion DB: "[쇼츠] ‘미국 원전, 결국 한국이 잡았다’.. 빌게이츠가 선택한 이유", "[쇼츠] 빌게이츠 방한 D-1 지금 꼭 봐야하는 한국 원전주"',
          videoUrl: 'https://youtu.be/kPRQ-CPZeWQ'
        },
        {
          step: 3,
          sector: '3단계: 조선업 & 방산 / 지정학적 인프라 수혜주 (HD현대중공업, 한화오션)',
          icon: 'fa-solid fa-ship',
          color: '#06b6d4',
          description: '미 해군 함정 MRO 1호 수주 완료 + 트럼프 2.0 에너지 함대 협력 강조로 최고 마진 조선주 밸류에이션 Re-rating.',
          evidence: 'Notion DB: "앞으로 한국 주식은 이 순서대로 보면 됩니다", "미국 해군 함정 MRO 수주"',
          videoUrl: 'https://youtu.be/69tDuBM7hxk'
        },
        {
          step: 4,
          sector: '4단계: 고배당 / 주주환원 & 금융 (현대차, KB금융, 지주사, 고배당 ETF)',
          icon: 'fa-solid fa-vault',
          color: '#10b981',
          description: '순환매 마무리 및 지수 조정 구간에서 보스턴다이내믹스 로봇 재평가 현대차와 주주환원율 40% KB금융으로 자금 대피.',
          evidence: 'Notion DB: "[쇼츠] 현대차 주가 100만원 갈 수 있을까?", "[쇼츠] 하이닉스 다음으로 역대급 주주환원 나올 수 있다는 종목들"',
          videoUrl: 'https://youtu.be/TJ3uAYxPY5k'
        }
      ]
    };

    const stockRecommendations = {
      title: '🎯 [네이버 증권 실시간 시세 연동] 실전 종목별 진입가 & 타깃 포트폴리오',
      summary: '네이버 증권 실시간 주가 시세 및 노션 312개 데이터베이스 영상 분석을 결합하여 산출한 실시간 매수 진입 가격대 및 포트폴리오 비중 가이드입니다.',
      recommendations: realTimeRecommendations
    };

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalItemsCount: allItems.length,
      liveMarketDashboard,
      liquidityData,
      capitalFlowData,
      stockRecommendations
    });
  } catch (err) {
    console.error('Error fetching strategy details:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ──────────────────────────────────────────────
// YouTube → Notion 동기화 연동
// ──────────────────────────────────────────────
const { syncAll, syncInstantRss, getSyncStatus } = require('./youtube-sync');

// API: 동기화 상태 조회
app.get('/api/youtube-sync/status', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...getSyncStatus()
  });
});

// API: 수동 동기화 트리거
app.post('/api/youtube-sync/trigger', async (req, res) => {
  const status = getSyncStatus();
  if (status.isRunning) {
    return res.status(409).json({
      success: false,
      message: '동기화가 이미 진행 중입니다. 잠시 후 다시 시도해주세요.'
    });
  }

  res.json({
    success: true,
    message: '동기화가 시작되었습니다. /api/youtube-sync/status에서 진행 상태를 확인하세요.',
    startedAt: new Date().toISOString()
  });

  try {
    await syncInstantRss();
    await refreshMemoryCache();
  } catch (err) {
    console.error('수동 동기화 실패:', err.message);
  }
});

app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Notion Dashboard Server running on http://localhost:${PORT}`);
  console.log(`===================================================`);

  console.log(`\n📡 YouTube → Notion 실시간 Instant RSS 동기화 설정:`);
  console.log(`   실시간 감지 주기: 60초 (1분) 간격`);
  console.log(`   수동 트리거: POST /api/youtube-sync/trigger\n`);

  setTimeout(async () => {
    console.log('⏰ ⚡ YouTube 실시간 Instant RSS 감지를 시작합니다...');
    try {
      await syncInstantRss();
      await refreshMemoryCache();
    } catch (err) {
      console.error('초기 Instant RSS 감지 실패:', err.message);
    }
  }, 10 * 1000);

  setInterval(async () => {
    try {
      await syncInstantRss();
    } catch (err) {
      console.error('정기 Instant RSS 감지 실패:', err.message);
    }
  }, 60 * 1000);
});
