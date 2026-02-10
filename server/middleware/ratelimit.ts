import { TRPCError } from "@trpc/server";
import type { Request } from "express";

interface RateLimitStore {
  [key: string]: { count: number; resetAt: number };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter
 * For production, use Redis-based solution like @upstash/ratelimit
 */
export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return async (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `ratelimit:${ip}`;
    const now = Date.now();
    
    const record = store[key];
    
    if (!record || now > record.resetAt) {
      store[key] = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      return;
    }
    
    if (record.count >= options.maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: options.message || `Rate limit exceeded. Try again in ${Math.ceil((record.resetAt - now) / 1000)} seconds.`,
      });
    }
    
    record.count++;
  };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);
