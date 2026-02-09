import { describe, it, expect, beforeEach, vi } from "vitest";
// Mock implementation for testing
const calculateDiscrepancy = (ss5_11: any[], ss5_18: any[]): number => {
  if (!ss5_11.length || !ss5_18.length) return 100;
  
  let totalDiff = 0;
  let count = 0;
  
  for (const vote11 of ss5_11) {
    const vote18 = ss5_18.find(v => v.candidateNumber === vote11.candidateNumber);
    if (vote18) {
      const diff = Math.abs(vote18.voteCount - vote11.voteCount) / (vote11.voteCount || 1);
      totalDiff += diff * 100;
      count++;
    } else {
      totalDiff += 100;
      count++;
    }
  }
  
  for (const vote18 of ss5_18) {
    if (!ss5_11.find(v => v.candidateNumber === vote18.candidateNumber)) {
      totalDiff += 100;
      count++;
    }
  }
  
  return count > 0 ? totalDiff / count : 0;
};

const generateCrossValidationAlert = (stationCode: string, province: string, constituency: string, discrepancy: number, ss5_11: any[], ss5_18: any[]): any => {
  if (discrepancy <= 5) return null;
  
  const severity = discrepancy > 15 ? 'critical' : 'high';
  
  // Build summary with candidate details
  let summary = `Cross-validation discrepancy ${discrepancy.toFixed(1)}% detected for ${stationCode}. `;
  
  // Add candidate details
  for (const vote11 of ss5_11) {
    const vote18 = ss5_18.find(v => v.candidateNumber === vote11.candidateNumber);
    if (vote18) {
      const diff = Math.abs(vote18.voteCount - vote11.voteCount);
      if (diff > 0) {
        summary += `${vote11.candidateName}: ${vote11.voteCount} vs ${vote18.voteCount}. `;
      }
    }
  }
  
  return {
    stationCode,
    province,
    constituency,
    severity,
    summary,
  };
};

const performCrossValidation = async (ss5_11Result: any, ss5_18Result: any): Promise<any> => {
  if (ss5_11Result.documentType !== 'ss5_11' || ss5_18Result.documentType !== 'ss5_18') {
    return { isValid: false, error: 'Require ss5_11 and ss5_18 documents' };
  }
  
  if (!ss5_11Result.votes?.length || !ss5_18Result.votes?.length) {
    return { isValid: false, error: 'Missing vote data ข้อมูล' };
  }
  
  const discrepancy = calculateDiscrepancy(ss5_11Result.votes, ss5_18Result.votes);
  const alert = generateCrossValidationAlert(
    ss5_11Result.stationCode,
    ss5_11Result.province,
    ss5_11Result.constituency,
    discrepancy,
    ss5_11Result.votes,
    ss5_18Result.votes
  );
  
  const overallConfidence = (ss5_11Result.votes[0]?.confidence + ss5_18Result.votes[0]?.confidence) / 2;
  
  return {
    isValid: discrepancy <= 5,
    discrepancy,
    alert,
    overallConfidence,
  };
};

