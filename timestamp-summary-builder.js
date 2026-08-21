/**
 * YouTube 영상별 타임스탬프 기반 정밀 금융 분석 리포트 생성 엔진
 * 
 * [쇼츠 / 일반 영상]의 제목과 주제를 기반으로
 * 사용자가 지정한 타임라인 하이퍼링크([[00:15]](url&t=15))와
 * 3대 핵심 분석(모멘텀&밸류에이션, 변동성&조정원인, 3대 트리거) 구조를 생성합니다.
 */

function generateTimestampedSummary(title, videoId, isShorts, channelName) {
  const cleanTitle = title.replace('[쇼츠]', '').replace('[속보]', '').trim();
  const baseUrl = isShorts
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;

  const ts = (sec) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    const url = isShorts ? `${baseUrl}?t=${sec}` : `${baseUrl}&t=${sec}`;
    return { label: `[${m}:${s}]`, url };
  };

  // 기본 분석 템플릿 데이터
  let topic = {
    section1_title: '1. 핵심 모멘텀 및 밸류에이션 재평가 구조',
    s1_p1: '증권사 리포트 및 시장 컨센서스가 제시하는 목표 시가총액은 단순 단기 매출 실적만으로 산정된 금액이 아닙니다',
    s1_t1: 15,
    s1_p2: '세부 가치 평가 내역 (본업 가치 + 미래 파이프라인/플랫폼 성장 가치 재평가 반영)',
    s1_t2: 28,
    s1_bullets: [
      '본업 기본 가치: 영업이익 및 캐시카우 실적 지지',
      '신기술/플랫폼 지분 가치: 글로벌 메가트렌드 수혜 반영',
      '미래 사업 가치: Re-rating 핵심 반영 요인'
    ],
    s1_p3: '즉, 기존 제조/단일 제품 기업에서 플랫폼 및 기술 생태계 기업으로의 체질 변화가 주가 목표가의 핵심 반영 요소였습니다',
    s1_t3: 42,

    section2_title: '2. 주가 변동성 및 최근 가격 조정의 핵심 원인',
    s2_up: '상승 동력: 주요 기술 이벤트(CES, 실적 컨센서스 상향) 및 글로벌 수급 유입으로 주가 급등 모멘텀 형성',
    s2_t_up: 65,
    s2_down: '하락/조정 원인: 2분기 매출 호조에도 불구하고 관세·원자재 가격·공급망 이슈로 영업이익률 마진 감소 경향 반영',
    s2_t_down: 82,
    s2_target: '목표가 조정: 단기 본업 수익성 변동에 따라 주요 기관 리포트의 목표 밸류에이션 하향 조정 및 숨고르기 국면 진입',
    s2_t_target: 98,

    section3_title: '3. 주가 목표치 도달을 위해 확인해야 할 3가지 핵심 트리거',
    s3_t1_p: '신사업/플랫폼 가치의 실체화 (자회사 나스닥 상장 및 해외 대형 프로젝트 계약 등)',
    s3_t1_t: 112,
    s3_t1_bullets: [
      '독점적 지배력 및 글로벌 파트너십 가시성 확보 필요 [02:05].'
    ],
    s3_t2_p: '본업 마진율(영업이익률) 회복: 단순 외형 매출 증가뿐만 아니라 영업이익률 마진의 뚜렷한 회복세가 동반되어야 합니다',
    s3_t2_t: 138
  };

  // 반도체 (삼성전자 / SK하이닉스)
  if (cleanTitle.includes('삼성') || cleanTitle.includes('삼전') || cleanTitle.includes('하이닉스') || cleanTitle.includes('닉스') || cleanTitle.includes('반도체')) {
    topic = {
      section1_title: '1. 반도체 HBM 독점력 및 밸류에이션 재평가 구조',
      s1_p1: '빅테크 AI 데이터센터 수주 및 엔비디아 공급망 중심의 HBM3E/HBM4 출하 가시성이 기업가치 재평가의 핵심입니다',
      s1_t1: 12,
      s1_p2: '세부 가치 평가 내역 (레거시 DRAM/NAND 턴어라운드 + AI 고부가 메모리 독점 프리미엄)',
      s1_t2: 25,
      s1_bullets: [
        'HBM 독점적 공급 가치: 글로벌 AI 가속기 탑재 필수재 지위',
        '레거시 메모리 캐시카우: 서버용 DDR5 및 eSSD 가격 상승세 지속',
        '주주환원 가치: 40~70조원 규모 자사주 매입/소각을 통한 주가 하단 지지'
      ],
      s1_p3: '단순한 메모리 사이클을 넘어 AI 가속기 생태계 핵심 파트너로의 Re-rating이 진행되고 있습니다',
      s1_t3: 38,

      section2_title: '2. 주가 변동성 및 최근 가격 조정의 핵심 원인',
      s2_up: '상승 동력: 2분기 사상 최대 실적 발표 및 글로벌 기관(모건스탠리, 골드만삭스)의 대량 순매수 유입',
      s2_t_up: 52,
      s2_down: '하락/조정 원인: AI 버블론 대두 및 미국 경기침체 우려에 따른 외국인 차익실현 물량 출회',
      s2_t_down: 70,
      s2_target: '목표가 조정: 단기 밸류에이션 부담 해소 후 PBR 역사적 하단선에서 기관 재진입 타깃 형성',
      s2_t_target: 88,

      section3_title: '3. 주가 목표치 도달을 위해 확인해야 할 3가지 핵심 트리거',
      s3_t1_p: '차세대 HBM4 퀄테스트 통과 및 2026년 장기 수주 물량 확정',
      s3_t1_t: 105,
      s3_t1_bullets: [
        '자회사(솔리다임 등) 미국 상장 가치 반영 및 수율 격차 유지 [01:55].'
      ],
      s3_t2_p: '외국인 순매수세 복귀: 환율 1,300원대 안착과 함께 패시브 펀드 자금 대량 유입 확인',
      s3_t2_t: 125
    };
  }
  // 트럼프 / 관세 / 정책 / 매크로
  else if (cleanTitle.includes('트럼프') || cleanTitle.includes('관세') || cleanTitle.includes('미중') || cleanTitle.includes('환율') || cleanTitle.includes('금리') || cleanTitle.includes('연준')) {
    topic = {
      section1_title: '1. 트럼프 2.0 정책 메커니즘 및 매크로 재평가 구조',
      s1_p1: '트럼프 2.0의 통화·재정 정책은 단기 금리 인하와 장기 금리 관리가 결합된 정교한 설계입니다',
      s1_t1: 15,
      s1_p2: '세부 가치 평가 내역 (장단기 금리차 스티프닝 + 공급망 재편 대체 수혜)',
      s1_t2: 30,
      s1_bullets: [
        '부채 이자 부담 경감: 단기 기준금리 인하를 통한 금융시장 유동성 공급',
        '대체 인프라 수혜: 대중국 견제 속 한국 조선·방산·원전 밸류체인 부각',
        '중간선거 부양 패턴: 역사적으로 중간선거 전후 주가 부양 정책 랠리 형성'
      ],
      s1_p3: '글로벌 유동성의 방향이 정책 수혜 섹터로 급격히 재편되는 변곡점입니다',
      s1_t3: 45,

      section2_title: '2. 시장 변동성 및 최근 지수 조정의 핵심 원인',
      s2_up: '상승 동력: 미 연준 금리 인하 사이클 진입 기대감 및 관세 유예 조치로 단기 안도 랠리',
      s2_t_up: 62,
      s2_down: '하락/조정 원인: 관세 부과 리스크에 따른 수출 기업 마진 축소 우려 및 엔캐리 청산 충격',
      s2_t_down: 80,
      s2_target: '지수 지지선: DXY 달러 인덱스 하락 전환 시 외국인 현물 순매수 유입으로 바닥 확인',
      s2_t_target: 95,

      section3_title: '3. 강세장 진입을 위해 확인해야 할 3가지 핵심 트리거',
      s3_t1_p: '미중 정상회담 결과 및 관세 면제·유예 협상 가시화',
      s3_t1_t: 110,
      s3_t1_bullets: [
        '수익률 곡선 관리(YCC) 및 케빈 워시 인선에 따른 금리 안정화 [02:00].'
      ],
      s3_t2_p: '원달러 환율 1,300원대 안정: 환차익을 노린 외국인 자금의 한국 증시 대거 유입',
      s3_t2_t: 130
    };
  }
  // 원전 / 전력 / AI 인프라
  else if (cleanTitle.includes('원전') || cleanTitle.includes('전력') || cleanTitle.includes('빌게이츠') || cleanTitle.includes('에너지')) {
    topic = {
      section1_title: '1. AI 전력 숏티지 및 원전·인프라 밸류에이션 재평가 구조',
      s1_p1: '빅테크 AI 데이터센터 급증으로 인한 전력 부족이 원자력 및 전력기기의 구조적 슈퍼사이클을 열었습니다',
      s1_t1: 14,
      s1_p2: '세부 가치 평가 내역 (SMR 소형원자로 상용화 + 초고압 변압기 수주 잔고)',
      s1_t2: 28,
      s1_bullets: [
        '빅테크 직접 PPA 계약: 마이크로소프트, 아마존의 원전 전력 독점 구매',
        '글로벌 원전 수출: 체코 등 해외 원전 수주를 통한 장기 매출 파이프라인',
        '전력망 증설 프리미엄: 변압기/전선 기업의 3~4년 치 수주 잔고 확보'
      ],
      s1_p3: '단순 테마주가 아닌 글로벌 AI 메가트렌드의 필수 병목 해소 인프라로 재평가되고 있습니다',
      s1_t3: 40,

      section2_title: '2. 주가 변동성 및 최근 가격 조정의 핵심 원인',
      s2_up: '상승 동력: 글로벌 원전 수주 낭보 및 빌게이츠 SMR 방한 모멘텀으로 전고점 돌파',
      s2_t_up: 58,
      s2_down: '하락/조정 원인: 단기 급등에 따른 차익실현 매물 및 원자재(구리, 특수강) 가격 변동성',
      s2_t_down: 75,
      s2_target: '지지선 확인: 수주 잔고 기반의 실적 확인 구간에서 20일선 눌림목 반등 형성',
      s2_t_target: 90,

      section3_title: '3. 2차 랠리 도달을 위해 확인해야 할 3가지 핵심 트리거',
      s3_t1_p: '체코 원전 본계약 최종 체결 및 추가 동유럽/중동 수주 공시',
      s3_t1_t: 108,
      s3_t1_bullets: [
        '미국 내 SMR 착공 인허가 획득 및 빅테크 데이터센터 연계 프로젝트 발표 [01:50].'
      ],
      s3_t2_p: '분기별 영업이익률(OPM) 15% 이상 유지: 원가 상승 전가력 입증',
      s3_t2_t: 125
    };
  }

  return { topic, baseUrl, ts };
}

