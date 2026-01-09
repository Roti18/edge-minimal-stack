/**
 * Cookie utilities (edge-safe)
 */

import { COOKIE_NAME, COOKIE_OPTIONS } from '../constants';

export function serializeCookie(value: string, maxAge: number): string {
    const options = {
        ...COOKIE_OPTIONS,
        maxAge,
    };

    const parts = [`${COOKIE_NAME}=${value}`];

    if (options.maxAge) {
        parts.push(`Max-Age=${options.maxAge}`);
    }
    if (options.path) {
        parts.push(`Path=${options.path}`);
    }
    if (options.httpOnly) {
        parts.push('HttpOnly');
    }
    if (options.secure) {
        parts.push('Secure');
    }
    if (options.sameSite) {
        parts.push(`SameSite=${options.sameSite}`);
    }

    return parts.join('; ');
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
    if (!cookieHeader) return {};

    return cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
            acc[key] = decodeURIComponent(value);
        }
        return acc;
    }, {} as Record<string, string>);
}

export function deleteCookie(): string {
    return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=lax`;
}
