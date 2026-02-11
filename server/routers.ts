import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  getOcrResultsByConstituency,
  getCrossValidationAlerts,
  getUnresolvedCrossValidationAlerts,
  getCrossValidationStats,
  getOcrStats,
  resolveCrossValidationAlert,
  saveOcrResult,
  getOcrResultsByStation
} from "./db";

export const appRouter = router({
  system: systemRouter,

  // ============ YASOTHON DISTRICT 2 LIVE MONITORING ============
  yasothon: router({
    liveMonitor: publicProcedure.query(async () => {
      const results = await getOcrResultsByConstituency('ยโสธร', '2');
      const candidateVotes: Record<number, number> = {};
      
      for (let i = 1; i <= 9; i++) {
        candidateVotes[i] = 0;
      }
      
      results.forEach(result => {
        const votes = (result.votesData as any[]) || [];
        votes.forEach(vote => {
          candidateVotes[vote.candidateNumber] = (candidateVotes[vote.candidateNumber] || 0) + vote.voteCount;
        });
      });
      
      return { candidateVotes };
    }),
  }),

  // ============ REAL-TIME DASHBOARD ============
  realtimeDashboard: router({
    getLiveData: publicProcedure.query(async () => {
      const results = await getOcrResultsByConstituency('ยโสธร', '2');
      const candidateVotes: Record<number, number> = {};
      
      for (let i = 1; i <= 9; i++) {
        candidateVotes[i] = 0;
      }
      
      results.forEach(result => {
        const votes = (result.votesData as any[]) || [];
        votes.forEach(vote => {
          candidateVotes[vote.candidateNumber] = (candidateVotes[vote.candidateNumber] || 0) + vote.voteCount;
        });
      });
      
      return { candidateVotes, totalStations: results.length };
    }),
  }),

  // ============ ALERT SYSTEM ============
  alertSystem: router({
    getAlerts: publicProcedure
      .input(z.object({
        province: z.string().optional(),
        constituency: z.string().optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        isResolved: z.boolean().optional(),
        limit: z.number().min(1).max(200).default(50),
      }).optional())
      .query(async ({ input }) => {
        return getCrossValidationAlerts(input ? {
          province: input.province,
          constituency: input.constituency,
          severity: input.severity,
          isResolved: input.isResolved,
        } : undefined, input?.limit || 50);
      }),

    getUnresolved: publicProcedure.query(async () => {
      return getUnresolvedCrossValidationAlerts();
    }),

    getStats: publicProcedure.query(async () => {
      const cvStats = await getCrossValidationStats();
      const ocrStats = await getOcrStats();
      return { crossValidation: cvStats, ocr: ocrStats };
    }),

    resolve: publicProcedure
      .input(z.object({
        alertId: z.number(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await resolveCrossValidationAlert(input.alertId, 'public-user', input.note);
        return { success: true };
      }),

    saveOcrAndCheck: publicProcedure
      .input(z.object({
        stationCode: z.string(),
        province: z.string().default('ยโสธร'),
        constituency: z.string().default('2'),
        district: z.string().optional(),
        documentType: z.enum(['ss5_11', 'ss5_18', 'unknown']),
        scoringMethod: z.enum(['tally', 'numeric', 'mixed']).default('numeric'),
        provider: z.string(),
        totalVoters: z.number().optional(),
        totalBallots: z.number().optional(),
        spoiledBallots: z.number().default(0),
        votes: z.array(z.object({
          candidateNumber: z.number(),
          candidateName: z.string(),
          voteCount: z.number(),
          confidence: z.number(),
        })),
        confidence: z.number().default(0),
        imageUrl: z.string().optional(),
        imageKey: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const ocrResult = await saveOcrResult({
          stationCode: input.stationCode,
          province: input.province,
          constituency: input.constituency,
          district: input.district,
          documentType: input.documentType,
          scoringMethod: input.scoringMethod,
          provider: input.provider,
          totalVoters: input.totalVoters,
          totalBallots: input.totalBallots,
          spoiledBallots: input.spoiledBallots,
          votesData: input.votes,
          confidence: input.confidence,
          imageUrl: input.imageUrl,
          imageKey: input.imageKey,
          uploadedBy: 'public-user',
        });
        return ocrResult;
      }),
  }),
});

export type AppRouter = typeof appRouter;
