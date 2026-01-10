import { Redis } from '@upstash/redis';

/**
 * Upstash Redis Client (Global Instance)
 * Optimized for Edge Runtimes
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
    console.warn('[Redis] Configuration missing. Distributed features (Rate limiting, Config, Sessions) will be disabled or use fallbacks.');
}

export const redis = new Redis({
    url: REDIS_URL || '',
    token: REDIS_TOKEN || '',
});

/**
 * Common prefixes for key management
 */
export const REDIS_KEYS = {
    RATE_LIMIT: 'rl:',
    SESSION_BLACKLIST: 'sb:',
    CACHE: 'cache:',
} as const;
