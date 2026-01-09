/**
 * Auth Domain Types
 * Pure types and interfaces for authentication
 */

export interface User {
    id: string;
    email: string;
    name: string;
    avatar_url?: string;
    oauth_provider: 'google';
    oauth_provider_id: string;
    created_at: number;
    updated_at: number;
}

export interface SessionData {
    userId: string;
    email: string;
    issuedAt: number;
    expiresAt: number;
}

export interface GoogleUserProfile {
    id: string;
    email: string;
    name: string;
    picture?: string;
}

export interface OAuthTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    id_token?: string;
}