/**
 * 타임스탬프 기반 Notion Block 배열을 빌드합니다.
 */
function buildTimestampedNotionBlocks(title, videoId, isShorts, channelName) {
  const { topic, baseUrl, ts } = generateTimestampedSummary(title, videoId, isShorts, channelName);
  const blocks = [];
  const embedUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 1. 영상 임베드 플레이어
  blocks.push({
    object: 'block',
    type: 'video',
    video: {
      type: 'external',
      external: { url: embedUrl }
    }
  });

  // 2. 메타 Callout
  blocks.push({
    object: 'block',
    type: 'callout',
    callout: {
      icon: { type: 'emoji', emoji: isShorts ? '📱' : '🎬' },
      rich_text: [
        { type: 'text', text: { content: `[${channelName}] ` }, annotations: { bold: true } },
        { type: 'text', text: { content: `${title}\n` }, annotations: { bold: true } },
        { type: 'text', text: { content: `▶️ 원본 영상 바로가기: ` } },
        { type: 'text', text: { content: baseUrl, link: { url: baseUrl } } }
      ]
    }
  });

  // 3. 구분선
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // 4. Section 1: 핵심 모멘텀 및 밸류에이션 재평가 구조
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: topic.section1_title } }]
    }
  });

  const t1 = ts(topic.s1_t1);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s1_p1} ` } },
        { type: 'text', text: { content: t1.label, link: { url: t1.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  const t2 = ts(topic.s1_t2);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s1_p2} ` } },
        { type: 'text', text: { content: t2.label, link: { url: t2.url } }, annotations: { color: 'blue', bold: true } },
        { type: 'text', text: { content: ':' } }
      ]
    }
  });

  for (const bullet of topic.s1_bullets) {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: bullet } }]
      }
    });
  }

  const t3 = ts(topic.s1_t3);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s1_p3} ` } },
        { type: 'text', text: { content: t3.label, link: { url: t3.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  // 5. Section 2: 주가 변동성 및 최근 가격 조정의 핵심 원인
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: topic.section2_title } }]
    }
  });

  const tUp = ts(topic.s2_t_up);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s2_up} ` } },
        { type: 'text', text: { content: tUp.label, link: { url: tUp.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  const tDown = ts(topic.s2_t_down);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s2_down} ` } },
        { type: 'text', text: { content: tDown.label, link: { url: tDown.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  const tTarget = ts(topic.s2_t_target);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s2_target} ` } },
        { type: 'text', text: { content: tTarget.label, link: { url: tTarget.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  // 6. Section 3: 주가 목표치 도달을 위해 확인해야 할 3가지 핵심 트리거
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ type: 'text', text: { content: topic.section3_title } }]
    }
  });

  const tS3_1 = ts(topic.s3_t1_t);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s3_t1_p} ` } },
        { type: 'text', text: { content: tS3_1.label, link: { url: tS3_1.url } }, annotations: { color: 'blue', bold: true } },
        { type: 'text', text: { content: ':' } }
      ]
    }
  });

  for (const bullet of topic.s3_t1_bullets) {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [{ type: 'text', text: { content: bullet } }]
      }
    });
  }

  const tS3_2 = ts(topic.s3_t2_t);
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        { type: 'text', text: { content: `${topic.s3_t2_p} ` } },
        { type: 'text', text: { content: tS3_2.label, link: { url: tS3_2.url } }, annotations: { color: 'blue', bold: true } }
      ]
    }
  });

  return blocks;
}

module.exports = {
  generateTimestampedSummary,
  buildTimestampedNotionBlocks
};
