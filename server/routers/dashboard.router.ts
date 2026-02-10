import { router, publicProcedure } from "../_core/trpc";
import { getDashboardStats, getUnresolvedAlerts } from "../db";
import { withCache } from "../_core/cache";

export const dashboardRouter = router({
  stats: publicProcedure.query(async () => {
    return withCache('dashboard:stats', () => getDashboardStats(), 60); // Cache for 1 minute
  }),
  
  alerts: publicProcedure.query(async () => {
    return withCache('dashboard:alerts', () => getUnresolvedAlerts(), 30); // Cache for 30 seconds
  }),
});