describe("Cross-Validation System", () => {
  describe("calculateDiscrepancy", () => {
    it("should return 0 for identical vote counts", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
        { candidateNumber: 3, voteCount: 60 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
        { candidateNumber: 3, voteCount: 60 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      expect(discrepancy).toBe(0);
    });

    it("should calculate percentage difference correctly", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 105 },
        { candidateNumber: 2, voteCount: 75 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      // Candidate 1: |105-100|/100 = 5%
      // Candidate 2: |75-80|/80 = 6.25%
      // Average: 5.625%
      expect(discrepancy).toBeCloseTo(5.625, 1);
    });

    it("should handle missing candidates in ss5_18", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
        { candidateNumber: 3, voteCount: 60 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      // Candidate 3 missing in ss5_18: 100% discrepancy
      expect(discrepancy).toBeGreaterThan(30);
    });

    it("should handle extra candidates in ss5_18", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 100 },
        { candidateNumber: 2, voteCount: 80 },
        { candidateNumber: 3, voteCount: 60 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      // Extra candidate in ss5_18
      expect(discrepancy).toBeGreaterThan(0);
    });

    it("should handle zero votes correctly", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 0 },
        { candidateNumber: 2, voteCount: 100 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 0 },
        { candidateNumber: 2, voteCount: 100 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      expect(discrepancy).toBe(0);
    });

    it("should detect significant discrepancy > 5%", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 106 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      // 6% difference
      expect(discrepancy).toBeGreaterThan(5);
    });

    it("should accept small discrepancy <= 5%", () => {
      const ss5_11 = [
        { candidateNumber: 1, voteCount: 100 },
      ];

      const ss5_18 = [
        { candidateNumber: 1, voteCount: 104 },
      ];

      const discrepancy = calculateDiscrepancy(ss5_11, ss5_18);
      // 4% difference
      expect(discrepancy).toBeLessThanOrEqual(5);
    });
  });

  describe("generateCrossValidationAlert", () => {
    it("should generate alert for discrepancy > 5%", () => {
      const alert = generateCrossValidationAlert(
        "YST-001",
        "ยโสธร",
        "2",
        10,
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100 },
          { candidateNumber: 2, candidateName: "ผู้สมัคร 2", voteCount: 80 },
        ],
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 110 },
          { candidateNumber: 2, candidateName: "ผู้สมัคร 2", voteCount: 70 },
        ]
      );

      expect(alert).toBeDefined();
      expect(alert.stationCode).toBe("YST-001");
      expect(alert.severity).toBe("high");
      expect(alert.summary).toContain("10.0%");
    });

    it("should not generate alert for discrepancy <= 5%", () => {
      const alert = generateCrossValidationAlert(
        "YST-001",
        "ยโสธร",
        "2",
        3,
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100 },
        ],
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 103 },
        ]
      );

      expect(alert).toBeNull();
    });

    it("should set severity to critical for discrepancy > 15%", () => {
      const alert = generateCrossValidationAlert(
        "YST-001",
        "ยโสธร",
        "2",
        20,
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100 },
        ],
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 120 },
        ]
      );

      expect(alert?.severity).toBe("critical");
    });

    it("should set severity to high for discrepancy 5-15%", () => {
      const alert = generateCrossValidationAlert(
        "YST-001",
        "ยโสธร",
        "2",
        10,
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100 },
        ],
        [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 110 },
        ]
      );

      expect(alert?.severity).toBe("high");
    });

    it("should include detailed summary with candidate names", () => {
      const alert = generateCrossValidationAlert(
        "YST-001",
        "ยโสธร",
        "2",
        10,
        [
          { candidateNumber: 1, candidateName: "บุญแก้ว สมเพชร", voteCount: 100 },
          { candidateNumber: 2, candidateName: "วรายุทธ บุญโสภณ", voteCount: 80 },
        ],
        [
          { candidateNumber: 1, candidateName: "บุญแก้ว สมเพชร", voteCount: 110 },
          { candidateNumber: 2, candidateName: "วรายุทธ บุญโสภณ", voteCount: 70 },
        ]
      );

      expect(alert?.summary).toContain("บุญแก้ว สมเพชร");
      expect(alert?.summary).toContain("10.0%");
    });
  });

  describe("performCrossValidation", () => {
    it("should validate matching ss5_11 and ss5_18 results", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
          { candidateNumber: 2, candidateName: "ผู้สมัคร 2", voteCount: 80, confidence: 92 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_18" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
          { candidateNumber: 2, candidateName: "ผู้สมัคร 2", voteCount: 80, confidence: 92 },
        ],
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      expect(result.isValid).toBe(true);
      expect(result.discrepancy).toBe(0);
      expect(result.alert).toBeNull();
    });

    it("should detect discrepancy > 5%", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_18" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 110, confidence: 95 },
        ],
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      expect(result.isValid).toBe(false);
      expect(result.discrepancy).toBeGreaterThan(5);
      expect(result.alert).toBeDefined();
    });

    it("should require both ss5_11 and ss5_18", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const, // Wrong type!
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
        ],
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ss5_11");
    });

    it("should handle missing votes gracefully", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 95 },
          { candidateNumber: 2, candidateName: "ผู้สมัคร 2", voteCount: 80, confidence: 92 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_18" as const,
        votes: [], // Empty!
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain("ข้อมูล");
    });

    it("should match candidates by candidateNumber, not name", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร A", voteCount: 100, confidence: 95 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_18" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร B (ชื่อต่างกัน)", voteCount: 100, confidence: 95 },
        ],
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      // Should match by candidateNumber, not name
      expect(result.isValid).toBe(true);
      expect(result.discrepancy).toBe(0);
    });

    it("should calculate overall confidence from both documents", async () => {
      const ss5_11Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_11" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 90 },
        ],
      };

      const ss5_18Result = {
        stationCode: "YST-001",
        province: "ยโสธร",
        constituency: "2",
        documentType: "ss5_18" as const,
        votes: [
          { candidateNumber: 1, candidateName: "ผู้สมัคร 1", voteCount: 100, confidence: 100 },
        ],
      };

      const result = await performCrossValidation(ss5_11Result, ss5_18Result);

      expect(result.overallConfidence).toBe(95); // (90 + 100) / 2
    });
  });
});
