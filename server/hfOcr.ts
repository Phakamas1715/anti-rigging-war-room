/**
 * Hugging Face OCR Module for Vote Counting Board Analysis
 * Uses HF Inference API with vision-language models
 * 
 * Models used:
 * - Qwen2-VL-OCR-2B-Instruct (primary: multimodal OCR, supports Thai)
 * - microsoft/trocr-large-handwritten (fallback: handwriting recognition)
 * - microsoft/table-transformer-detection (table structure detection)
 * 
 * Supports Thai election document types:
 * - ส.ส.5/11: กระดานนับคะแนนแบบขีด (Tally board)
 * - ส.ส.5/18: แบบรายงานผลการนับคะแนน (Official form)
 */

import axios from 'axios';

// ============================================================
// Types
// ============================================================
interface VoteCount {
  candidateName: string;
  candidateNumber: number;
  voteCount: number;
  confidence: number;
  tallyBreakdown?: string;
}

interface OcrResult {
  success: boolean;
  stationCode?: string;
  totalVoters?: number;
  totalBallots?: number;
  spoiledBallots?: number;
  votes: VoteCount[];
  rawText?: string;
  error?: string;
  processingTime?: number;
  scoringMethod?: 'numeric' | 'tally' | 'mixed';
  documentType?: 'ss5_11' | 'ss5_18' | 'unknown';
  provider?: string;
  modelUsed?: string;
}

export type OcrMode = 'auto' | 'tally' | 'numeric' | 'ss5_11' | 'ss5_18';

// ============================================================
// HF Inference API Configuration
// ============================================================
const HF_INFERENCE_BASE = 'https://api-inference.huggingface.co/models';

// Primary model: Qwen2-VL for multimodal OCR (supports Thai, tables, handwriting)
const QWEN_VL_MODEL = 'prithivMLmods/Qwen2-VL-OCR-2B-Instruct';

// Fallback models
const TROCR_HANDWRITTEN = 'microsoft/trocr-large-handwritten';
const TABLE_TRANSFORMER = 'microsoft/table-transformer-detection';

// ============================================================
// Prompts for Qwen2-VL (chat-style)
// ============================================================
const SS5_11_PROMPT = `Analyze this Thai election tally board (ส.ส.5/11). This is a large board displayed at polling stations with tally marks (ขีดคะแนน).

Instructions:
1. Read the header: province, constituency, district, polling station number
2. For each candidate row, count tally marks carefully:
   - Each group of 5 (||||/) = 5 votes
   - Count remaining marks (1-4)
   - Provide breakdown like "5+5+5+3 = 18"
3. Read summary data at bottom: registered voters, ballots used, spoiled ballots

Return ONLY valid JSON:
{
  "documentType": "ss5_11",
  "stationCode": "station info or null",
  "province": "province name or null",
  "constituency": "constituency number or null",
  "district": "district name or null",
  "totalVoters": number or null,
  "totalBallots": number or null,
  "spoiledBallots": number or 0,
  "scoringMethod": "tally",
  "votes": [
    {
      "candidateNumber": number,
      "candidateName": "name/party",
      "voteCount": total count,
      "tallyBreakdown": "5+5+3 = 13",
      "confidence": 0-100
    }
  ],
  "rawText": "all readable text"
}`;

const SS5_18_PROMPT = `Analyze this Thai election official result form (ส.ส.5/18). This is a formal document with the Garuda emblem.

Instructions:
1. Read header: province, constituency, district, polling station, date
2. Read summary: registered voters, voters who came, ballots used, spoiled ballots, no-vote ballots
3. Read the table: candidate number, full name, vote count (Arabic numerals)
4. Verify total votes match ballots used minus spoiled

Return ONLY valid JSON:
{
  "documentType": "ss5_18",
  "stationCode": "station info or null",
  "province": "province name or null",
  "constituency": "constituency number or null",
  "district": "district name or null",
  "totalVoters": number or null,
  "totalBallots": number or null,
  "spoiledBallots": number or 0,
  "noVoteBallots": number or 0,
  "scoringMethod": "numeric",
  "votes": [
    {
      "candidateNumber": number,
      "candidateName": "full name",
      "voteCount": number,
      "confidence": 0-100
    }
  ],
  "rawText": "all readable text"
}`;

