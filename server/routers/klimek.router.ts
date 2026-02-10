import { protectedProcedure, router } from "../_core/trpc";
import { getElectionDataForAnalysis } from "../db";
import { calculateKlimekAnalysis } from "../services/klimek.service";

export const klimekRouter = router({
  analyze: protectedProcedure.query(async () => {
    const rawData = await getElectionDataForAnalysis();
    
    if (!rawData || rawData.length === 0) {
      return {
        alpha: 0,
        beta: 0,
        correlation: 0,
        fraudZoneCount: 0,
        totalUnits: 0,
        heatmap: [],
        suspicious: false,
      };
    }
    
    // Transform to VoteData format
    const data = rawData.map(d => ({
      turnout: parseFloat(d.turnout || "0"),
      voteShare: parseFloat(d.candidateAShare || "0"),
    }));
    
    return calculateKlimekAnalysis(data);
  }),
});
