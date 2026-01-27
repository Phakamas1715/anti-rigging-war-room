import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db functions
vi.mock('./db', () => ({
  getSetting: vi.fn(),
  setSetting: vi.fn(),
  getAllSettings: vi.fn(),
}));

import { getSetting, setSetting, getAllSettings } from './db';

describe('Settings Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSetting', () => {
    it('should return default value when setting not found', async () => {
      vi.mocked(getSetting).mockResolvedValue('');
      const result = await getSetting('discord_webhook', '');
      expect(result).toBe('');
    });

    it('should return stored value when setting exists', async () => {
      vi.mocked(getSetting).mockResolvedValue('https://discord.com/webhook/123');
      const result = await getSetting('discord_webhook', '');
      expect(result).toBe('https://discord.com/webhook/123');
    });
  });

  describe('setSetting', () => {
    it('should save setting value', async () => {
      vi.mocked(setSetting).mockResolvedValue(undefined);
      await setSetting('discord_webhook', 'https://discord.com/webhook/123');
      expect(setSetting).toHaveBeenCalledWith('discord_webhook', 'https://discord.com/webhook/123');
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings as object', async () => {
      vi.mocked(getAllSettings).mockResolvedValue({
        discord_webhook: 'https://discord.com/webhook/123',
        line_token: 'token123',
        gap_threshold: '10',
      });
      const result = await getAllSettings();
      expect(result).toEqual({
        discord_webhook: 'https://discord.com/webhook/123',
        line_token: 'token123',
        gap_threshold: '10',
      });
    });
  });

  describe('Gap Alert Settings', () => {
    it('should get gap alert settings with defaults', async () => {
      vi.mocked(getSetting)
        .mockResolvedValueOnce('') // discord_webhook
        .mockResolvedValueOnce('') // line_token
        .mockResolvedValueOnce('10') // gap_threshold
        .mockResolvedValueOnce('false'); // gap_alert_enabled

      const discordWebhook = await getSetting('discord_webhook', '');
      const lineToken = await getSetting('line_token', '');
      const gapThreshold = await getSetting('gap_threshold', '10');
      const gapAlertEnabled = await getSetting('gap_alert_enabled', 'false');

      expect(discordWebhook).toBe('');
      expect(lineToken).toBe('');
      expect(gapThreshold).toBe('10');
      expect(gapAlertEnabled).toBe('false');
    });
  });
});
