/**
 * HMAC signing utilities for session cookies (Node.js only)
 */

import { createHmac, randomBytes } from 'crypto';

const SECRET = process.env.SESSION_SECRET;

if (!SECRET || SECRET.length < 32) {
    console.warn('[Crypto] SESSION_SECRET not configured or too short - session endpoints will not work');
}

export function signData(data: string): string {
    if (!SECRET || SECRET.length < 32) {
        throw new Error('SESSION_SECRET must be configured and at least 32 characters');
    }
    const hmac = createHmac('sha256', SECRET);
    hmac.update(data);
    return hmac.digest('hex');
}

export function createSignedCookie(payload: object): string {
    const data = JSON.stringify(payload);
    const encoded = Buffer.from(data).toString('base64url');
    const signature = signData(encoded);
    return `${encoded}.${signature}`;
}

export function verifySignedCookie(cookie: string): object | null {
    const parts = cookie.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const expectedSignature = signData(encoded!);

    // Constant-time comparison
    if (signature !== expectedSignature) return null;

    try {
        const data = Buffer.from(encoded!, 'base64url').toString('utf-8');
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function generateState(): string {
    return randomBytes(32).toString('base64url');
}
