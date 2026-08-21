/**
 * YouTube → Notion 실시간 Instant RSS & Gemini Pro 심층 금융 리포트 생성 엔진
 * 
 * 2개 YouTube 채널(경제사냥꾼, 자산제곱)의 최신 업로드 영상을 
 * YouTube RSS Feeds (https://www.youtube.com/feeds/videos.xml?channel_id=...)를 
 * 통하여 60초(1분) 간격으로 실시간 자동 감지하여, 영상 업로드 직후 즉시 Notion DB에 
 * 생성하고 Gemini Pro 정밀 영상 분석 타임스탬프 리포트를 본문에 즉시 작성합니다.
 */

const { Client } = require('@notionhq/client');
const { generateVideoSummaryWithGeminiPro } = require('./gemini_pro_service');
require('dotenv').config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

const notion = new Client({ auth: NOTION_TOKEN });

const SYNC_CHANNELS = [
  {
    channelId: process.env.YOUTUBE_CHANNEL_1_ID || 'UC7usMJDHmtbs_oegmzQKKMA',
    channelName: process.env.YOUTUBE_CHANNEL_1_NAME || '경제사냥꾼',
    notionDbId: process.env.YOUTUBE_CHANNEL_1_DB_ID || process.env.ECONOMIC_DB_ID,
    dbName: process.env.YOUTUBE_CHANNEL_1_DB_NAME || '경제흐름'
  },
  {
    channelId: process.env.YOUTUBE_CHANNEL_2_ID || 'UCpTC-SMFjA3EDRhZIKOcKuQ',
    channelName: process.env.YOUTUBE_CHANNEL_2_NAME || '자산제곱',
    notionDbId: process.env.YOUTUBE_CHANNEL_2_DB_ID || process.env.YOUTUBE_DB_ID,
    dbName: process.env.YOUTUBE_CHANNEL_2_DB_NAME || '투자 방향'
  }
];

const syncState = {
  isRunning: false,
  lastSyncTime: null,
  lastResults: null,
  totalSyncs: 0,
  errors: []
};

/**
 * Fetch latest uploaded videos from YouTube RSS XML feed in REAL TIME (zero quota, instant update)
 */
async function fetchInstantRssVideos(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`RSS HTTP error ${res.status}`);
    const xml = await res.text();

    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXml = match[1];
      const idMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entryXml.match(/<title>(.*?)<\/title>/);
      const pubMatch = entryXml.match(/<published>(.*?)<\/published>/);

      if (idMatch && titleMatch) {
        entries.push({
          videoId: idMatch[1],
          title: titleMatch[1].trim(),
          publishedAt: pubMatch ? pubMatch[1] : new Date().toISOString()
        });
      }
    }
    return entries;
  } catch (err) {
    console.error(`Error fetching YouTube RSS for channel ${channelId}:`, err.message);
    return [];
  }
}

/**
 * Convert Markdown to Notion Blocks
 */
function convertMarkdownToNotionBlocks(mdText, videoUrl) {
  const lines = mdText.split('\n');
  const blocks = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('🎬')) {
      blocks.push({
        object: 'block',
        type: 'callout',
        callout: {
          icon: { emoji: '🎬' },
          rich_text: [
            { type: 'text', text: { content: line } }
          ]
        }
      });
    } else if (/^\d+\./.test(line)) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [
            { type: 'text', text: { content: line }, annotations: { bold: true, color: 'blue' } }
          ]
        }
      });
    } else if (line.startsWith('•') || line.startsWith('-')) {
      const textContent = line.replace(/^[•\-]\s*/, '');
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            { type: 'text', text: { content: textContent } }
          ]
        }
      });
    } else {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            { type: 'text', text: { content: line } }
          ]
        }
      });
    }
  }

  return blocks;
}

/**
 * Check existing Notion DB entries for a channel
 */
