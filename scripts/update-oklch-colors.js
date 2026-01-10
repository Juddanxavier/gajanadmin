/** @format */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Light mode OKLCH - Vibrant colors
// Chart 1: Bright Blue
content = content.replace(
  '--chart-1: oklch(0.4341 0.0392 41.9938);',
  '--chart-1: oklch(0.65 0.25 250);'
);

// Chart 2: Vibrant Green
content = content.replace(
  '--chart-2: oklch(0.9200 0.0651 74.3695);',
  '--chart-2: oklch(0.65 0.25 150);'
);

// Chart 3: Rich Purple
content = content.replace(
  '--chart-3: oklch(0.9310 0 0);',
  '--chart-3: oklch(0.70 0.25 300);'
);

// Chart 4: Bright Orange
content = content.replace(
  '--chart-4: oklch(0.9367 0.0523 75.5009);',
  '--chart-4: oklch(0.70 0.25 50);'
);

// Chart 5: Vibrant Pink
content = content.replace(
  '--chart-5: oklch(0.4338 0.0437 41.6746);',
  '--chart-5: oklch(0.65 0.25 350);'
);

// Dark mode OKLCH - Lighter vibrant colors for dark backgrounds
// Chart 1: Light Blue
content = content.replace(
  '--chart-1: oklch(0.9247 0.0524 66.1732);',
  '--chart-1: oklch(0.75 0.20 250);'
);

// Chart 2: Bright Green
content = content.replace(
  '--chart-2: oklch(0.3163 0.0190 63.6992);',
  '--chart-2: oklch(0.70 0.20 150);'
);

// Chart 3: Light Purple
content = content.replace(
  '--chart-3: oklch(0.2850 0 0);',
  '--chart-3: oklch(0.75 0.20 300);'
);

// Chart 4: Bright Orange
content = content.replace(
  '--chart-4: oklch(0.3481 0.0219 67.0001);',
  '--chart-4: oklch(0.75 0.20 50);'
);

// Chart 5: Bright Pink
content = content.replace(
  '--chart-5: oklch(0.9245 0.0533 67.0855);',
  '--chart-5: oklch(0.75 0.20 350);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ OKLCH chart colors updated to VIBRANT colors!');
console.log('🎨 Colors are now much more saturated and eye-catching!');
