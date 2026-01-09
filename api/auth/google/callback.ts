/**
 * GET /auth/google/callback
 * Handles Google OAuth callback and creates session
 */

import { handleGoogleCallback } from '@/services/auth/oauth.service';
import { createSession } from '@/services/auth/session.service';
import { parseCookies } from '@/shared/utils/cookies';
import { errorResponse } from '@/shared/utils/response';

export { runtime } from '../_runtime';

export async function GET(request: Request): Promise<Response> {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');

        // Validate state parameter (CSRF protection)
        const cookies = parseCookies(request.headers.get('cookie'));
        const storedState = cookies['oauth_state'];

        if (!state || !storedState || state !== storedState) {
            return errorResponse('Invalid state parameter', 400);
        }

        if (!code) {
            return errorResponse('Missing authorization code', 400);
        }

        // Exchange code for user
        const user = await handleGoogleCallback(code);

        // Create session
        const sessionCookie = createSession(user.id, user.email);

        // Redirect to frontend with session cookie
        const redirectUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

        return new Response(null, {
            status: 302,
            headers: {
                Location: redirectUrl,
                'Set-Cookie': sessionCookie,
            },
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        return errorResponse('Authentication failed', 500);
    }
}
