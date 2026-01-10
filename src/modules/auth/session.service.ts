/**
 * Session Service (Edge Runtime Compatible)
 * Stateless session management with HMAC-signed cookies and global revocation.
 */

import { createSignedCookie, verifySignedCookie } from '@/infra/crypto/hmac';
import { serializeCookie, deleteCookie } from '@/shared/utils/cookies';
import { SESSION_DURATION_MS } from '@/shared/constants';
import { redis, REDIS_KEYS } from '@/infra/redis/client';
import type { SessionData } from '@/domain/auth';

export async function createSession(userId: string, email: string): Promise<string> {
    const now = Date.now();
    const sessionData: SessionData = {
        userId,
        email,
        issuedAt: now,
        expiresAt: now + SESSION_DURATION_MS,
    };

    const signedCookie = await createSignedCookie(sessionData);
    return serializeCookie(signedCookie, SESSION_DURATION_MS / 1000);
}

export async function validateSession(cookieValue: string): Promise<SessionData | null> {
    const payload = await verifySignedCookie(cookieValue);
    if (!payload) return null;

    const session = payload as SessionData;

    // 1. Check expiration
    if (session.expiresAt < Date.now()) {
        return null;
    }

    // 2. Check blacklist (Global Revocation)
    // We use a unique key per user + issue time or a session ID if added
    const blacklistKey = `${REDIS_KEYS.SESSION_BLACKLIST}${session.userId}:${session.issuedAt}`;
    const isBlacklisted = await redis.get(blacklistKey);
    if (isBlacklisted) {
        return null;
    }

    return session;
}

/**
 * Revoke a specific session globally
 */
export async function revokeSession(session: SessionData): Promise<void> {
    const blacklistKey = `${REDIS_KEYS.SESSION_BLACKLIST}${session.userId}:${session.issuedAt}`;
    const ttl = Math.ceil((session.expiresAt - Date.now()) / 1000);

    if (ttl > 0) {
        await redis.set(blacklistKey, '1', { ex: ttl });
    }
}

export function destroySession(): string {
    return deleteCookie();
}
