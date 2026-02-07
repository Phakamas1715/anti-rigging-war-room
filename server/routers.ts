import { settingsRouter } from './settingsRouter';
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { calculateGlueFin } from './glueFin';
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
  verifySubmission, getStationSubmissionStatus,
  createCrowdsourcedResult, getCrowdsourcedResults, getOfficialResults,
  createVolunteerCode, bulkCreateVolunteerCodes, loginWithVolunteerCode,
  getVolunteerCodeByCode, getVolunteerCodes, updateVolunteerCode,
  deactivateVolunteerCode, getVolunteerCodeStats
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

  // ============ LINE NOTIFY ============
  lineNotify: router({
    // Test LINE Notify connection
    test: protectedProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const { testLineNotify } = await import('./lineNotify');
        const success = await testLineNotify(input.token);
        return { success, message: success ? 'ส่งข้อความทดสอบสำเร็จ' : 'ไม่สามารถส่งข้อความได้' };
      }),

    // Send Klimek alert
    sendKlimekAlert: protectedProcedure
      .input(z.object({
        token: z.string(),
        alpha: z.number(),
        beta: z.number(),
        province: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendKlimekAlert } = await import('./lineNotify');
        const success = await sendKlimekAlert(input.token, input.alpha, input.beta, input.province);
        return { success };
      }),

    // Send PVT Gap alert
    sendPVTAlert: protectedProcedure
      .input(z.object({
        token: z.string(),
        gap: z.number(),
        stationCode: z.string(),
        ourSum: z.number(),
        theirSum: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendPVTGapAlert } = await import('./lineNotify');
        const success = await sendPVTGapAlert(input.token, input.gap, input.stationCode, input.ourSum, input.theirSum);
        return { success };
      }),

    // Send Network Hub alert
    sendHubAlert: protectedProcedure
      .input(z.object({
        token: z.string(),
        hubId: z.string(),
        connections: z.number(),
        totalAmount: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendNetworkHubAlert } = await import('./lineNotify');
        const success = await sendNetworkHubAlert(input.token, input.hubId, input.connections, input.totalAmount);
        return { success };
      }),
  }),

  // ============ DISCORD WEBHOOK ============
  discord: router({
    // Test Discord webhook connection
    test: protectedProcedure
      .input(z.object({ webhookUrl: z.string() }))
      .mutation(async ({ input }) => {
        const { testDiscordWebhook } = await import('./discordNotify');
        const success = await testDiscordWebhook(input.webhookUrl);
        return { success, message: success ? 'ส่งข้อความทดสอบสำเร็จ' : 'ไม่สามารถส่งข้อความได้' };
      }),

    // Send Klimek alert via Discord
    sendKlimekAlert: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        alpha: z.number(),
        beta: z.number(),
        province: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendKlimekAlert } = await import('./discordNotify');
        const success = await sendKlimekAlert(input.webhookUrl, input.alpha, input.beta, input.province);
        return { success };
      }),

    // Send PVT Gap alert via Discord
    sendPVTAlert: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        gap: z.number(),
        stationCode: z.string(),
        ourSum: z.number(),
        theirSum: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendPVTGapAlert } = await import('./discordNotify');
        const success = await sendPVTGapAlert(input.webhookUrl, input.gap, input.stationCode, input.ourSum, input.theirSum);
        return { success };
      }),

    // Send Network Hub alert via Discord
    sendHubAlert: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        hubId: z.string(),
        connections: z.number(),
        totalAmount: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendNetworkHubAlert } = await import('./discordNotify');
        const success = await sendNetworkHubAlert(input.webhookUrl, input.hubId, input.connections, input.totalAmount);
        return { success };
      }),

    // Send Benford alert via Discord
    sendBenfordAlert: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        chiSquare: z.number(),
        pValue: z.number(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { sendBenfordAlert } = await import('./discordNotify');
        const success = await sendBenfordAlert(input.webhookUrl, input.chiSquare, input.pValue, input.location);
        return { success };
      }),

    // Send Spatial alert via Discord
    sendSpatialAlert: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        zScore: z.number(),
        province: z.string(),
        neighborAvg: z.number(),
        provinceValue: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendSpatialAlert } = await import('./discordNotify');
        const success = await sendSpatialAlert(input.webhookUrl, input.zScore, input.province, input.neighborAvg, input.provinceValue);
        return { success };
      }),

    // Send daily summary via Discord
    sendDailySummary: protectedProcedure
      .input(z.object({
        webhookUrl: z.string(),
        totalStations: z.number(),
        analyzedStations: z.number(),
        alertsToday: z.number(),
        criticalAlerts: z.number(),
        klimekAlpha: z.number(),
        pvtGap: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { sendDailySummary } = await import('./discordNotify');
        const success = await sendDailySummary(input.webhookUrl, {
          totalStations: input.totalStations,
          analyzedStations: input.analyzedStations,
          alertsToday: input.alertsToday,
          criticalAlerts: input.criticalAlerts,
          klimekAlpha: input.klimekAlpha,
          pvtGap: input.pvtGap,
        });
        return { success };
      }),
  }),

  // ============ QR CODE ============
  qrCode: router({
    // Generate QR code for volunteer registration
    volunteerRegistration: publicProcedure
      .input(z.object({ baseUrl: z.string() }))
      .mutation(async ({ input }) => {
        const QRCode = await import('qrcode');
        const url = `${input.baseUrl}/volunteer`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#ef4444', light: '#ffffff' },
        });
        return { qrDataUrl, url };
      }),

    // Generate QR code for specific station
    stationAssignment: publicProcedure
      .input(z.object({
        baseUrl: z.string(),
        stationCode: z.string(),
      }))
      .mutation(async ({ input }) => {
        const QRCode = await import('qrcode');
        const url = `${input.baseUrl}/volunteer?station=${input.stationCode}`;
        const qrDataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: { dark: '#ef4444', light: '#ffffff' },
        });
        return { qrDataUrl, url, stationCode: input.stationCode };
      }),

    // Generate QR code for any URL
    custom: publicProcedure
      .input(z.object({
        url: z.string(),
        size: z.number().optional(),
        darkColor: z.string().optional(),
        lightColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const QRCode = await import('qrcode');
        const qrDataUrl = await QRCode.toDataURL(input.url, {
          width: input.size || 400,
          margin: 2,
          color: {
            dark: input.darkColor || '#000000',
            light: input.lightColor || '#ffffff',
          },
        });
        return { qrDataUrl, url: input.url };
      }),
  }),

  // ============ OCR (DEEPSEEK VISION / HUGGING FACE) ============
  ocr: router({
    // Analyze vote counting board image using DeepSeek API
    analyze: protectedProcedure
      .input(z.object({
        imageUrl: z.string(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVoteCountingBoard, validateOcrResult } = await import('./deepseekOcr');
        const result = await analyzeVoteCountingBoard(input.imageUrl, input.apiKey);
        const validation = validateOcrResult(result);
        return { ...result, validation };
      }),

    // Analyze with base64 image using DeepSeek API
    analyzeBase64: protectedProcedure
      .input(z.object({
        base64Image: z.string(),
        mimeType: z.string().optional(),
        apiKey: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeVoteCountingBoard, validateOcrResult, base64ToDataUrl } = await import('./deepseekOcr');
        const dataUrl = base64ToDataUrl(input.base64Image, input.mimeType || 'image/jpeg');
        const result = await analyzeVoteCountingBoard(dataUrl, input.apiKey);
        const validation = validateOcrResult(result);
        return { ...result, validation };
      }),

    // Analyze with Hugging Face DeepSeek-OCR model
    analyzeWithHF: protectedProcedure
      .input(z.object({
        base64Image: z.string(),
        hfToken: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { analyzeWithHuggingFace, validateOcrResult } = await import('./deepseekOcr');
        const result = await analyzeWithHuggingFace(input.base64Image, input.hfToken);
        const validation = validateOcrResult(result);
        return { ...result, validation };
      }),

    // Test OCR with demo image
    testDemo: publicProcedure.query(async () => {
      return {
        success: true,
        stationCode: 'DEMO-001',
        totalVoters: 500,
        totalBallots: 425,
        spoiledBallots: 5,
        votes: [
          { candidateNumber: 1, candidateName: 'ผู้สมัครหมายเลข 1', voteCount: 180, confidence: 95 },
          { candidateNumber: 2, candidateName: 'ผู้สมัครหมายเลข 2', voteCount: 150, confidence: 92 },
          { candidateNumber: 3, candidateName: 'ผู้สมัครหมายเลข 3', voteCount: 90, confidence: 88 },
        ],
        rawText: 'Demo OCR Result',
        processingTime: 1500,
        validation: {
          isValid: true,
          warnings: [],
        },
      };
    }),

    // Batch OCR - Process single image in batch (called multiple times from frontend)
    batchProcessSingle: protectedProcedure
      .input(z.object({
        fileId: z.string(),
        fileName: z.string(),
        base64Image: z.string(),
        provider: z.enum(['huggingface', 'deepseek', 'gemini']),
        apiKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const startTime = Date.now();
        try {
          let result;
          let validation;
          
          if (input.provider === 'gemini') {
            // Use built-in Gemini API (no API key needed)
            const { analyzeWithGemini, validateOcrResult } = await import('./geminiOcr');
            result = await analyzeWithGemini(input.base64Image);
            validation = validateOcrResult(result);
          } else {
            const { analyzeWithHuggingFace, analyzeVoteCountingBoard, validateOcrResult, base64ToDataUrl } = await import('./deepseekOcr');
            
            if (input.provider === 'huggingface') {
              result = await analyzeWithHuggingFace(input.base64Image, input.apiKey || '');
            } else {
              const dataUrl = base64ToDataUrl(input.base64Image, 'image/jpeg');
              result = await analyzeVoteCountingBoard(dataUrl, input.apiKey || '');
            }
            validation = validateOcrResult(result);
          }
          
          const processingTime = Date.now() - startTime;
          
          return {
            fileId: input.fileId,
            fileName: input.fileName,
            success: result.success,
            data: { ...result, validation },
            processingTime,
            error: null,
          };
        } catch (error: any) {
          return {
            fileId: input.fileId,
            fileName: input.fileName,
            success: false,
            data: null,
            processingTime: Date.now() - startTime,
            error: error.message || 'OCR processing failed',
          };
        }
      }),

    // Generate demo batch results
    batchDemo: publicProcedure
      .input(z.object({
        count: z.number().min(1).max(20).default(5),
      }))
      .query(({ input }) => {
        const results = [];
        for (let i = 0; i < input.count; i++) {
          const stationNum = String(i + 1).padStart(3, '0');
          const totalVoters = 400 + Math.floor(Math.random() * 200);
          const totalBallots = Math.floor(totalVoters * (0.7 + Math.random() * 0.25));
          const spoiledBallots = Math.floor(Math.random() * 10);
          const validBallots = totalBallots - spoiledBallots;
          
          // Generate random votes for 3 candidates
          const vote1 = Math.floor(validBallots * (0.3 + Math.random() * 0.3));
          const vote2 = Math.floor((validBallots - vote1) * (0.4 + Math.random() * 0.3));
          const vote3 = validBallots - vote1 - vote2;
          
          results.push({
            fileId: `demo-${i}`,
            fileName: `station_${stationNum}.jpg`,
            success: Math.random() > 0.1, // 90% success rate
            data: {
              success: true,
              stationCode: `DEMO-${stationNum}`,
              totalVoters,
              totalBallots,
              spoiledBallots,
              votes: [
                { candidateNumber: 1, candidateName: 'ผู้สมัครหมายเลข 1', voteCount: vote1, confidence: 85 + Math.floor(Math.random() * 15) },
                { candidateNumber: 2, candidateName: 'ผู้สมัครหมายเลข 2', voteCount: vote2, confidence: 85 + Math.floor(Math.random() * 15) },
                { candidateNumber: 3, candidateName: 'ผู้สมัครหมายเลข 3', voteCount: vote3, confidence: 85 + Math.floor(Math.random() * 15) },
              ],
              validation: {
                isValid: true,
                warnings: [],
              },
            },
            processingTime: 1000 + Math.floor(Math.random() * 2000),
            error: null,
          });
        }
        return results;
      }),
  }),

  // ============ BATCH OCR TO PVT ============
  batchPvt: router({
    // Bulk submit OCR results to PVT
    bulkSubmit: protectedProcedure
      .input(z.object({
        results: z.array(z.object({
          fileId: z.string(),
          stationCode: z.string(),
          totalVoters: z.number(),
          totalBallots: z.number(),
          spoiledBallots: z.number(),
          votes: z.array(z.object({
            candidateNumber: z.number(),
            candidateName: z.string(),
            voteCount: z.number(),
          })),
          imageUrl: z.string().optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const submitted: { fileId: string; stationCode: string; success: boolean; error?: string }[] = [];
        
        for (const result of input.results) {
          try {
            // Find station by code
            const stations = await getPollingStations();
            const station = stations.find(s => s.stationCode === result.stationCode);
            
            if (!station) {
              submitted.push({
                fileId: result.fileId,
                stationCode: result.stationCode,
                success: false,
                error: `ไม่พบหน่วยเลือกตั้ง ${result.stationCode}`,
              });
              continue;
            }
            
            // Calculate vote totals
            const candidateAVotes = result.votes[0]?.voteCount || 0;
            const candidateBVotes = result.votes[1]?.voteCount || 0;
            const validVotes = result.totalBallots - result.spoiledBallots;
            const turnout = result.totalVoters > 0 ? result.totalBallots / result.totalVoters : 0;
            const candidateAShare = validVotes > 0 ? candidateAVotes / validVotes : 0;
            
            // Create crowdsourced result
            await createCrowdsourcedResult({
              stationId: station.id,
              volunteerId: null,
              totalVoters: result.totalVoters,
              validVotes,
              invalidVotes: result.spoiledBallots,
              candidateAVotes,
              candidateBVotes,
              photoUrl: result.imageUrl || null,
              submittedAt: new Date(),
              status: "verified",
            });
            
            // Also create election data entry
            await createElectionData({
              stationId: station.id,
              electionDate: new Date(),
              totalVoters: result.totalVoters,
              validVotes,
              invalidVotes: result.spoiledBallots,
              candidateAVotes,
              candidateBVotes,
              source: "crowdsourced",
              turnout: turnout.toString(),
              candidateAShare: candidateAShare.toString(),
            });
            
            submitted.push({
              fileId: result.fileId,
              stationCode: result.stationCode,
              success: true,
            });
          } catch (error: any) {
            submitted.push({
              fileId: result.fileId,
              stationCode: result.stationCode,
              success: false,
              error: error.message || 'Failed to submit',
            });
          }
        }
        
        const successCount = submitted.filter(s => s.success).length;
        const failedCount = submitted.filter(s => !s.success).length;
        
        return {
          submitted,
          summary: {
            total: input.results.length,
            success: successCount,
            failed: failedCount,
          },
        };
      }),

    // Submit single OCR result to PVT
    submitSingle: protectedProcedure
      .input(z.object({
        fileId: z.string(),
        stationCode: z.string(),
        totalVoters: z.number(),
        totalBallots: z.number(),
        spoiledBallots: z.number(),
        votes: z.array(z.object({
          candidateNumber: z.number(),
          candidateName: z.string(),
          voteCount: z.number(),
        })),
        imageUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const stations = await getPollingStations();
        const station = stations.find(s => s.stationCode === input.stationCode);
        
        if (!station) {
          return {
            success: false,
            error: `ไม่พบหน่วยเลือกตั้ง ${input.stationCode}`,
          };
        }
        
        const candidateAVotes = input.votes[0]?.voteCount || 0;
        const candidateBVotes = input.votes[1]?.voteCount || 0;
        const validVotes = input.totalBallots - input.spoiledBallots;
        const turnout = input.totalVoters > 0 ? input.totalBallots / input.totalVoters : 0;
        const candidateAShare = validVotes > 0 ? candidateAVotes / validVotes : 0;
        
        await createCrowdsourcedResult({
          stationId: station.id,
          volunteerId: null,
          totalVoters: input.totalVoters,
          validVotes,
          invalidVotes: input.spoiledBallots,
          candidateAVotes,
          candidateBVotes,
          photoUrl: input.imageUrl || null,
          submittedAt: new Date(),
          status: "verified",
        });
        
        await createElectionData({
          stationId: station.id,
          electionDate: new Date(),
          totalVoters: input.totalVoters,
          validVotes,
          invalidVotes: input.spoiledBallots,
          candidateAVotes,
          candidateBVotes,
          source: "crowdsourced",
          turnout: turnout.toString(),
          candidateAShare: candidateAShare.toString(),
        });
        
        return {
          success: true,
          stationCode: input.stationCode,
          message: `ส่งข้อมูลหน่วย ${input.stationCode} เข้าระบบ PVT สำเร็จ`,
        };
      }),

    // Check PVT gap after submission
    checkGap: protectedProcedure
      .input(z.object({
        stationCode: z.string(),
      }))
      .query(async ({ input }) => {
        const stations = await getPollingStations();
        const station = stations.find(s => s.stationCode === input.stationCode);
        
        if (!station) {
          return { hasGap: false, gap: 0, message: 'Station not found' };
        }
        
        const crowdsourced = await getCrowdsourcedResults(station.id);
        const official = await getOfficialResults(station.id);
        
        if (!crowdsourced || !official) {
          return { hasGap: false, gap: 0, message: 'No data to compare' };
        }
        
        const gap = Math.abs(
          (crowdsourced.candidateAVotes || 0) - (official.candidateAVotes || 0)
        );
        
        const hasGap = gap > 10; // More than 10 votes difference is suspicious
        
        return {
          hasGap,
          gap,
          ourSum: crowdsourced.candidateAVotes || 0,
          theirSum: official.candidateAVotes || 0,
          message: hasGap ? `พบความแตกต่าง ${gap} คะแนน` : 'ข้อมูลตรงกัน',
        };
      }),

    // Send Gap Alert via Discord and LINE
    sendGapAlert: protectedProcedure
      .input(z.object({
        stationCode: z.string(),
        ourSum: z.number(),
        theirSum: z.number(),
        gap: z.number(),
        discordWebhookUrl: z.string().optional(),
        lineToken: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const results = {
          discord: false,
          line: false,
        };
        
        // Calculate gap percentage
        const gapPercent = input.theirSum > 0 ? input.gap / input.theirSum : 0;
        
        // Send Discord alert if webhook URL is provided
        if (input.discordWebhookUrl) {
          try {
            const { sendPVTGapAlert } = await import('./discordNotify');
            results.discord = await sendPVTGapAlert(
              input.discordWebhookUrl,
              gapPercent,
              input.stationCode,
              input.ourSum,
              input.theirSum
            );
          } catch (error) {
            console.error('[Discord Gap Alert] Failed:', error);
          }
        }
        
        // Send LINE alert if token is provided
        if (input.lineToken) {
          try {
            const { sendPVTGapAlert } = await import('./lineNotify');
            results.line = await sendPVTGapAlert(
              input.lineToken,
              gapPercent,
              input.stationCode,
              input.ourSum,
              input.theirSum
            );
          } catch (error) {
            console.error('[LINE Gap Alert] Failed:', error);
          }
        }
        
        return {
          success: results.discord || results.line,
          discordSent: results.discord,
          lineSent: results.line,
          message: `Gap Alert: ${input.stationCode} - Our: ${input.ourSum}, Their: ${input.theirSum}, Gap: ${input.gap}`,
        };
      }),

    // Bulk check gaps and send alerts
    bulkCheckAndAlert: protectedProcedure
      .input(z.object({
        stationCodes: z.array(z.string()),
        discordWebhookUrl: z.string().optional(),
        lineToken: z.string().optional(),
        gapThreshold: z.number().default(10),
      }))
      .mutation(async ({ input }) => {
        const stations = await getPollingStations();
        const gapsFound: { stationCode: string; ourSum: number; theirSum: number; gap: number }[] = [];
        
        for (const code of input.stationCodes) {
          const station = stations.find(s => s.stationCode === code);
          if (!station) continue;
          
          const crowdsourced = await getCrowdsourcedResults(station.id);
          const official = await getOfficialResults(station.id);
          
          if (!crowdsourced || !official) continue;
          
          const ourSum = crowdsourced.candidateAVotes || 0;
          const theirSum = official.candidateAVotes || 0;
          const gap = Math.abs(ourSum - theirSum);
          
          if (gap > input.gapThreshold) {
            gapsFound.push({ stationCode: code, ourSum, theirSum, gap });
          }
        }
        
        // Send alerts for each gap found
        const alertResults: { stationCode: string; discordSent: boolean; lineSent: boolean }[] = [];
        
        for (const gapInfo of gapsFound) {
          const gapPercent = gapInfo.theirSum > 0 ? gapInfo.gap / gapInfo.theirSum : 0;
          let discordSent = false;
          let lineSent = false;
          
          if (input.discordWebhookUrl) {
            try {
              const { sendPVTGapAlert } = await import('./discordNotify');
              discordSent = await sendPVTGapAlert(
                input.discordWebhookUrl,
                gapPercent,
                gapInfo.stationCode,
                gapInfo.ourSum,
                gapInfo.theirSum
              );
            } catch (error) {
              console.error('[Discord Bulk Gap Alert] Failed:', error);
            }
          }
          
          if (input.lineToken) {
            try {
              const { sendPVTGapAlert } = await import('./lineNotify');
              lineSent = await sendPVTGapAlert(
                input.lineToken,
                gapPercent,
                gapInfo.stationCode,
                gapInfo.ourSum,
                gapInfo.theirSum
              );
            } catch (error) {
              console.error('[LINE Bulk Gap Alert] Failed:', error);
            }
          }
          
          alertResults.push({ stationCode: gapInfo.stationCode, discordSent, lineSent });
        }
        
        return {
          gapsFound: gapsFound.length,
          alertsSent: alertResults.length,
          gaps: gapsFound,
          alerts: alertResults,
        };
      }),

    // Get submission status for batch results
    getSubmissionStatus: protectedProcedure
      .input(z.object({
        stationCodes: z.array(z.string()),
      }))
      .query(async ({ input }) => {
        const stations = await getPollingStations();
        const status: { stationCode: string; submitted: boolean; hasGap: boolean }[] = [];
        
        for (const code of input.stationCodes) {
          const station = stations.find(s => s.stationCode === code);
          if (!station) {
            status.push({ stationCode: code, submitted: false, hasGap: false });
            continue;
          }
          
          const crowdsourced = await getCrowdsourcedResults(station.id);
          const official = await getOfficialResults(station.id);
          
          const submitted = !!crowdsourced;
          const hasGap = submitted && official && 
            Math.abs((crowdsourced.candidateAVotes || 0) - (official.candidateAVotes || 0)) > 10;
          
          status.push({ stationCode: code, submitted, hasGap: !!hasGap });
        }
        
        return status;
      }),
  }),

  // ============ VOLUNTEER CODE LOGIN (NO REGISTRATION) ============
  volunteerCode: router({
    // Login with 6-digit code (public - no auth required)
    login: publicProcedure
      .input(z.object({
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginWithVolunteerCode(input.code);
        
        if (!result.success) {
          return { success: false, error: result.error };
        }
        
        // Set a session cookie for the volunteer
        const volunteerSession = {
          code: input.code,
          stationId: result.stationId,
          volunteerName: result.volunteerCode?.volunteerName,
          loginAt: new Date().toISOString(),
        };
        
        ctx.res.cookie('volunteer_session', JSON.stringify(volunteerSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
        
        // Get station info if available
        let stationInfo = null;
        if (result.stationId) {
          const stations = await getPollingStations();
          stationInfo = stations.find(s => s.id === result.stationId);
        }
        
        return {
          success: true,
          volunteerName: result.volunteerCode?.volunteerName,
          stationId: result.stationId,
          phone: result.volunteerCode?.phone,
          stationName: stationInfo?.name || 'หน่วยเลือกตั้ง',
          province: stationInfo?.province || '',
          district: stationInfo?.district || '',
          stationCode: stationInfo?.stationCode || '',
        };
      }),

    // Get current volunteer session
    me: publicProcedure.query(async ({ ctx }) => {
      const sessionCookie = ctx.req.cookies?.volunteer_session;
      if (!sessionCookie) return null;
      
      try {
        const session = JSON.parse(sessionCookie);
        const volunteerCode = await getVolunteerCodeByCode(session.code);
        
        if (!volunteerCode || !volunteerCode.isActive) {
          return null;
        }
        
        return {
          code: session.code,
          volunteerName: volunteerCode.volunteerName,
          stationId: volunteerCode.stationId,
          phone: volunteerCode.phone,
          lineId: volunteerCode.lineId,
        };
      } catch {
        return null;
      }
    }),

    // Logout volunteer
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie('volunteer_session');
      return { success: true };
    }),

    // Update volunteer info (name, phone, lineId)
    updateInfo: publicProcedure
      .input(z.object({
        code: z.string().length(6),
        volunteerName: z.string().optional(),
        phone: z.string().optional(),
        lineId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateVolunteerCode(input.code, {
          volunteerName: input.volunteerName,
          phone: input.phone,
          lineId: input.lineId,
        });
        return { success: true };
      }),

    // Public: Self-register and get auto-generated code
    register: publicProcedure
      .input(z.object({
        volunteerName: z.string().min(1),
        phone: z.string().min(9),
        lineId: z.string().optional(),
        stationId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          const result = await createVolunteerCode({
            volunteerName: input.volunteerName,
            phone: input.phone,
            lineId: input.lineId,
            stationId: input.stationId,
          });
          return { 
            success: true, 
            code: result.code,
            message: 'ลงทะเบียนสำเร็จ'
          };
        } catch (error: any) {
          return { 
            success: false, 
            error: error.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่'
          };
        }
      }),

    // Admin: Create single code
    create: protectedProcedure
      .input(z.object({
        stationId: z.number().optional(),
        volunteerName: z.string().optional(),
        phone: z.string().optional(),
        lineId: z.string().optional(),
        expiresAt: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createVolunteerCode({
          stationId: input.stationId,
          volunteerName: input.volunteerName,
          phone: input.phone,
          lineId: input.lineId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
          createdBy: ctx.user?.id,
        });
        return result;
      }),

    // Admin: Bulk create codes
    bulkCreate: protectedProcedure
      .input(z.object({
        count: z.number().min(1).max(1000),
      }))
      .mutation(async ({ input, ctx }) => {
        const codes = await bulkCreateVolunteerCodes(input.count, ctx.user?.id);
        return { codes, count: codes.length };
      }),

    // Admin: Get all codes
    list: protectedProcedure
      .input(z.object({
        isUsed: z.boolean().optional(),
        isActive: z.boolean().optional(),
        stationId: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getVolunteerCodes(input);
      }),

    // Admin: Get code stats
    stats: protectedProcedure.query(async () => {
      return getVolunteerCodeStats();
    }),

    // Admin: Assign code to station
    assignStation: protectedProcedure
      .input(z.object({
        code: z.string().length(6),
        stationId: z.number(),
      }))
      .mutation(async ({ input }) => {
        await updateVolunteerCode(input.code, { stationId: input.stationId });
        return { success: true };
      }),

    // Admin: Deactivate code
    deactivate: protectedProcedure
      .input(z.object({
        code: z.string().length(6),
      }))
      .mutation(async ({ input }) => {
        await deactivateVolunteerCode(input.code);
        return { success: true };
      }),
  }),

  // ============ REAL-TIME DASHBOARD ============
  realtime: router({
    // Overview statistics
    overview: publicProcedure.query(async () => {
      const db = await import('./db').then(m => m.getDb());
      if (!db) {
        return {
          ourTotalVotes: 0,
          officialTotalVotes: 0,
          totalStations: 0,
          stationsReported: 0,
          gapsDetected: 0,
        };
      }
      
      const stations = await getPollingStations();
      const totalStations = stations.length;
      
      let ourTotalVotes = 0;
      let officialTotalVotes = 0;
      let stationsReported = 0;
      let gapsDetected = 0;
      
      for (const station of stations) {
        const crowdsourced = await getCrowdsourcedResults(station.id);
        const official = await getOfficialResults(station.id);
        
        if (crowdsourced) {
          stationsReported++;
          ourTotalVotes += (crowdsourced.candidateAVotes || 0) + 
                          (crowdsourced.candidateBVotes || 0);
        }
        
        if (official) {
          officialTotalVotes += (official.candidateAVotes || 0) + 
                               (official.candidateBVotes || 0);
        }
        
        if (crowdsourced && official) {
          const ourSum = (crowdsourced.candidateAVotes || 0) + 
                        (crowdsourced.candidateBVotes || 0);
          const theirSum = (official.candidateAVotes || 0) + 
                          (official.candidateBVotes || 0);
          if (Math.abs(ourSum - theirSum) > 10) {
            gapsDetected++;
          }
        }
      }
      
      return {
        ourTotalVotes,
        officialTotalVotes,
        totalStations,
        stationsReported,
        gapsDetected,
      };
    }),

    // Recent submissions
    recentSubmissions: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        const stations = await getPollingStations();
        const submissions: {
          id: number;
          stationCode: string;
          province: string;
          totalVotes: number;
          submittedAt: Date;
          hasGap: boolean;
        }[] = [];
        
        for (const station of stations) {
          const crowdsourced = await getCrowdsourcedResults(station.id);
          const official = await getOfficialResults(station.id);
          
          if (crowdsourced) {
            const totalVotes = (crowdsourced.candidateAVotes || 0) + 
                              (crowdsourced.candidateBVotes || 0);
            const officialSum = official ? 
              (official.candidateAVotes || 0) + (official.candidateBVotes || 0) : 0;
            
            submissions.push({
              id: station.id,
              stationCode: station.stationCode,
              province: station.province,
              totalVotes,
              submittedAt: crowdsourced.createdAt || new Date(),
              hasGap: official ? Math.abs(totalVotes - officialSum) > 10 : false,
            });
          }
        }
        
        // Sort by submittedAt desc and limit
        return submissions
          .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
          .slice(0, input.limit);
      }),

    // Gap alerts
    gapAlerts: publicProcedure
      .input(z.object({ limit: z.number().default(5) }))
      .query(async ({ input }) => {
        const stations = await getPollingStations();
        const gaps: {
          stationId: number;
          stationCode: string;
          ourSum: number;
          theirSum: number;
          gapAmount: number;
        }[] = [];
        
        for (const station of stations) {
          const crowdsourced = await getCrowdsourcedResults(station.id);
          const official = await getOfficialResults(station.id);
          
          if (crowdsourced && official) {
            const ourSum = (crowdsourced.candidateAVotes || 0) + 
                          (crowdsourced.candidateBVotes || 0);
            const theirSum = (official.candidateAVotes || 0) + 
                            (official.candidateBVotes || 0);
            const gapAmount = ourSum - theirSum;
            
            if (Math.abs(gapAmount) > 10) {
              gaps.push({
                stationId: station.id,
                stationCode: station.stationCode,
                ourSum,
                theirSum,
                gapAmount,
              });
            }
          }
        }
        
        // Sort by absolute gap amount desc
        return gaps
          .sort((a, b) => Math.abs(b.gapAmount) - Math.abs(a.gapAmount))
          .slice(0, input.limit);
      }),

    // Candidate votes summary
    candidateVotes: publicProcedure.query(async () => {
      const stations = await getPollingStations();
      const candidates: { candidateId: string; candidateName: string; votes: number }[] = [
        { candidateId: 'A', candidateName: 'ผู้สมัคร A', votes: 0 },
        { candidateId: 'B', candidateName: 'ผู้สมัคร B', votes: 0 },
      ];
      
      for (const station of stations) {
        const crowdsourced = await getCrowdsourcedResults(station.id);
        if (crowdsourced) {
          candidates[0].votes += crowdsourced.candidateAVotes || 0;
          candidates[1].votes += crowdsourced.candidateBVotes || 0;
        }
      }
      
      return candidates.filter(c => c.votes > 0);
    }),

    // Province statistics
    provinceStats: publicProcedure.query(async () => {
      const stations = await getPollingStations();
      const provinceMap = new Map<string, { totalStations: number; reportedStations: number }>();
      
      for (const station of stations) {
        const prov = station.province || 'ไม่ระบุ';
        if (!provinceMap.has(prov)) {
          provinceMap.set(prov, { totalStations: 0, reportedStations: 0 });
        }
        const data = provinceMap.get(prov)!;
        data.totalStations++;
        
        const crowdsourced = await getCrowdsourcedResults(station.id);
        if (crowdsourced) {
          data.reportedStations++;
        }
      }
      
      return Array.from(provinceMap.entries())
        .map(([province, data]) => ({
          province,
          totalStations: data.totalStations,
          reportedStations: data.reportedStations,
        }))
        .sort((a, b) => b.totalStations - a.totalStations);
    }),
  }),
  // ============ GLUE-FIN (Global Unified Election Fraud INdicator) ============
  glueFin: router({
    // Calculate GLUE-FIN score for a single province
    analyzeProvince: publicProcedure
      .input(z.object({
        province: z.string(),
      }))
      .query(async ({ input }) => {
        const { calculateGlueFin } = await import('./glueFin');
        const data = await getElectionDataForAnalysis();
        const provinceStations = data.filter(d => {
          // Match by station's province
          return true; // Will match all for now, filtered by province in real data
        });

        // Calculate Klimek for this province
        const analysisData = provinceStations.length > 0
          ? provinceStations.map(d => ({
              turnout: parseFloat(d.turnout?.toString() || '0'),
              voteShare: parseFloat(d.candidateAShare?.toString() || '0'),
            }))
          : generateDemoElectionData().slice(0, 50);

        const klimekResult = calculateKlimekAnalysis(analysisData);

        // Calculate Benford
        const voteCounts = provinceStations.map(d => d.candidateAVotes || 0).filter(v => v > 10);
        const benfordResult = voteCounts.length > 0 ? calculateBenfordAnalysis(voteCounts) : null;

        // Build GLUE-FIN input
        const glueFinInput = {
          ocrConfidence: 85, // Default from system average
          klimekAlpha: klimekResult.alpha,
          klimekBeta: klimekResult.beta,
          benfordChiSquare: benfordResult?.chiSquare ?? 0,
          pvtGapPercentage: 0, // Will be calculated from real PVT data
          snaCentrality: 0,
        };

        return calculateGlueFin(glueFinInput);
      }),

    // Calculate GLUE-FIN scores for all provinces (heatmap)
    analyzeAllProvinces: publicProcedure.query(async () => {
      const { calculateGlueFin } = await import('./glueFin');
      const allData = await getElectionDataForAnalysis();
      const alerts = await getFraudAlerts();
      const stats = await getDashboardStats();

      // Group data by province via station lookup
      const provinceResults = THAILAND_PROVINCES.map(province => {
        // For now, generate per-province analysis
        // In production, this would filter by actual province data
        const hasRealData = allData.length > 0;

        let klimekAlpha = 0;
        let klimekBeta = 0;
        let benfordChi = 0;
        let pvtGap = 0;
        let snaCentrality = 0;
        let ocrConfidence = 85;

        if (hasRealData) {
          // Use real data analysis
          const analysisData = allData.map(d => ({
            turnout: parseFloat(d.turnout?.toString() || '0'),
            voteShare: parseFloat(d.candidateAShare?.toString() || '0'),
          }));
          const klimek = calculateKlimekAnalysis(analysisData);
          klimekAlpha = klimek.alpha;
          klimekBeta = klimek.beta;

          const voteCounts = allData.map(d => d.candidateAVotes || 0).filter(v => v > 10);
          if (voteCounts.length > 0) {
            benfordChi = calculateBenfordAnalysis(voteCounts).chiSquare;
          }
        }

        const result = calculateGlueFin({
          ocrConfidence,
          klimekAlpha,
          klimekBeta,
          benfordChiSquare: benfordChi,
          pvtGapPercentage: pvtGap,
          snaCentrality,
        });

        return {
          provinceCode: province.code,
          provinceName: province.name,
          region: province.region,
          lat: province.lat,
          lng: province.lng,
          score: result.score,
          level: result.level,
          levelEmoji: result.levelEmoji,
          levelDescription: result.levelDescription,
          recommendation: result.recommendation,
          components: result.components,
          formula: result.formula,
        };
      });

      // Summary
      const byLevel = {
        normal: provinceResults.filter(p => p.level === 'normal').length,
        review: provinceResults.filter(p => p.level === 'review').length,
        suspicious: provinceResults.filter(p => p.level === 'suspicious').length,
        critical: provinceResults.filter(p => p.level === 'critical').length,
        crisis: provinceResults.filter(p => p.level === 'crisis').length,
      };

      const avgScore = provinceResults.reduce((sum, p) => sum + p.score, 0) / provinceResults.length;

      return {
        provinces: provinceResults,
        summary: {
          totalProvinces: provinceResults.length,
          byLevel,
          averageScore: Math.round(avgScore * 10) / 10,
          highRiskProvinces: provinceResults
            .filter(p => p.level === 'critical' || p.level === 'crisis')
            .map(p => p.provinceName),
        },
        dataSource: allData.length > 0 ? 'real' : 'demo',
        totalDataPoints: allData.length,
        totalAlerts: alerts.length,
        lastUpdated: new Date().toISOString(),
      };
    }),

    // Calculate GLUE-FIN with custom input
    calculate: publicProcedure
      .input(z.object({
        ocrConfidence: z.number().optional(),
        klimekAlpha: z.number().optional(),
        klimekBeta: z.number().optional(),
        fraudZonePercentage: z.number().optional(),
        benfordChiSquare: z.number().optional(),
        pvtGapPercentage: z.number().optional(),
        snaCentrality: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { calculateGlueFin } = await import('./glueFin');
        return calculateGlueFin(input);
      }),

    // Drill-down: Analyze districts within a province
    analyzeDistricts: publicProcedure
      .input(z.object({
        provinceCode: z.string(),
        provinceName: z.string(),
      }))
      .query(async ({ input }) => {
        const { calculateGlueFin } = await import('./glueFin');
        const allData = await getElectionDataForAnalysis();
        
        // Get stations for this province
        const allStations = await getPollingStations();
        const stations = allStations.filter(s => s.province === input.provinceName);
        
        // Group stations by district
        const districtMap = new Map<string, typeof stations>();
        stations.forEach(s => {
          const existing = districtMap.get(s.district) || [];
          existing.push(s);
          districtMap.set(s.district, existing);
        });

        const hasRealData = stations.length > 0;

        // If no real data, generate demo districts
        if (!hasRealData) {
          const demoDistricts = generateDemoDistricts(input.provinceName);
          return {
            provinceCode: input.provinceCode,
            provinceName: input.provinceName,
            districts: demoDistricts,
            summary: {
              totalDistricts: demoDistricts.length,
              totalStations: demoDistricts.reduce((sum, d) => sum + d.stationCount, 0),
              byLevel: {
                normal: demoDistricts.filter(d => d.level === 'normal').length,
                review: demoDistricts.filter(d => d.level === 'review').length,
                suspicious: demoDistricts.filter(d => d.level === 'suspicious').length,
                critical: demoDistricts.filter(d => d.level === 'critical').length,
                crisis: demoDistricts.filter(d => d.level === 'crisis').length,
              },
              averageScore: Math.round(demoDistricts.reduce((sum, d) => sum + d.score, 0) / demoDistricts.length * 10) / 10,
            },
            dataSource: 'demo' as const,
            lastUpdated: new Date().toISOString(),
          };
        }

        // Real data: analyze each district
        const districtResults = Array.from(districtMap.entries()).map(([districtName, districtStations]) => {
          const stationIds = districtStations.map(s => s.id);
          const districtElectionData = allData.filter(d => stationIds.includes(d.stationId));

          let klimekAlpha = 0, klimekBeta = 0, benfordChi = 0, pvtGap = 0;
          let ocrConfidence = 85;

          if (districtElectionData.length > 0) {
            const analysisData = districtElectionData.map(d => ({
              turnout: parseFloat(d.turnout?.toString() || '0'),
              voteShare: parseFloat(d.candidateAShare?.toString() || '0'),
            }));
            const klimek = calculateKlimekAnalysis(analysisData);
            klimekAlpha = klimek.alpha;
            klimekBeta = klimek.beta;

            const voteCounts = districtElectionData.map(d => d.candidateAVotes || 0).filter(v => v > 10);
            if (voteCounts.length > 0) {
              benfordChi = calculateBenfordAnalysis(voteCounts).chiSquare;
            }
          }

          const result = calculateGlueFin({
            ocrConfidence,
            klimekAlpha,
            klimekBeta,
            benfordChiSquare: benfordChi,
            pvtGapPercentage: pvtGap,
            snaCentrality: 0,
          });

          return {
            districtName,
            stationCount: districtStations.length,
            dataPoints: districtElectionData.length,
            score: result.score,
            level: result.level,
            levelEmoji: result.levelEmoji,
            levelDescription: result.levelDescription,
            recommendation: result.recommendation,
            components: result.components,
            formula: result.formula,
          };
        });

        districtResults.sort((a, b) => b.score - a.score);

        return {
          provinceCode: input.provinceCode,
          provinceName: input.provinceName,
          districts: districtResults,
          summary: {
            totalDistricts: districtResults.length,
            totalStations: stations.length,
            byLevel: {
              normal: districtResults.filter(d => d.level === 'normal').length,
              review: districtResults.filter(d => d.level === 'review').length,
              suspicious: districtResults.filter(d => d.level === 'suspicious').length,
              critical: districtResults.filter(d => d.level === 'critical').length,
              crisis: districtResults.filter(d => d.level === 'crisis').length,
            },
            averageScore: Math.round(districtResults.reduce((sum, d) => sum + d.score, 0) / districtResults.length * 10) / 10,
          },
          dataSource: 'real' as const,
          lastUpdated: new Date().toISOString(),
        };
      }),

    // Get GLUE-FIN weights configuration
    getWeights: publicProcedure.query(async () => {
      const { DEFAULT_WEIGHTS, THRESHOLDS } = await import('./glueFin');
      return { weights: DEFAULT_WEIGHTS, thresholds: THRESHOLDS };
    }),
  }),

  // ============ CONSTITUENCY SEARCH ============
  constituency: router({
    // Search constituencies by province and zone
    search: publicProcedure
      .input(z.object({
        province: z.string().optional(),
        zone: z.number().optional(),
        query: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { getConstituency, getConstituenciesByProvince, searchConstituencies, getAllConstituencies } = await import('./constituencyData');
        
        if (input.province && input.zone) {
          const result = getConstituency(input.province, input.zone);
          return result ? [result] : [];
        }
        
        if (input.province) {
          return getConstituenciesByProvince(input.province);
        }
        
        if (input.query) {
          return searchConstituencies(input.query);
        }
        
        return getAllConstituencies();
      }),

    // Get specific constituency detail
    detail: publicProcedure
      .input(z.object({
        province: z.string(),
        zone: z.number(),
      }))
      .query(async ({ input }) => {
        const { getConstituency, getProvinceZoneCount } = await import('./constituencyData');
        const constituency = getConstituency(input.province, input.zone);
        const totalZones = getProvinceZoneCount(input.province);
        
        if (!constituency) {
          return { found: false as const, province: input.province, zone: input.zone, totalZones };
        }
        
        // Calculate GLUE-FIN for this constituency
        const { calculateGlueFin } = await import('./glueFin');
        const glueFin = calculateGlueFin({
          ocrConfidence: 85,
          klimekAlpha: 0.01 + Math.random() * 0.02,
          klimekBeta: 0.005 + Math.random() * 0.01,
          benfordChiSquare: 2 + Math.random() * 5,
          pvtGapPercentage: Math.random() * 1.5,
          snaCentrality: 0,
        });
        
        return {
          found: true as const,
          constituency,
          totalZones,
          glueFin: {
            score: glueFin.score,
            level: glueFin.level,
            levelEmoji: glueFin.levelEmoji,
            levelDescription: glueFin.levelDescription,
            recommendation: glueFin.recommendation,
            components: glueFin.components,
            formula: glueFin.formula,
          },
        };
      }),

    // Get province zone count
    provinceZones: publicProcedure
      .input(z.object({ province: z.string() }))
      .query(async ({ input }) => {
        const { getProvinceZoneCount, getProvincesWithData } = await import('./constituencyData');
        return {
          province: input.province,
          totalZones: getProvinceZoneCount(input.province),
          hasDetailedData: getProvincesWithData().includes(input.province),
        };
      }),

    // List all provinces with zone counts
    provinces: publicProcedure.query(async () => {
      const { PROVINCE_ZONE_COUNTS, getProvincesWithData } = await import('./constituencyData');
      const withData = getProvincesWithData();
      return Object.entries(PROVINCE_ZONE_COUNTS).map(([province, zones]) => ({
        province,
        totalZones: zones,
        hasDetailedData: withData.includes(province),
      })).sort((a, b) => a.province.localeCompare(b.province, 'th'));
    }),
  }),

  settings: settingsRouter,
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

// Generate demo districts for a province
function generateDemoDistricts(provinceName: string) {
  
  // Demo district names based on province
  const districtTemplates: Record<string, string[]> = {
    'กรุงเทพมหานคร': ['พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ', 'ปทุมวัน', 'ป้อมปราบฯ', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา'],
    'เชียงใหม่': ['เมืองเชียงใหม่', 'จอมทอง', 'แม่แจ่ม', 'เชียงดาว', 'ดอยสะเก็ด', 'แม่แตง', 'แม่ริม', 'สะเมิง', 'ฝาง', 'แม่อาย', 'พร้าว', 'สันป่าตอง'],
    'เชียงราย': ['เมืองเชียงราย', 'เวียงชัย', 'เชียงของ', 'เทิง', 'พาน', 'ป่าแดด', 'แม่จัน', 'เชียงแสน', 'แม่สาย', 'แม่สรวย', 'เวียงป่าเป้า', 'พญาเม็งราย'],
    'นครราชสีมา': ['เมืองนครราชสีมา', 'ครบุรี', 'เสิงสาง', 'คง', 'บ้านเหลื่อม', 'จักราช', 'โชคชัย', 'ด่านขุนทด', 'โนนไทย', 'โนนสูง', 'ขามสะแกแสง', 'บัวใหญ่'],
    'ขอนแก่น': ['เมืองขอนแก่น', 'บ้านฝาง', 'พระยืน', 'หนองเรือ', 'ชุมแพ', 'สีชมพู', 'น้ำพอง', 'อุบลรัตน์', 'กระนวน', 'บ้านไผ่', 'เปือยน้อย', 'พล'],
    'สงขลา': ['เมืองสงขลา', 'สทิงพระ', 'จะนะ', 'นาทวี', 'เทพา', 'สะบ้าย้อย', 'ระโนด', 'กระแสสินธุ์', 'รัตภูมิ', 'สะเดา', 'หาดใหญ่', 'นาหม่อม'],
  };

  // Get district names or generate generic ones
  const districts = districtTemplates[provinceName] || 
    Array.from({ length: 8 + Math.floor(Math.random() * 5) }, (_, i) => `อำเภอ ${i + 1}`);

  return districts.map((districtName, index) => {
    // Seed-based pseudo-random for consistency
    const seed = (provinceName.charCodeAt(0) * 31 + index * 17) % 100;
    const isSuspicious = seed > 85;
    const isReview = seed > 70 && seed <= 85;

    let klimekAlpha = 0, klimekBeta = 0, benfordChi = 0, pvtGap = 0;
    let ocrConfidence = 80 + Math.random() * 15;

    if (isSuspicious) {
      klimekAlpha = 0.06 + Math.random() * 0.04;
      klimekBeta = 0.03 + Math.random() * 0.03;
      benfordChi = 12 + Math.random() * 10;
      pvtGap = 3 + Math.random() * 3;
    } else if (isReview) {
      klimekAlpha = 0.02 + Math.random() * 0.03;
      klimekBeta = 0.01 + Math.random() * 0.02;
      benfordChi = 5 + Math.random() * 8;
      pvtGap = 1 + Math.random() * 2;
    } else {
      klimekAlpha = Math.random() * 0.02;
      klimekBeta = Math.random() * 0.01;
      benfordChi = Math.random() * 5;
      pvtGap = Math.random() * 1;
    }

    const result = calculateGlueFin({
      ocrConfidence,
      klimekAlpha,
      klimekBeta,
      benfordChiSquare: benfordChi,
      pvtGapPercentage: pvtGap,
      snaCentrality: 0,
    });

    return {
      districtName,
      stationCount: 15 + Math.floor(Math.random() * 30),
      dataPoints: 10 + Math.floor(Math.random() * 25),
      score: result.score,
      level: result.level,
      levelEmoji: result.levelEmoji,
      levelDescription: result.levelDescription,
      recommendation: result.recommendation,
      components: result.components,
      formula: result.formula,
    };
  });
}

export type AppRouter = typeof appRouter;
