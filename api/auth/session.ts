/**
 * GET /auth/session
 * Validates and returns current session data
 */

import { validateSession } from '@/services/auth/session.service';
import { parseCookies } from '@/shared/utils/cookies';
import { jsonResponse, errorResponse } from '@/shared/utils/response';
import { COOKIE_NAME } from '@/shared/constants';

export { runtime } from './_runtime';

export async function GET(request: Request): Promise<Response> {
    try {
        const cookies = parseCookies(request.headers.get('cookie'));
        const sessionCookie = cookies[COOKIE_NAME];

        if (!sessionCookie) {
            return errorResponse('Not authenticated', 401);
        }

        const session = validateSession(sessionCookie);

        if (!session) {
            return errorResponse('Invalid or expired session', 401);
        }

        return jsonResponse({
            userId: session.userId,
            email: session.email,
            expiresAt: session.expiresAt,
        });
    } catch (error) {
        console.error('Session validation error:', error);
        return errorResponse('Session validation failed', 500);
    }
}
