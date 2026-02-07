import { describe, it, expect, vi } from 'vitest';
import { crossValidate, type CrossValidationResult } from './hfOcr';

// ============================================================
// Cross-validation Tests (ส.ส.5/11 vs ส.ส.5/18)
// ============================================================
describe('Cross-validation: ส.ส.5/11 vs ส.ส.5/18', () => {
  // Ground truth for Yasothon Zone 2, Unit 5
  const yasothonUnit5Tally = {
    success: true as const,
    stationCode: 'หน่วยที่ 5 อำเภอคำเขื่อนแก้ว',
    totalVoters: 520,
    totalBallots: 490,
    spoiledBallots: 12,
    votes: [
      { candidateName: 'นายบุญแก้ว สมวงศ์', candidateNumber: 1, voteCount: 187, confidence: 95, tallyBreakdown: '5×37+2 = 187' },
      { candidateName: 'นายวรายุทธ ทองสะอาด', candidateNumber: 2, voteCount: 42, confidence: 90, tallyBreakdown: '5×8+2 = 42' },
      { candidateName: 'นายสุทัศน์ เรืองศรี', candidateNumber: 3, voteCount: 156, confidence: 95, tallyBreakdown: '5×31+1 = 156' },
      { candidateName: 'นายประสิทธิ์ ศรีสวัสดิ์', candidateNumber: 4, voteCount: 23, confidence: 85, tallyBreakdown: '5×4+3 = 23' },
      { candidateName: 'นายธนกร วงศ์ใหญ่', candidateNumber: 5, voteCount: 8, confidence: 90, tallyBreakdown: '5+3 = 8' },
      { candidateName: 'นายสมชาย ดีเลิศ', candidateNumber: 6, voteCount: 15, confidence: 85, tallyBreakdown: '5×3 = 15' },
      { candidateName: 'นางสาวพิมพ์ใจ ศรีสุข', candidateNumber: 7, voteCount: 31, confidence: 90, tallyBreakdown: '5×6+1 = 31' },
      { candidateName: 'นายอนุชา ทองดี', candidateNumber: 8, voteCount: 5, confidence: 90, tallyBreakdown: '5 = 5' },
      { candidateName: 'นายวิชัย ประเสริฐ', candidateNumber: 9, voteCount: 3, confidence: 85, tallyBreakdown: '3' },
    ],
    scoringMethod: 'tally' as const,
    documentType: 'ss5_11' as const,
  };

  const yasothonUnit5Form = {
    success: true as const,
    stationCode: 'หน่วยที่ 5 อำเภอคำเขื่อนแก้ว',
    totalVoters: 520,
    totalBallots: 490,
    spoiledBallots: 12,
    votes: [
      { candidateName: 'นายบุญแก้ว สมวงศ์', candidateNumber: 1, voteCount: 187, confidence: 98 },
      { candidateName: 'นายสุทัศน์ เรืองศรี', candidateNumber: 2, voteCount: 156, confidence: 98 },
      { candidateName: 'นายวรายุทธ ทองสะอาด', candidateNumber: 3, voteCount: 42, confidence: 95 },
      { candidateName: 'นางสาวพิมพ์ใจ ศรีสุข', candidateNumber: 4, voteCount: 31, confidence: 95 },
      { candidateName: 'นายประสิทธิ์ ศรีสวัสดิ์', candidateNumber: 5, voteCount: 23, confidence: 95 },
      { candidateName: 'นายสมชาย ดีเลิศ', candidateNumber: 6, voteCount: 15, confidence: 95 },
      { candidateName: 'นายธนกร วงศ์ใหญ่', candidateNumber: 7, voteCount: 8, confidence: 95 },
      { candidateName: 'นายอนุชา ทองดี', candidateNumber: 8, voteCount: 5, confidence: 95 },
      { candidateName: 'นายวิชัย ประเสริฐ', candidateNumber: 9, voteCount: 3, confidence: 95 },
    ],
    scoringMethod: 'numeric' as const,
    documentType: 'ss5_18' as const,
  };

  it('should detect matching results when both documents agree', () => {
    // Use same candidate numbers for both (matching scenario)
    const matchingForm = {
      ...yasothonUnit5Form,
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.voteCount,
        confidence: 98,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, matchingForm);
    expect(result.isMatch).toBe(true);
    expect(result.overallConfidence).toBe(100);
    expect(result.stationMatch).toBe(true);
    expect(result.totalVotesMatch).toBe(true);
    expect(result.discrepancies).toHaveLength(0);
    expect(result.candidateMatches).toHaveLength(9);
    expect(result.summary).toContain('✅');
  });

  it('should detect discrepancies when vote counts differ', () => {
    const tamperedForm = {
      ...yasothonUnit5Form,
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.candidateNumber === 1 ? v.voteCount + 50 : v.voteCount, // Tamper candidate 1
        confidence: 98,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, tamperedForm);
    expect(result.isMatch).toBe(false);
    expect(result.discrepancies.length).toBeGreaterThan(0);
    expect(result.candidateMatches.find(c => c.candidateNumber === 1)?.isMatch).toBe(false);
    expect(result.candidateMatches.find(c => c.candidateNumber === 1)?.difference).toBe(50);
  });

  it('should allow small tolerance in vote counts', () => {
    const slightlyOffForm = {
      ...yasothonUnit5Form,
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.voteCount + (v.candidateNumber === 3 ? 1 : 0), // Off by 1 for candidate 3
        confidence: 90,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, slightlyOffForm, 2);
    // Difference of 1 should be within tolerance of 2
    expect(result.candidateMatches.find(c => c.candidateNumber === 3)?.isMatch).toBe(true);
  });

  it('should detect station code mismatch', () => {
    const differentStation = {
      ...yasothonUnit5Form,
      stationCode: 'หน่วยที่ 12 อำเภอมหาชนะชัย',
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.voteCount,
        confidence: 98,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, differentStation);
    expect(result.stationMatch).toBe(false);
    expect(result.discrepancies.some(d => d.includes('รหัสหน่วยไม่ตรงกัน'))).toBe(true);
  });

  it('should detect ballot count mismatch', () => {
    const differentBallots = {
      ...yasothonUnit5Form,
      totalBallots: 550, // Different from 490
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.voteCount,
        confidence: 98,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, differentBallots);
    expect(result.totalVotesMatch).toBe(false);
    expect(result.discrepancies.some(d => d.includes('จำนวนบัตรไม่ตรงกัน'))).toBe(true);
  });

  it('should detect missing candidates', () => {
    const fewerCandidates = {
      ...yasothonUnit5Form,
      votes: yasothonUnit5Tally.votes.slice(0, 7).map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.voteCount,
        confidence: 98,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, fewerCandidates);
    expect(result.discrepancies.some(d => d.includes('จำนวนผู้สมัครไม่ตรงกัน'))).toBe(true);
  });

  it('should handle multiple discrepancies (fraud scenario)', () => {
    const fraudResult = {
      success: true as const,
      stationCode: 'หน่วยที่ 5 อำเภอคำเขื่อนแก้ว',
      totalVoters: 520,
      totalBallots: 550, // Inflated
      spoiledBallots: 5, // Reduced
      votes: [
        { candidateName: 'นายบุญแก้ว สมวงศ์', candidateNumber: 1, voteCount: 250, confidence: 98 }, // Inflated
        { candidateName: 'นายสุทัศน์ เรืองศรี', candidateNumber: 3, voteCount: 100, confidence: 98 }, // Reduced
        { candidateName: 'นายวรายุทธ ทองสะอาด', candidateNumber: 2, voteCount: 42, confidence: 98 },
        { candidateName: 'นายประสิทธิ์ ศรีสวัสดิ์', candidateNumber: 4, voteCount: 23, confidence: 98 },
        { candidateName: 'นายธนกร วงศ์ใหญ่', candidateNumber: 5, voteCount: 8, confidence: 98 },
        { candidateName: 'นายสมชาย ดีเลิศ', candidateNumber: 6, voteCount: 15, confidence: 98 },
        { candidateName: 'นางสาวพิมพ์ใจ ศรีสุข', candidateNumber: 7, voteCount: 31, confidence: 98 },
        { candidateName: 'นายอนุชา ทองดี', candidateNumber: 8, voteCount: 5, confidence: 98 },
        { candidateName: 'นายวิชัย ประเสริฐ', candidateNumber: 9, voteCount: 3, confidence: 98 },
      ],
      scoringMethod: 'numeric' as const,
      documentType: 'ss5_18' as const,
    };

    const result = crossValidate(yasothonUnit5Tally, fraudResult);
    expect(result.isMatch).toBe(false);
    expect(result.discrepancies.length).toBeGreaterThanOrEqual(3); // ballots + spoiled + candidates
    // 7/9 candidates match (78%) → ⚠️ level, not 🚨
    expect(result.summary).toContain('⚠️');
    expect(result.overallConfidence).toBeLessThan(100);
  });

  it('should generate correct summary for partial match', () => {
    const partialMatch = {
      ...yasothonUnit5Form,
      votes: yasothonUnit5Tally.votes.map(v => ({
        candidateName: v.candidateName,
        candidateNumber: v.candidateNumber,
        voteCount: v.candidateNumber <= 2 ? v.voteCount + 10 : v.voteCount, // 2 candidates off
        confidence: 90,
      })),
    };

    const result = crossValidate(yasothonUnit5Tally, partialMatch);
    expect(result.overallConfidence).toBeGreaterThan(50);
    expect(result.overallConfidence).toBeLessThan(100);
    expect(result.summary).toContain('⚠️');
  });
});

