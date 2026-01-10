/**
 * Development Server (Edge Stack Optimized)
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Import updated modules (formerly services)
import { getAppConfig, getFeatureFlags } from './modules/data/config.service.js';
import { initiateGoogleOAuth, handleGoogleCallback } from './modules/auth/oauth.service.js';
import { createSession, validateSession, destroySession } from './modules/auth/session.service.js';
import { parseCookies } from './shared/utils/cookies.js';
import { COOKIE_NAME } from './shared/constants.js';

const app = new Hono();

// Global Middleware
app.use('*', logger());

/**
 * Data API
 */
app.get('/data/config', async (c) => {
    try {
        const config = await getAppConfig();
        const configObj = config.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, string>);

        return c.json({ success: true, data: configObj, timestamp: Date.now() });
    } catch (error) {
        return c.json({ success: false, error: 'Failed' }, 500);
    }
});

app.get('/data/flags', async (c) => {
    try {
        const flags = await getFeatureFlags();
        const flagsObj = flags.reduce((acc, flag) => {
            acc[flag.key] = flag.enabled;
            return acc;
        }, {} as Record<string, boolean>);

        return c.json({ success: true, data: flagsObj, timestamp: Date.now() });
    } catch (error) {
        return c.json({ success: false, error: 'Failed' }, 500);
    }
});

/**
 * Auth API
 */
app.get('/auth/google', async (c) => {
    const { url, state } = initiateGoogleOAuth();
    c.header('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=lax; Max-Age=600`);
    return c.redirect(url, 302);
});

app.get('/auth/google/callback', async (c) => {
    try {
        const code = c.req.query('code');
        const state = c.req.query('state');
        const cookies = parseCookies(c.req.header('cookie') || '');
        const storedState = cookies['oauth_state'];

        if (!state || !storedState || state !== storedState || !code) {
            return c.json({ success: false, error: 'Invalid OAuth flow' }, 400);
        }

        const user = await handleGoogleCallback(code);
        const sessionCookie = await createSession(user.id, user.email);

        const redirectUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
        c.header('Set-Cookie', sessionCookie);
        return c.redirect(redirectUrl, 302);
    } catch (error) {
        return c.json({ success: false, error: 'Auth failed' }, 500);
    }
});

app.get('/auth/session', async (c) => {
    const cookies = parseCookies(c.req.header('cookie') || '');
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) return c.json({ success: false, error: 'No session' }, 401);

    const session = await validateSession(sessionCookie);
    if (!session) return c.json({ success: false, error: 'Invalid session' }, 401);

    return c.json({ success: true, data: session, timestamp: Date.now() });
});

app.post('/auth/logout', async (c) => {
    const destroyCookie = destroySession();
    c.header('Set-Cookie', destroyCookie);
    return c.json({ success: true, data: { message: 'Logged out' } });
});

// UI Routes
app.get('/', (c) => c.html(readFileSync(join(__dirname, '../public/index.html'), 'utf-8')));
app.get('/docs', (c) => c.html(readFileSync(join(__dirname, '../public/docs.html'), 'utf-8')));

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });

console.log(`\x1b[32m[EdgeStack]\x1b[0m Dev server running on http://localhost:${port}`);
