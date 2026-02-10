/**
 * GLUE-FIN: Global Unified Election Fraud INdicator
 * 
 * ดัชนีรวมที่ใช้วัดความน่าเชื่อถือของผลการเลือกตั้ง
 * โดยรวมสัญญาณจากหลายโมดูลวิเคราะห์เข้าด้วยกัน
 */

// ==================== Types ====================

export interface GlueFinInput {
  // OCR Module
  ocrConfidence?: number; // 0-100

  // Klimek Model
  klimekAlpha?: number; // 0-1
  klimekBeta?: number; // 0-1
  fraudZonePercentage?: number; // 0-100

  // Benford's Law
  benfordChiSquare?: number; // 0-∞

  // PVT Gap
  pvtGapPercentage?: number; // 0-100

  // SNA Centrality
  snaCentrality?: number; // 0-1
}

export interface GlueFinWeights {
  ocr: number;
  klimek: number;
  benford: number;
  pvt: number;
  sna: number;
}

export interface GlueFinResult {
  score: number; // 0-100
  level: 'normal' | 'review' | 'suspicious' | 'critical' | 'crisis';
  levelEmoji: string;
  levelDescription: string;
  recommendation: string;
  components: {
    name: string;
    rawValue: number | undefined;
    normalizedValue: number;
    weight: number;
    contribution: number;
  }[];
  formula: string;
}

// ==================== Constants ====================

const DEFAULT_WEIGHTS: GlueFinWeights = {
  ocr: 0.15,
  klimek: 0.30,
  benford: 0.20,
  pvt: 0.25,
  sna: 0.10,
};

const BIAS = -2; // β₀ - ปรับให้ค่าเริ่มต้นอยู่ในช่วงที่เหมาะสม

const THRESHOLDS = {
  benfordCritical: 16.92, // Chi-square critical value at df=8, α=0.05
  klimekSuspicious: 0.05, // Alpha or Beta > 5%
  pvtSuspicious: 0.05, // Gap > 5%
};

// ==================== Helper Functions ====================

/**
 * Sigmoid function: σ(x) = 1 / (1 + e^(-x))
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Normalize value to 0-1 range
 */
function normalize(value: number, max: number): number {
  return Math.min(1, Math.max(0, value / max));
}

/**
 * Get level from score
 */
function getLevel(score: number): GlueFinResult['level'] {
  if (score <= 20) return 'normal';
  if (score <= 40) return 'review';
  if (score <= 60) return 'suspicious';
  if (score <= 80) return 'critical';
  return 'crisis';
}

/**
 * Get level emoji
 */
function getLevelEmoji(level: GlueFinResult['level']): string {
  switch (level) {
    case 'normal': return '🟢';
    case 'review': return '🟡';
    case 'suspicious': return '🟠';
    case 'critical': return '🔴';
    case 'crisis': return '⚫';
  }
}

/**
 * Get level description in Thai
 */
function getLevelDescription(level: GlueFinResult['level']): string {
  switch (level) {
    case 'normal': return 'ปกติ - ไม่พบสัญญาณผิดปกติ';
    case 'review': return 'ต้องตรวจสอบ - พบสัญญาณเล็กน้อย';
    case 'suspicious': return 'น่าสงสัย - พบสัญญาณหลายจุด';
    case 'critical': return 'น่าสงสัยมาก - พบสัญญาณชัดเจน';
    case 'crisis': return 'วิกฤต - พบหลักฐานชัด';
  }
}

/**
 * Get recommendation in Thai
 */
function getRecommendation(level: GlueFinResult['level']): string {
  switch (level) {
    case 'normal': return 'ไม่ต้องดำเนินการเพิ่มเติม';
    case 'review': return 'ตรวจสอบข้อมูลเพิ่มเติม';
    case 'suspicious': return 'สอบสวนเชิงลึก';
    case 'critical': return 'รายงานทันที';
    case 'crisis': return 'ดำเนินการทางกฎหมาย';
  }
}

// ==================== Main Function ====================

/**
 * Calculate GLUE-FIN score
 * 
 * สูตร: S_GLUE = 100 × σ(β₀ + Σ wₖ × zₖ)
 * 
 * @param input - ข้อมูลจากแต่ละโมดูล
 * @param weights - น้ำหนักของแต่ละโมดูล (optional)
 * @returns ผลลัพธ์ GLUE-FIN พร้อมรายละเอียด
 */