const AUTO_DETECT_PROMPT = `Analyze this Thai election document. First determine if it is:
A) ส.ส.5/11 - Tally board with tally marks (||||/) at polling station
B) ส.ส.5/18 - Official form with Garuda emblem and Arabic numerals

Then extract all vote data accordingly.

For tally marks: count groups of 5 (||||/) and remaining marks, provide breakdown.
For numeric forms: read Arabic numerals from table.

Return ONLY valid JSON:
{
  "documentType": "ss5_11" or "ss5_18" or "unknown",
  "stationCode": "station info or null",
  "province": "province or null",
  "constituency": "constituency or null",
  "district": "district or null",
  "totalVoters": number or null,
  "totalBallots": number or null,
  "spoiledBallots": number or 0,
  "scoringMethod": "tally" or "numeric" or "mixed",
  "votes": [
    {
      "candidateNumber": number,
      "candidateName": "name/party",
      "voteCount": number,
      "tallyBreakdown": "breakdown if tally marks",
      "confidence": 0-100
    }
  ],
  "rawText": "all readable text"
}`;

// ============================================================
// Main OCR Function using Qwen2-VL via HF Inference API
// ============================================================
/**
 * Analyze vote counting board image using Hugging Face Qwen2-VL model
 */
export async function analyzeWithHF(
  imageBase64: string,
  hfToken: string,
  mode: OcrMode = 'auto'
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    if (!hfToken) {
      return {
        success: false,
        votes: [],
        error: 'Hugging Face API Token is required. ตั้งค่า HF_API_TOKEN ใน Settings.',
        processingTime: Date.now() - startTime,
        provider: 'huggingface'
      };
    }

    // Clean base64
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    // Select prompt based on mode
    let prompt: string;
    switch (mode) {
      case 'tally':
      case 'ss5_11':
        prompt = SS5_11_PROMPT;
        break;
      case 'numeric':
      case 'ss5_18':
        prompt = SS5_18_PROMPT;
        break;
      default:
        prompt = AUTO_DETECT_PROMPT;
    }

    // Try Qwen2-VL first (chat completion style)
    const result = await callQwenVL(base64Data, prompt, hfToken, mode);
    if (result.success) {
      result.processingTime = Date.now() - startTime;
      result.provider = 'huggingface';
      result.modelUsed = QWEN_VL_MODEL;
      return result;
    }

    // Fallback: try TrOCR for basic text extraction
    console.log('[HF OCR] Qwen2-VL failed, trying TrOCR fallback...');
    const trOcrResult = await callTrOCR(base64Data, hfToken);
    if (trOcrResult.success) {
      trOcrResult.processingTime = Date.now() - startTime;
      trOcrResult.provider = 'huggingface';
      trOcrResult.modelUsed = TROCR_HANDWRITTEN;
      return trOcrResult;
    }

    return {
      success: false,
      votes: [],
      error: 'ทั้ง Qwen2-VL และ TrOCR ไม่สามารถอ่านภาพได้ ลองใช้ Gemini แทน',
      processingTime: Date.now() - startTime,
      provider: 'huggingface'
    };

  } catch (error: any) {
    console.error('[HF OCR] Error:', error.message);
    return {
      success: false,
      votes: [],
      error: `HF OCR error: ${error.message}`,
      processingTime: Date.now() - startTime,
      provider: 'huggingface'
    };
  }
}

