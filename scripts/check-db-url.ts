
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envFiles = ['.env', '.env.local'];
let hasDbUrl = false;
for (const file of envFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('DATABASE_URL=')) {
        hasDbUrl = true;
        console.log(`Found DATABASE_URL in ${file}`);
        // Extract it to verify format (postgres://...)
        const match = content.match(/DATABASE_URL=["']?(postgres(?:ql)?:\/\/[^"']+)["']?/);
        if (match) {
            console.log("Format looks valid.");
        }
    }
  }
}

if (!hasDbUrl) {
    console.log("DATABASE_URL not found.");
}