export function calculateGlueFin(
  input: GlueFinInput,
  weights: GlueFinWeights = DEFAULT_WEIGHTS
): GlueFinResult {
  const components: GlueFinResult['components'] = [];

  // 1. OCR Confidence
  const zOcr = input.ocrConfidence !== undefined
    ? normalize(input.ocrConfidence, 100)
    : 0.5; // default to neutral
  components.push({
    name: 'OCR Confidence',
    rawValue: input.ocrConfidence,
    normalizedValue: zOcr,
    weight: weights.ocr,
    contribution: weights.ocr * zOcr,
  });

  // 2. Klimek Model (Alpha + Beta)
  let zKlimek = 0;
  if (input.klimekAlpha !== undefined || input.klimekBeta !== undefined) {
    const alpha = input.klimekAlpha ?? 0;
    const beta = input.klimekBeta ?? 0;
    zKlimek = normalize(alpha + beta, 0.2); // 20% combined = max
  } else if (input.fraudZonePercentage !== undefined) {
    zKlimek = normalize(input.fraudZonePercentage, 20); // 20% fraud zone = max
  }
  components.push({
    name: 'Klimek Model',
    rawValue: input.klimekAlpha ?? input.fraudZonePercentage,
    normalizedValue: zKlimek,
    weight: weights.klimek,
    contribution: weights.klimek * zKlimek,
  });

  // 3. Benford's Law (Chi-Square)
  const zBenford = input.benfordChiSquare !== undefined
    ? normalize(input.benfordChiSquare, THRESHOLDS.benfordCritical)
    : 0;
  components.push({
    name: "Benford's Law",
    rawValue: input.benfordChiSquare,
    normalizedValue: zBenford,
    weight: weights.benford,
    contribution: weights.benford * zBenford,
  });

  // 4. PVT Gap
  const zPvt = input.pvtGapPercentage !== undefined
    ? normalize(input.pvtGapPercentage, 5) // 5% gap = max
    : 0;
  components.push({
    name: 'PVT Gap',
    rawValue: input.pvtGapPercentage,
    normalizedValue: zPvt,
    weight: weights.pvt,
    contribution: weights.pvt * zPvt,
  });

  // 5. SNA Centrality
  const zSna = input.snaCentrality ?? 0;
  components.push({
    name: 'SNA Centrality',
    rawValue: input.snaCentrality,
    normalizedValue: zSna,
    weight: weights.sna,
    contribution: weights.sna * zSna,
  });

  // Calculate weighted sum
  const weightedSum = components.reduce((sum, c) => sum + c.contribution, 0);

  // Apply sigmoid and scale to 0-100
  const rawScore = BIAS + weightedSum;
  const score = Math.round(100 * sigmoid(rawScore) * 10) / 10;

  // Determine level
  const level = getLevel(score);

  // Build formula string
  const formula = `S = 100 × σ(${BIAS} + ${components.map(c => 
    `${c.weight}×${c.normalizedValue.toFixed(2)}`
  ).join(' + ')}) = ${score}`;

  return {
    score,
    level,
    levelEmoji: getLevelEmoji(level),
    levelDescription: getLevelDescription(level),
    recommendation: getRecommendation(level),
    components,
    formula,
  };
}

// ==================== Alternative: Probability Fusion ====================

/**
 * Calculate fraud probability using fusion method
 * 
 * สูตร: P_fraud = 1 - Π(1 - Pᵢ)
 * 
 * @param probabilities - ความน่าจะเป็นจากแต่ละโมดูล
 * @returns ความน่าจะเป็นรวม
 */
export function calculateFraudProbability(probabilities: number[]): number {
  const validProbs = probabilities.filter(p => p >= 0 && p <= 1);
  if (validProbs.length === 0) return 0;

  const notFraudProb = validProbs.reduce((prod, p) => prod * (1 - p), 1);
  return 1 - notFraudProb;
}

// ==================== Batch Analysis ====================

export interface PollingStationData {
  stationId: string;
  stationName?: string;
  input: GlueFinInput;
}

export interface BatchGlueFinResult {
  stations: (PollingStationData & { result: GlueFinResult })[];
  summary: {
    total: number;
    byLevel: Record<GlueFinResult['level'], number>;
    averageScore: number;
    highRiskStations: string[];
  };
}

/**
 * Analyze multiple polling stations
 */
export function analyzePollingStations(
  stations: PollingStationData[],
  weights?: GlueFinWeights
): BatchGlueFinResult {
  const results = stations.map(station => ({
    ...station,
    result: calculateGlueFin(station.input, weights),
  }));

  const byLevel: Record<GlueFinResult['level'], number> = {
    normal: 0,
    review: 0,
    suspicious: 0,
    critical: 0,
    crisis: 0,
  };

  let totalScore = 0;
  const highRiskStations: string[] = [];

  results.forEach(r => {
    byLevel[r.result.level]++;
    totalScore += r.result.score;
    if (r.result.level === 'critical' || r.result.level === 'crisis') {
      highRiskStations.push(r.stationId);
    }
  });

  return {
    stations: results,
    summary: {
      total: stations.length,
      byLevel,
      averageScore: Math.round((totalScore / stations.length) * 10) / 10,
      highRiskStations,
    },
  };
}

// ==================== Export Default Weights ====================

export { DEFAULT_WEIGHTS, THRESHOLDS };