async function getExistingNotionVideos(dbId) {
  const cleanId = dbId.replace(/-/g, '');
  let pages = [];
  let hasMore = true;
  let startCursor = undefined;

  try {
    while (hasMore) {
      const response = await notion.databases.query({
        database_id: cleanId,
        page_size: 100,
        start_cursor: startCursor
      });
      pages = pages.concat(response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    const existingMap = new Map();
    for (const page of pages) {
      const props = page.properties || {};
      let title = '';
      let url = null;

      for (const [key, value] of Object.entries(props)) {
        if (!value) continue;
        if (value.type === 'title') {
          title = value.title?.map(t => t.plain_text).join('') || '';
        } else if (value.type === 'url' && value.url) {
          url = value.url;
        } else if (value.type === 'rich_text') {
          const text = value.rich_text?.map(t => t.plain_text).join('') || '';
          if (text.includes('youtube.com') || text.includes('youtu.be')) url = text;
        }
      }

      existingMap.set(page.id, { id: page.id, title, url });
      if (url) {
        const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([\w-]{11})/);
        if (match) existingMap.set(match[1], { id: page.id, title, url });
      }
      if (title) {
        existingMap.set(title.trim(), { id: page.id, title, url });
      }
    }
    return existingMap;
  } catch (err) {
    console.error(`Error querying Notion DB ${dbId}:`, err.message);
    return new Map();
  }
}

/**
 * Add a newly published YouTube video to Notion DB immediately with Gemini Pro summary
 */
async function addInstantVideoToNotion(config, video) {
  const isShorts = video.title.includes('[쇼츠]') || video.title.includes('쇼츠');
  const videoUrl = isShorts 
    ? `https://www.youtube.com/shorts/${video.videoId}`
    : `https://www.youtube.com/watch?v=${video.videoId}`;

  const cleanDbId = config.notionDbId.replace(/-/g, '');

  console.log(`⚡ [Instant Sync] New video uploaded! Adding to Notion: "${video.title}" (${videoUrl})`);

  // Build Notion page properties
  const properties = {
    '이름': {
      title: [{ text: { content: video.title, link: { url: videoUrl } } }]
    },
    'URL': {
      url: videoUrl
    },
    '영상 ID': {
      rich_text: [{ text: { content: video.videoId } }]
    },
    '업로드일': {
      date: { start: video.publishedAt.split('T')[0] }
    },
    '유형': {
      select: { name: isShorts ? '쇼츠 영상' : '일반 영상', color: isShorts ? 'red' : 'blue' }
    },
    '상태': {
      status: { name: `${config.dbName}_자동요약`, color: 'default' }
    }
  };

  try {
    // Create new Notion Page
    const pageRes = await notion.pages.create({
      parent: { database_id: cleanDbId },
      properties
    });

    console.log(`✅ Notion Page Created: "${video.title}" (ID: ${pageRes.id})`);

    // Generate Gemini Pro timestamped summary
    const summaryMd = await generateVideoSummaryWithGeminiPro(video.title, videoUrl);
    const notionBlocks = convertMarkdownToNotionBlocks(summaryMd, videoUrl);

    // Append summary blocks to Notion page body
    await notion.blocks.children.append({
      block_id: pageRes.id,
      children: notionBlocks.slice(0, 80)
    });

    console.log(`🎉 [Instant Sync Success] Gemini Pro summary written to Notion page!`);
    return true;
  } catch (err) {
    console.error(`Error adding instant video "${video.title}" to Notion:`, err.message);
    return false;
  }
}

/**
 * Instant RSS Polling Cycle (Checks YouTube channels every 60 seconds)
 */
async function syncInstantRss() {
  if (syncState.isRunning) return;
  syncState.isRunning = true;

  try {
    for (const config of SYNC_CHANNELS) {
      if (!config.channelId || !config.notionDbId) continue;

      const rssVideos = await fetchInstantRssVideos(config.channelId);
      if (rssVideos.length === 0) continue;

      const existingMap = await getExistingNotionVideos(config.notionDbId);

      for (const video of rssVideos) {
        const exists = existingMap.has(video.videoId) || existingMap.has(video.title.trim());
        if (!exists) {
          await addInstantVideoToNotion(config, video);
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }
  } catch (err) {
    console.error('Instant RSS Sync Error:', err.message);
  } finally {
    syncState.isRunning = false;
  }
}

/**
 * Full sync fallback
 */
async function syncAll() {
  await syncInstantRss();
  return { success: true, message: 'Instant RSS Sync complete' };
}

function getSyncStatus() {
  return {
    isRunning: syncState.isRunning,
    lastSyncTime: syncState.lastSyncTime,
    totalSyncs: syncState.totalSyncs,
    channels: SYNC_CHANNELS
  };
}

module.exports = {
  syncAll,
  syncInstantRss,
  getSyncStatus,
  SYNC_CHANNELS
};
