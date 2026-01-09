/**
 * OAuth Service
 * Coordinates OAuth flow with security checks
 */

import { generateAuthUrl, exchangeCodeForToken, fetchUserProfile } from '@/infra/oauth/google';
import { generateState } from '@/infra/crypto/hmac';
import { db } from '@/infra/db/client';
import type { User, GoogleUserProfile } from '@/domain/auth';
import { randomBytes } from 'crypto';

export function initiateGoogleOAuth(): { url: string; state: string } {
    const state = generateState();
    const url = generateAuthUrl(state);
    return { url, state };
}

export async function handleGoogleCallback(code: string): Promise<User> {
    // Exchange code for token
    const tokenResponse = await exchangeCodeForToken(code);

    // Fetch user profile
    const profile = await fetchUserProfile(tokenResponse.access_token);

    // Upsert user in database
    const user = await upsertUser(profile);

    return user;
}

async function upsertUser(profile: GoogleUserProfile): Promise<User> {
    const now = Date.now();

    // Check if user exists
    const existing = await db.execute({
        sql: 'SELECT * FROM users WHERE oauth_provider = ? AND oauth_provider_id = ?',
        args: ['google', profile.id],
    });

    if (existing.rows.length > 0) {
        // Update existing user
        const row = existing.rows[0]!;
        await db.execute({
            sql: 'UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?',
            args: [profile.name, profile.picture || null, now, row.id as string],
        });

        return {
            id: row.id as string,
            email: row.email as string,
            name: profile.name,
            avatar_url: profile.picture,
            oauth_provider: 'google',
            oauth_provider_id: profile.id,
            created_at: row.created_at as number,
            updated_at: now,
        };
    }

    // Create new user
    const userId = randomBytes(16).toString('hex');
    await db.execute({
        sql: `INSERT INTO users (id, email, name, avatar_url, oauth_provider, oauth_provider_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [userId, profile.email, profile.name, profile.picture || null, 'google', profile.id, now, now],
    });

    return {
        id: userId,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.picture,
        oauth_provider: 'google',
        oauth_provider_id: profile.id,
        created_at: now,
        updated_at: now,
    };
}
