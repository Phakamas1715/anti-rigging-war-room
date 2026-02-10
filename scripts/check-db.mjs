import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[DB] No DATABASE_URL set in environment');
  process.exit(2);
}

(async () => {
  try {
    const conn = await mysql.createConnection(url);
    console.log('[DB] Connected');
    const [rows] = await conn.query('SELECT DATABASE() as db, NOW() as now');
    console.log('[DB] Server info:', rows);
    const [tables] = await conn.query('SHOW TABLES');
    console.log('[DB] Tables count:', Array.isArray(tables) ? tables.length : 0);
    console.log('[DB] Tables sample (first 20):', tables.slice(0, 20));
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error('[DB] Connection failed:', err.message || err);
    process.exit(3);
  }
})();
