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
  });
});
