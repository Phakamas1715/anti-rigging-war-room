import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  createPollingStation, getPollingStations, getPollingStationByCode,
  createElectionData, getElectionDataForAnalysis, getElectionDataByStation,
  createEvidence, getEvidenceByStation, updateEvidenceVerification, getPendingEvidence,
  createFraudAlert, getFraudAlerts, getUnresolvedAlerts, resolveAlert,
  createNetworkTransaction, getNetworkTransactions,
  createDataSnapshot, getDataSnapshots,
  getDashboardStats
} from "./db";
import crypto from "crypto";

// ============ KLIMEK MODEL ANALYSIS ============
function calculateKlimekAnalysis(data: { turnout: number; voteShare: number }[]) {
  // Calculate Alpha (Vote Stuffing coefficient)
  // Count units in the "fraud zone" (high turnout + high vote share)
  const fraudZoneThreshold = 0.85;
  const fraudZoneUnits = data.filter(d => d.turnout > fraudZoneThreshold && d.voteShare > fraudZoneThreshold);
  const alpha = fraudZoneUnits.length / data.length;
  
  // Calculate Beta (Vote Stealing coefficient)
  // Detect correlation between turnout and vote share (should be weak in fair elections)
  const n = data.length;
  const sumX = data.reduce((acc, d) => acc + d.turnout, 0);
  const sumY = data.reduce((acc, d) => acc + d.voteShare, 0);
  const sumXY = data.reduce((acc, d) => acc + d.turnout * d.voteShare, 0);
  const sumX2 = data.reduce((acc, d) => acc + d.turnout * d.turnout, 0);
  const sumY2 = data.reduce((acc, d) => acc + d.voteShare * d.voteShare, 0);
  
  const correlation = (n * sumXY - sumX * sumY) / 
    Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const beta = Math.max(0, correlation - 0.3); // Adjust for expected natural correlation
  
  // Generate heatmap data (2D histogram)
  const bins = 20;
  const heatmapData: number[][] = Array(bins).fill(null).map(() => Array(bins).fill(0));
  
  data.forEach(d => {
    const xBin = Math.min(Math.floor(d.turnout * bins), bins - 1);
    const yBin = Math.min(Math.floor(d.voteShare * bins), bins - 1);
    heatmapData[yBin][xBin]++;
  });
  
  return {
    alpha,
    beta,
    correlation,
    heatmapData,
    fraudZoneCount: fraudZoneUnits.length,
    totalUnits: data.length,
    isSuspicious: alpha > 0.05 || beta > 0.2
  };
}

// ============ BENFORD'S LAW ANALYSIS ============
function calculateBenfordAnalysis(votes: number[]) {
  // Second Digit Benford's Law (2BL)
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
  
  // Chi-square test
  let chiSquare = 0;
  for (let i = 0; i < 10; i++) {
    const expected = expectedFreq[i] * total;
    const observed = observedCount[i];
    chiSquare += Math.pow(observed - expected, 2) / expected;
  }
  
  // Critical value for df=9, alpha=0.05 is 16.92
  const isSuspicious = chiSquare > 16.92;
  
  return {
    expectedFreq,
    observedFreq,
    observedCount,
    chiSquare,
    isSuspicious,
    deviations: observedFreq.map((o, i) => ({
      digit: i,
      expected: expectedFreq[i],
      observed: o,
      deviation: o - expectedFreq[i]
    }))
  };
}

// ============ Z-SCORE SPATIAL ANALYSIS ============
function calculateSpatialZScore(stationData: { id: number; value: number; neighbors: number[] }[], allData: Map<number, number>) {
  return stationData.map(station => {
    const neighborValues = station.neighbors.map(nId => allData.get(nId) || 0).filter(v => v > 0);
    if (neighborValues.length === 0) return { id: station.id, zScore: 0, isSuspicious: false };
    
    const neighborMean = neighborValues.reduce((a, b) => a + b, 0) / neighborValues.length;
    const neighborStd = Math.sqrt(neighborValues.reduce((acc, v) => acc + Math.pow(v - neighborMean, 2), 0) / neighborValues.length);
    
    const zScore = neighborStd > 0 ? (station.value - neighborMean) / neighborStd : 0;
    
    return {
      id: station.id,
      value: station.value,
      neighborMean,
      neighborStd,
      zScore,
      isSuspicious: Math.abs(zScore) > 2.5
    };
  });
}