// ============================================================
// Qwen2-VL Call (Image-Text-to-Text)
// ============================================================
async function callQwenVL(
  base64Data: string,
  prompt: string,
  hfToken: string,
  mode: OcrMode
): Promise<OcrResult> {
  try {
    const response = await axios.post(
      `${HF_INFERENCE_BASE}/${QWEN_VL_MODEL}`,
      {
        inputs: {
          image: base64Data,
          text: prompt
        },
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.1
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    // Extract text from response
    const rawText = extractResponseText(response.data);
    if (!rawText) {
      return { success: false, votes: [], error: 'Empty response from Qwen2-VL' };
    }

    // Parse JSON from response
    return parseHFResponse(rawText, mode);

  } catch (error: any) {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error || error.message;

    if (status === 503) {
      return { success: false, votes: [], error: 'Model กำลังโหลด กรุณารอ 20-30 วินาทีแล้วลองใหม่' };
    }
    if (status === 401) {
      return { success: false, votes: [], error: 'HF Token ไม่ถูกต้อง กรุณาตรวจสอบ HF_API_TOKEN' };
    }
    if (status === 404) {
      return { success: false, votes: [], error: `Model ${QWEN_VL_MODEL} ไม่พร้อมใช้งาน` };
    }

    console.error('[Qwen2-VL] Error:', status, errorMsg);
    return { success: false, votes: [], error: `Qwen2-VL error: ${errorMsg}` };
  }
}

// ============================================================
// TrOCR Fallback (Image-to-Text for handwriting)
// ============================================================
async function callTrOCR(
  base64Data: string,
  hfToken: string
): Promise<OcrResult> {
  try {
    const imageBuffer = Buffer.from(base64Data, 'base64');

    const response = await axios.post(
      `${HF_INFERENCE_BASE}/${TROCR_HANDWRITTEN}`,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 60000,
      }
    );

    const rawText = response.data?.[0]?.generated_text ||
                    response.data?.generated_text ||
                    (typeof response.data === 'string' ? response.data : '');

    if (!rawText) {
      return { success: false, votes: [], error: 'TrOCR returned empty text' };
    }

    // Parse raw text to extract vote data
    return parseRawOcrText(rawText);

  } catch (error: any) {
    console.error('[TrOCR] Error:', error.message);
    return { success: false, votes: [], error: `TrOCR error: ${error.message}` };
  }
}

// ============================================================
// Response Parsing Helpers
// ============================================================
function extractResponseText(data: any): string {
  if (typeof data === 'string') return data;
  if (Array.isArray(data)) {
    const textItem = data.find((d: any) => d.generated_text);
    return textItem?.generated_text || '';
  }
  if (data?.generated_text) return data.generated_text;
  if (data?.[0]?.generated_text) return data[0].generated_text;
  return JSON.stringify(data);
}

function parseHFResponse(rawText: string, mode: OcrMode): OcrResult {
  try {
    // Try to extract JSON
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      rawText.match(/(\{[\s\S]*\})/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      const scoringMethod = parsed.scoringMethod ||
        (mode === 'tally' || mode === 'ss5_11' ? 'tally' :
         mode === 'numeric' || mode === 'ss5_18' ? 'numeric' : 'mixed');

      const documentType = parsed.documentType ||
        (mode === 'tally' || mode === 'ss5_11' ? 'ss5_11' :
         mode === 'numeric' || mode === 'ss5_18' ? 'ss5_18' : 'unknown');

      return {
        success: true,
        stationCode: parsed.stationCode || undefined,
        totalVoters: parsed.totalVoters || 0,
        totalBallots: parsed.totalBallots || 0,
        spoiledBallots: parsed.spoiledBallots || 0,
        scoringMethod,
        documentType,
        votes: (parsed.votes || []).map((v: any) => ({
          candidateName: v.candidateName || 'Unknown',
          candidateNumber: v.candidateNumber || 0,
          voteCount: v.voteCount || 0,
          confidence: v.confidence || 50,
          tallyBreakdown: v.tallyBreakdown || undefined
        })),
        rawText: parsed.rawText || rawText
      };
    }

    // Fallback: parse raw text
    return parseRawOcrText(rawText);

  } catch (error) {
    return parseRawOcrText(rawText);
  }
}

function parseRawOcrText(text: string): OcrResult {
  const votes: VoteCount[] = [];

  // Thai vote patterns
  const patterns = [
    /(?:หมายเลข|เบอร์)\s*(\d+)[:\s]+(\d+)\s*(?:คะแนน|เสียง)?/gi,
    /(\d+)\s*[:=]\s*(\d+)\s*(?:คะแนน|เสียง|votes?)?/gi,
    /(?:ผู้สมัคร|candidate)\s*(\d+)[:\s]+(\d+)/gi,
    /No\.?\s*(\d+)[:\s]+(\d+)/gi
  ];

  const seenCandidates = new Set<number>();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const candidateNum = parseInt(match[1]);
      const voteCount = parseInt(match[2]);

      if (!seenCandidates.has(candidateNum) && candidateNum > 0 && candidateNum < 100) {
        seenCandidates.add(candidateNum);
        votes.push({
          candidateName: `ผู้สมัครหมายเลข ${candidateNum}`,
          candidateNumber: candidateNum,
          voteCount,
          confidence: 60
        });
      }
    }
  }

  votes.sort((a, b) => a.candidateNumber - b.candidateNumber);

  const stationMatch = text.match(/(?:หน่วย|station|รหัส)[:\s]*([A-Z0-9\-]+)/i);
  const voterMatch = text.match(/(?:ผู้มีสิทธิ์|voters?)[:\s]*(\d+)/i);
  const ballotMatch = text.match(/(?:บัตร|ballots?|ใช้สิทธิ์)[:\s]*(\d+)/i);
  const spoiledMatch = text.match(/(?:บัตรเสีย|spoiled)[:\s]*(\d+)/i);

  return {
    success: votes.length > 0,
    stationCode: stationMatch ? stationMatch[1] : undefined,
    totalVoters: voterMatch ? parseInt(voterMatch[1]) : 0,
    totalBallots: ballotMatch ? parseInt(ballotMatch[1]) : 0,
    spoiledBallots: spoiledMatch ? parseInt(spoiledMatch[1]) : 0,
    votes,
    rawText: text,
    scoringMethod: 'mixed',
    documentType: 'unknown',
    error: votes.length === 0 ? 'ไม่สามารถอ่านข้อมูลคะแนนจากภาพได้' : undefined
  };
}

