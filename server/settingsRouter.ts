import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getSetting, setSetting, getAllSettings } from './db';

export const settingsRouter = router({
  get: protectedProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const value = await getSetting(input.key, '');
      return { key: input.key, value };
    }),

  set: protectedProcedure
    .input(z.object({ key: z.string(), value: z.string() }))
    .mutation(async ({ input }) => {
      await setSetting(input.key, input.value);
      return { success: true };
    }),

  getAll: protectedProcedure.query(async () => {
    const settings = await getAllSettings();
    return settings;
  }),

  getGapAlertSettings: protectedProcedure.query(async () => {
    const [discordWebhook, lineToken, gapThreshold, gapAlertEnabled] = await Promise.all([
      getSetting('discord_webhook', ''),
      getSetting('line_token', ''),
      getSetting('gap_threshold', '10'),
      getSetting('gap_alert_enabled', 'false'),
    ]);
    return {
      discordWebhook,
      lineToken,
      gapThreshold: parseInt(gapThreshold) || 10,
      gapAlertEnabled: gapAlertEnabled === 'true',
    };
  }),

  saveGapAlertSettings: protectedProcedure
    .input(z.object({
      discordWebhook: z.string().optional(),
      lineToken: z.string().optional(),
      gapThreshold: z.number().optional(),
      gapAlertEnabled: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const promises = [];
      if (input.discordWebhook !== undefined) {
        promises.push(setSetting('discord_webhook', input.discordWebhook));
      }
      if (input.lineToken !== undefined) {
        promises.push(setSetting('line_token', input.lineToken));
      }
      if (input.gapThreshold !== undefined) {
        promises.push(setSetting('gap_threshold', input.gapThreshold.toString()));
      }
      if (input.gapAlertEnabled !== undefined) {
        promises.push(setSetting('gap_alert_enabled', input.gapAlertEnabled.toString()));
      }
      await Promise.all(promises);
      return { success: true };
    }),
});
