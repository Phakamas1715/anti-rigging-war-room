import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { analyzeWithGemini, validateOcrResult as validateGemini } from "../geminiOcr";
import { analyzeVoteCountingBoard, analyzeWithHuggingFace, validateOcrResult as validateDeepseek, base64ToDataUrl } from "../deepseekOcr";

type OcrResult = Awaited<ReturnType<typeof analyzeWithGemini>>;

function compareOcrResults(a: OcrResult, b: OcrResult) {
  const stationCodeMatch = !!(a.stationCode && b.stationCode && a.stationCode === b.stationCode);

  const totalBallotsDiff = Math.abs((a.totalBallots||0) - (b.totalBallots||0));
  const totalVotersDiff = Math.abs((a.totalVoters||0) - (b.totalVoters||0));

  const candidatesMap = new Map<number, { a?: any; b?: any }>();
  a.votes.forEach(v => candidatesMap.set(v.candidateNumber, { ...(candidatesMap.get(v.candidateNumber) || {}), a: v }));
  b.votes.forEach(v => candidatesMap.set(v.candidateNumber, { ...(candidatesMap.get(v.candidateNumber) || {}), b: v }));

  const comparisons: Array<any> = [];
  let matched = 0;
  candidatesMap.forEach((entry, num) => {
    const aVote = entry.a;
    const bVote = entry.b;
    if (aVote && bVote) {
      const diff = Math.abs((aVote.voteCount||0) - (bVote.voteCount||0));
      comparisons.push({ candidateNumber: num, a: aVote, b: bVote, diff });
      if (diff === 0) matched++;
    } else {
      comparisons.push({ candidateNumber: num, a: aVote || null, b: bVote || null, diff: null });
    }
  });

  const totalCandidates = candidatesMap.size || 1;
  const candidateMatchRate = matched / totalCandidates;

  const overallSimilarity = Math.max(0, 1 - (totalBallotsDiff / Math.max(1, (a.totalBallots || b.totalBallots || 1)))) * 0.5
    + candidateMatchRate * 0.5;

  return {
    stationCodeMatch,
    stationCodes: { a: a.stationCode, b: b.stationCode },
    totalBallotsDiff,
    totalVotersDiff,
    comparisons,
    candidateMatchRate,
    overallSimilarity
  };
}

export const ocrRouter = router({
  crossValidate: publicProcedure
    .input(z.object({
      imageA: z.string(), // base64 or data URL
      imageB: z.string(),
      prefer: z.enum(["gemini","deepseek"]).optional()
    }))
    .mutation(async ({ input }) => {
      // Try Gemini first (vision-capable LLM)
      const a = await analyzeWithGemini(input.imageA).catch(err => ({ success: false, votes: [], error: String(err) }));
      const b = await analyzeWithGemini(input.imageB).catch(err => ({ success: false, votes: [], error: String(err) }));

      // If both failed and prefer deepseek or fallback, try deepseek (Hugging Face) if configured
      if ((!a.success || !b.success) && input.prefer !== 'gemini') {
        try {
          // deepseek analyzeVoteCountingBoard expects an image URL; convert data URLs to data:<mime>;base64 form if needed
          const aUrl = base64ToDataUrl(input.imageA);
          const bUrl = base64ToDataUrl(input.imageB);

          const da = await analyzeVoteCountingBoard(aUrl, process.env.DEEPSEEK_API_KEY || '');
          const db = await analyzeVoteCountingBoard(bUrl, process.env.DEEPSEEK_API_KEY || '');
          // prefer successful deepseek results when gemini failed
          if (!a.success && da.success) Object.assign(a, da);
          if (!b.success && db.success) Object.assign(b, db);
        } catch (err) {
          // ignore, keep gemini results
        }
      }

      // Prepare result with validations
      const aValidation = a.success ? validateGemini(a) : { isValid: false, warnings: [a.error || 'Failed'] };
      const bValidation = b.success ? validateGemini(b) : { isValid: false, warnings: [b.error || 'Failed'] };

      const comparison = compareOcrResults(a as OcrResult, b as OcrResult);

      return {
        a,
        b,
        aValidation,
        bValidation,
        comparison
      };
    })
});

export default ocrRouter;
