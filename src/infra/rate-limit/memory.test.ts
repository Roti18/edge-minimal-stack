/**
 * Rate Limiter Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimiter } from '@/infra/rate-limit/memory';

describe('Rate Limiter', () => {
    beforeEach(() => {
        // Clear rate limit state between tests
        rateLimiter.check('test-reset', 100, 60000);
    });

    it('should allow requests within limit', () => {
        const result1 = rateLimiter.check('test-key', 3, 60000);
        expect(result1.allowed).toBe(true);
        expect(result1.remaining).toBe(2);

        const result2 = rateLimiter.check('test-key', 3, 60000);
        expect(result2.allowed).toBe(true);
        expect(result2.remaining).toBe(1);

        const result3 = rateLimiter.check('test-key', 3, 60000);
        expect(result3.allowed).toBe(true);
        expect(result3.remaining).toBe(0);
    });

    it('should block requests over limit', () => {
        // Exhaust the limit
        rateLimiter.check('test-key-2', 2, 60000);
        rateLimiter.check('test-key-2', 2, 60000);

        // Next request should be blocked
        const blocked = rateLimiter.check('test-key-2', 2, 60000);
        expect(blocked.allowed).toBe(false);
        expect(blocked.remaining).toBe(0);
    });

    it('should isolate different keys', () => {
        rateLimiter.check('key-a', 1, 60000);
        const resultA = rateLimiter.check('key-a', 1, 60000);
        expect(resultA.allowed).toBe(false);

        // Different key should still be allowed
        const resultB = rateLimiter.check('key-b', 1, 60000);
        expect(resultB.allowed).toBe(true);
    });

    it('should reset after window expires', async () => {
        const shortWindow = 100; // 100ms

        // Exhaust limit
        rateLimiter.check('test-key-3', 1, shortWindow);
        const blocked = rateLimiter.check('test-key-3', 1, shortWindow);
        expect(blocked.allowed).toBe(false);

        // Wait for window to expire
        await new Promise(resolve => setTimeout(resolve, 150));

        // Should be allowed again
        const allowed = rateLimiter.check('test-key-3', 1, shortWindow);
        expect(allowed.allowed).toBe(true);
    });
});