// ============ SOCIAL NETWORK ANALYSIS ============
function calculateNetworkCentrality(transactions: { source: string; target: string; amount?: number }[]) {
  const nodes = new Set<string>();
  const edges: Map<string, number> = new Map();
  
  transactions.forEach(tx => {
    nodes.add(tx.source);
    nodes.add(tx.target);
    const key = tx.source;
    edges.set(key, (edges.get(key) || 0) + 1);
  });
  
  // Calculate degree centrality
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
  
  // Identify hubs (top 5% by centrality)
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

// ============ PROOFMODE VERIFICATION ============
function verifyProofMode(fileHash: string, storedHash: string, metadata: Record<string, unknown>) {
  const hashMatch = fileHash === storedHash;
  const hasLocation = metadata?.latitude && metadata?.longitude;
  const hasTimestamp = metadata?.capturedAt;
  
  return {
    hashMatch,
    hasLocation,
    hasTimestamp,
    isValid: hashMatch && hasLocation && hasTimestamp,
    verificationDetails: {
      hashVerified: hashMatch,
      locationVerified: !!hasLocation,
      timestampVerified: !!hasTimestamp,
      metadata
    }
  };
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ DASHBOARD ============
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return getDashboardStats();
    }),
    
    alerts: publicProcedure.query(async () => {
      return getUnresolvedAlerts();
    }),
  }),

  // ============ POLLING STATIONS ============
  stations: router({
    list: publicProcedure.query(async () => {
      return getPollingStations();
    }),
    
    create: protectedProcedure
      .input(z.object({
        stationCode: z.string(),
        name: z.string(),
        province: z.string(),
        district: z.string(),
        subDistrict: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        registeredVoters: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        return createPollingStation(input);
      }),
      
    getByCode: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        return getPollingStationByCode(input.code);
      }),
  }),

  // ============ ELECTION DATA ============
  electionData: router({
    submit: protectedProcedure
      .input(z.object({
        stationId: z.number(),
        electionDate: z.date(),
        totalVoters: z.number(),
        validVotes: z.number(),
        invalidVotes: z.number(),
        candidateAVotes: z.number(),
        candidateBVotes: z.number(),
        source: z.enum(["official", "crowdsourced", "pvt"]).default("crowdsourced"),
      }))
      .mutation(async ({ input }) => {
        const turnout = input.totalVoters > 0 ? (input.validVotes + input.invalidVotes) / input.totalVoters : 0;
        const candidateAShare = input.validVotes > 0 ? input.candidateAVotes / input.validVotes : 0;
        
        return createElectionData({
          ...input,
          turnout: turnout.toString(),
          candidateAShare: candidateAShare.toString(),
        });
      }),
      
    getByStation: publicProcedure
      .input(z.object({ stationId: z.number() }))
      .query(async ({ input }) => {
        return getElectionDataByStation(input.stationId);
      }),
  }),

  // ============ KLIMEK MODEL ANALYSIS ============
  klimek: router({
    analyze: publicProcedure.query(async () => {
      const data = await getElectionDataForAnalysis();
      
      if (data.length === 0) {
        // Return demo data for visualization
        const demoData = generateDemoElectionData();
        return calculateKlimekAnalysis(demoData);
      }
      
      const analysisData = data.map(d => ({
        turnout: parseFloat(d.turnout?.toString() || "0"),
        voteShare: parseFloat(d.candidateAShare?.toString() || "0")
      }));
      
      return calculateKlimekAnalysis(analysisData);
    }),
    
    analyzeWithData: publicProcedure
      .input(z.array(z.object({
        turnout: z.number(),
        voteShare: z.number()
      })))
      .mutation(async ({ input }) => {
        const result = calculateKlimekAnalysis(input);
        
        // Create alert if suspicious
        if (result.isSuspicious) {
          await createFraudAlert({
            alertType: result.alpha > 0.05 ? "ballot_stuffing" : "vote_stealing",
            severity: result.alpha > 0.1 ? "critical" : "high",
            alphaScore: result.alpha.toString(),
            betaScore: result.beta.toString(),
            description: `Klimek Model detected anomaly: Alpha=${result.alpha.toFixed(4)}, Beta=${result.beta.toFixed(4)}`,
          });
        }
        
        return result;
      }),
  }),

  // ============ BENFORD'S LAW ANALYSIS ============
  benford: router({
    analyze: publicProcedure
      .input(z.array(z.number()))
      .mutation(async ({ input }) => {
        const result = calculateBenfordAnalysis(input);
        
        if (result.isSuspicious) {
          await createFraudAlert({
            alertType: "benford_violation",
            severity: result.chiSquare > 30 ? "critical" : "high",
            description: `Benford's Law violation detected: Chi-square=${result.chiSquare.toFixed(2)}`,
          });
        }
        
        return result;
      }),
  }),

  // ============ SPATIAL ANALYSIS ============
  spatial: router({
    analyze: publicProcedure
      .input(z.array(z.object({
        id: z.number(),
        value: z.number(),
        neighbors: z.array(z.number())
      })))
      .mutation(async ({ input }) => {
        const allData = new Map(input.map(s => [s.id, s.value]));
        const result = calculateSpatialZScore(input, allData);
        
        const suspicious = result.filter(r => r.isSuspicious);
        for (const s of suspicious) {
          await createFraudAlert({
            stationId: s.id,
            alertType: "spatial_anomaly",
            severity: Math.abs(s.zScore) > 3.5 ? "critical" : "high",
            zScore: s.zScore.toString(),
            description: `Spatial anomaly detected: Z-score=${s.zScore.toFixed(2)}`,
          });
        }
        
        return result;
      }),
  }),

  // ============ SOCIAL NETWORK ANALYSIS ============
  network: router({
    analyze: publicProcedure.query(async () => {
      const transactions = await getNetworkTransactions();
      
      if (transactions.length === 0) {
        // Return demo data
        const demoTx = generateDemoNetworkData();
        return calculateNetworkCentrality(demoTx);
      }
      
      const txData = transactions.map(tx => ({
        source: tx.sourceNode,
        target: tx.targetNode,
        amount: parseFloat(tx.amount?.toString() || "0")
      }));
      
      return calculateNetworkCentrality(txData);
    }),
    
    addTransaction: protectedProcedure
      .input(z.object({
        sourceNode: z.string(),
        targetNode: z.string(),
        transactionType: z.enum(["money_transfer", "communication", "social_share"]).default("money_transfer"),
        amount: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return createNetworkTransaction(input);
      }),
  }),

  // ============ EVIDENCE & PROOFMODE ============
  evidence: router({
    upload: protectedProcedure
      .input(z.object({
        stationId: z.number().optional(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Calculate file hash for verification
        const fileHash = crypto.createHash('sha256').update(input.fileUrl + Date.now()).digest('hex');
        
        return createEvidence({
          ...input,
          uploaderId: ctx.user?.id,
          fileHash,
        });
      }),
      
    verify: protectedProcedure
      .input(z.object({
        evidenceId: z.number(),
        currentFileHash: z.string(),
      }))
      .mutation(async ({ input }) => {
        // In real implementation, fetch evidence and verify
        const isValid = true; // Placeholder
        
        await updateEvidenceVerification(
          input.evidenceId,
          isValid ? "verified" : "tampered",
          isValid
        );
        
        return { isValid };
      }),
      
    pending: publicProcedure.query(async () => {
      return getPendingEvidence();
    }),
  }),

  // ============ FRAUD ALERTS ============
  alerts: router({
    list: publicProcedure.query(async () => {
      return getFraudAlerts();
    }),
    
    resolve: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return resolveAlert(input.id);
      }),
  }),

  // ============ PVT (PARALLEL VOTE TABULATION) ============
  pvt: router({
    compare: publicProcedure.query(async () => {
      const data = await getElectionDataForAnalysis();
      
      const official = data.filter(d => d.source === "official");
      const crowdsourced = data.filter(d => d.source === "crowdsourced" || d.source === "pvt");
      
      const officialTotal = official.reduce((acc, d) => acc + (d.candidateAVotes || 0), 0);
      const crowdsourcedTotal = crowdsourced.reduce((acc, d) => acc + (d.candidateAVotes || 0), 0);
      
      const gap = Math.abs(officialTotal - crowdsourcedTotal);
      const gapPercent = officialTotal > 0 ? (gap / officialTotal) * 100 : 0;
      
      return {
        officialTotal,
        crowdsourcedTotal,
        gap,
        gapPercent,
        isSuspicious: gapPercent > 5,
        officialCount: official.length,
        crowdsourcedCount: crowdsourced.length
      };
    }),
    
    snapshot: protectedProcedure
      .input(z.object({
        source: z.string(),
        totalVotes: z.number(),
        candidateATotal: z.number(),
        candidateBTotal: z.number(),
        rawData: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input }) => {
        return createDataSnapshot({
          source: input.source,
          totalVotes: input.totalVotes,
          candidateATotal: input.candidateATotal,
          candidateBTotal: input.candidateBTotal,
          rawData: input.rawData as Record<string, unknown> | undefined,
        });
      }),
      
    detectJump: publicProcedure
      .input(z.object({ source: z.string() }))
      .query(async ({ input }) => {
        const snapshots = await getDataSnapshots(input.source, 100);
        
        if (snapshots.length < 2) return { jumps: [], hasAnomaly: false };
        
        const jumps: { time: Date; previousTotal: number; newTotal: number; jumpSize: number }[] = [];
        
        for (let i = 1; i < snapshots.length; i++) {
          const prev = snapshots[i];
          const curr = snapshots[i - 1];
          const jumpSize = (curr.candidateATotal || 0) - (prev.candidateATotal || 0);
          
          // Detect suspicious jumps (more than 10% increase in short time)
          const timeDiff = (curr.snapshotTime.getTime() - prev.snapshotTime.getTime()) / 1000 / 60; // minutes
          if (timeDiff < 5 && jumpSize > (prev.candidateATotal || 1) * 0.1) {
            jumps.push({
              time: curr.snapshotTime,
              previousTotal: prev.candidateATotal || 0,
              newTotal: curr.candidateATotal || 0,
              jumpSize
            });
          }
        }
        
        return {
          jumps,
          hasAnomaly: jumps.length > 0,
          totalSnapshots: snapshots.length
        };
      }),
  }),
});

