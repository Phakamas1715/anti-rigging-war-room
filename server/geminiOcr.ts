/**
 * Gemini Vision OCR Module for Vote Counting Board Analysis
 * Uses the built-in Gemini API via invokeLLM helper
 * 
 * Supports Thai election document types:
 * - ส.ส.5/11: กระดานนับคะแนนแบบขีด (Tally board at polling station)
 * - ส.ส.5/18: แบบรายงานผลการนับคะแนน (Official result report form)
 * - Auto: ตรวจจับอัตโนมัติ
 */

import { invokeLLM } from './_core/llm';

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
}

// ============================================================
// PROMPT: ส.ส.5/11 - กระดานนับคะแนนแบบขีด (Tally Board)
// ============================================================
const SS5_11_TALLY_PROMPT = `คุณคือผู้เชี่ยวชาญด้านการอ่านกระดานนับคะแนนเลือกตั้ง สส. ของประเทศไทย
เอกสารนี้คือ "แบบ ส.ส.5/11" หรือ "ส.ส.5/11 (บช)" - กระดานนับคะแนนที่ตั้งหน้าหน่วยเลือกตั้ง

ลักษณะของ ส.ส.5/11:
- เป็นกระดานขนาดใหญ่ (กระดาษแผ่นใหญ่) ตั้งแสดงหน้าหน่วยเลือกตั้ง
- ด้านบนมีข้อมูล: จังหวัด, เขตเลือกตั้ง, อำเภอ/ตำบล, หน่วยเลือกตั้งที่
- มีตารางแบ่งเป็นแถว แต่ละแถวคือผู้สมัคร 1 คน
- ด้านซ้ายมีหมายเลขผู้สมัคร (1, 2, 3, ...) และชื่อพรรค/ผู้สมัคร
- คะแนนแสดงเป็น "ขีดคะแนน" (Tally marks):
  * ขีดแนวตั้ง 4 ขีด แล้วขีดทับเฉียง 1 ขีด = 1 ชุด = 5 คะแนน
  * เขียนเป็น ||||/ หรือ 正 
  * ขีดที่ไม่ครบชุด (1-4 ขีด) นับตามจำนวนจริง
  * ตัวอย่าง: ||||/ ||||/ ||||/ ||| = 3 ชุด + 3 ขีด = 15+3 = 18 คะแนน

วิธีนับขีดคะแนนอย่างถูกต้อง:
1. ดูแต่ละแถว (ผู้สมัครแต่ละคน) ทีละแถว
2. นับจำนวน "ชุดที่ครบ 5" (มีขีดทับเฉียง) → คูณ 5
3. นับขีดที่เหลือ (ไม่ครบชุด) → บวกเพิ่ม
4. รวมเป็นคะแนนทั้งหมดของผู้สมัครคนนั้น
5. ทำซ้ำทุกแถว

สำคัญมาก:
- นับขีดคะแนนอย่างละเอียดทีละชุด อย่ารีบนับ
- ถ้าขีดไม่ชัดหรือภาพเบลอ ให้ใส่ confidence ต่ำ (< 70)
- ระบุ tallyBreakdown เช่น "5+5+5+3 = 18" สำหรับทุกผู้สมัคร
- ด้านล่างกระดานอาจมีข้อมูลสรุป: จำนวนผู้มีสิทธิ์, บัตรที่ใช้, บัตรเสีย

ตอบกลับในรูปแบบ JSON เท่านั้น:
{
  "documentType": "ss5_11",
  "stationCode": "รหัสหน่วย เช่น หน่วยที่ 5 อำเภอคำเขื่อนแก้ว",
  "province": "จังหวัด (ถ้าอ่านได้)",
  "constituency": "เขตเลือกตั้งที่ (ถ้าอ่านได้)",
  "district": "อำเภอ/ตำบล (ถ้าอ่านได้)",
  "totalVoters": จำนวนผู้มีสิทธิ์ หรือ null,
  "totalBallots": จำนวนบัตรที่ใช้ หรือ null,
  "spoiledBallots": จำนวนบัตรเสีย หรือ 0,
  "scoringMethod": "tally",
  "votes": [
    {
      "candidateNumber": หมายเลขผู้สมัคร,
      "candidateName": "ชื่อผู้สมัคร/พรรค (ถ้าอ่านได้)",
      "voteCount": จำนวนคะแนนที่นับได้,
      "tallyBreakdown": "เช่น 5+5+5+3 = 18",
      "confidence": ความมั่นใจ 0-100
    }
  ],
  "rawText": "รายละเอียดทั้งหมดที่อ่านได้จากภาพ"
}`;

