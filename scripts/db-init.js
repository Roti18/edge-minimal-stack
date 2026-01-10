/**
 * Database Initialization Script
 * Creates local SQLite database and applies schema
 */

import { Database } from 'bun:sqlite';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Pastikan direktori data ada
const dataDir = join(projectRoot, 'data');
if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
}

const dbPath = join(dataDir, 'local.db');
const db = new Database(dbPath);

console.log(`Initializing database at: ${dbPath}`);

// Aktifkan WAL mode untuk performa maksimal (sesuai docs Bun)
db.run("PRAGMA journal_mode = WAL;");

// Baca schema dan eksekusi SEKALIGUS (Bun mendukung multi-query dalam .run)
const schemaPath = join(projectRoot, 'src', 'infra', 'db', 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

try {
    db.run(schema);
    console.log('✅ Schema applied successfully');
} catch (error) {
    console.error('❌ Error applying schema:', error.message);
    process.exit(1);
}

// Verifikasi Tabel
const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

// Cek Isi Data
try {
    const userCount = db.query('SELECT COUNT(*) as count FROM users').get();
    const configCount = db.query('SELECT COUNT(*) as count FROM app_config').get();
    console.log(`\nStats: ${userCount.count} Users, ${configCount.count} Config items.`);
} catch (e) {
    console.log('\nStats: No data yet.');
}

db.close();
console.log('\nDatabase initialization complete! 🚀');
