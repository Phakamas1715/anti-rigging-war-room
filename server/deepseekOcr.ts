/**
 * DeepSeek OCR Module for Vote Counting Board Analysis
 * Supports both Hugging Face Inference API and DeepSeek API
 */

import axios from 'axios';

interface VoteCount {
  candidateName: string;
  candidateNumber: number;
  voteCount: number;
  confidence: number;
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
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const HF_INFERENCE_API_URL = 'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-OCR';

/**
 * Analyze vote counting board image using Hugging Face DeepSeek-OCR
 */
export async function analyzeWithHuggingFace(
  imageBase64: string,
  hfToken: string
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    if (!hfToken) {
      return {
        success: false,
        votes: [],
        error: 'Hugging Face API Token is required. Please configure HF_TOKEN in Settings.',
        processingTime: Date.now() - startTime
      };
    }

    // Convert base64 to buffer
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Call Hugging Face Inference API
    const response = await axios.post(
      HF_INFERENCE_API_URL,
      imageBuffer,
      {
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/octet-stream',
        },
        timeout: 120000, // 2 minutes timeout
      }
    );

    // Parse the OCR response
    const ocrText = response.data?.generated_text || 
                    response.data?.[0]?.generated_text || 
                    (typeof response.data === 'string' ? response.data : '');
    