// ============================================================
// PROMPT: ส.ส.5/18 - แบบรายงานผลการนับคะแนน (Official Form)
// ============================================================
const SS5_18_FORM_PROMPT = `คุณคือผู้เชี่ยวชาญด้านการอ่านเอกสารผลการเลือกตั้ง สส. ของประเทศไทย
เอกสารนี้คือ "แบบ ส.ส.5/18" หรือ "ส.ส.5/18 (บช)" - แบบรายงานผลการนับคะแนนอย่างเป็นทางการ

ลักษณะของ ส.ส.5/18:
- เป็นเอกสารทางการ มีตราครุฑด้านบน
- มีหัวข้อ "รายงานผลการนับคะแนนเลือกตั้ง" หรือคล้ายกัน
- ส่วนบนมีข้อมูล: จังหวัด, เขตเลือกตั้ง, อำเภอ/ตำบล, หน่วยเลือกตั้ง, วันที่
- มีข้อมูลสรุป:
  * จำนวนผู้มีสิทธิเลือกตั้ง
  * จำนวนผู้มาใช้สิทธิ
  * จำนวนบัตรเลือกตั้งที่ได้รับมา
  * จำนวนบัตรที่ใช้ลงคะแนน
  * จำนวนบัตรเสีย
  * จำนวนบัตรไม่ประสงค์ลงคะแนน
- มีตาราง: หมายเลขผู้สมัคร | ชื่อผู้สมัคร (ชื่อ-สกุล) | คะแนนที่ได้ (ตัวเลข)
- คะแนนเขียนเป็นตัวเลขอารบิก (ไม่ใช่ขีดคะแนน)
- อาจมีลายเซ็นกรรมการประจำหน่วย

วิธีอ่าน:
1. อ่านข้อมูลหัวเอกสาร (จังหวัด, เขต, หน่วย)
2. อ่านข้อมูลสรุป (ผู้มีสิทธิ์, บัตรที่ใช้, บัตรเสีย)
3. อ่านตารางคะแนน (หมายเลข, ชื่อ, คะแนน)
4. ตรวจสอบว่าคะแนนรวมตรงกับจำนวนบัตร

สำคัญมาก:
- อ่านตัวเลขอย่างระมัดระวัง (0 กับ 6, 1 กับ 7 อาจคล้ายกัน)
- ถ้าลายมืออ่านไม่ชัด ให้ใส่ confidence ต่ำ
- อ่านชื่อ-สกุลผู้สมัครให้ครบถ้วน

ตอบกลับในรูปแบบ JSON เท่านั้น:
{
  "documentType": "ss5_18",
  "stationCode": "รหัสหน่วย/หมายเลขหน่วย",
  "province": "จังหวัด (ถ้าอ่านได้)",
  "constituency": "เขตเลือกตั้งที่ (ถ้าอ่านได้)",
  "district": "อำเภอ/ตำบล (ถ้าอ่านได้)",
  "totalVoters": จำนวนผู้มีสิทธิ์,
  "totalBallots": จำนวนบัตรที่ใช้,
  "spoiledBallots": จำนวนบัตรเสีย,
  "noVoteBallots": จำนวนบัตรไม่ประสงค์ลงคะแนน หรือ 0,
  "scoringMethod": "numeric",
  "votes": [
    {
      "candidateNumber": หมายเลขผู้สมัคร,
      "candidateName": "ชื่อ-สกุล ผู้สมัคร",
      "voteCount": จำนวนคะแนน,
      "confidence": ความมั่นใจ 0-100
    }
  ],
  "rawText": "ข้อความทั้งหมดที่อ่านได้จากเอกสาร"
}`;

