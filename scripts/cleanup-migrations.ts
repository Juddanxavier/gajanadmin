
import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
const keepFiles = ['20260101_consolidated_full.sql', 'README.md'];

if (!fs.existsSync(migrationsDir)) {
    console.error('Migrations dir not found');
    process.exit(1);
}

const files = fs.readdirSync(migrationsDir);

console.log(`Checking ${files.length} files in ${migrationsDir}...`);

files.forEach(file => {
    if (keepFiles.includes(file)) {
        console.log(`KEEP: ${file}`);
        return;
    }
    
    // Only delete .sql files to be safe
    if (file.endsWith('.sql')) {
        console.log(`DELETE: ${file}`);
        fs.unlinkSync(path.join(migrationsDir, file));
    } else {
        console.log(`SKIP (not .sql): ${file}`);
    }
});

console.log('Cleanup complete.');
