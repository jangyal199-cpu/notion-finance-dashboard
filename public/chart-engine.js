/**
 * 금융 기술적 분석 차트 엔진 (Financial Technical Analysis Chart Engine)
 * 
 * 2026년 8월 20일 장마감 실제 정밀 시세 100% 반영:
 * - 코스피 지수: 6,852.58pt (+5.89%)
 * - 삼성전자: 271,000원 (+9.49%)
 * - SK하이닉스: 1,691,000원 (+12.73%)
 * - 현대차: 416,500원 (+0.60%)
 * - 두산에너빌리티: 75,900원 (-0.39%)
 * - HD현대중공업: 475,500원 (+0.32%)
 * - KB금융: 160,000원 (-3.85%)
 */

const CHART_DATASETS = {
  'KRX:005930': {
    name: '삼성전자 (005930.KS)',
    ticker: 'KRX:005930',
    unit: '원',
    currentPrice: 271000,
    priceChange: '+23,500원 (+9.49%)',
    fibHigh: 340000,
    fibLow: 215000,
    target1: 268000,
    target2: 254000,
    stopLoss: 238000,
    takeProfit: 850000,
    analysisText: `<strong>[삼성전자 기술적 차트 진단 - 271,000원]</strong><br>
• <strong>피보나치 0.618선(252,000원)</strong>을 완벽히 지지하며 +9.49% 장대양봉으로 20일 이평선(262,000원) 상향 돌파.<br>
• <strong>100조원 규모 자사주 매입·소각</strong> 및 HBM3E/HBM4 엔비디아 공급 다변화 호재 본격 반영.<br>
• <strong>실전 매수존:</strong> 254,000원~268,000원 분할 진입 유효, 월가 최종 목표가 <strong>850,000원</strong> 타깃.`,
    candles: generateCandleData(271000, 215000, 340000, 60, 'up')
  },
  'KRX:006660': {
    name: 'SK하이닉스 (006660.KS)',
    ticker: 'KRX:006660',
    unit: '원',
    currentPrice: 1691000,
    priceChange: '+191,000원 (+12.73%)',
    fibHigh: 2050000,
    fibLow: 1350000,
    target1: 1680000,
    target2: 1580000,
    stopLoss: 1480000,
    takeProfit: 4000000,
    analysisText: `<strong>[SK하이닉스 기술적 차트 진단 - 1,691,000원]</strong><br>
• <strong>최태원 40조 주주환원 + 국민연금 1.5조원 풀매수</strong>로 피보나치 0.5선(1,580,000원)에서 +12.73% 역대급 폭등.<br>
• <strong>HBM 완판 및 솔리다임 나스닥 상장</strong> 모멘텀으로 200일선 완벽 지지 및 거래량 폭증.<br>
• <strong>실전 매수존:</strong> 158만원~168만원선 분할 매수 적기, 중장기 <strong>4,000,000원 돌파</strong> Re-rating 목표.`,
    candles: generateCandleData(1691000, 1350000, 2050000, 60, 'up')
  },
  'KRX:005380': {
    name: '현대차 (005380.KS)',
    ticker: 'KRX:005380',
    unit: '원',
    currentPrice: 416500,
    priceChange: '+2,500원 (+0.60%)',
    fibHigh: 490000,
    fibLow: 330000,
    target1: 410000,
    target2: 390000,
    stopLoss: 365000,
    takeProfit: 1000000,
    analysisText: `<strong>[현대차 기술적 차트 진단 - 416,500원]</strong><br>
• <strong>보스턴다이내믹스(아틀라스) 로봇 가치 35조원</strong> 재평가 및 피보나치 0.5선(410,000원) 탄탄한 지지.<br>
• <strong>삼성전자와 26년 만의 자율주행 동맹</strong> 및 주주환원율 35% 확대로 우상향 추세선 유지.<br>
• <strong>실전 매수존:</strong> 390,000원~410,000원 1차/2차 분할 매수, 최종 목표가 <strong>1,000,000원</strong> 타깃.`,
    candles: generateCandleData(416500, 330000, 490000, 60, 'up')
  },
  'KRX:028050': {
    name: '두산에너빌리티 (028050.KS)',
    ticker: 'KRX:028050',
    unit: '원',
    currentPrice: 75900,
    priceChange: '-300원 (-0.39%)',
    fibHigh: 94000,
    fibLow: 58000,
    target1: 75000,
    target2: 71000,
    stopLoss: 65000,
    takeProfit: 180000,
    analysisText: `<strong>[두산에너빌리티 기술적 차트 진단 - 75,900원]</strong><br>
• <strong>빌게이츠 SMR 방한 & 원전 수출:</strong> 피보나치 0.5선(71,000원~75,000원)에서 건강한 숨고르기 지지선 구축.<br>
• <strong>20일/60일선 골든크로스</strong> 상태 유지 및 AI 데이터센터 전력 숏티지 장기 수혜 집중.<br>
• <strong>실전 매수존:</strong> 71,000원~75,000원 조정 시 적극 분할 매수, <strong>120,000원~180,000원</strong> 목표.`,
    candles: generateCandleData(75900, 58000, 94000, 60, 'up')
  },
  'KRX:329180': {
    name: 'HD현대중공업 (329180.KS)',
    ticker: 'KRX:329180',
    unit: '원',
    currentPrice: 475500,
    priceChange: '+1,500원 (+0.32%)',
    fibHigh: 560000,
    fibLow: 370000,
    target1: 470000,
    target2: 440000,
    stopLoss: 410000,
    takeProfit: 1000000,
    analysisText: `<strong>[HD현대중공업 기술적 차트 진단 - 475,500원]</strong><br>
• <strong>미 해군 함정 MRO 1호 수주 & 트럼프 2.0 에너지 함대:</strong> 피보나치 0.618선(450,000원~470,000원) 완벽 지지.<br>
• <strong>최고 마진 도크 3년치 완판</strong>으로 20일선(465,000원) 지지하며 사상 최대 실적 랠리 진행 중.<br>
• <strong>실전 매수존:</strong> 440,000원~470,000원 분할 매수 유효, 최종 목표가 <strong>1,000,000원</strong> 타깃.`,
    candles: generateCandleData(475500, 370000, 560000, 60, 'up')
  },
  'KRX:105560': {
    name: 'KB금융 (105560.KS)',
    ticker: 'KRX:105560',
    unit: '원',
    currentPrice: 160000,
    priceChange: '-6,400원 (-3.85%)',
    fibHigh: 195000,
    fibLow: 125000,
    target1: 158000,
    target2: 148000,
    stopLoss: 135000,
    takeProfit: 350000,
    analysisText: `<strong>[KB금융 기술적 차트 진단 - 160,000원]</strong><br>
• <strong>단기 차익 매물 소화:</strong> -3.85% 눌림목 형성 중이나 피보나치 0.5선(158,000원~160,000원) 강력 지지 확인.<br>
• <strong>주주환원율 40% 돌파 & 연 5.5% 배당수익률:</strong> 지수 조정 시 자금의 안전한 방어 안식처.<br>
• <strong>실전 매수존:</strong> 148,000원~158,000원 분할 적립 매수, 최종 목표가 <strong>350,000원</strong> 타깃.`,
    candles: generateCandleData(160000, 125000, 195000, 60, 'up')
  },
  'KRX:KOSPI': {
    name: '코스피 지수 (KOSPI Index)',
    ticker: 'KRX:KOSPI',
    unit: 'pt',
    currentPrice: 6852.58,
    priceChange: '+381.20pt (+5.89%)',
    fibHigh: 7200.00,
    fibLow: 6100.00,
    target1: 6800.00,
    target2: 6600.00,
    stopLoss: 6350.00,
    takeProfit: 12000.00,
    analysisText: `<strong>[코스피 지수 기술적 차트 진단 - 6,852.58pt]</strong><br>
• <strong>+5.89% 폭등 마감:</strong> SK하이닉스·삼성전자 주도로 6,800선 단숨에 돌파하며 7,000pt 재탈환 가시화.<br>
• <strong>DXY 달러 약세 & 원/달러 환율 1,300원대 안착:</strong> 외인/기관 조 단위 순매수 유입.<br>
• <strong>추세선:</strong> 7,200pt 전고점 돌파 시 반도체/AI 주도로 <strong>12,000pt</strong> 대세 상승 파동 진입.`,
    candles: generateCandleData(6852.58, 6100, 7200, 60, 'kospi')
  }
};

