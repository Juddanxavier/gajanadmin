/** @format */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Remove OKLCH chart color definitions in :root section (around line 215-219)
content = content.replace(
  /--chart-1: oklch\([^)]+\);/g,
  '/* Removed - using HSL format above */'
);
content = content.replace(
  /--chart-2: oklch\([^)]+\);/g,
  '/* Removed - using HSL format above */'
);
content = content.replace(
  /--chart-3: oklch\([^)]+\);/g,
  '/* Removed - using HSL format above */'
);
content = content.replace(
  /--chart-4: oklch\([^)]+\);/g,
  '/* Removed - using HSL format above */'
);
content = content.replace(
  /--chart-5: oklch\([^)]+\);/g,
  '/* Removed - using HSL format above */'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log(
  '✅ Removed OKLCH chart colors - now using Shadcn HSL format only!'
);
console.log('🎨 Chart colors are now consistent with Shadcn standards');
