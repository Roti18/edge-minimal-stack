/**
 * HMAC Crypto Unit Tests
 */

import { describe, it, expect } from 'vitest';
import { signData, createSignedCookie, verifySignedCookie, generateState } from '@/infra/crypto/hmac';

describe('HMAC Crypto', () => {
    describe('signData', () => {
        it('should produce consistent signatures for same input', () => {
            const data = 'test-data';
            const sig1 = signData(data);
            const sig2 = signData(data);

            expect(sig1).toBe(sig2);
            expect(sig1).toHaveLength(64); // SHA-256 hex = 64 chars
        });

        it('should produce different signatures for different inputs', () => {
            const sig1 = signData('data1');
            const sig2 = signData('data2');

            expect(sig1).not.toBe(sig2);
        });
    });

    describe('createSignedCookie & verifySignedCookie', () => {
        it('should create and verify valid signed cookies', () => {
            const payload = { userId: '123', email: 'test@example.com' };

            const cookie = createSignedCookie(payload);
            expect(cookie).toContain('.'); // Format: encoded.signature

            const verified = verifySignedCookie(cookie);
            expect(verified).toEqual(payload);
        });

        it('should reject tampered cookies', () => {
            const payload = { userId: '123' };
            const cookie = createSignedCookie(payload);

            // Tamper with the cookie
            const tampered = cookie.replace('123', '456');

            const verified = verifySignedCookie(tampered);
            expect(verified).toBeNull();
        });

        it('should reject malformed cookies', () => {
            expect(verifySignedCookie('invalid')).toBeNull();
            expect(verifySignedCookie('')).toBeNull();
            expect(verifySignedCookie('only-one-part')).toBeNull();
        });
    });

    describe('generateState', () => {
        it('should generate random states', () => {
            const state1 = generateState();
            const state2 = generateState();

            expect(state1).not.toBe(state2);
            expect(state1.length).toBeGreaterThan(40); // base64url encoded 32 bytes
        });
    });
});
