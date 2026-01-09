/**
 * Development Server with tsx
 * Quick iteration without Vercel CLI overhead
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');

// Import services
import { getAppConfig, getFeatureFlags } from './services/data/config.service.js';
import { initiateGoogleOAuth, handleGoogleCallback } from './services/auth/oauth.service.js';
import { createSession, validateSession, destroySession } from './services/auth/session.service.js';
import { parseCookies } from './shared/utils/cookies.js';
import { COOKIE_NAME } from './shared/constants.js';

const app = new Hono();

// Data API (simulating edge)
app.get('/data/app', async (c) => {
    return c.json({
        success: true,
        data: {
            name: 'Edge Minimal Stack',
            version: '1.0.0',
            status: 'operational',
        },
        timestamp: Date.now(),
    });
});

app.get('/data/config', async (c) => {
    try {
        const config = await getAppConfig();
        const configObj = config.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, string>);

        return c.json({
            success: true,
            data: configObj,
            timestamp: Date.now(),
        });
    } catch (error) {
        return c.json({ success: false, error: 'Failed to fetch config', timestamp: Date.now() }, 500);
    }
});

app.get('/data/flags', async (c) => {
    try {
        const flags = await getFeatureFlags();
        const flagsObj = flags.reduce((acc, flag) => {
            acc[flag.key] = flag.enabled;
            return acc;
        }, {} as Record<string, boolean>);

        return c.json({
            success: true,
            data: flagsObj,
            timestamp: Date.now(),
        });
    } catch (error) {
        return c.json({ success: false, error: 'Failed to fetch flags', timestamp: Date.now() }, 500);
    }
});

app.get('/data/ping', async (c) => {
    return c.json({
        success: true,
        data: {
            message: 'pong',
            region: 'local',
        },
        timestamp: Date.now(),
    });
});

// Auth API (simulating Node.js runtime)
app.get('/auth/google', async (c) => {
    try {
        const { url, state } = initiateGoogleOAuth();

        c.header('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=lax; Max-Age=600`);
        return c.redirect(url, 302);
    } catch (error) {
        return c.json({ success: false, error: 'Failed to initiate OAuth', timestamp: Date.now() }, 500);
    }
});

app.get('/auth/google/callback', async (c) => {
    try {
        const code = c.req.query('code');
        const state = c.req.query('state');
        const cookies = parseCookies(c.req.header('cookie') || '');
        const storedState = cookies['oauth_state'];

        if (!state || !storedState || state !== storedState) {
            return c.json({ success: false, error: 'Invalid state parameter', timestamp: Date.now() }, 400);
        }

        if (!code) {
            return c.json({ success: false, error: 'Missing authorization code', timestamp: Date.now() }, 400);
        }

        const user = await handleGoogleCallback(code);
        const sessionCookie = createSession(user.id, user.email);

        const redirectUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
        c.header('Set-Cookie', sessionCookie);
        return c.redirect(redirectUrl, 302);
    } catch (error) {
        return c.json({ success: false, error: 'Authentication failed', timestamp: Date.now() }, 500);
    }
});

app.get('/auth/session', async (c) => {
    try {
        const cookies = parseCookies(c.req.header('cookie') || '');
        const sessionCookie = cookies[COOKIE_NAME];

        if (!sessionCookie) {
            return c.json({ success: false, error: 'Not authenticated', timestamp: Date.now() }, 401);
        }

        const session = validateSession(sessionCookie);

        if (!session) {
            return c.json({ success: false, error: 'Invalid or expired session', timestamp: Date.now() }, 401);
        }

        return c.json({
            success: true,
            data: {
                userId: session.userId,
                email: session.email,
                expiresAt: session.expiresAt,
            },
            timestamp: Date.now(),
        });
    } catch (error) {
        return c.json({ success: false, error: 'Session validation failed', timestamp: Date.now() }, 500);
    }
});

app.post('/auth/logout', async (c) => {
    const destroyCookie = destroySession();
    c.header('Set-Cookie', destroyCookie);
    return c.json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: Date.now(),
    });
});

// Landing & Docs
app.get('/', (c) => {
    const html = readFileSync(join(__dirname, '../public/index.html'), 'utf-8');
    return c.html(html);
});

app.get('/docs', (c) => {
    const html = readFileSync(join(__dirname, '../public/docs.html'), 'utf-8');
    return c.html(html);
});

// Health check
app.get('/health', (c) => {
    return c.json({
        success: true,
        data: {
            message: 'Edge Minimal Stack - Dev Server',
            mode: 'development',
            endpoints: {
                data: ['/data/app', '/data/config', '/data/flags', '/data/ping'],
                auth: ['/auth/google', '/auth/google/callback', '/auth/session', '/auth/logout'],
                pages: ['/', '/docs'],
            },
        },
        timestamp: Date.now(),
    });
});

const port = Number(process.env.PORT) || 3000;

console.log(`Dev Server running on http://localhost:${port}`);
console.log(`API Mode: Development (tsx watch)`);
console.log(`\nEndpoints:`);
console.log(`   Data API: http://localhost:${port}/data/*`);
console.log(`   Auth API: http://localhost:${port}/auth/*`);
console.log(`\nHot reload enabled - edit and save to restart\n`);

serve({
    fetch: app.fetch,
    port,
});