// ============================================================
// PROMPT: Auto-detect (ตรวจจับอัตโนมัติ)
// ============================================================
const AUTO_DETECT_PROMPT = `คุณคือผู้เชี่ยวชาญด้านการอ่านเอกสารผลการเลือกตั้ง สส. ของประเทศไทย

ก่อนอื่น ให้ตรวจสอบว่าภาพนี้เป็นเอกสารประเภทใด:

A) "ส.ส.5/11" - กระดานนับคะแนน (Tally Board)
   - กระดานขนาดใหญ่ตั้งหน้าหน่วยเลือกตั้ง
   - คะแนนเป็นขีด (tally marks): ||||/ = 5 คะแนน
   - มีหมายเลขผู้สมัครและชื่อพรรคด้านซ้าย

B) "ส.ส.5/18" - แบบรายงานผลการนับคะแนน
   - เอกสารทางการ มีตราครุฑ
   - คะแนนเป็นตัวเลขอารบิกในตาราง
   - มีข้อมูลสรุปครบถ้วน (ผู้มีสิทธิ์, บัตรที่ใช้, บัตรเสีย)

C) เอกสารอื่น / ไม่แน่ใจ

ถ้าเป็น ส.ส.5/11 (ขีดคะแนน):
- นับจำนวนชุดที่ครบ 5 (มีขีดทับ) × 5
- บวกขีดที่เหลือ (ไม่ครบชุด)
- ระบุ tallyBreakdown เช่น "5+5+5+3 = 18"

ถ้าเป็น ส.ส.5/18 (ตาราง):
- อ่านตัวเลขจากตาราง
- อ่านชื่อ-สกุลผู้สมัคร
- อ่านข้อมูลสรุป (ผู้มีสิทธิ์, บัตรที่ใช้, บัตรเสีย)

ตอบกลับในรูปแบบ JSON เท่านั้น:
{
  "documentType": "ss5_11" หรือ "ss5_18" หรือ "unknown",
  "stationCode": "รหัสหน่วย หรือ null",
  "province": "จังหวัด หรือ null",
  "constituency": "เขตเลือกตั้งที่ หรือ null",
  "district": "อำเภอ/ตำบล หรือ null",
  "totalVoters": จำนวนผู้มีสิทธิ์ หรือ null,
  "totalBallots": จำนวนบัตรที่ใช้ หรือ null,
  "spoiledBallots": จำนวนบัตรเสีย หรือ 0,
  "noVoteBallots": จำนวนบัตรไม่ประสงค์ลงคะแนน หรือ 0,
  "scoringMethod": "tally" หรือ "numeric" หรือ "mixed",
  "votes": [
    {
      "candidateNumber": หมายเลขผู้สมัคร,
      "candidateName": "ชื่อผู้สมัคร/พรรค",
      "voteCount": จำนวนคะแนน,
      "tallyBreakdown": "วิธีนับ เช่น 5+5+3 = 13 (เฉพาะขีดคะแนน)",
      "confidence": ความมั่นใจ 0-100
    }
  ],
  "rawText": "รายละเอียดที่อ่านได้จากภาพ"
}

หากอ่านตัวเลขหรือขีดไม่ชัด ให้ใส่ค่า confidence ต่ำ (< 70)`;

export type OcrMode = 'auto' | 'tally' | 'numeric' | 'ss5_11' | 'ss5_18';

/**
 * Analyze vote counting board image using Gemini Vision API
 * @param imageBase64 - Base64 encoded image
 * @param mode - OCR mode: 'auto', 'tally'/'ss5_11' (tally marks), 'numeric'/'ss5_18' (form)
 */
export async function analyzeWithGemini(
  imageBase64: string,
  mode: OcrMode = 'auto'
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

    // Select prompt based on mode
    let systemPrompt: string;
    let userMessage: string;
    
    switch (mode) {
      case 'tally':
      case 'ss5_11':
        systemPrompt = SS5_11_TALLY_PROMPT;
        userMessage = 'กรุณาวิเคราะห์รูปภาพกระดานนับคะแนน ส.ส.5/11 นี้ โดยนับจากขีดคะแนน (tally marks) อย่างละเอียดทีละชุด ตอบเป็น JSON เท่านั้น';
        break;
      case 'numeric':
      case 'ss5_18':
        systemPrompt = SS5_18_FORM_PROMPT;
        userMessage = 'กรุณาวิเคราะห์แบบรายงานผลการนับคะแนน ส.ส.5/18 นี้ อ่านตัวเลขจากตารางอย่างระมัดระวัง ตอบเป็น JSON เท่านั้น';
        break;
      case 'auto':
      default:
        systemPrompt = AUTO_DETECT_PROMPT;
        userMessage = 'กรุณาวิเคราะห์เอกสารผลการเลือกตั้งนี้ ตรวจสอบว่าเป็น ส.ส.5/11 (ขีดคะแนน) หรือ ส.ส.5/18 (ตาราง) แล้วดึงข้อมูลคะแนน ตอบเป็น JSON เท่านั้น';
        break;
    }

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
              text: userMessage
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
    
    // Map scoring method
    const scoringMethod = parsed.scoringMethod || 
      (mode === 'tally' || mode === 'ss5_11' ? 'tally' : 
       mode === 'numeric' || mode === 'ss5_18' ? 'numeric' : 'mixed');

    // Map document type
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

  // Tally-specific validation (ส.ส.5/11)
  if (result.scoringMethod === 'tally' || result.documentType === 'ss5_11') {
    const roundVotes = result.votes.filter(v => v.voteCount > 0 && v.voteCount % 10 === 0);
    if (roundVotes.length > result.votes.length / 2) {
      warnings.push('พบคะแนนเป็นจำนวนกลมหลายรายการ อาจนับขีดคะแนนไม่ถูกต้อง');
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  };
}
