/** @format */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'globals.css');
let content = fs.readFileSync(filePath, 'utf8');

// Update light mode colors
content = content.replace('--chart-1: 12 76% 61%;', '--chart-1: 217 91% 60%;');
content = content.replace('--chart-2: 173 58% 39%;', '--chart-2: 142 76% 45%;');
content = content.replace('--chart-3: 197 37% 24%;', '--chart-3: 280 87% 65%;');
content = content.replace('--chart-4: 43 74% 66%;', '--chart-4: 31 97% 55%;');
content = content.replace('--chart-5: 27 87% 67%;', '--chart-5: 340 82% 52%;');

// Update dark mode colors
content = content.replace(
  '--chart-1: hsl(211.7880 101.9718% 78.6759%);',
  '--chart-1: hsl(217 91% 75%);'
);
content = content.replace(
  '--chart-2: hsl(217.4076 91.3672% 59.5787%);',
  '--chart-2: hsl(142 76% 50%);'
);
content = content.replace(
  '--chart-3: hsl(221.4336 86.3731% 54.0624%);',
  '--chart-3: hsl(280 87% 75%);'
);
content = content.replace(
  '--chart-4: hsl(223.6587 78.7180% 47.8635%);',
  '--chart-4: hsl(31 97% 65%);'
);
content = content.replace(
  '--chart-5: hsl(226.5426 70.0108% 39.9224%);',
  '--chart-5: hsl(340 82% 65%);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Chart colors updated to vibrant colors!');
