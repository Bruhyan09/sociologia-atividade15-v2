import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : undefined });
try { const sql = await readFile(new URL('../migrations/001_init.sql', import.meta.url), 'utf8'); await pool.query(sql); console.log('Migrations aplicadas.'); } finally { await pool.end(); }
