/**
 * GET /auth/google
 * Initiates Google OAuth flow with state parameter for CSRF protection
 */

import { initiateGoogleOAuth } from '@/services/auth/oauth.service';

export { runtime } from './_runtime';

export async function GET(_request: Request): Promise<Response> {
    try {
        const { url, state } = initiateGoogleOAuth();

        return new Response(null, {
            status: 302,
            headers: {
                Location: url,
                'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=lax; Max-Age=600`,
            },
        });
    } catch (error) {
        console.error('OAuth initiation error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to initiate OAuth', timestamp: Date.now() }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
