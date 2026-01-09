/**
 * Session Service (Node.js only)
 * Stateless session management with HMAC-signed cookies
 */

import { createSignedCookie, verifySignedCookie } from '@/infra/crypto/hmac';
import { serializeCookie, deleteCookie } from '@/shared/utils/cookies';
import { SESSION_DURATION_MS } from '@/shared/constants';
import type { SessionData } from '@/domain/auth';

export function createSession(userId: string, email: string): string {
    const now = Date.now();
    const sessionData: SessionData = {
        userId,
        email,
        issuedAt: now,
        expiresAt: now + SESSION_DURATION_MS,
    };

    const signedCookie = createSignedCookie(sessionData);
    return serializeCookie(signedCookie, SESSION_DURATION_MS / 1000);
}

export function validateSession(cookieValue: string): SessionData | null {
    const payload = verifySignedCookie(cookieValue);
    if (!payload) return null;

    const session = payload as SessionData;

    // Check expiration
    if (session.expiresAt < Date.now()) {
        return null;
    }

    return session;
}

export function destroySession(): string {
    return deleteCookie();
}
