/**
 * DeepSeek OCR Module for Vote Counting Board Analysis
 * Uses DeepSeek API (OpenAI-compatible) for image analysis
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

/**
 * Analyze vote counting board image using DeepSeek Vision
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
