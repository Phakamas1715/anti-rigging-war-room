import { describe, it, expect } from 'vitest';
import { calculateKlimekAnalysis } from './klimek.service';

describe('Klimek Service', () => {
  describe('calculateKlimekAnalysis', () => {
    it('should detect ballot stuffing with high alpha', () => {
      const data = Array(100).fill(0).map((_, i) => ({
        turnout: 0.9,
        voteShare: 0.95,
      }));
      
      const result = calculateKlimekAnalysis(data);
      
      expect(result.alpha).toBeGreaterThan(0.05);
      expect(result.suspicious).toBe(true);
    });
    
    it('should not flag clean election data', () => {
      const data = Array(100).fill(0).map((_, i) => ({
        turnout: 0.5 + Math.random() * 0.3,
        voteShare: 0.4 + Math.random() * 0.3,
      }));
      
      const result = calculateKlimekAnalysis(data);
      
      expect(result.alpha).toBeLessThan(0.05);
      expect(result.suspicious).toBe(false);
    });
    
    it('should calculate correlation correctly', () => {
      const data = [
        { turnout: 0.5, voteShare: 0.5 },
        { turnout: 0.6, voteShare: 0.6 },
        { turnout: 0.7, voteShare: 0.7 },
      ];
      
      const result = calculateKlimekAnalysis(data);
      
      expect(result.correlation).toBeCloseTo(1, 1);
    });
    
    it('should generate heatmap data', () => {
      const data = Array(50).fill(0).map(() => ({
        turnout: Math.random(),
        voteShare: Math.random(),
      }));
      
      const result = calculateKlimekAnalysis(data);
      
      expect(result.heatmap).toBeInstanceOf(Array);
      expect(result.heatmap.length).toBeGreaterThan(0);
      expect(result.heatmap[0]).toHaveProperty('x');
      expect(result.heatmap[0]).toHaveProperty('y');
      expect(result.heatmap[0]).toHaveProperty('value');
    });
  });
});
