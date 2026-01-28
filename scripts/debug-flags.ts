/** @format */

import * as Flags from 'country-flag-icons/react/3x2';

console.log('Flags keys:', Object.keys(Flags).slice(0, 10));
console.log('Has GB?', 'GB' in Flags);
console.log('Has UK?', 'UK' in Flags);
console.log('Has US?', 'US' in Flags);
