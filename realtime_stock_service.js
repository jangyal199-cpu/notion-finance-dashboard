/**
 * Real-Time Korean Stock Quote Fetcher (Naver Finance Mobile API)
 * Fetches live real-time stock prices for target KOSPI giants.
 */

const TARGET_STOCKS = [
  { code: '005930', ticker: 'KRX:005930', name: '삼성전자', sector: '반도체 & AI 메모리', badge: '핵심 주력주', badgeColor: '#3b82f6', allocation: '25%', targetEntryRange: '254,000원 ~ 268,000원', takeProfitTarget: '850,000원', stopLossLine: '238,000원', buyRule: '268,000원 이하 1차 40%, 254,000원선 2차 60% 분할 매수 진입', evidenceTitle: '[쇼츠] 월가에서 삼성전자 \'85만원\' 갈 수 있다는 이유 3가지', videoUrl: 'https://www.youtube.com/shorts/hwbeQ-TYyo4', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:005930' },
  { code: '000660', ticker: 'KRX:000660', name: 'SK하이닉스', sector: 'HBM 톱티어 독점주', badge: 'AI 주도주', badgeColor: '#ef4444', allocation: '20%', targetEntryRange: '1,580,000원 ~ 1,680,000원', takeProfitTarget: '2,500,000원 ~ 4,000,000원', stopLossLine: '1,480,000원', buyRule: '1,680,000원 이하 50% 1차 진입, 1,580,000원선 2차 분할 매수', evidenceTitle: '[쇼츠] SK하이닉스는 400만원을 넘을 수 있을까?', videoUrl: 'https://www.youtube.com/shorts/PHQLWkGU8AI', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:000660' },
  { code: '005380', ticker: 'KRX:005380', name: '현대차', sector: '피지컬 AI & 로보틱스', badge: '로봇/자율주행', badgeColor: '#10b981', allocation: '15%', targetEntryRange: '390,000원 ~ 410,000원', takeProfitTarget: '800,000원 ~ 1,000,000원', stopLossLine: '365,000원', buyRule: '410,000원 이하 1차 40%, 390,000원선 2차 60% 분할 진입', evidenceTitle: '[쇼츠] 현대차 주가 100만원 갈 수 있을까?', videoUrl: 'https://www.youtube.com/shorts/SoJ_DCnr37o', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:005380' },
  { code: '034020', ticker: 'KRX:034020', name: '두산에너빌리티', sector: 'AI 전력망 & SMR 원전', badge: '전력 인프라', badgeColor: '#f59e0b', allocation: '15%', targetEntryRange: '71,000원 ~ 75,000원', takeProfitTarget: '120,000원 ~ 180,000원', stopLossLine: '65,000원', buyRule: '75,000원 이하 조정 시 적립식 분할 진입', evidenceTitle: '‘미국 원전, 결국 한국이 잡았다’.. 빌게이츠가 선택한 이유', videoUrl: 'https://www.youtube.com/shorts/WBanVG0u1OA', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:034020' },
  { code: '329180', ticker: 'KRX:329180', name: 'HD현대중공업', sector: '조선 MRO & 방산', badge: '미중갈등 수혜', badgeColor: '#06b6d4', allocation: '15%', targetEntryRange: '440,000원 ~ 470,000원', takeProfitTarget: '600,000원 ~ 1,000,000원', stopLossLine: '410,000원', buyRule: '470,000원 이하 1차 매수, 440,000원선 2차 매수', evidenceTitle: '앞으로 한국 주식은 "이 순서대로" 보면 됩니다', videoUrl: 'https://youtu.be/69tDuBM7hxk', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:329180' },
  { code: '105560', ticker: 'KRX:105560', name: 'KB금융', sector: '주주환원 & 밸류업', badge: '고배당 안식처', badgeColor: '#8b5cf6', allocation: '10%', targetEntryRange: '148,000원 ~ 158,000원', takeProfitTarget: '220,000원 ~ 350,000원', stopLossLine: '135,000원', buyRule: '158,000원 이하 지수 변동성 확대 시 리스크 헤지용으로 분할 적립', evidenceTitle: '하이닉스 다음으로 \'역대급 주주환원\' 나올 수 있다는 종목들', videoUrl: 'https://www.youtube.com/shorts/2htU4Q7sfL8', tradingViewUrl: 'https://kr.tradingview.com/chart/?symbol=KRX:105560' }
];

async function fetchLiveStockQuote(code) {
  const url = `https://m.stock.naver.com/api/stock/${code}/basic`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const data = await res.json();
    const isUp = parseFloat(data.fluctuationsRatio || '0') >= 0;
    const sign = isUp ? '+' : '';
    return {
      priceStr: `${data.closePrice}원`,
      changeStr: `${sign}${data.compareToPreviousClosePrice}원 (${sign}${data.fluctuationsRatio}%)`,
      isUp,
      marketStatus: data.marketStatus || 'OPEN'
    };
  } catch (err) {
    console.error(`Error fetching live stock quote for ${code}:`, err.message);
    return null;
  }
}

async function getRealTimeStockRecommendations() {
  const list = [];
  for (const s of TARGET_STOCKS) {
    const quote = await fetchLiveStockQuote(s.code);
    const currentPriceStr = quote ? `${quote.priceStr} (${quote.changeStr})` : '실시간 시세 조회 중';
    
    list.push({
      ...s,
      currentPrice: currentPriceStr,
      entryReason: `${s.name} 실시간 시세 ${quote ? quote.priceStr : ''} 반영 | PBR 밸류에이션 및 HBM/로봇/원전 수혜`
    });
  }
  return list;
}

module.exports = {
  getRealTimeStockRecommendations,
  fetchLiveStockQuote,
  TARGET_STOCKS
};