// ============================================================
// Cross-validation: Compare ส.ส.5/11 with ส.ส.5/18
// ============================================================
export interface CrossValidationResult {
  isMatch: boolean;
  overallConfidence: number;
  stationMatch: boolean;
  totalVotesMatch: boolean;
  candidateMatches: {
    candidateNumber: number;
    candidateName: string;
    ss5_11_votes: number;
    ss5_18_votes: number;
    difference: number;
    isMatch: boolean;
  }[];
  discrepancies: string[];
  summary: string;
}

/**
 * Cross-validate results from ส.ส.5/11 (tally) and ส.ส.5/18 (form)
 * from the same polling station
 */
export function crossValidate(
  tallyResult: OcrResult,
  formResult: OcrResult,
  tolerance: number = 2
): CrossValidationResult {
  const discrepancies: string[] = [];

  // Check station code match
  const stationMatch = !!(
    tallyResult.stationCode &&
    formResult.stationCode &&
    tallyResult.stationCode === formResult.stationCode
  );

  if (!stationMatch && tallyResult.stationCode && formResult.stationCode) {
    discrepancies.push(
      `รหัสหน่วยไม่ตรงกัน: ส.ส.5/11="${tallyResult.stationCode}" vs ส.ส.5/18="${formResult.stationCode}"`
    );
  }

  // Compare total ballots
  const totalVotesMatch = Math.abs(
    (tallyResult.totalBallots || 0) - (formResult.totalBallots || 0)
  ) <= tolerance;

  if (!totalVotesMatch) {
    discrepancies.push(
      `จำนวนบัตรไม่ตรงกัน: ส.ส.5/11=${tallyResult.totalBallots} vs ส.ส.5/18=${formResult.totalBallots}`
    );
  }

  // Compare spoiled ballots
  if (Math.abs((tallyResult.spoiledBallots || 0) - (formResult.spoiledBallots || 0)) > tolerance) {
    discrepancies.push(
      `บัตรเสียไม่ตรงกัน: ส.ส.5/11=${tallyResult.spoiledBallots} vs ส.ส.5/18=${formResult.spoiledBallots}`
    );
  }

  // Compare individual candidate votes
  const candidateMatches: CrossValidationResult['candidateMatches'] = [];
  const allCandidateNumbers = new Set<number>();

  tallyResult.votes.forEach(v => allCandidateNumbers.add(v.candidateNumber));
  formResult.votes.forEach(v => allCandidateNumbers.add(v.candidateNumber));

  for (const num of Array.from(allCandidateNumbers).sort((a, b) => a - b)) {
    const tallyVote = tallyResult.votes.find(v => v.candidateNumber === num);
    const formVote = formResult.votes.find(v => v.candidateNumber === num);

    const ss5_11_votes = tallyVote?.voteCount || 0;
    const ss5_18_votes = formVote?.voteCount || 0;
    const difference = Math.abs(ss5_11_votes - ss5_18_votes);
    const isMatch = difference <= tolerance;

    candidateMatches.push({
      candidateNumber: num,
      candidateName: tallyVote?.candidateName || formVote?.candidateName || `หมายเลข ${num}`,
      ss5_11_votes,
      ss5_18_votes,
      difference,
      isMatch
    });

    if (!isMatch) {
      discrepancies.push(
        `หมายเลข ${num} (${tallyVote?.candidateName || formVote?.candidateName}): ` +
        `ส.ส.5/11=${ss5_11_votes} vs ส.ส.5/18=${ss5_18_votes} (ต่างกัน ${difference})`
      );
    }
  }

  // Missing candidates
  if (tallyResult.votes.length !== formResult.votes.length) {
    discrepancies.push(
      `จำนวนผู้สมัครไม่ตรงกัน: ส.ส.5/11=${tallyResult.votes.length} คน vs ส.ส.5/18=${formResult.votes.length} คน`
    );
  }

  const matchingCandidates = candidateMatches.filter(c => c.isMatch).length;
  const totalCandidates = candidateMatches.length;
  const overallConfidence = totalCandidates > 0
    ? Math.round((matchingCandidates / totalCandidates) * 100)
    : 0;

  const isMatch = discrepancies.length === 0 && overallConfidence >= 80;

  // Generate summary
  let summary: string;
  if (isMatch) {
    summary = `✅ ผลตรงกัน: คะแนนจาก ส.ส.5/11 และ ส.ส.5/18 ตรงกันทุกรายการ (${matchingCandidates}/${totalCandidates} ผู้สมัคร)`;
  } else if (overallConfidence >= 60) {
    summary = `⚠️ พบความแตกต่างเล็กน้อย: ตรงกัน ${matchingCandidates}/${totalCandidates} ผู้สมัคร (${discrepancies.length} รายการไม่ตรง)`;
  } else {
    summary = `🚨 พบความแตกต่างมาก: ตรงกันเพียง ${matchingCandidates}/${totalCandidates} ผู้สมัคร — ต้องตรวจสอบด่วน`;
  }

  return {
    isMatch,
    overallConfidence,
    stationMatch,
    totalVotesMatch,
    candidateMatches,
    discrepancies,
    summary
  };
}

