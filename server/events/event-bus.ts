/**
 * Event Bus for decoupled alert notifications
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface Events {
  'fraud.detected': { type: string; severity: string; data: any };
  'volunteer.submitted': { volunteerId: number; stationId: number };
  'gap.detected': { stationId: number; gap: number };
}

class EventBus {
  private handlers: Map<keyof Events, Set<EventHandler>> = new Map();
  
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
  }
  
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>) {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
    }
  }
  
  async emit<K extends keyof Events>(event: K, data: Events[K]) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    
    // Execute all handlers in parallel
    await Promise.allSettled(
      Array.from(handlers).map(handler => 
        Promise.resolve(handler(data))
      )
    );
  }
}

export const eventBus = new EventBus();

// Setup alert handlers
eventBus.on('fraud.detected', async (alert) => {
  // Import dynamically to avoid circular dependencies
  const { createFraudAlert } = await import('../db');
  const { sendKlimekAlert } = await import('../lineNotify');
  const { sendKlimekAlert: sendDiscordAlert } = await import('../discordNotify');
  
  try {
    await createFraudAlert({
      alertType: alert.type as any,
      severity: alert.severity as any,
      description: JSON.stringify(alert.data),
      stationId: alert.data.stationId,
    });
    
    // Send notifications in parallel (fire and forget)
    Promise.all([
      sendKlimekAlert(
        process.env.LINE_NOTIFY_TOKEN || '',
        alert.data.alpha,
        alert.data.beta,
        alert.data.province
      ),
      sendDiscordAlert(
        process.env.DISCORD_WEBHOOK_URL || '',
        alert.data.alpha,
        alert.data.beta,
        alert.data.province
      ),
    ]).catch(err => console.error('[EventBus] Alert notification failed:', err));
  } catch (error) {
    console.error('[EventBus] Failed to handle fraud.detected:', error);
  }
});
