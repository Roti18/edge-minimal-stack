/**
 * Database Query Script
 * Opens interactive SQLite shell using bun:sqlite
 */

import { Database } from 'bun:sqlite';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as接口readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'data', 'local.db');

if (!existsSync(dbPath)) {
    console.error('Database not found. Run: bun db:init');
    process.exit(1);
}

const db = new Database(dbPath);

console.log('Bun SQLite Interactive Shell');
console.log(`   Database: ${dbPath}`);
console.log('   Type SQL queries or .exit to quit\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'sqlite> '
});

rl.prompt();

rl.on('line', (line) => {
    const query = line.trim();

    if (query === '.exit' || query === 'exit' || query === 'quit') {
        console.log('Goodbye!');
        db.close();
        process.exit(0);
    }

    if (query === '.tables') {
        const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log('Tables:', tables.map(t => t.name).join(', '));
        rl.prompt();
        return;
    }

    if (!query) {
        rl.prompt();
        return;
    }

    try {
        if (query.toLowerCase().startsWith('select')) {
            const results = db.query(query).all();
            console.table(results);
        } else {
            const result = db.run(query);
            console.log(`Executed. Changes: ${result.changes}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }

    rl.prompt();
});

rl.on('close', () => {
    db.close();
    process.exit(0);
});