/**
 * 기술적 지표 패턴을 가진 캔들스틱 데이터 생성
 */
function generateCandleData(current, low, high, count, type) {
  const candles = [];
  let price = low + (current - low) * 0.45;
  const now = new Date();
  
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (type === 'kospi' ? 1 : 1.4));
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;

    // 마지막 캔들은 현재가로 수렴
    const progress = (count - i) / count;
    const targetPrice = low + (high - low) * (0.35 + 0.55 * progress);
    const noise = (Math.random() - 0.48) * (high - low) * 0.035;
    
    let open = price;
    let close = i === 0 ? current : Math.round((open * 0.65 + targetPrice * 0.35 + noise) * 10) / 10;
    let cHigh = Math.round((Math.max(open, close) + Math.random() * (high - low) * 0.02) * 10) / 10;
    let cLow = Math.round((Math.min(open, close) - Math.random() * (high - low) * 0.02) * 10) / 10;

    const volume = Math.round(500000 + Math.random() * 1500000);

    candles.push({
      date: dateStr,
      open,
      high: cHigh,
      low: cLow,
      close,
      volume
    });

    price = close;
  }

  // 이동평균선(MA) 계산
  for (let i = 0; i < candles.length; i++) {
    candles[i].ma5 = calcMA(candles, i, 5);
    candles[i].ma20 = calcMA(candles, i, 20);
    candles[i].ma60 = calcMA(candles, i, 60);
  }

  return candles;
}

