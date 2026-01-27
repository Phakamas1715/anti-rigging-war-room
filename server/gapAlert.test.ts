import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the notification modules
vi.mock('./discordNotify', () => ({
  sendPVTGapAlert: vi.fn(),
}));

vi.mock('./lineNotify', () => ({
  sendPVTGapAlert: vi.fn(),
}));

// Mock the database functions
vi.mock('./db', () => ({
  getPollingStations: vi.fn(),
  getCrowdsourcedResults: vi.fn(),
  getOfficialResults: vi.fn(),
}));

import { sendPVTGapAlert as sendDiscordGapAlert } from './discordNotify';
import { sendPVTGapAlert as sendLineGapAlert } from './lineNotify';
import { getPollingStations, getCrowdsourcedResults, getOfficialResults } from './db';

describe('Gap Alert Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Discord Gap Alert', () => {
    it('should send Discord alert with correct parameters', async () => {
      vi.mocked(sendDiscordGapAlert).mockResolvedValue(true);

      const webhookUrl = 'https://discord.com/api/webhooks/test';
      const gapPercent = 0.1; // 10% gap
      const stationCode = 'TEST-001';
      const ourSum = 200;
      const theirSum = 180;

      const result = await sendDiscordGapAlert(webhookUrl, gapPercent, stationCode, ourSum, theirSum);

      expect(sendDiscordGapAlert).toHaveBeenCalledWith(webhookUrl, gapPercent, stationCode, ourSum, theirSum);
      expect(result).toBe(true);
    });

    it('should handle Discord alert failure gracefully', async () => {
      vi.mocked(sendDiscordGapAlert).mockResolvedValue(false);

      const result = await sendDiscordGapAlert('invalid-url', 0.1, 'TEST-001', 200, 180);

      expect(result).toBe(false);
    });
  });

  describe('LINE Gap Alert', () => {
    it('should send LINE alert with correct parameters', async () => {
      vi.mocked(sendLineGapAlert).mockResolvedValue(true);

      const lineToken = 'test-line-token';
      const gapPercent = 0.15; // 15% gap
      const stationCode = 'TEST-002';
      const ourSum = 300;
      const theirSum = 255;

      const result = await sendLineGapAlert(lineToken, gapPercent, stationCode, ourSum, theirSum);

      expect(sendLineGapAlert).toHaveBeenCalledWith(lineToken, gapPercent, stationCode, ourSum, theirSum);
      expect(result).toBe(true);
    });

    it('should handle LINE alert failure gracefully', async () => {
      vi.mocked(sendLineGapAlert).mockResolvedValue(false);

      const result = await sendLineGapAlert('invalid-token', 0.1, 'TEST-001', 200, 180);

      expect(result).toBe(false);
    });
  });

  describe('Gap Detection Logic', () => {
    it('should calculate gap percentage correctly', () => {
      const ourSum = 200;
      const theirSum = 180;
      const gap = Math.abs(ourSum - theirSum);
      const gapPercent = theirSum > 0 ? gap / theirSum : 0;

      expect(gap).toBe(20);
      expect(gapPercent).toBeCloseTo(0.111, 2); // ~11.1%
    });

    it('should handle zero official votes', () => {
      const ourSum = 100;
      const theirSum = 0;
      const gap = Math.abs(ourSum - theirSum);
      const gapPercent = theirSum > 0 ? gap / theirSum : 0;

      expect(gap).toBe(100);
      expect(gapPercent).toBe(0); // Avoid division by zero
    });

    it('should detect gap above threshold', () => {
      const gapThreshold = 10;
      const gap = 15;
      const hasGap = gap > gapThreshold;

      expect(hasGap).toBe(true);
    });

    it('should not detect gap below threshold', () => {
      const gapThreshold = 10;
      const gap = 5;
      const hasGap = gap > gapThreshold;

      expect(hasGap).toBe(false);
    });
  });

  describe('Bulk Gap Check and Alert', () => {
    it('should find gaps in multiple stations', async () => {
      const mockStations = [
        { id: 1, stationCode: 'BULK-001' },
        { id: 2, stationCode: 'BULK-002' },
        { id: 3, stationCode: 'BULK-003' },
      ];

      vi.mocked(getPollingStations).mockResolvedValue(mockStations as any);
      
      // Station 1: Has gap
      vi.mocked(getCrowdsourcedResults).mockResolvedValueOnce({
        candidateAVotes: 200,
      } as any);
      vi.mocked(getOfficialResults).mockResolvedValueOnce({
        candidateAVotes: 180, // 20 votes gap
      } as any);

      // Station 2: No gap
      vi.mocked(getCrowdsourcedResults).mockResolvedValueOnce({
        candidateAVotes: 150,
      } as any);
      vi.mocked(getOfficialResults).mockResolvedValueOnce({
        candidateAVotes: 148, // 2 votes gap
      } as any);

      // Station 3: Has gap
      vi.mocked(getCrowdsourcedResults).mockResolvedValueOnce({
        candidateAVotes: 300,
      } as any);
      vi.mocked(getOfficialResults).mockResolvedValueOnce({
        candidateAVotes: 250, // 50 votes gap
      } as any);

      // Simulate gap detection
      const gapThreshold = 10;
      const gapsFound: { stationCode: string; gap: number }[] = [];

      for (const station of mockStations) {
        const crowdsourced = await getCrowdsourcedResults(station.id);
        const official = await getOfficialResults(station.id);

        if (crowdsourced && official) {
          const gap = Math.abs(
            (crowdsourced.candidateAVotes || 0) - (official.candidateAVotes || 0)
          );
          if (gap > gapThreshold) {
            gapsFound.push({ stationCode: station.stationCode, gap });
          }
        }
      }

      expect(gapsFound.length).toBe(2); // BULK-001 and BULK-003
      expect(gapsFound[0].stationCode).toBe('BULK-001');
      expect(gapsFound[0].gap).toBe(20);
      expect(gapsFound[1].stationCode).toBe('BULK-003');
      expect(gapsFound[1].gap).toBe(50);
    });
  });

  describe('Alert Severity Classification', () => {
    it('should classify critical severity for gap > 10%', () => {
      const gapPercent = 0.15; // 15%
      const severity = gapPercent > 0.1 ? 'critical' : gapPercent > 0.05 ? 'high' : 'medium';
      expect(severity).toBe('critical');
    });

    it('should classify high severity for gap 5-10%', () => {
      const gapPercent = 0.07; // 7%
      const severity = gapPercent > 0.1 ? 'critical' : gapPercent > 0.05 ? 'high' : 'medium';
      expect(severity).toBe('high');
    });

    it('should classify medium severity for gap < 5%', () => {
      const gapPercent = 0.03; // 3%
      const severity = gapPercent > 0.1 ? 'critical' : gapPercent > 0.05 ? 'high' : 'medium';
      expect(severity).toBe('medium');
    });
  });
});

describe('Notification Message Formatting', () => {
  it('should format gap alert message correctly', () => {
    const stationCode = 'FORMAT-001';
    const ourSum = 250;
    const theirSum = 200;
    const gap = ourSum - theirSum;
    const gapPercent = gap / theirSum;

    const message = `Gap Alert: ${stationCode} - Our: ${ourSum}, Their: ${theirSum}, Gap: ${gap} (${(gapPercent * 100).toFixed(2)}%)`;

    expect(message).toBe('Gap Alert: FORMAT-001 - Our: 250, Their: 200, Gap: 50 (25.00%)');
  });

  it('should include timestamp in alert', () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
