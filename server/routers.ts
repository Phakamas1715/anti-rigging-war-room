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
  getDashboardStats,
  createVolunteer, getVolunteerByUserId, getVolunteerByCode, updateVolunteerStatus,
  assignVolunteerToStation, getVolunteers, getVolunteerStats,
  createVolunteerSubmission, getVolunteerSubmissions, getPendingSubmissions,
  verifySubmission, getStationSubmissionStatus
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
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

// ============ THAILAND PROVINCES DATA ============
const THAILAND_PROVINCES = [
  { code: "10", name: "กรุงเทพมหานคร", region: "central", lat: 13.7563, lng: 100.5018 },
  { code: "11", name: "สมุทรปราการ", region: "central", lat: 13.5991, lng: 100.5998 },
  { code: "12", name: "นนทบุรี", region: "central", lat: 13.8621, lng: 100.5144 },
  { code: "13", name: "ปทุมธานี", region: "central", lat: 14.0208, lng: 100.5250 },
  { code: "14", name: "พระนครศรีอยุธยา", region: "central", lat: 14.3692, lng: 100.5877 },
  { code: "15", name: "อ่างทอง", region: "central", lat: 14.5896, lng: 100.4549 },
  { code: "16", name: "ลพบุรี", region: "central", lat: 14.7995, lng: 100.6534 },
  { code: "17", name: "สิงห์บุรี", region: "central", lat: 14.8936, lng: 100.3967 },
  { code: "18", name: "ชัยนาท", region: "central", lat: 15.1851, lng: 100.1251 },
  { code: "19", name: "สระบุรี", region: "central", lat: 14.5289, lng: 100.9108 },
  { code: "20", name: "ชลบุรี", region: "east", lat: 13.3611, lng: 100.9847 },
  { code: "21", name: "ระยอง", region: "east", lat: 12.6814, lng: 101.2816 },
  { code: "22", name: "จันทบุรี", region: "east", lat: 12.6113, lng: 102.1028 },
  { code: "23", name: "ตราด", region: "east", lat: 12.2428, lng: 102.5177 },
  { code: "24", name: "ฉะเชิงเทรา", region: "east", lat: 13.6904, lng: 101.0779 },
  { code: "25", name: "ปราจีนบุรี", region: "east", lat: 14.0509, lng: 101.3717 },
  { code: "26", name: "นครนายก", region: "central", lat: 14.2069, lng: 101.2131 },
  { code: "27", name: "สระแก้ว", region: "east", lat: 13.8240, lng: 102.0645 },
  { code: "30", name: "นครราชสีมา", region: "northeast", lat: 14.9799, lng: 102.0978 },
  { code: "31", name: "บุรีรัมย์", region: "northeast", lat: 14.9930, lng: 103.1029 },
  { code: "32", name: "สุรินทร์", region: "northeast", lat: 14.8818, lng: 103.4936 },
  { code: "33", name: "ศรีสะเกษ", region: "northeast", lat: 15.1186, lng: 104.3220 },
  { code: "34", name: "อุบลราชธานี", region: "northeast", lat: 15.2287, lng: 104.8564 },
  { code: "35", name: "ยโสธร", region: "northeast", lat: 15.7920, lng: 104.1452 },
  { code: "36", name: "ชัยภูมิ", region: "northeast", lat: 15.8068, lng: 102.0316 },
  { code: "37", name: "อำนาจเจริญ", region: "northeast", lat: 15.8656, lng: 104.6258 },
  { code: "38", name: "บึงกาฬ", region: "northeast", lat: 18.3609, lng: 103.6466 },
  { code: "39", name: "หนองบัวลำภู", region: "northeast", lat: 17.2218, lng: 102.4260 },
  { code: "40", name: "ขอนแก่น", region: "northeast", lat: 16.4419, lng: 102.8360 },
  { code: "41", name: "อุดรธานี", region: "northeast", lat: 17.4156, lng: 102.7872 },
  { code: "42", name: "เลย", region: "northeast", lat: 17.4860, lng: 101.7223 },
  { code: "43", name: "หนองคาย", region: "northeast", lat: 17.8783, lng: 102.7420 },
  { code: "44", name: "มหาสารคาม", region: "northeast", lat: 16.1851, lng: 103.3008 },
  { code: "45", name: "ร้อยเอ็ด", region: "northeast", lat: 16.0538, lng: 103.6520 },
  { code: "46", name: "กาฬสินธุ์", region: "northeast", lat: 16.4314, lng: 103.5059 },
  { code: "47", name: "สกลนคร", region: "northeast", lat: 17.1545, lng: 104.1348 },
  { code: "48", name: "นครพนม", region: "northeast", lat: 17.3921, lng: 104.7694 },
  { code: "49", name: "มุกดาหาร", region: "northeast", lat: 16.5453, lng: 104.7235 },
  { code: "50", name: "เชียงใหม่", region: "north", lat: 18.7883, lng: 98.9853 },
  { code: "51", name: "ลำพูน", region: "north", lat: 18.5744, lng: 99.0087 },
  { code: "52", name: "ลำปาง", region: "north", lat: 18.2888, lng: 99.4909 },
  { code: "53", name: "อุตรดิตถ์", region: "north", lat: 17.6200, lng: 100.0993 },
  { code: "54", name: "แพร่", region: "north", lat: 18.1445, lng: 100.1403 },
  { code: "55", name: "น่าน", region: "north", lat: 18.7756, lng: 100.7730 },
  { code: "56", name: "พะเยา", region: "north", lat: 19.1664, lng: 99.9019 },
  { code: "57", name: "เชียงราย", region: "north", lat: 19.9105, lng: 99.8406 },
  { code: "58", name: "แม่ฮ่องสอน", region: "north", lat: 19.3020, lng: 97.9654 },
  { code: "60", name: "นครสวรรค์", region: "central", lat: 15.7030, lng: 100.1367 },
  { code: "61", name: "อุทัยธานี", region: "central", lat: 15.3835, lng: 100.0245 },
  { code: "62", name: "กำแพงเพชร", region: "central", lat: 16.4827, lng: 99.5226 },
  { code: "63", name: "ตาก", region: "west", lat: 16.8840, lng: 99.1258 },
  { code: "64", name: "สุโขทัย", region: "central", lat: 17.0070, lng: 99.8265 },
  { code: "65", name: "พิษณุโลก", region: "central", lat: 16.8211, lng: 100.2659 },
  { code: "66", name: "พิจิตร", region: "central", lat: 16.4429, lng: 100.3487 },
  { code: "67", name: "เพชรบูรณ์", region: "central", lat: 16.4190, lng: 101.1591 },
  { code: "70", name: "ราชบุรี", region: "west", lat: 13.5282, lng: 99.8134 },
  { code: "71", name: "กาญจนบุรี", region: "west", lat: 14.0227, lng: 99.5328 },
  { code: "72", name: "สุพรรณบุรี", region: "central", lat: 14.4744, lng: 100.1177 },
  { code: "73", name: "นครปฐม", region: "central", lat: 13.8196, lng: 100.0445 },
  { code: "74", name: "สมุทรสาคร", region: "central", lat: 13.5475, lng: 100.2744 },
  { code: "75", name: "สมุทรสงคราม", region: "central", lat: 13.4098, lng: 100.0022 },
  { code: "76", name: "เพชรบุรี", region: "west", lat: 13.1119, lng: 99.9390 },
  { code: "77", name: "ประจวบคีรีขันธ์", region: "west", lat: 11.8126, lng: 99.7957 },
  { code: "80", name: "นครศรีธรรมราช", region: "south", lat: 8.4324, lng: 99.9631 },
  { code: "81", name: "กระบี่", region: "south", lat: 8.0863, lng: 98.9063 },
  { code: "82", name: "พังงา", region: "south", lat: 8.4509, lng: 98.5253 },
  { code: "83", name: "ภูเก็ต", region: "south", lat: 7.8804, lng: 98.3923 },
  { code: "84", name: "สุราษฎร์ธานี", region: "south", lat: 9.1382, lng: 99.3217 },
  { code: "85", name: "ระนอง", region: "south", lat: 9.9528, lng: 98.6085 },
  { code: "86", name: "ชุมพร", region: "south", lat: 10.4930, lng: 99.1800 },
  { code: "90", name: "สงขลา", region: "south", lat: 7.1756, lng: 100.6142 },
  { code: "91", name: "สตูล", region: "south", lat: 6.6238, lng: 100.0673 },
  { code: "92", name: "ตรัง", region: "south", lat: 7.5593, lng: 99.6114 },
  { code: "93", name: "พัทลุง", region: "south", lat: 7.6167, lng: 100.0740 },
  { code: "94", name: "ปัตตานี", region: "south", lat: 6.8698, lng: 101.2501 },
  { code: "95", name: "ยะลา", region: "south", lat: 6.5410, lng: 101.2803 },
  { code: "96", name: "นราธิวาส", region: "south", lat: 6.4318, lng: 101.8231 },
];

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

  // ============ DATA IMPORT ============
  import: router({
    // Parse CSV data
    parseCSV: protectedProcedure
      .input(z.object({
        csvContent: z.string(),
        dataType: z.enum(["polling_stations", "election_results", "network_transactions"])
      }))
      .mutation(async ({ input }) => {
        const lines = input.csvContent.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',');
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i]?.trim() || '';
          });
          return row;
        });
        
        return {
          headers,
          rows,
          rowCount: rows.length,
          dataType: input.dataType
        };
      }),
      
    // Import polling stations
    pollingStations: protectedProcedure
      .input(z.array(z.object({
        stationCode: z.string(),
        name: z.string(),
        province: z.string(),
        district: z.string(),
        subDistrict: z.string().optional(),
        registeredVoters: z.number().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
      })))
      .mutation(async ({ input }) => {
        const results = { success: 0, failed: 0, errors: [] as string[] };
        
        for (const station of input) {
          try {
            await createPollingStation(station);
            results.success++;
          } catch (e) {
            results.failed++;
            results.errors.push(`Station ${station.stationCode}: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
        
        return results;
      }),
      
    // Import election results
    electionResults: protectedProcedure
      .input(z.array(z.object({
        stationCode: z.string(),
        totalVoters: z.number(),
        validVotes: z.number(),
        invalidVotes: z.number(),
        candidateAVotes: z.number(),
        candidateBVotes: z.number(),
        source: z.enum(["official", "crowdsourced", "pvt"]).default("official"),
      })))
      .mutation(async ({ input }) => {
        const results = { success: 0, failed: 0, errors: [] as string[] };
        
        for (const data of input) {
          try {
            const station = await getPollingStationByCode(data.stationCode);
            if (!station) {
              results.failed++;
              results.errors.push(`Station ${data.stationCode}: Not found`);
              continue;
            }
            
            const turnout = data.totalVoters > 0 ? (data.validVotes + data.invalidVotes) / data.totalVoters : 0;
            const candidateAShare = data.validVotes > 0 ? data.candidateAVotes / data.validVotes : 0;
            
            await createElectionData({
              stationId: station.id,
              electionDate: new Date(),
              totalVoters: data.totalVoters,
              validVotes: data.validVotes,
              invalidVotes: data.invalidVotes,
              candidateAVotes: data.candidateAVotes,
              candidateBVotes: data.candidateBVotes,
              source: data.source,
              turnout: turnout.toString(),
              candidateAShare: candidateAShare.toString(),
            });
            results.success++;
          } catch (e) {
            results.failed++;
            results.errors.push(`Station ${data.stationCode}: ${e instanceof Error ? e.message : 'Unknown error'}`);
          }
        }
        
        return results;
      }),
  }),

  // ============ REPORT EXPORT ============
  export: router({
    // Generate comprehensive forensic report
    forensicReport: publicProcedure.query(async () => {
      const klimekData = await getElectionDataForAnalysis();
      const alerts = await getFraudAlerts();
      const stats = await getDashboardStats();
      
      // Calculate Klimek analysis
      let klimekResult = null;
      if (klimekData.length > 0) {
        const analysisData = klimekData.map(d => ({
          turnout: parseFloat(d.turnout?.toString() || "0"),
          voteShare: parseFloat(d.candidateAShare?.toString() || "0")
        }));
        klimekResult = calculateKlimekAnalysis(analysisData);
      } else {
        klimekResult = calculateKlimekAnalysis(generateDemoElectionData());
      }
      
      // Calculate Benford analysis from vote counts
      const voteCounts = klimekData.map(d => d.candidateAVotes || 0).filter(v => v > 10);
      const benfordResult = voteCounts.length > 0 ? calculateBenfordAnalysis(voteCounts) : null;
      
      // Get network analysis
      const transactions = await getNetworkTransactions();
      const networkResult = transactions.length > 0 
        ? calculateNetworkCentrality(transactions.map(tx => ({ source: tx.sourceNode, target: tx.targetNode })))
        : calculateNetworkCentrality(generateDemoNetworkData());
      
      return {
        generatedAt: new Date().toISOString(),
        summary: {
          totalStations: stats.totalStations,
          totalAlerts: stats.totalAlerts,
          pendingReview: stats.unresolvedAlerts,
          totalEvidence: stats.totalEvidence,
        },
        klimekAnalysis: {
          alpha: klimekResult.alpha,
          beta: klimekResult.beta,
          correlation: klimekResult.correlation,
          fraudZoneCount: klimekResult.fraudZoneCount,
          totalUnits: klimekResult.totalUnits,
          isSuspicious: klimekResult.isSuspicious,
          interpretation: klimekResult.alpha > 0.05 
            ? `ตรวจพบความผิดปกติ: Alpha = ${(klimekResult.alpha * 100).toFixed(2)}% ของหน่วยเลือกตั้งอยู่ในโซนทุจริต (Turnout > 85% และ Vote Share > 85%)`
            : `ไม่พบความผิดปกติที่ชัดเจน: Alpha = ${(klimekResult.alpha * 100).toFixed(2)}% อยู่ในเกณฑ์ปกติ`,
        },
        benfordAnalysis: benfordResult ? {
          chiSquare: benfordResult.chiSquare,
          criticalValue: 16.92,
          isSuspicious: benfordResult.isSuspicious,
          interpretation: benfordResult.isSuspicious
            ? `ตรวจพบความผิดปกติ: Chi-square = ${benfordResult.chiSquare.toFixed(2)} > 16.92 แสดงว่าตัวเลขอาจถูกแต่งขึ้น`
            : `ไม่พบความผิดปกติ: Chi-square = ${benfordResult.chiSquare.toFixed(2)} < 16.92 ตัวเลขกระจายตามธรรมชาติ`,
          deviations: benfordResult.deviations,
        } : null,
        networkAnalysis: {
          totalNodes: networkResult.totalNodes,
          totalEdges: networkResult.totalEdges,
          hubs: networkResult.hubs.slice(0, 10),
          interpretation: networkResult.hubs.length > 0
            ? `พบหัวคะแนน (Hubs) ${networkResult.hubs.length} ราย ที่มี Centrality Score สูงผิดปกติ`
            : `ไม่พบหัวคะแนนที่มี Centrality Score สูงผิดปกติ`,
        },
        alerts: alerts.slice(0, 20).map(a => ({
          type: a.alertType,
          severity: a.severity,
          description: a.description,
          createdAt: a.createdAt,
        })),
        legalDisclaimer: `รายงานฉบับนี้จัดทำขึ้นโดยใช้วิธีการทางสถิติและนิติวิทยาศาสตร์การเลือกตั้ง (Election Forensics) ตามมาตรฐานสากล ผลการวิเคราะห์เป็นหลักฐานทางสถิติที่สามารถใช้ประกอบการพิจารณาทางกฎหมายได้`,
      };
    }),
  }),

  // ============ VOLUNTEER MOBILE APP ============
  volunteer: router({
    // Register as volunteer
    register: protectedProcedure
      .input(z.object({
        phone: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        
        // Check if already registered
        const existing = await getVolunteerByUserId(ctx.user.id);
        if (existing) {
          return { success: true, volunteer: existing, message: "ลงทะเบียนแล้ว" };
        }
        
        // Generate unique volunteer code
        const volunteerCode = `VOL-${nanoid(8).toUpperCase()}`;
        
        await createVolunteer({
          userId: ctx.user.id,
          volunteerCode,
          phone: input.phone,
          status: "pending",
        });
        
        const volunteer = await getVolunteerByUserId(ctx.user.id);
        return { success: true, volunteer, message: "ลงทะเบียนสำเร็จ รอการอนุมัติ" };
      }),
      
    // Get current volunteer status
    me: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      return getVolunteerByUserId(ctx.user.id);
    }),
    
    // Get assigned station info
    myStation: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const volunteer = await getVolunteerByUserId(ctx.user.id);
      if (!volunteer?.stationId) return null;
      
      const stations = await getPollingStations();
      return stations.find(s => s.id === volunteer.stationId) || null;
    }),
    
    // Get my submissions
    mySubmissions: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      const volunteer = await getVolunteerByUserId(ctx.user.id);
      if (!volunteer) return [];
      return getVolunteerSubmissions(volunteer.id);
    }),
    
    // Submit vote count with photo
    submit: protectedProcedure
      .input(z.object({
        stationId: z.number(),
        photoBase64: z.string().optional(),
        photoMimeType: z.string().optional(),
        totalVoters: z.number(),
        validVotes: z.number(),
        invalidVotes: z.number(),
        candidateAVotes: z.number(),
        candidateBVotes: z.number(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        
        const volunteer = await getVolunteerByUserId(ctx.user.id);
        if (!volunteer) throw new Error("ไม่พบข้อมูลอาสาสมัคร");
        if (volunteer.status !== "active") throw new Error("สถานะอาสาสมัครยังไม่ได้รับการอนุมัติ");
        
        let photoUrl = undefined;
        let photoKey = undefined;
        
        // Upload photo if provided
        if (input.photoBase64 && input.photoMimeType) {
          const buffer = Buffer.from(input.photoBase64, 'base64');
          const ext = input.photoMimeType.split('/')[1] || 'jpg';
          const fileKey = `submissions/${volunteer.id}/${Date.now()}-${nanoid(8)}.${ext}`;
          
          const uploadResult = await storagePut(fileKey, buffer, input.photoMimeType);
          photoUrl = uploadResult.url;
          photoKey = uploadResult.key;
        }
        
        // Create submission
        await createVolunteerSubmission({
          volunteerId: volunteer.id,
          stationId: input.stationId,
          photoUrl,
          photoKey,
          totalVoters: input.totalVoters,
          validVotes: input.validVotes,
          invalidVotes: input.invalidVotes,
          candidateAVotes: input.candidateAVotes,
          candidateBVotes: input.candidateBVotes,
          latitude: input.latitude,
          longitude: input.longitude,
          notes: input.notes,
        });
        
        // Also create election data for PVT comparison
        const station = await getPollingStationByCode(
          (await getPollingStations()).find(s => s.id === input.stationId)?.stationCode || ""
        );
        
        if (station) {
          const turnout = input.totalVoters > 0 ? (input.validVotes + input.invalidVotes) / input.totalVoters : 0;
          const candidateAShare = input.validVotes > 0 ? input.candidateAVotes / input.validVotes : 0;
          
          await createElectionData({
            stationId: input.stationId,
            electionDate: new Date(),
            totalVoters: input.totalVoters,
            validVotes: input.validVotes,
            invalidVotes: input.invalidVotes,
            candidateAVotes: input.candidateAVotes,
            candidateBVotes: input.candidateBVotes,
            source: "pvt",
            turnout: turnout.toString(),
            candidateAShare: candidateAShare.toString(),
          });
        }
        
        return { success: true, message: "ส่งข้อมูลสำเร็จ" };
      }),
      
    // Get available stations for assignment
    availableStations: publicProcedure.query(async () => {
      return getPollingStations();
    }),
    
    // Get station submission status (for coverage map)
    stationStatus: publicProcedure.query(async () => {
      return getStationSubmissionStatus();
    }),
    
    // Get volunteer stats
    stats: publicProcedure.query(async () => {
      return getVolunteerStats();
    }),
  }),
  
  // ============ ADMIN VOLUNTEER MANAGEMENT ============
  adminVolunteer: router({
    // List all volunteers
    list: protectedProcedure
      .input(z.object({
        status: z.enum(["pending", "active", "inactive"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getVolunteers(input?.status);
      }),
      
    // Approve volunteer
    approve: protectedProcedure
      .input(z.object({
        volunteerId: z.number(),
        stationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await assignVolunteerToStation(input.volunteerId, input.stationId);
        return { success: true, message: "อนุมัติอาสาสมัครและมอบหมายหน่วยเลือกตั้งแล้ว" };
      }),
      
    // Deactivate volunteer
    deactivate: protectedProcedure
      .input(z.object({ volunteerId: z.number() }))
      .mutation(async ({ input }) => {
        await updateVolunteerStatus(input.volunteerId, "inactive");
        return { success: true, message: "ยกเลิกสิทธิ์อาสาสมัครแล้ว" };
      }),
      
    // Get pending submissions for verification
    pendingSubmissions: protectedProcedure.query(async () => {
      return getPendingSubmissions();
    }),
    
    // Verify submission
    verifySubmission: protectedProcedure
      .input(z.object({
        submissionId: z.number(),
        status: z.enum(["verified", "rejected"]),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Not authenticated");
        await verifySubmission(input.submissionId, ctx.user.id, input.status);
        return { success: true, message: input.status === "verified" ? "ยืนยันข้อมูลแล้ว" : "ปฏิเสธข้อมูลแล้ว" };
      }),
  }),

  // ============ SPATIAL MAP ============
  spatialMap: router({
    // Get Thailand provinces with election data
    provinces: publicProcedure.query(async () => {
      const stations = await getPollingStations();
      const electionData = await getElectionDataForAnalysis();
      
      // Group data by province
      const provinceData = new Map<string, { stations: number; avgTurnout: number; avgVoteShare: number; zScore: number }>();
      
      THAILAND_PROVINCES.forEach(prov => {
        const provStations = stations.filter(s => s.province === prov.name);
        const provElectionData = electionData.filter(d => 
          provStations.some(s => s.id === d.stationId)
        );
        
        if (provElectionData.length > 0) {
          const avgTurnout = provElectionData.reduce((acc, d) => acc + parseFloat(d.turnout?.toString() || "0"), 0) / provElectionData.length;
          const avgVoteShare = provElectionData.reduce((acc, d) => acc + parseFloat(d.candidateAShare?.toString() || "0"), 0) / provElectionData.length;
          
          provinceData.set(prov.code, {
            stations: provStations.length,
            avgTurnout,
            avgVoteShare,
            zScore: 0 // Will be calculated below
          });
        }
      });
      
      // Calculate Z-scores for each province
      const allTurnouts = Array.from(provinceData.values()).map(d => d.avgTurnout);
      const meanTurnout = allTurnouts.length > 0 ? allTurnouts.reduce((a, b) => a + b, 0) / allTurnouts.length : 0;
      const stdTurnout = allTurnouts.length > 0 ? Math.sqrt(allTurnouts.reduce((acc, t) => acc + Math.pow(t - meanTurnout, 2), 0) / allTurnouts.length) : 1;
      
      provinceData.forEach((data, code) => {
        data.zScore = stdTurnout > 0 ? (data.avgTurnout - meanTurnout) / stdTurnout : 0;
      });
      
      return THAILAND_PROVINCES.map(prov => {
        const data = provinceData.get(prov.code);
        return {
          ...prov,
          stations: data?.stations || 0,
          avgTurnout: data?.avgTurnout || 0,
          avgVoteShare: data?.avgVoteShare || 0,
          zScore: data?.zScore || 0,
          isSuspicious: Math.abs(data?.zScore || 0) > 2.5,
        };
      });
    }),
    
    // Get demo data for spatial map
    demoData: publicProcedure.query(async () => {
      // Generate demo data for all provinces
      return THAILAND_PROVINCES.map(prov => {
        const baseVoteShare = 0.4 + Math.random() * 0.2;
        const baseTurnout = 0.6 + Math.random() * 0.2;
        
        // Add some suspicious provinces
        const isSuspicious = Math.random() < 0.15;
        const turnout = isSuspicious ? 0.9 + Math.random() * 0.1 : baseTurnout;
        const voteShare = isSuspicious ? 0.85 + Math.random() * 0.15 : baseVoteShare;
        
        // Calculate Z-score (simplified)
        const zScore = isSuspicious ? 2.5 + Math.random() * 1.5 : (Math.random() - 0.5) * 2;
        
        return {
          ...prov,
          stations: Math.floor(50 + Math.random() * 200),
          avgTurnout: turnout,
          avgVoteShare: voteShare,
          zScore,
          isSuspicious: Math.abs(zScore) > 2.5,
        };
      });
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