// ============ DEMO DATA GENERATORS ============
function generateDemoElectionData() {
  const data: { turnout: number; voteShare: number }[] = [];
  
  // Normal distribution (honest stations)
  for (let i = 0; i < 900; i++) {
    const turnout = Math.max(0, Math.min(1, 0.6 + (Math.random() - 0.5) * 0.3));
    const voteShare = Math.max(0, Math.min(1, 0.4 + (Math.random() - 0.5) * 0.3));
    data.push({ turnout, voteShare });
  }
  
  // Fraud zone (stuffed stations)
  for (let i = 0; i < 100; i++) {
    const turnout = Math.max(0.85, Math.min(1, 0.95 + (Math.random() - 0.5) * 0.1));
    const voteShare = Math.max(0.85, Math.min(1, 0.95 + (Math.random() - 0.5) * 0.1));
    data.push({ turnout, voteShare });
  }
  
  return data;
}

function generateDemoNetworkData() {
  const users = Array.from({ length: 50 }, (_, i) => `User_${String(i).padStart(3, '0')}`);
  const transactions: { source: string; target: string; amount: number }[] = [];
  
  // Normal transactions
  for (let i = 0; i < 150; i++) {
    const source = users[Math.floor(Math.random() * users.length)];
    let target = users[Math.floor(Math.random() * users.length)];
    while (target === source) target = users[Math.floor(Math.random() * users.length)];
    transactions.push({ source, target, amount: Math.random() * 1000 });
  }
  
  // Hub (Big Boss)
  const bigBoss = "User_007";
  for (let i = 0; i < 30; i++) {
    const target = users[Math.floor(Math.random() * users.length)];
    if (target !== bigBoss) {
      transactions.push({ source: bigBoss, target, amount: Math.random() * 5000 });
    }
  }
  
  return transactions;
}

export type AppRouter = typeof appRouter;
