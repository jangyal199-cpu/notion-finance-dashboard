/**
 * 전체 Notion DB 페이지에 타임스탬프 기반 3단 정밀 분석 리포트를 직접 덮어쓰는 스크립트
 */

const { Client } = require('@notionhq/client');
const { buildTimestampedNotionBlocks } = require('./timestamp-summary-builder');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DB_CONFIG = {
  economic: {
    id: process.env.ECONOMIC_DB_ID,
    name: '경제흐름 (경제사냥꾼)'
  },
  youtube: {
    id: process.env.YOUTUBE_DB_ID,
    name: '투자 방향 (자산제곱)'
  }
};

function parsePageInfo(page) {
  let title = '제목 없음';
  let videoId = null;
  const props = page.properties || {};

  for (const [key, value] of Object.entries(props)) {
    if (value && value.type === 'title') {
      title = value.title?.map(t => t.plain_text).join('') || title;
    }
    if (value && value.type === 'rich_text' && key === '영상 ID') {
      videoId = value.rich_text?.map(t => t.plain_text).join('') || videoId;
    }
    if (value && value.type === 'url' && key === 'URL') {
      const match = (value.url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
      if (match) videoId = match[1];
    }
  }

  if (!videoId) {
    const match = title.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (match) videoId = match[1];
  }

  return { title, videoId };
}

async function updateAllPagesWithTimestampedReport() {
  console.log('🚀 [타임스탬프 3단 분석 리포트] 전체 Notion 페이지 작성 시작...');
  let totalUpdated = 0;

  for (const [dbKey, cfg] of Object.entries(DB_CONFIG)) {
    if (!cfg.id) continue;
    const cleanId = cfg.id.replace(/-/g, '');
    console.log(`\n========================================`);
    console.log(`데이터베이스 점검: ${cfg.name}`);
    console.log(`========================================`);

    let pages = [];
    let hasMore = true;
    let startCursor = undefined;

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

    console.log(`총 ${pages.length}개 페이지 발견. 타임라인 3단 분석 리포트 작성 중...`);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { title, videoId } = parsePageInfo(page);
      const isShorts = title.includes('[쇼츠]') || title.includes('쇼츠');
      const vId = videoId || 'Owte7G5dmUU'; // fallback ID

      try {
        const blocks = buildTimestampedNotionBlocks(title, vId, isShorts, cfg.name);

        await notion.blocks.children.append({
          block_id: page.id,
          children: blocks
        });

        totalUpdated++;
        console.log(`[${i + 1}/${pages.length}] ✅ 타임라인 리포트 작성 완료: "${title}"`);
        await new Promise(r => setTimeout(r, 350));
      } catch (err) {
        console.error(`[${i + 1}/${pages.length}] ❌ 작성 실패 ("${title}"):`, err.message);
      }
    }
  }

  console.log(`\n🎉 전체 ${totalUpdated}개 노션 페이지에 타임스탬프 3단 분석 리포트 작성 완료!`);
}

updateAllPagesWithTimestampedReport();
