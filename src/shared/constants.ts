/**
 * Application-wide constants
 */

export const COOKIE_NAME = 'session';

export const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
};

export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const CACHE_DURATION = {
    APP: 600, // 10 minutes
    CONFIG: 300, // 5 minutes
    FLAGS: 60, // 1 minute
} as const;

export const RATE_LIMIT = {
    AUTH: {
        MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
        WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    },
    DATA: {
        MAX: parseInt(process.env.DATA_RATE_LIMIT_MAX || '100', 10),
        WINDOW_MS: parseInt(process.env.DATA_RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 min
    },
} as const;

export const OAUTH_SCOPES = {
    GOOGLE: ['openid', 'email', 'profile'],
} as const;
