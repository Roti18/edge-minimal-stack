/**
 * Database Migration Script
 * Applies schema to local database (idempotent)
 */

import { Database } from 'bun:sqlite';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'data', 'local.db');

if (!existsSync(dbPath)) {
    console.error('Database not found. Run: bun db:init');
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

db.run('BEGIN TRANSACTION');

try {
    for (const statement of statements) {
        db.run(statement);
    }
    db.run('COMMIT');
    console.log('Schema migrated successfully');
} catch (error) {
    db.run('ROLLBACK');
    console.error('Migration error:', error);
    process.exit(1);
}

db.close();

console.log('Migration complete!');
