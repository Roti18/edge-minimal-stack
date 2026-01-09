/**
 * Database Migration Script
 * Applies schema to local database (idempotent)
 */

import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'data', 'local.db');

if (!existsSync(dbPath)) {
    console.error('Database not found. Run: npm run db:init');
    process.exit(1);
}

const db = new Database(dbPath);

console.log(`Migrating database: ${dbPath}`);

// Read schema
const schemaPath = join(projectRoot, 'src', 'infra', 'db', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

db.exec('BEGIN TRANSACTION');

try {
    for (const statement of statements) {
        db.exec(statement);
    }
    db.exec('COMMIT');
    console.log('Schema migrated successfully');
} catch (error) {
    db.exec('ROLLBACK');
    console.error('Migration error:', error);
    process.exit(1);
}

db.close();

console.log('Migration complete!');
