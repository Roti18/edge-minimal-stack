/**
 * Database Reset Script
 * Deletes and recreates local database
 */

import { unlinkSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const dbPath = join(projectRoot, 'data', 'local.db');

console.log('Resetting database...');

// Delete existing database files
const filesToDelete = [
    dbPath,
    `${dbPath}-shm`,
    `${dbPath}-wal`,
];

for (const file of filesToDelete) {
    if (existsSync(file)) {
        unlinkSync(file);
        console.log(`Deleted: ${file}`);
    }
}

// Reinitialize
console.log('\nReinitializing database...');
execSync('bun scripts/db-init.js', { stdio: 'inherit' });

console.log('\nDatabase reset complete!');
