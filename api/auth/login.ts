/**
 * POST /auth/login
 * Email/password login with rate limiting
 * Note: This is a placeholder for future implementation
 */

import { rateLimiter } from '@/infra/rate-limit/memory';
import { RATE_LIMIT } from '@/shared/constants';
import { errorResponse } from '@/shared/utils/response';

export { runtime } from './_runtime';

export async function POST(_request: Request): Promise<Response> {
    // Rate limiting
    const clientIp = _request.headers.get('x-forwarded-for') || 'unknown';
    const { allowed } = rateLimiter.check(
        `login:${clientIp}`,
        RATE_LIMIT.AUTH.MAX,
        RATE_LIMIT.AUTH.WINDOW_MS
    );

    if (!allowed) {
        return errorResponse('Too many login attempts. Please try again later.', 429);
    }

    // TODO: Implement email/password authentication
    // For now, redirect to OAuth
    return errorResponse('Email/password login not implemented. Use /auth/google', 501);
}