/**
 * Validate OCR results for consistency (same as geminiOcr)
 */
export function validateHFOcrResult(result: OcrResult): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!result.success) {
    return { isValid: false, warnings: ['OCR processing failed'] };
  }

  const totalCandidateVotes = result.votes.reduce((sum, v) => sum + v.voteCount, 0);
  const expectedTotal = (result.totalBallots || 0) - (result.spoiledBallots || 0);

  if (expectedTotal > 0 && Math.abs(totalCandidateVotes - expectedTotal) > 5) {
    warnings.push(`คะแนนรวม (${totalCandidateVotes}) ไม่ตรงกับบัตรที่ใช้ - บัตรเสีย (${expectedTotal})`);
  }

  const lowConfidenceVotes = result.votes.filter(v => v.confidence < 70);
  if (lowConfidenceVotes.length > 0) {
    warnings.push(`พบ ${lowConfidenceVotes.length} รายการที่ความมั่นใจต่ำ กรุณาตรวจสอบ`);
  }

  if (result.totalVoters && totalCandidateVotes > result.totalVoters) {
    warnings.push(`คะแนนรวม (${totalCandidateVotes}) มากกว่าจำนวนผู้มีสิทธิ์ (${result.totalVoters})`);
  }

  if (result.totalVoters && result.totalBallots) {
    const turnout = result.totalBallots / result.totalVoters;
    if (turnout > 0.95) {
      warnings.push(`อัตราผู้มาใช้สิทธิ์สูงผิดปกติ (${(turnout * 100).toFixed(1)}%)`);
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}
