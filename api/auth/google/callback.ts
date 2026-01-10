/**
 * GET /auth/google/callback
 * Handles Google OAuth callback and creates session
 */

import { handleGoogleCallback } from '@/modules/auth/oauth.service';
import { createSession } from '@/modules/auth/session.service';
import { parseCookies } from '@/shared/utils/cookies';
import { createHandler } from '@/core/handler';

export { runtime } from '../_runtime';

export const GET = createHandler({
    handler: async ({ req }) => {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        // Validate state parameter (CSRF protection)
        const cookies = parseCookies(req.headers.get('cookie'));
        const storedState = cookies['oauth_state'];

        if (!state || !storedState || state !== storedState) {
            throw new Error('Invalid state parameter');
        }

        if (!code) {
            throw new Error('Missing authorization code');
        }

        // Exchange code for user
        const user = await handleGoogleCallback(code);

        // Create session
        const sessionCookie = await createSession(user.id, user.email);

        // Redirect to frontend with session cookie
        const redirectUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

        return new Response(null, {
            status: 302,
            headers: {
                Location: redirectUrl,
                'Set-Cookie': sessionCookie,
            },
        });
    }
});
