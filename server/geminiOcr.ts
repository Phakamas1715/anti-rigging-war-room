/**
 * Gemini Vision OCR Module for Vote Counting Board Analysis
 * Uses the built-in Gemini API via invokeLLM helper
 */

import { invokeLLM } from './_core/llm';

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

/**
 * Analyze vote counting board image using Gemini Vision API
 */
export async function analyzeWithGemini(
  imageBase64: string
): Promise<OcrResult> {
  const startTime = Date.now();

  try {
    // Clean base64 string
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    
    // Detect mime type from base64 header or default to jpeg
    let mimeType = 'image/jpeg';
    if (imageBase64.startsWith('data:image/png')) {
      mimeType = 'image/png';
    } else if (imageBase64.startsWith('data:image/webp')) {
      mimeType = 'image/webp';
    }

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

    const response = await invokeLLM({
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
              text: 'กรุณาวิเคราะห์รูปภาพกระดานนับคะแนนนี้และดึงข้อมูลคะแนนเลือกตั้ง ตอบเป็น JSON เท่านั้น'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Data}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from Gemini');
    }

    // Extract JSON from response (handle string or array content)
    let jsonContent = '';
    if (typeof content === 'string') {
      jsonContent = content;
    } else if (Array.isArray(content)) {
      const textPart = content.find(p => p.type === 'text');
      if (textPart && 'text' in textPart) {
        jsonContent = textPart.text;
      }
    }

    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                      jsonContent.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      jsonContent = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonContent);
    
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
    console.error('[Gemini OCR] Error:', error.message);
    
    return {
      success: false,
      votes: [],
      error: error.message || 'Gemini OCR processing failed',
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Validate OCR results for consistency (same as deepseekOcr)
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
