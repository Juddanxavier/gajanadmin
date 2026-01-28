/** @format */

import * as XLSX from 'xlsx';
import path from 'path';

const filePath =
  'c:\\websites\\kajen\\gajan\\admin\\Dail booking details as on 24th Jan 2026.xlsx';

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Read first 2 rows to understand structure
  const data = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range: 0,
    defval: '',
  });

  console.log('--- EXCEL HEADERS ---');
  console.log(JSON.stringify(data[0], null, 2));

  console.log('\n--- FIRST ROW DATA ---');
  console.log(JSON.stringify(data[1], null, 2));
} catch (error) {
  console.error('Error reading file:', error);
}
