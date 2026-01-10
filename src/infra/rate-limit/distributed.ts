import { redis, REDIS_KEYS } from '../redis/client';

/**
 * Distributed Rate Limiting using Upstash Redis
 * This provides consistent limits across all global Edge regions.
 */

interface RateLimitConfig {
    windowMs: number;
    max: number;
}

export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetAt: number }> {
    const key = `${REDIS_KEYS.RATE_LIMIT}${identifier}`;

    try {
        // Use Redis Multi for atomic operations
        const p = redis.pipeline();
        p.incr(key);
        p.pttl(key);
        const [count, ttl] = await p.exec() as [number, number];

        // If it's a new key (ttl < 0), set expiration
        if (ttl < 0) {
            await redis.pexpire(key, config.windowMs);
        }

        const success = count <= config.max;
        const remaining = Math.max(0, config.max - count);
        const resetAt = Date.now() + (ttl < 0 ? config.windowMs : ttl);

        return { success, remaining, resetAt };
    } catch (error) {
        console.error('[RateLimit] Redis error, failing open for safety:', error);
        return { success: true, remaining: 1, resetAt: Date.now() };
    }
}
