/**
 * Database Client - Environment Aware
 * Automatically switches between local SQLite and Turso based on NODE_ENV
 */

import { createClient } from '@libsql/client';

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

let dbUrl: string;
let authToken: string | undefined;

if (NODE_ENV === 'development' || NODE_ENV === 'test') {
    // Local SQLite file
    const dbFile = NODE_ENV === 'test' ? './data/test.db' : './data/local.db';
    dbUrl = `file:${dbFile}`;
    authToken = undefined;
    console.log(`[DB] Using local SQLite: ${dbFile}`);
} else {
    // Production: Turso remote
    if (!DATABASE_URL) {
        throw new Error('DATABASE_URL is required in production');
    }
    dbUrl = DATABASE_URL;
    authToken = DATABASE_AUTH_TOKEN;
    console.log('[DB] Using Turso (remote)');
}

export const db = createClient({
    url: dbUrl,
    authToken,
});

export type DbClient = typeof db;
