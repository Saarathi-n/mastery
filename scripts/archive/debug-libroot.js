import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const raw = process.env.LIBRARY_ROOT;
console.log('RAW:', raw);
console.log('RAW JSON:', JSON.stringify(raw));

const normalized = String(raw || '')
  .replace(/\r?\n/g, '\\n')
  .trim()
  .replace(/^['"]|['"]$/g, '');

console.log('NORMALIZED:', normalized);
console.log('NORMALIZED JSON:', JSON.stringify(normalized));

const check = path.join(normalized, '11th biology');
console.log('CHECK PATH:', check);
console.log('exists?', fs.existsSync(check));
try {
  if (fs.existsSync(check)) console.log('stat:', fs.statSync(check));
} catch (e) {
  console.error('stat error', e.message);
}
