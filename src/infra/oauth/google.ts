/**
 * Google OAuth 2.0 Client
 * Implements REQUIRED security: state parameter for CSRF protection
 */

import { OAUTH_SCOPES } from '@/shared/constants';
import type { OAuthTokenResponse, GoogleUserProfile } from '@/domain/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

// Lazy initialization - warn but don't crash if not configured
let _isConfigured = false;
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    console.warn('[OAuth] Google OAuth not configured - auth endpoints will not work');
} else {
    _isConfigured = true;
    console.log('[OAuth] Google OAuth configured');
}

function checkConfigured() {
    if (!_isConfigured) {
        throw new Error('Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI');
    }
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export function generateAuthUrl(state: string): string {
    checkConfigured();
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        response_type: 'code',
        scope: OAUTH_SCOPES.GOOGLE.join(' '),
        state, // MANDATORY: anti-CSRF protection
        access_type: 'online',
        prompt: 'select_account',
    });

    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: GOOGLE_CLIENT_ID!,
            client_secret: GOOGLE_CLIENT_SECRET!,
            redirect_uri: GOOGLE_REDIRECT_URI!,
            grant_type: 'authorization_code',
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to exchange code for token');
    }

    return response.json() as Promise<OAuthTokenResponse>;
}

export async function fetchUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user profile');
    }

    return response.json() as Promise<GoogleUserProfile>;
}