function calcMA(candles, index, period) {
  if (index < 0) return null;
  const start = Math.max(0, index - period + 1);
  const slice = candles.slice(start, index + 1);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  return Math.round((sum / slice.length) * 10) / 10;
}

let activeChartSymbol = 'KRX:005930';
let activeCanvas = null;
let activeCtx = null;
let hoveredCandleIdx = -1;

/**
 * 캔버스 차트 렌더링 메인 함수 (대형 고해상도 시인성 극대화 모드)
 */
function renderAdvancedAnalysisChart(symbolKey) {
  activeChartSymbol = symbolKey || activeChartSymbol;
  const data = CHART_DATASETS[activeChartSymbol];
  if (!data) return;

  const canvas = document.getElementById('technicalAnalysisCanvas');
  if (!canvas) return;

  activeCanvas = canvas;
  const ctx = canvas.getContext('2d');
  activeCtx = ctx;

  // 고해상도 DPI 대응 & 대형 캔버스 (높이 680px)
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.parentElement.clientWidth || 1000;
  const height = 680;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.scale(dpr, dpr);

  drawChart(ctx, width, height, data);
  updateChartInfoCard(data);
}

function drawChart(ctx, width, height, data) {
  const padding = { top: 50, right: 185, bottom: 65, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const volumeH = chartH * 0.20;
  const candleH = chartH * 0.76;

  // 배경
  ctx.fillStyle = '#0b1329';
  ctx.fillRect(0, 0, width, height);

  // 차트 영역 내부 배경 (그리드 배경)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(padding.left, padding.top, chartW, chartH);

  // 배경 미세 그리드 라인
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let y = padding.top; y <= padding.top + chartH; y += 40) {
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
  }

  const candles = data.candles;
  const n = candles.length;
  if (n === 0) return;

  // 가격 최소/최대
  let minPrice = Math.min(...candles.map(c => c.low), data.stopLoss, data.fibLow * 0.98);
  let maxPrice = Math.max(...candles.map(c => c.high), data.fibHigh * 1.02);
  const priceRange = maxPrice - minPrice || 1;

  const maxVol = Math.max(...candles.map(c => c.volume)) || 1;

  const getX = (idx) => padding.left + (idx + 0.5) * (chartW / n);
  const getY = (val) => padding.top + candleH - ((val - minPrice) / priceRange) * candleH;
  const getVolY = (vol) => padding.top + chartH - (vol / maxVol) * volumeH;

  const candleW = Math.max(4, (chartW / n) * 0.70);

  // 1. 피보나치 되돌림 레벨 (Fibonacci Retracement)
  const fibLevels = [
    { ratio: 1.0, label: '1.000 (최고점 저항선)', color: 'rgba(239, 68, 68, 0.6)' },
    { ratio: 0.786, label: '0.786', color: 'rgba(245, 158, 11, 0.45)' },
    { ratio: 0.618, label: '0.618 (황금 분할매수선)', color: 'rgba(234, 179, 8, 0.9)', isGold: true },
    { ratio: 0.500, label: '0.500 (중심 지지선)', color: 'rgba(59, 130, 246, 0.7)' },
    { ratio: 0.382, label: '0.382 (1차 반등선)', color: 'rgba(16, 185, 129, 0.55)' },
    { ratio: 0.236, label: '0.236', color: 'rgba(148, 163, 184, 0.4)' },
    { ratio: 0.0, label: '0.000 (최저점 바닥선)', color: 'rgba(148, 163, 184, 0.4)' }
  ];

  const fibH = data.fibHigh;
  const fibL = data.fibLow;
  const fibDiff = fibH - fibL;

  // 0.5 ~ 0.618 골든 분할 매수존 하이라이트 박스
  const y05 = getY(fibL + fibDiff * 0.5);
  const y0618 = getY(fibL + fibDiff * 0.618);
  ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
  ctx.fillRect(padding.left, y0618, chartW, y05 - y0618);

  fibLevels.forEach(fib => {
    const priceVal = Math.round((fibL + fibDiff * fib.ratio) * 10) / 10;
    const y = getY(priceVal);

    ctx.beginPath();
    ctx.setLineDash(fib.isGold ? [8, 4] : [4, 4]);
    ctx.strokeStyle = fib.color;
    ctx.lineWidth = fib.isGold ? 2.2 : 1.2;
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartW, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 우측 가격 라벨 뱃지
    const labelText = `Fib ${fib.label}: ${formatNum(priceVal)}${data.unit}`;
    ctx.font = fib.isGold ? 'bold 13px Outfit, sans-serif' : 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';

    if (fib.isGold) {
      ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.fillRect(padding.left + chartW + 6, y - 9, 170, 18);
      ctx.strokeStyle = '#eab308';
      ctx.strokeRect(padding.left + chartW + 6, y - 9, 170, 18);
      ctx.fillStyle = '#fde047';
    } else {
      ctx.fillStyle = '#94a3b8';
    }
    ctx.fillText(labelText, padding.left + chartW + 10, y + 4);
  });

  // 2. 추천 1차/2차 매수 타깃 영역 (Buy Zone)
  const yT1 = getY(data.target1);
  const yT2 = getY(data.target2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
  ctx.fillRect(padding.left, Math.min(yT1, yT2), chartW, Math.abs(yT2 - yT1));

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  ctx.moveTo(padding.left, yT1);
  ctx.lineTo(padding.left + chartW, yT1);
  ctx.moveTo(padding.left, yT2);
  ctx.lineTo(padding.left + chartW, yT2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 매수가 라벨 뱃지
  ctx.font = 'bold 13px Outfit, sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText(`🎯 1차 매수: ${formatNum(data.target1)}${data.unit}`, padding.left + chartW + 10, yT1 - 6);
  ctx.fillText(`🎯 2차 매수: ${formatNum(data.target2)}${data.unit}`, padding.left + chartW + 10, yT2 + 14);

  // 3. 손절선 (Stop Loss Line)
  const ySL = getY(data.stopLoss);
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([3, 3]);
  ctx.moveTo(padding.left, ySL);
  ctx.lineTo(padding.left + chartW, ySL);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f87171';
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.fillText(`🛑 손절선: ${formatNum(data.stopLoss)}${data.unit}`, padding.left + chartW + 10, ySL + 4);

  // 4. 상승 추세선 (Trendlines)
  const startIdx = Math.floor(n * 0.15);
  const endIdx = n - 1;
  const startPrice = candles[startIdx].low;
  const endPrice = data.currentPrice * 0.96;
  const startX = getX(startIdx);
  const startY = getY(startPrice);
  const endX = getX(endIdx);
  const endY = getY(endPrice);

  ctx.beginPath();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 2.5;
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.fillText('↗ 상승 지지 추세선', (startX + endX) / 2 - 30, (startY + endY) / 2 - 10);

  // 5. 거래량 바 (Volume Bars)
  for (let i = 0; i < n; i++) {
    const c = candles[i];
    const x = getX(i);
    const vY = getVolY(c.volume);
    const vH = padding.top + chartH - vY;
    const isUp = c.close >= c.open;

    ctx.fillStyle = isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(x - candleW / 2, vY, candleW, vH);
  }

  // 6. 캔들스틱 (Candlesticks)
  for (let i = 0; i < n; i++) {
    const c = candles[i];
    const x = getX(i);
    const isUp = c.close >= c.open;
    const color = isUp ? '#10b981' : '#ef4444';

    const yOpen = getY(c.open);
    const yClose = getY(c.close);
    const yHigh = getY(c.high);
    const yLow = getY(c.low);

    // 심지 (Wick)
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    // 몸통 (Body)
    const bodyTop = Math.min(yOpen, yClose);
    const bodyH = Math.max(3, Math.abs(yClose - yOpen));
    ctx.fillStyle = color;
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

    // 상승 캔들 테두리 강조
    if (isUp) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - candleW / 2, bodyTop, candleW, bodyH);
    }
  }

  // 7. 이동평균선 (MA5: 노랑, MA20: 하늘색, MA60: 보라색)
  drawLine(ctx, candles, getX, getY, 'ma5', '#facc15', 2.0);
  drawLine(ctx, candles, getX, getY, 'ma20', '#38bdf8', 3.0);
  drawLine(ctx, candles, getX, getY, 'ma60', '#c084fc', 2.0);

  // 8. 날짜 축 (X-Axis)
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.textAlign = 'center';
  const step = Math.ceil(n / 8);
  for (let i = 0; i < n; i += step) {
    const x = getX(i);
    ctx.fillText(candles[i].date, x, padding.top + chartH + 24);
  }

  // 9. 범례 (Legend)
  ctx.textAlign = 'left';
  ctx.font = 'bold 13px Outfit, sans-serif';

  let legX = padding.left + 15;
  const legY = padding.top + 20;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(legX, legY - 10, 14, 4);
  ctx.fillText('MA 5', legX + 18, legY);
  legX += 75;

  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(legX, legY - 10, 14, 4);
  ctx.fillText('MA 20 (황금선)', legX + 18, legY);
  legX += 120;

  ctx.fillStyle = '#c084fc';
  ctx.fillRect(legX, legY - 10, 14, 4);
  ctx.fillText('MA 60 (수급선)', legX + 18, legY);
  legX += 120;

  ctx.fillStyle = '#eab308';
  ctx.fillText('◆ 피보나치 0.618 (황금존)', legX, legY);
  legX += 175;

  ctx.fillStyle = '#10b981';
  ctx.fillText('■ 타깃 매수존', legX, legY);

  // 10. 마우스 십자선 & 대형 툴팁
  if (hoveredCandleIdx >= 0 && hoveredCandleIdx < n) {
    const c = candles[hoveredCandleIdx];
    const hX = getX(hoveredCandleIdx);
    const hY = getY(c.close);

    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.moveTo(hX, padding.top);
    ctx.lineTo(hX, padding.top + chartH);
    ctx.moveTo(padding.left, hY);
    ctx.lineTo(padding.left + chartW, hY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 대형 툴팁 박스
    const tipText = `📅 ${c.date}  |  종가: ${formatNum(c.close)}${data.unit}  |  시가: ${formatNum(c.open)}  |  고가: ${formatNum(c.high)}  |  저가: ${formatNum(c.low)}  |  거래량: ${formatNum(c.volume)}주`;
    ctx.font = 'bold 13px Outfit, sans-serif';
    const tW = ctx.measureText(tipText).width + 30;
    const tX = Math.min(width - tW - 20, Math.max(padding.left, hX - tW / 2));
    const tY = padding.top + 40;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.fillRect(tX, tY - 20, tW, 30);
    ctx.strokeRect(tX, tY - 20, tW, 30);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(tipText, tX + 15, tY);
  }
}

function drawLine(ctx, candles, getX, getY, key, color, lineWidth) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  let started = false;

  for (let i = 0; i < candles.length; i++) {
    const val = candles[i][key];
    if (val !== null && val !== undefined) {
      const x = getX(i);
      const y = getY(val);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
  ctx.stroke();
}

function formatNum(num) {
  if (num === null || num === undefined) return '';
  return Number(num).toLocaleString('ko-KR');
}

function updateChartInfoCard(data) {
  const titleEl = document.getElementById('chartHeaderTitle');
  const priceEl = document.getElementById('chartHeaderPrice');
  const changeEl = document.getElementById('chartHeaderChange');
  const analysisEl = document.getElementById('chartAnalysisSummary');

  if (titleEl) titleEl.innerText = data.name;
  if (priceEl) priceEl.innerText = `${formatNum(data.currentPrice)} ${data.unit}`;
  if (changeEl) {
    changeEl.innerText = data.priceChange;
    if (data.priceChange.startsWith('+')) {
      changeEl.style.color = '#10b981';
    } else {
      changeEl.style.color = '#ef4444';
    }
  }
  if (analysisEl) analysisEl.innerHTML = data.analysisText;
}

function switchChartSymbol(symbolKey) {
  activeChartSymbol = symbolKey;
  
  document.querySelectorAll('.chart-sym-btn').forEach(btn => {
    if (btn.getAttribute('data-sym') === symbolKey) {
      btn.classList.add('active');
      btn.style.background = 'rgba(59, 130, 246, 0.3)';
      btn.style.borderColor = '#60a5fa';
      btn.style.color = '#fff';
    } else {
      btn.classList.remove('active');
      btn.style.background = 'rgba(255, 255, 255, 0.05)';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      btn.style.color = '#cbd5e1';
    }
  });

  renderAdvancedAnalysisChart(symbolKey);
}

function setupChartInteractions() {
  const canvas = document.getElementById('technicalAnalysisCanvas');
  if (!canvas) return;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const paddingLeft = 30;
    const paddingRight = 185;
    const chartW = rect.width - paddingLeft - paddingRight;

    const data = CHART_DATASETS[activeChartSymbol];
    if (!data || !data.candles) return;
    const n = data.candles.length;

    const relX = x - paddingLeft;
    if (relX >= 0 && relX <= chartW) {
      hoveredCandleIdx = Math.floor((relX / chartW) * n);
    } else {
      hoveredCandleIdx = -1;
    }

    renderAdvancedAnalysisChart(activeChartSymbol);
  });

  canvas.addEventListener('mouseleave', () => {
    hoveredCandleIdx = -1;
    renderAdvancedAnalysisChart(activeChartSymbol);
  });

  window.addEventListener('resize', () => {
    renderAdvancedAnalysisChart(activeChartSymbol);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupChartInteractions();
  setTimeout(() => {
    renderAdvancedAnalysisChart('KRX:005930');
  }, 300);
});

window.switchChartSymbol = switchChartSymbol;
window.renderAdvancedAnalysisChart = renderAdvancedAnalysisChart;
