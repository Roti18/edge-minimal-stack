/**
 * In-memory rate limiter
 * 
 * WARNING: This is BEST-EFFORT rate limiting, NOT globally consistent:
 * - Edge: Per-isolate, per-region (not shared across edge locations)
 * - Node.js: Per-instance, resets on cold start
 * - Purpose: Cost protection and basic abuse prevention only
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private cleanupInterval: NodeJS.Timeout | number | null = null;

    constructor() {
        // Cleanup old entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.store.entries()) {
                if (entry.resetAt < now) {
                    this.store.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }

    check(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number } {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || entry.resetAt < now) {
            // New window
            this.store.set(key, {
                count: 1,
                resetAt: now + windowMs,
            });
            return { allowed: true, remaining: max - 1 };
        }

        if (entry.count >= max) {
            return { allowed: false, remaining: 0 };
        }

        entry.count++;
        return { allowed: true, remaining: max - entry.count };
    }

    cleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval as NodeJS.Timeout);
        }
        this.store.clear();
    }
}

export const rateLimiter = new RateLimiter();