// ============================================================
// HF OCR Module Structure Tests
// ============================================================
describe('HF OCR Module Structure', () => {
  it('should export analyzeWithHF function', async () => {
    const hfOcr = await import('./hfOcr');
    expect(typeof hfOcr.analyzeWithHF).toBe('function');
  });

  it('should export crossValidate function', async () => {
    const hfOcr = await import('./hfOcr');
    expect(typeof hfOcr.crossValidate).toBe('function');
  });

  it('should export validateHFOcrResult function', async () => {
    const hfOcr = await import('./hfOcr');
    expect(typeof hfOcr.validateHFOcrResult).toBe('function');
  });

  it('should return error when HF token is empty', async () => {
    const { analyzeWithHF } = await import('./hfOcr');
    const result = await analyzeWithHF('dGVzdA==', '', 'auto');
    expect(result.success).toBe(false);
    expect(result.error).toContain('HF_API_TOKEN');
  });
});

// ============================================================
// validateHFOcrResult Tests
// ============================================================
describe('validateHFOcrResult', () => {
  it('should detect vote count exceeding total voters', async () => {
    const { validateHFOcrResult } = await import('./hfOcr');
    const result = validateHFOcrResult({
      success: true,
      totalVoters: 100,
      totalBallots: 90,
      spoiledBallots: 5,
      votes: [
        { candidateName: 'A', candidateNumber: 1, voteCount: 150, confidence: 90 },
      ],
    });
    expect(result.isValid).toBe(false);
    expect(result.warnings.some(w => w.includes('มากกว่าจำนวนผู้มีสิทธิ์'))).toBe(true);
  });

  it('should detect suspiciously high turnout', async () => {
    const { validateHFOcrResult } = await import('./hfOcr');
    const result = validateHFOcrResult({
      success: true,
      totalVoters: 100,
      totalBallots: 98,
      spoiledBallots: 2,
      votes: [
        { candidateName: 'A', candidateNumber: 1, voteCount: 60, confidence: 90 },
        { candidateName: 'B', candidateNumber: 2, voteCount: 36, confidence: 90 },
      ],
    });
    expect(result.warnings.some(w => w.includes('สูงผิดปกติ'))).toBe(true);
  });

  it('should pass valid results when votes match ballots', async () => {
    const { validateHFOcrResult } = await import('./hfOcr');
    // Total votes = 478, expected = 490 - 12 = 478 → exact match
    const result = validateHFOcrResult({
      success: true,
      totalVoters: 520,
      totalBallots: 490,
      spoiledBallots: 12,
      votes: [
        { candidateName: 'A', candidateNumber: 1, voteCount: 190, confidence: 95 },
        { candidateName: 'B', candidateNumber: 2, voteCount: 156, confidence: 95 },
        { candidateName: 'C', candidateNumber: 3, voteCount: 42, confidence: 90 },
        { candidateName: 'D', candidateNumber: 4, voteCount: 31, confidence: 90 },
        { candidateName: 'E', candidateNumber: 5, voteCount: 23, confidence: 85 },
        { candidateName: 'F', candidateNumber: 6, voteCount: 15, confidence: 85 },
        { candidateName: 'G', candidateNumber: 7, voteCount: 8, confidence: 90 },
        { candidateName: 'H', candidateNumber: 8, voteCount: 5, confidence: 90 },
        { candidateName: 'I', candidateNumber: 9, voteCount: 8, confidence: 85 },
      ],
    });
    // Total = 190+156+42+31+23+15+8+5+8 = 478 = 490-12 → valid
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('should detect low confidence votes', async () => {
    const { validateHFOcrResult } = await import('./hfOcr');
    const result = validateHFOcrResult({
      success: true,
      totalVoters: 500,
      totalBallots: 400,
      spoiledBallots: 10,
      votes: [
        { candidateName: 'A', candidateNumber: 1, voteCount: 200, confidence: 50 },
        { candidateName: 'B', candidateNumber: 2, voteCount: 190, confidence: 40 },
      ],
    });
    expect(result.warnings.some(w => w.includes('ความมั่นใจต่ำ'))).toBe(true);
  });

  it('should return invalid for failed OCR', async () => {
    const { validateHFOcrResult } = await import('./hfOcr');
    const result = validateHFOcrResult({
      success: false,
      votes: [],
      error: 'OCR failed',
    });
    expect(result.isValid).toBe(false);
  });
});

// ============================================================
// Gemini OCR Validation Tests
// ============================================================
describe('Gemini OCR validateOcrResult', () => {
  it('should validate Yasothon Zone 2 Unit 5 data correctly', async () => {
    const { validateOcrResult } = await import('./geminiOcr');
    const result = validateOcrResult({
      success: true,
      totalVoters: 520,
      totalBallots: 490,
      spoiledBallots: 12,
      scoringMethod: 'tally',
      documentType: 'ss5_11',
      votes: [
        { candidateName: 'นายบุญแก้ว สมวงศ์', candidateNumber: 1, voteCount: 187, confidence: 95 },
        { candidateName: 'นายวรายุทธ ทองสะอาด', candidateNumber: 2, voteCount: 42, confidence: 90 },
        { candidateName: 'นายสุทัศน์ เรืองศรี', candidateNumber: 3, voteCount: 156, confidence: 95 },
        { candidateName: 'นายประสิทธิ์ ศรีสวัสดิ์', candidateNumber: 4, voteCount: 23, confidence: 85 },
        { candidateName: 'นายธนกร วงศ์ใหญ่', candidateNumber: 5, voteCount: 8, confidence: 90 },
        { candidateName: 'นายสมชาย ดีเลิศ', candidateNumber: 6, voteCount: 15, confidence: 85 },
        { candidateName: 'นางสาวพิมพ์ใจ ศรีสุข', candidateNumber: 7, voteCount: 31, confidence: 90 },
        { candidateName: 'นายอนุชา ทองดี', candidateNumber: 8, voteCount: 5, confidence: 90 },
        { candidateName: 'นายวิชัย ประเสริฐ', candidateNumber: 9, voteCount: 3, confidence: 85 },
      ],
    });
    // Total votes = 470, expected = 490 - 12 = 478, difference = 8 > 5 → warning
    expect(result.warnings.some(w => w.includes('คะแนนรวม'))).toBe(true);
  });

  it('should detect round number tally warning', async () => {
    const { validateOcrResult } = await import('./geminiOcr');
    const result = validateOcrResult({
      success: true,
      totalVoters: 500,
      totalBallots: 400,
      spoiledBallots: 10,
      scoringMethod: 'tally',
      documentType: 'ss5_11',
      votes: [
        { candidateName: 'A', candidateNumber: 1, voteCount: 200, confidence: 90 },
        { candidateName: 'B', candidateNumber: 2, voteCount: 100, confidence: 90 },
        { candidateName: 'C', candidateNumber: 3, voteCount: 50, confidence: 90 },
        { candidateName: 'D', candidateNumber: 4, voteCount: 40, confidence: 90 },
      ],
    });
    expect(result.warnings.some(w => w.includes('จำนวนกลม'))).toBe(true);
  });
});