    // Parse the raw OCR text to extract vote data
    return parseOcrText(ocrText, startTime);

  } catch (error: any) {
    console.error('[HF OCR] Error:', error.message);

    // Handle specific error cases
    if (error.response?.status === 503) {
      return {
        success: false,
        votes: [],
        error: 'Model is loading. Please try again in 20-30 seconds.',
        processingTime: Date.now() - startTime
      };
    }

    if (error.response?.status === 401) {
      return {
        success: false,
        votes: [],
        error: 'Invalid Hugging Face API Token. Please check your HF_TOKEN in Settings.',
        processingTime: Date.now() - startTime
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        votes: [],
        error: 'Invalid image format. Please use JPEG or PNG.',
        processingTime: Date.now() - startTime
      };
    }

    return {
      success: false,
      votes: [],
      error: `OCR processing failed: ${error.response?.data?.error || error.message}`,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Analyze vote counting board image using DeepSeek Vision API
 */
export async function analyzeVoteCountingBoard(
  imageUrl: string,
  apiKey: string
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านการอ่านกระดานนับคะแนนเลือกตั้งของประเทศไทย
    
งานของคุณคือวิเคราะห์รูปภาพกระดานนับคะแนนและดึงข้อมูลต่อไปนี้:
1. รหัสหน่วยเลือกตั้ง (ถ้ามี)
2. จำนวนผู้มีสิทธิเลือกตั้ง
3. จำนวนบัตรเลือกตั้งที่ใช้
4. จำนวนบัตรเสีย
5. คะแนนของผู้สมัครแต่ละคน พร้อมหมายเลขและชื่อ

ตอบกลับในรูปแบบ JSON เท่านั้น ดังนี้:
{
  "stationCode": "รหัสหน่วย หรือ null",
  "totalVoters": จำนวนผู้มีสิทธิ์,
  "totalBallots": จำนวนบัตรที่ใช้,
  "spoiledBallots": จำนวนบัตรเสีย,
  "votes": [
    {
      "candidateNumber": หมายเลขผู้สมัคร,
      "candidateName": "ชื่อผู้สมัคร/พรรค",
      "voteCount": จำนวนคะแนน,
      "confidence": ความมั่นใจ 0-100
    }
  ],
  "rawText": "ข้อความดิบที่อ่านได้จากภาพ"
}

หากอ่านตัวเลขไม่ชัด ให้ใส่ค่า confidence ต่ำ (< 70)
หากไม่พบข้อมูลใด ให้ใส่ค่า null หรือ 0`;

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'กรุณาวิเคราะห์รูปภาพกระดานนับคะแนนนี้และดึงข้อมูลคะแนนเลือกตั้ง'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 60000
      }
    );

    const content = response.data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from DeepSeek');
    }

    const parsed = JSON.parse(content);
    
    return {
      success: true,
      stationCode: parsed.stationCode || undefined,
      totalVoters: parsed.totalVoters || 0,
      totalBallots: parsed.totalBallots || 0,
      spoiledBallots: parsed.spoiledBallots || 0,
      votes: (parsed.votes || []).map((v: any) => ({
        candidateName: v.candidateName || 'Unknown',
        candidateNumber: v.candidateNumber || 0,
        voteCount: v.voteCount || 0,
        confidence: v.confidence || 50
      })),
      rawText: parsed.rawText,
      processingTime: Date.now() - startTime
    };

  } catch (error: any) {
    console.error('[DeepSeek OCR] Error:', error.message);
    
    return {
      success: false,
      votes: [],
      error: error.response?.data?.error?.message || error.message,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Parse raw OCR text and extract vote data
 */
function parseOcrText(text: string, startTime: number): OcrResult {
  try {
    // Try to parse as JSON first
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        stationCode: parsed.stationCode || parsed.station_code,
        totalVoters: parsed.totalVoters || parsed.total_voters || 0,
        totalBallots: parsed.totalBallots || parsed.total_ballots || 0,
        spoiledBallots: parsed.spoiledBallots || parsed.spoiled_ballots || 0,
        votes: (parsed.votes || []).map((v: any, i: number) => ({
          candidateName: v.candidateName || v.name || `ผู้สมัครหมายเลข ${i + 1}`,
          candidateNumber: v.candidateNumber || v.number || i + 1,
          voteCount: v.voteCount || v.count || 0,
          confidence: v.confidence || 85
        })),
        rawText: text,
        processingTime: Date.now() - startTime
      };
    }

    // If not JSON, extract data using patterns
    return extractFromRawText(text, startTime);

  } catch (error) {
    return extractFromRawText(text, startTime);
  }
}

/**
 * Extract vote data from raw text using pattern matching
 */
function extractFromRawText(text: string, startTime: number): OcrResult {
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
          voteCount: voteCount,
          confidence: 70
        });
      }
    }
  }

  // Sort by candidate number
  votes.sort((a, b) => a.candidateNumber - b.candidateNumber);

  // Extract station code
  const stationMatch = text.match(/(?:หน่วย|station|รหัส)[:\s]*([A-Z0-9\-]+)/i);
  
  // Extract voter/ballot counts
  const voterMatch = text.match(/(?:ผู้มีสิทธิ์|voters?|จำนวนผู้)[:\s]*(\d+)/i);
  const ballotMatch = text.match(/(?:บัตร|ballots?|ใช้สิทธิ์)[:\s]*(\d+)/i);
  const spoiledMatch = text.match(/(?:บัตรเสีย|spoiled|เสีย)[:\s]*(\d+)/i);

  return {
    success: votes.length > 0,
    stationCode: stationMatch ? stationMatch[1] : undefined,
    totalVoters: voterMatch ? parseInt(voterMatch[1]) : 0,
    totalBallots: ballotMatch ? parseInt(ballotMatch[1]) : 0,
    spoiledBallots: spoiledMatch ? parseInt(spoiledMatch[1]) : 0,
    votes,
    rawText: text,
    error: votes.length === 0 ? 'ไม่สามารถอ่านข้อมูลคะแนนจากภาพได้ กรุณากรอกข้อมูลด้วยตนเอง' : undefined,
    processingTime: Date.now() - startTime
  };
}

/**
 * Validate OCR results for consistency
 */
export function validateOcrResult(result: OcrResult): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!result.success) {
    return { isValid: false, warnings: ['OCR processing failed'] };
  }

  // Check if total votes match sum of individual candidates
  const totalCandidateVotes = result.votes.reduce((sum, v) => sum + v.voteCount, 0);
  const expectedTotal = (result.totalBallots || 0) - (result.spoiledBallots || 0);
  
  if (expectedTotal > 0 && Math.abs(totalCandidateVotes - expectedTotal) > 5) {
    warnings.push(`คะแนนรวม (${totalCandidateVotes}) ไม่ตรงกับบัตรที่ใช้ - บัตรเสีย (${expectedTotal})`);
  }

  // Check for low confidence results
  const lowConfidenceVotes = result.votes.filter(v => v.confidence < 70);
  if (lowConfidenceVotes.length > 0) {
    warnings.push(`พบ ${lowConfidenceVotes.length} รายการที่ความมั่นใจต่ำ กรุณาตรวจสอบ`);
  }

  // Check if votes exceed total voters
  if (result.totalVoters && totalCandidateVotes > result.totalVoters) {
    warnings.push(`คะแนนรวม (${totalCandidateVotes}) มากกว่าจำนวนผู้มีสิทธิ์ (${result.totalVoters})`);
  }

  // Check for suspiciously high turnout
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

/**
 * Convert base64 image to data URL for API
 */
export function base64ToDataUrl(base64: string, mimeType: string = 'image/jpeg'): string {
  if (base64.startsWith('data:')) {
    return base64;
  }
  return `data:${mimeType};base64,${base64}`;
}
