import { describe, expect, it } from "vitest";

// Test the Klimek Model calculation logic
describe("Klimek Model Analysis", () => {
  // Helper function to calculate Klimek analysis (same as in routers.ts)
  function calculateKlimekAnalysis(data: { turnout: number; voteShare: number }[]) {
    const fraudZoneThreshold = 0.85;
    const fraudZoneUnits = data.filter(d => d.turnout > fraudZoneThreshold && d.voteShare > fraudZoneThreshold);
    const alpha = fraudZoneUnits.length / data.length;
    
    const n = data.length;
    const sumX = data.reduce((acc, d) => acc + d.turnout, 0);
    const sumY = data.reduce((acc, d) => acc + d.voteShare, 0);
    const sumXY = data.reduce((acc, d) => acc + d.turnout * d.voteShare, 0);
    const sumX2 = data.reduce((acc, d) => acc + d.turnout * d.turnout, 0);
    const sumY2 = data.reduce((acc, d) => acc + d.voteShare * d.voteShare, 0);
    
    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const beta = Math.max(0, correlation - 0.3);
    
    return {
      alpha,
      beta,
      correlation,
      fraudZoneCount: fraudZoneUnits.length,
      totalUnits: data.length,
      isSuspicious: alpha > 0.05 || beta > 0.2
    };
  }

  it("detects ballot stuffing when alpha > 0.05", () => {
    // Create data with 10% in fraud zone
    const data: { turnout: number; voteShare: number }[] = [];
    
    // 90 normal units
    for (let i = 0; i < 90; i++) {
      data.push({ turnout: 0.6, voteShare: 0.4 });
    }
    
    // 10 fraud zone units (high turnout + high vote share)
    for (let i = 0; i < 10; i++) {
      data.push({ turnout: 0.95, voteShare: 0.95 });
    }
    
    const result = calculateKlimekAnalysis(data);
    
    expect(result.alpha).toBe(0.1); // 10/100 = 0.1
    expect(result.fraudZoneCount).toBe(10);
    expect(result.isSuspicious).toBe(true);
  });

  it("returns low alpha when few units in fraud zone", () => {
    // Create data with only 2% in fraud zone
    const data: { turnout: number; voteShare: number }[] = [];
    
    // 98 normal units with varied values to avoid high correlation
    for (let i = 0; i < 98; i++) {
      data.push({ turnout: 0.5 + Math.random() * 0.2, voteShare: 0.3 + Math.random() * 0.2 });
    }
    
    // 2 fraud zone units
    for (let i = 0; i < 2; i++) {
      data.push({ turnout: 0.95, voteShare: 0.95 });
    }
    
    const result = calculateKlimekAnalysis(data);
    
    expect(result.alpha).toBe(0.02); // 2/100 = 0.02
    expect(result.alpha).toBeLessThan(0.05); // Alpha below threshold
  });

  it("calculates correlation correctly", () => {
    // Perfect positive correlation
    const data = [
      { turnout: 0.1, voteShare: 0.1 },
      { turnout: 0.5, voteShare: 0.5 },
      { turnout: 0.9, voteShare: 0.9 },
    ];
    
    const result = calculateKlimekAnalysis(data);
    
    expect(result.correlation).toBeCloseTo(1, 5);
  });
});

describe("Benford's Law Analysis", () => {
  function calculateBenfordAnalysis(votes: number[]) {
    const expectedFreq = [0.1197, 0.1139, 0.1088, 0.1043, 0.1003, 0.0967, 0.0934, 0.0904, 0.0876, 0.0850];
    const observedCount = Array(10).fill(0);
    
    votes.forEach(v => {
      const str = Math.abs(v).toString();
      if (str.length >= 2) {
        const secondDigit = parseInt(str[1]);
        observedCount[secondDigit]++;
      }
    });
    
    const total = observedCount.reduce((a, b) => a + b, 0);
    const observedFreq = observedCount.map(c => c / total);
    
    let chiSquare = 0;
    for (let i = 0; i < 10; i++) {
      const expected = expectedFreq[i] * total;
      const observed = observedCount[i];
      chiSquare += Math.pow(observed - expected, 2) / expected;
    }
    
    const isSuspicious = chiSquare > 16.92;
    
    return {
      expectedFreq,
      observedFreq,
      chiSquare,
      isSuspicious
    };
  }

  it("extracts second digit correctly", () => {
    const votes = [123, 456, 789, 234, 567];
    const result = calculateBenfordAnalysis(votes);
    
    // Second digits are: 2, 5, 8, 3, 6
    expect(result.observedFreq[2]).toBeCloseTo(0.2, 5); // 1 out of 5
    expect(result.observedFreq[5]).toBeCloseTo(0.2, 5);
    expect(result.observedFreq[8]).toBeCloseTo(0.2, 5);
    expect(result.observedFreq[3]).toBeCloseTo(0.2, 5);
    expect(result.observedFreq[6]).toBeCloseTo(0.2, 5);
  });

  it("detects suspicious data when chi-square > 16.92", () => {
    // Create obviously fake data - all same second digit
    const votes = Array(100).fill(110); // All have second digit = 1
    const result = calculateBenfordAnalysis(votes);
    
    expect(result.isSuspicious).toBe(true);
    expect(result.chiSquare).toBeGreaterThan(16.92);
  });
});

describe("Network Centrality Analysis", () => {
  function calculateNetworkCentrality(transactions: { source: string; target: string }[]) {
    const nodes = new Set<string>();
    const edges: Map<string, number> = new Map();
    
    transactions.forEach(tx => {
      nodes.add(tx.source);
      nodes.add(tx.target);
      const key = tx.source;
      edges.set(key, (edges.get(key) || 0) + 1);
    });
    
    const nodeArray = Array.from(nodes);
    const maxDegree = nodeArray.length - 1;
    
    const centrality = nodeArray.map(node => {
      const outDegree = edges.get(node) || 0;
      const inDegree = transactions.filter(tx => tx.target === node).length;
      const totalDegree = outDegree + inDegree;
      
      return {
        node,
        outDegree,
        inDegree,
        totalDegree,
        centralityScore: totalDegree / (2 * maxDegree)
      };
    }).sort((a, b) => b.centralityScore - a.centralityScore);
    
    const hubThreshold = centrality.length > 0 ? centrality[Math.floor(centrality.length * 0.05)]?.centralityScore || 0 : 0;
    const hubs = centrality.filter(n => n.centralityScore >= hubThreshold && n.centralityScore > 0.1);
    
    return {
      nodes: nodeArray,
      centrality,
      hubs,
      totalNodes: nodes.size,
      totalEdges: transactions.length
    };
  }

  it("identifies hub with high out-degree", () => {
    const transactions = [
      { source: "BigBoss", target: "User1" },
      { source: "BigBoss", target: "User2" },
      { source: "BigBoss", target: "User3" },
      { source: "BigBoss", target: "User4" },
      { source: "BigBoss", target: "User5" },
      { source: "User1", target: "User2" },
    ];
    
    const result = calculateNetworkCentrality(transactions);
    
    // BigBoss should have highest centrality
    expect(result.centrality[0].node).toBe("BigBoss");
    expect(result.centrality[0].outDegree).toBe(5);
  });

  it("counts nodes and edges correctly", () => {
    const transactions = [
      { source: "A", target: "B" },
      { source: "B", target: "C" },
      { source: "C", target: "A" },
    ];
    
    const result = calculateNetworkCentrality(transactions);
    
    expect(result.totalNodes).toBe(3);
    expect(result.totalEdges).toBe(3);
  });
});
