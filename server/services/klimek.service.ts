/**
 * Klimek Model Analysis Service
 * Detects vote stuffing (alpha) and vote stealing (beta) patterns
 */

interface VoteData {
  turnout: number;
  voteShare: number;
}

interface KlimekAnalysisResult {
  alpha: number;
  beta: number;
  correlation: number;
  fraudZoneCount: number;
  totalUnits: number;
  heatmap: Array<{ x: number; y: number; value: number }>;
  suspicious: boolean;
}

export function calculateKlimekAnalysis(data: VoteData[]): KlimekAnalysisResult {
  // Calculate Alpha (Vote Stuffing coefficient)
  const fraudZoneThreshold = 0.85;
  const fraudZoneUnits = data.filter(
    d => d.turnout > fraudZoneThreshold && d.voteShare > fraudZoneThreshold
  );
  const alpha = fraudZoneUnits.length / data.length;
  
  // Calculate Beta (Vote Stealing coefficient)
  const n = data.length;
  const sumX = data.reduce((acc, d) => acc + d.turnout, 0);
  const sumY = data.reduce((acc, d) => acc + d.voteShare, 0);
  const sumXY = data.reduce((acc, d) => acc + d.turnout * d.voteShare, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.turnout * d.turnout, 0);
  const sumY2 = data.reduce((acc, d) => acc + d.voteShare * d.voteShare, 0);
  
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const beta = Math.max(0, correlation - 0.3);
  
  // Generate heatmap data (2D histogram)
  const bins = 20;
  const heatmap: Array<{ x: number; y: number; value: number }> = [];
  const grid: number[][] = Array(bins).fill(0).map(() => Array(bins).fill(0));
  
  for (const d of data) {
    const binX = Math.min(Math.floor(d.turnout * bins), bins - 1);
    const binY = Math.min(Math.floor(d.voteShare * bins), bins - 1);
    grid[binX][binY]++;
  }
  
  for (let x = 0; x < bins; x++) {
    for (let y = 0; y < bins; y++) {
      if (grid[x][y] > 0) {
        heatmap.push({
          x: (x + 0.5) / bins,
          y: (y + 0.5) / bins,
          value: grid[x][y],
        });
      }
    }
  }
  
  return {
    alpha,
    beta,
    correlation,
    fraudZoneCount: fraudZoneUnits.length,
    totalUnits: data.length,
    heatmap,
    suspicious: alpha > 0.05 || beta > 0.3,
  };
}
