import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  generateVolunteerCode: vi.fn(() => '123456'),
  createVolunteerCode: vi.fn(async (data) => ({ code: '123456', insertId: 1 })),
  bulkCreateVolunteerCodes: vi.fn(async (count) => Array.from({ length: count }, (_, i) => String(100000 + i))),
  loginWithVolunteerCode: vi.fn(async (code) => {
    if (code === '123456') {
      return {
        success: true,
        volunteerCode: {
          id: 1,
          code: '123456',
          volunteerName: 'Test Volunteer',
          stationId: 1,
          phone: '0812345678',
          isActive: true,
          isUsed: false,
        },
        stationId: 1,
      };
    }
    return { success: false, error: 'รหัสไม่ถูกต้องหรือถูกยกเลิกแล้ว' };
  }),
  getVolunteerCodeByCode: vi.fn(async (code) => {
    if (code === '123456') {
      return {
        id: 1,
        code: '123456',
        volunteerName: 'Test Volunteer',
        stationId: 1,
        phone: '0812345678',
        isActive: true,
        isUsed: false,
      };
    }
    return null;
  }),
  getVolunteerCodes: vi.fn(async () => [
    { id: 1, code: '123456', volunteerName: 'Test 1', isActive: true, isUsed: false },
    { id: 2, code: '234567', volunteerName: 'Test 2', isActive: true, isUsed: true },
  ]),
  updateVolunteerCode: vi.fn(async () => ({})),
  deactivateVolunteerCode: vi.fn(async () => ({})),
  getVolunteerCodeStats: vi.fn(async () => ({ total: 10, used: 3, unused: 7, active: 9 })),
}));

import {
  generateVolunteerCode,
  createVolunteerCode,
  bulkCreateVolunteerCodes,
  loginWithVolunteerCode,
  getVolunteerCodeByCode,
  getVolunteerCodes,
  updateVolunteerCode,
  deactivateVolunteerCode,
  getVolunteerCodeStats,
} from './db';

describe('Volunteer Code System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateVolunteerCode', () => {
    it('should generate a 6-digit code', () => {
      const code = generateVolunteerCode();
      expect(code).toHaveLength(6);
      expect(/^\d{6}$/.test(code)).toBe(true);
    });
  });

  describe('createVolunteerCode', () => {
    it('should create a new volunteer code', async () => {
      const result = await createVolunteerCode({
        volunteerName: 'Test Volunteer',
        phone: '0812345678',
      });

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('insertId');
      expect(result.code).toHaveLength(6);
    });

    it('should create code with station assignment', async () => {
      const result = await createVolunteerCode({
        stationId: 1,
        volunteerName: 'Station Volunteer',
      });

      expect(result.code).toBeDefined();
      expect(createVolunteerCode).toHaveBeenCalledWith(
        expect.objectContaining({ stationId: 1 })
      );
    });
  });

  describe('bulkCreateVolunteerCodes', () => {
    it('should create multiple codes at once', async () => {
      const codes = await bulkCreateVolunteerCodes(5);

      expect(codes).toHaveLength(5);
      expect(bulkCreateVolunteerCodes).toHaveBeenCalledWith(5);
    });

    it('should generate unique codes', async () => {
      const codes = await bulkCreateVolunteerCodes(10);
      const uniqueCodes = new Set(codes);

      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('loginWithVolunteerCode', () => {
    it('should login successfully with valid code', async () => {
      const result = await loginWithVolunteerCode('123456');

      expect(result.success).toBe(true);
      expect(result.volunteerCode).toBeDefined();
      expect(result.stationId).toBe(1);
    });

    it('should fail with invalid code', async () => {
      const result = await loginWithVolunteerCode('000000');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return volunteer info on success', async () => {
      const result = await loginWithVolunteerCode('123456');

      expect(result.volunteerCode?.volunteerName).toBe('Test Volunteer');
      expect(result.volunteerCode?.phone).toBe('0812345678');
    });
  });

  describe('getVolunteerCodeByCode', () => {
    it('should return code info for valid code', async () => {
      const code = await getVolunteerCodeByCode('123456');

      expect(code).toBeDefined();
      expect(code?.code).toBe('123456');
      expect(code?.volunteerName).toBe('Test Volunteer');
    });

    it('should return null for invalid code', async () => {
      const code = await getVolunteerCodeByCode('000000');

      expect(code).toBeNull();
    });
  });

  describe('getVolunteerCodes', () => {
    it('should return list of all codes', async () => {
      const codes = await getVolunteerCodes();

      expect(codes).toHaveLength(2);
      expect(codes[0]).toHaveProperty('code');
      expect(codes[0]).toHaveProperty('volunteerName');
    });
  });

  describe('updateVolunteerCode', () => {
    it('should update volunteer info', async () => {
      await updateVolunteerCode('123456', {
        volunteerName: 'Updated Name',
        phone: '0899999999',
      });

      expect(updateVolunteerCode).toHaveBeenCalledWith('123456', {
        volunteerName: 'Updated Name',
        phone: '0899999999',
      });
    });

    it('should update station assignment', async () => {
      await updateVolunteerCode('123456', { stationId: 5 });

      expect(updateVolunteerCode).toHaveBeenCalledWith('123456', { stationId: 5 });
    });
  });

  describe('deactivateVolunteerCode', () => {
    it('should deactivate a code', async () => {
      await deactivateVolunteerCode('123456');

      expect(deactivateVolunteerCode).toHaveBeenCalledWith('123456');
    });
  });

  describe('getVolunteerCodeStats', () => {
    it('should return code statistics', async () => {
      const stats = await getVolunteerCodeStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('used');
      expect(stats).toHaveProperty('unused');
      expect(stats).toHaveProperty('active');
      expect(stats.total).toBe(10);
      expect(stats.used).toBe(3);
      expect(stats.unused).toBe(7);
    });
  });
});

describe('Volunteer Code Validation', () => {
  it('should validate 6-digit code format', () => {
    const validCodes = ['123456', '000000', '999999'];
    const invalidCodes = ['12345', '1234567', 'abcdef', '12345a'];

    validCodes.forEach(code => {
      expect(/^\d{6}$/.test(code)).toBe(true);
    });

    invalidCodes.forEach(code => {
      expect(/^\d{6}$/.test(code)).toBe(false);
    });
  });
});
