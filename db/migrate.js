import fs from 'node:fs/promises';
import { sql } from '../api/_lib/db.js';

const source = await fs.readFile(new URL('./schema.sql', import.meta.url), 'utf8');
for (const statement of source.split(';').map((part) => part.trim()).filter(Boolean)) {
  await sql.query(statement);
}
console.log('Neon schema is ready.');
