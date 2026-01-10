/**
 * HMAC signing utilities for session cookies (Edge Runtime Compatible)
 */

const SECRET = process.env.SESSION_SECRET;

// Helper to convert string to ArrayBuffer
const encoder = new TextEncoder();

async function getCryptoKey() {
    if (!SECRET || SECRET.length < 32) {
        throw new Error('SESSION_SECRET must be configured and at least 32 characters');
    }
    const keyData = encoder.encode(SECRET);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/**
 * Sign data using Web Crypto API
 */
export async function signData(data: string): Promise<string> {
    const key = await getCryptoKey();
    const dataUint8 = encoder.encode(data);
    const signature = await crypto.subtle.sign('HMAC', key, dataUint8);

    // Convert to hex string
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Create a signed session cookie string
 */
export async function createSignedCookie(payload: object): Promise<string> {
    const data = JSON.stringify(payload);
    // base64url encoding
    const encoded = btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const signature = await signData(encoded);
    return `${encoded}.${signature}`;
}

/**
 * Verify a signed session cookie
 */
export async function verifySignedCookie(cookie: string): Promise<object | null> {
    const parts = cookie.split('.');
    if (parts.length !== 2) return null;

    const [encoded, signature] = parts;
    const expectedSignature = await signData(encoded!);

    // Timing-safe comparison is hard with strings, but signData re-hashing is common practice
    // here we just compare the hex signatures
    if (signature !== expectedSignature) return null;

    try {
        // base64url decoding
        const base64 = encoded!
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const json = atob(base64);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Generate a secure random state for OAuth
 */
export function generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
