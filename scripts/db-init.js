/**
 * Database Initialization Script
 * Creates local SQLite database and applies schema
 */

import Database from 'better-sqlite3';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Ensure data directory exists
const dataDir = join(projectRoot, 'data');
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('Created data/ directory');
}

// Create database file
const dbPath = join(dataDir, 'local.db');
const db = new Database(dbPath);

console.log(`Initializing database at: ${dbPath}`);

// Read and execute schema
const schemaPath = join(projectRoot, 'src', 'infra', 'db', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

// Split by semicolon and execute each statement
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
    console.log('Schema applied successfully');
} catch (error) {
    db.exec('ROLLBACK');
    console.error('Error applying schema:', error);
    process.exit(1);
}

// Verify tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables created:', tables.map(t => t.name).join(', '));

// Show row counts
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const configCount = db.prepare('SELECT COUNT(*) as count FROM app_config').get();
const flagsCount = db.prepare('SELECT COUNT(*) as count FROM feature_flags').get();

console.log(`\nDatabase initialized:`);
console.log(`   Users: ${userCount.count}`);
console.log(`   Config: ${configCount.count}`);
console.log(`   Flags: ${flagsCount.count}`);

db.close();

console.log('\nDatabase initialization complete!');
console.log('   Run: npm run dev');
