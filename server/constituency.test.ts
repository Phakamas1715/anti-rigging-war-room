import { describe, it, expect } from 'vitest';
import {
  getConstituency,
  getConstituenciesByProvince,
  getAllConstituencies,
  getProvinceZoneCount,
  searchConstituencies,
  getProvincesWithData,
  PROVINCE_ZONE_COUNTS,
} from './constituencyData';

describe('Constituency Data Module', () => {
  describe('getConstituency', () => {
    it('should return Yasothon zone 2 data', () => {
      const result = getConstituency('ยโสธร', 2);
      expect(result).not.toBeNull();
      expect(result!.province).toBe('ยโสธร');
      expect(result!.zone).toBe(2);
      expect(result!.candidates.length).toBe(9);
      expect(result!.totalZones).toBe(3);
    });

    it('should have correct candidates for Yasothon zone 2', () => {
      const result = getConstituency('ยโสธร', 2);
      expect(result).not.toBeNull();
      
      // Check first candidate
      expect(result!.candidates[0].number).toBe(1);
      expect(result!.candidates[0].name).toBe('นายบุญแก้ว สมวงศ์');
      expect(result!.candidates[0].party).toBe('เพื่อไทย');
      expect(result!.candidates[0].votes2566).toBe(44851);
      
      // Check third candidate
      expect(result!.candidates[2].number).toBe(3);
      expect(result!.candidates[2].name).toBe('นายวรายุทธ จงอักษร');
      expect(result!.candidates[2].party).toBe('ภูมิใจไทย');
      expect(result!.candidates[2].votes2566).toBe(34581);
    });

    it('should have coverage areas for Yasothon zone 2', () => {
      const result = getConstituency('ยโสธร', 2);
      expect(result).not.toBeNull();
      expect(result!.coverage.length).toBeGreaterThan(0);
      expect(result!.coverage).toContain('อ.มหาชนะชัย');
      expect(result!.coverage).toContain('อ.ค้อวัง');
    });

    it('should have stats2566 for Yasothon zone 2', () => {
      const result = getConstituency('ยโสธร', 2);
      expect(result).not.toBeNull();
      expect(result!.stats2566).toBeDefined();
      expect(result!.stats2566!.registeredVoters).toBe(141902);
      expect(result!.stats2566!.turnoutPercent).toBe(69.37);
    });

    it('should return null for non-existent constituency', () => {
      const result = getConstituency('ยโสธร', 99);
      expect(result).toBeNull();
    });

    it('should return null for non-existent province', () => {
      const result = getConstituency('ไม่มีจังหวัดนี้', 1);
      expect(result).toBeNull();
    });
  });

  describe('getConstituenciesByProvince', () => {
    it('should return all 3 zones for Yasothon', () => {
      const results = getConstituenciesByProvince('ยโสธร');
      expect(results.length).toBe(3);
      expect(results[0].zone).toBe(1);
      expect(results[1].zone).toBe(2);
      expect(results[2].zone).toBe(3);
    });

    it('should return empty array for province without data', () => {
      const results = getConstituenciesByProvince('กรุงเทพมหานคร');
      expect(results.length).toBe(0);
    });
  });

  describe('getAllConstituencies', () => {
    it('should return all constituencies', () => {
      const results = getAllConstituencies();
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBe(3); // Currently only Yasothon
    });
  });

  describe('getProvinceZoneCount', () => {
    it('should return 3 zones for Yasothon', () => {
      expect(getProvinceZoneCount('ยโสธร')).toBe(3);
    });

    it('should return 33 zones for Bangkok', () => {
      expect(getProvinceZoneCount('กรุงเทพมหานคร')).toBe(33);
    });

    it('should return 0 for unknown province', () => {
      expect(getProvinceZoneCount('ไม่มี')).toBe(0);
    });
  });

  describe('searchConstituencies', () => {
    it('should find by province name', () => {
      const results = searchConstituencies('ยโสธร');
      expect(results.length).toBe(3);
    });

    it('should find by candidate name', () => {
      const results = searchConstituencies('บุญแก้ว');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find by party name', () => {
      const results = searchConstituencies('เพื่อไทย');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should find by area name', () => {
      const results = searchConstituencies('มหาชนะชัย');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty for no match', () => {
      const results = searchConstituencies('ไม่มีข้อมูลนี้เลย');
      expect(results.length).toBe(0);
    });
  });

  describe('getProvincesWithData', () => {
    it('should include Yasothon', () => {
      const provinces = getProvincesWithData();
      expect(provinces).toContain('ยโสธร');
    });
  });

  describe('PROVINCE_ZONE_COUNTS', () => {
    it('should have 77 provinces', () => {
      const count = Object.keys(PROVINCE_ZONE_COUNTS).length;
      expect(count).toBe(77);
    });

    it('should total at least 300 zones', () => {
      const total = Object.values(PROVINCE_ZONE_COUNTS).reduce((sum, z) => sum + z, 0);
      // Total should be around 400 (สส. แบ่งเขต)
      expect(total).toBeGreaterThanOrEqual(300);
      expect(total).toBeLessThanOrEqual(500);
    });
  });
});
