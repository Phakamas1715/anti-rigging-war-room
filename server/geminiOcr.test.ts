import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the LLM module
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn()
}));

import { analyzeWithGemini, validateOcrResult } from './geminiOcr';
import { invokeLLM } from './_core/llm';

describe('Gemini OCR Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeWithGemini', () => {
    it('should successfully analyze an image and return structured data', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              stationCode: 'TEST-001',
              totalVoters: 500,
              totalBallots: 450,
              spoiledBallots: 5,
              votes: [
                { candidateNumber: 1, candidateName: 'ผู้สมัคร 1', voteCount: 200, confidence: 95 },
                { candidateNumber: 2, candidateName: 'ผู้สมัคร 2', voteCount: 150, confidence: 90 },
                { candidateNumber: 3, candidateName: 'ผู้สมัคร 3', voteCount: 95, confidence: 85 }
              ],
              rawText: 'Test raw text'
            })
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('data:image/jpeg;base64,/9j/4AAQSkZJRg==');

      expect(result.success).toBe(true);
      expect(result.stationCode).toBe('TEST-001');
      expect(result.totalVoters).toBe(500);
      expect(result.totalBallots).toBe(450);
      expect(result.spoiledBallots).toBe(5);
      expect(result.votes).toHaveLength(3);
      expect(result.votes[0].voteCount).toBe(200);
    });

    it('should handle JSON in markdown code blocks', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '```json\n{"stationCode": "MD-001", "totalVoters": 100, "totalBallots": 80, "spoiledBallots": 2, "votes": [{"candidateNumber": 1, "candidateName": "Test", "voteCount": 78, "confidence": 90}], "rawText": "test"}\n```'
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('base64imagedata');

      expect(result.success).toBe(true);
      expect(result.stationCode).toBe('MD-001');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error('API Error'));

      const result = await analyzeWithGemini('base64imagedata');

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
      expect(result.votes).toEqual([]);
    });

    it('should handle empty response content', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: ''
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('base64imagedata');

      expect(result.success).toBe(false);
    });
  });

  describe('validateOcrResult', () => {
    it('should return valid for correct data', () => {
      const result = {
        success: true,
        stationCode: 'TEST-001',
        totalVoters: 500,
        totalBallots: 450,
        spoiledBallots: 5,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 200, confidence: 95 },
          { candidateName: 'B', candidateNumber: 2, voteCount: 150, confidence: 90 },
          { candidateName: 'C', candidateNumber: 3, voteCount: 95, confidence: 85 }
        ]
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toHaveLength(0);
    });

    it('should warn when vote sum does not match total ballots', () => {
      const result = {
        success: true,
        totalVoters: 500,
        totalBallots: 450,
        spoiledBallots: 5,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 100, confidence: 95 },
          { candidateName: 'B', candidateNumber: 2, voteCount: 100, confidence: 90 }
        ]
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(w => w.includes('คะแนนรวม'))).toBe(true);
    });

    it('should warn when votes exceed total voters', () => {
      const result = {
        success: true,
        totalVoters: 100,
        totalBallots: 150,
        spoiledBallots: 0,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 150, confidence: 95 }
        ]
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(w => w.includes('มากกว่าจำนวนผู้มีสิทธิ์'))).toBe(true);
    });

    it('should warn for low confidence results', () => {
      const result = {
        success: true,
        totalVoters: 500,
        totalBallots: 450,
        spoiledBallots: 5,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 445, confidence: 50 }
        ]
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(w => w.includes('ความมั่นใจต่ำ'))).toBe(true);
    });

    it('should warn for suspiciously high turnout', () => {
      const result = {
        success: true,
        totalVoters: 100,
        totalBallots: 99,
        spoiledBallots: 0,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 99, confidence: 95 }
        ]
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings.some(w => w.includes('อัตราผู้มาใช้สิทธิ์สูงผิดปกติ'))).toBe(true);
    });

    it('should return invalid for failed OCR', () => {
      const result = {
        success: false,
        votes: [],
        error: 'OCR failed'
      };

      const validation = validateOcrResult(result);

      expect(validation.isValid).toBe(false);
      expect(validation.warnings).toContain('OCR processing failed');
    });

    it('should warn on suspiciously round tally numbers for ss5_11', () => {
      const result = {
        success: true,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 100, confidence: 90 },
          { candidateName: 'B', candidateNumber: 2, voteCount: 200, confidence: 90 },
          { candidateName: 'C', candidateNumber: 3, voteCount: 150, confidence: 90 },
        ],
        scoringMethod: 'tally' as const,
        documentType: 'ss5_11' as const,
      };

      const validation = validateOcrResult(result);
      expect(validation.warnings.some(w => w.includes('จำนวนกลม'))).toBe(true);
    });

    it('should not warn on non-round tally numbers for ss5_11', () => {
      const result = {
        success: true,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 23, confidence: 90 },
          { candidateName: 'B', candidateNumber: 2, voteCount: 17, confidence: 90 },
          { candidateName: 'C', candidateNumber: 3, voteCount: 42, confidence: 90 },
        ],
        scoringMethod: 'tally' as const,
        documentType: 'ss5_11' as const,
      };

      const validation = validateOcrResult(result);
      expect(validation.warnings.some(w => w.includes('จำนวนกลม'))).toBe(false);
    });

    it('should accept small discrepancy (<=5) between total and sum', () => {
      const result = {
        success: true,
        totalBallots: 400,
        spoiledBallots: 10,
        votes: [
          { candidateName: 'A', candidateNumber: 1, voteCount: 200, confidence: 95 },
          { candidateName: 'B', candidateNumber: 2, voteCount: 187, confidence: 90 },
        ],
        scoringMethod: 'numeric' as const,
      };
      // 200+187=387, expected=400-10=390, diff=3 which is <=5
      const validation = validateOcrResult(result);
      expect(validation.warnings.some(w => w.includes('คะแนนรวม'))).toBe(false);
    });
  });

  describe('analyzeWithGemini - OCR modes', () => {
    it('should use ss5_11 prompt for tally mode', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              documentType: 'ss5_11',
              stationCode: 'YST-001',
              scoringMethod: 'tally',
              votes: [
                { candidateNumber: 1, candidateName: 'พรรคเพื่อไทย', voteCount: 23, tallyBreakdown: '5+5+5+5+3 = 23', confidence: 85 },
                { candidateNumber: 2, candidateName: 'พรรคเพื่อไทย', voteCount: 18, tallyBreakdown: '5+5+5+3 = 18', confidence: 80 },
              ],
              rawText: 'Test tally board'
            })
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('base64data', 'ss5_11');

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('ss5_11');
      expect(result.scoringMethod).toBe('tally');
      expect(result.votes[0].tallyBreakdown).toBe('5+5+5+5+3 = 23');
    });

    it('should use ss5_18 prompt for numeric mode', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              documentType: 'ss5_18',
              stationCode: 'YST-002',
              province: 'ยโสธร',
              constituency: '2',
              totalVoters: 500,
              totalBallots: 400,
              spoiledBallots: 5,
              noVoteBallots: 3,
              scoringMethod: 'numeric',
              votes: [
                { candidateNumber: 1, candidateName: 'บุญแก้ว สมเพชร', voteCount: 200, confidence: 95 },
                { candidateNumber: 2, candidateName: 'วรายุทธ บุญโสภณ', voteCount: 150, confidence: 92 },
              ],
              rawText: 'Test form'
            })
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('base64data', 'ss5_18');

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('ss5_18');
      expect(result.scoringMethod).toBe('numeric');
      expect(result.votes[0].candidateName).toBe('บุญแก้ว สมเพชร');
    });

    it('should use auto-detect prompt by default', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              documentType: 'ss5_11',
              scoringMethod: 'tally',
              votes: [{ candidateNumber: 1, candidateName: 'Test', voteCount: 50, confidence: 80 }],
              rawText: 'Auto detected'
            })
          }
        }]
      };

      vi.mocked(invokeLLM).mockResolvedValue(mockResponse as any);

      const result = await analyzeWithGemini('base64data');

      expect(result.success).toBe(true);
      expect(result.documentType).toBe('ss5_11');
    });
  });
});
