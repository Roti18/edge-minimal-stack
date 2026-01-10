/**
 * GET /auth/session
 * Validates and returns current session data
 */

import { validateSession } from '@/modules/auth/session.service';
import { parseCookies } from '@/shared/utils/cookies';
import { COOKIE_NAME } from '@/shared/constants';
import { createHandler } from '@/core/handler';

export { runtime } from './_runtime';

export const GET = createHandler({
    handler: async ({ req }) => {
        const cookies = parseCookies(req.headers.get('cookie') || '');
        const sessionCookie = cookies[COOKIE_NAME];

        if (!sessionCookie) {
            throw new Error('Not authenticated');
        }

        const session = await validateSession(sessionCookie);

        if (!session) {
            throw new Error('Invalid or expired session');
        }

        return {
            userId: session.userId,
            email: session.email,
            expiresAt: session.expiresAt,
        };
    }
});
