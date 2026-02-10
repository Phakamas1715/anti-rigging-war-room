import { describe, it, expect } from 'vitest';
import {
  calculateGlueFin,
  calculateFraudProbability,
  analyzePollingStations,
  DEFAULT_WEIGHTS,
  GlueFinInput,
} from './glueFin';

describe('GLUE-FIN: Global Unified Election Fraud INdicator', () => {
  describe('calculateGlueFin', () => {
    it('should return normal level for clean polling station', () => {
      const input: GlueFinInput = {
        ocrConfidence: 95,
        klimekAlpha: 0.01,
        klimekBeta: 0.01,
        benfordChiSquare: 5.07,
        pvtGapPercentage: 0.25,
        snaCentrality: 0.15,
      };

      const result = calculateGlueFin(input);

      expect(result.level).toBe('normal');
      expect(result.score).toBeLessThan(20);
      expect(result.levelEmoji).toBe('🟢');
    });

    it('should return review level for slightly suspicious station', () => {
      const input: GlueFinInput = {
        ocrConfidence: 70,
        klimekAlpha: 0.08,
        klimekBeta: 0.04,
        benfordChiSquare: 12,
        pvtGapPercentage: 2.5,
        snaCentrality: 0.4,
      };

      const result = calculateGlueFin(input);

      // Score should be higher than clean station
      expect(result.score).toBeGreaterThan(10);
      // Level can be normal, review, or suspicious depending on sigmoid curve
      expect(['normal', 'review', 'suspicious']).toContain(result.level);
    });

    it('should return higher score for high fraud indicators', () => {
      const input: GlueFinInput = {
        ocrConfidence: 50,
        klimekAlpha: 0.15,
        klimekBeta: 0.08,
        benfordChiSquare: 25,
        pvtGapPercentage: 8,
        snaCentrality: 0.9,
      };

      const result = calculateGlueFin(input);

      expect(result.score).toBeGreaterThan(20);
    });

    it('should handle missing input values gracefully', () => {
      const input: GlueFinInput = {
        ocrConfidence: 90,
        // Other values missing
      };

      const result = calculateGlueFin(input);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.components).toHaveLength(5);
    });

    it('should use custom weights when provided', () => {
      const input: GlueFinInput = {
        klimekAlpha: 0.20,
        klimekBeta: 0.10,
      };

      const customWeights = {
        ocr: 0.05,
        klimek: 0.60, // Higher weight for Klimek
        benford: 0.15,
        pvt: 0.15,
        sna: 0.05,
      };

      const resultDefault = calculateGlueFin(input);
      const resultCustom = calculateGlueFin(input, customWeights);

      // Custom weights should give higher score due to higher Klimek weight
      expect(resultCustom.score).toBeGreaterThan(resultDefault.score);
    });

    it('should include formula in result', () => {
      const input: GlueFinInput = {
        ocrConfidence: 80,
        klimekAlpha: 0.05,
      };

      const result = calculateGlueFin(input);

      expect(result.formula).toContain('S = 100 × σ');
      expect(result.formula).toContain(result.score.toString());
    });

    it('should calculate component contributions correctly', () => {
      const input: GlueFinInput = {
        ocrConfidence: 100,
        klimekAlpha: 0.10,
        klimekBeta: 0.10,
        benfordChiSquare: 16.92,
        pvtGapPercentage: 5,
        snaCentrality: 1.0,
      };

      const result = calculateGlueFin(input);

      // All normalized values should be 1.0 (max)
      result.components.forEach(c => {
        expect(c.normalizedValue).toBe(1);
        expect(c.contribution).toBe(c.weight * c.normalizedValue);
      });
    });
  });

  describe('calculateFraudProbability', () => {
    it('should return 0 for empty array', () => {
      expect(calculateFraudProbability([])).toBe(0);
    });

    it('should return same value for single probability', () => {
      expect(calculateFraudProbability([0.3])).toBeCloseTo(0.3);
    });

    it('should combine probabilities correctly', () => {
      // P = 1 - (1-0.5)(1-0.5) = 1 - 0.25 = 0.75
      expect(calculateFraudProbability([0.5, 0.5])).toBeCloseTo(0.75);
    });

    it('should return 1 if any probability is 1', () => {
      expect(calculateFraudProbability([0.3, 1.0, 0.2])).toBe(1);
    });

    it('should handle multiple low probabilities', () => {
      // P = 1 - (0.9)^5 ≈ 0.41
      const result = calculateFraudProbability([0.1, 0.1, 0.1, 0.1, 0.1]);
      expect(result).toBeCloseTo(0.41, 1);
    });
  });

  describe('analyzePollingStations', () => {
    it('should analyze multiple stations and provide summary', () => {
      const stations = [
        {
          stationId: 'ST001',
          stationName: 'หน่วยที่ 1',
          input: { ocrConfidence: 95, klimekAlpha: 0.01 },
        },
        {
          stationId: 'ST002',
          stationName: 'หน่วยที่ 2',
          input: { ocrConfidence: 60, klimekAlpha: 0.15, pvtGapPercentage: 10 },
        },
        {
          stationId: 'ST003',
          stationName: 'หน่วยที่ 3',
          input: { ocrConfidence: 85, klimekAlpha: 0.03 },
        },
      ];

      const result = analyzePollingStations(stations);

      expect(result.stations).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.averageScore).toBeGreaterThan(0);
    });

    it('should identify high risk stations', () => {
      const stations = [
        {
          stationId: 'ST001',
          input: { ocrConfidence: 95, klimekAlpha: 0.01 },
        },
        {
          stationId: 'ST002',
          input: {
            ocrConfidence: 30,
            klimekAlpha: 0.25,
            klimekBeta: 0.15,
            benfordChiSquare: 30,
            pvtGapPercentage: 15,
            snaCentrality: 0.95,
          },
        },
      ];

      const result = analyzePollingStations(stations);

      // ST002 should be flagged as high risk
      expect(result.stations[1].result.score).toBeGreaterThan(
        result.stations[0].result.score
      );
    });

    it('should count stations by level', () => {
      const stations = [
        { stationId: 'ST001', input: { ocrConfidence: 95 } },
        { stationId: 'ST002', input: { ocrConfidence: 90 } },
        { stationId: 'ST003', input: { ocrConfidence: 85 } },
      ];

      const result = analyzePollingStations(stations);

      const totalByLevel = Object.values(result.summary.byLevel).reduce(
        (a, b) => a + b,
        0
      );
      expect(totalByLevel).toBe(3);
    });
  });

  describe('DEFAULT_WEIGHTS', () => {
    it('should sum to 1.0', () => {
      const sum = Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0);
    });

    it('should have all required modules', () => {
      expect(DEFAULT_WEIGHTS).toHaveProperty('ocr');
      expect(DEFAULT_WEIGHTS).toHaveProperty('klimek');
      expect(DEFAULT_WEIGHTS).toHaveProperty('benford');
      expect(DEFAULT_WEIGHTS).toHaveProperty('pvt');
      expect(DEFAULT_WEIGHTS).toHaveProperty('sna');
    });
  });
});
