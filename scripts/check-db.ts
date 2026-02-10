import 'dotenv/config';
import { getDb } from '../server/db';
import { systemSettings } from '../drizzle/schema';
import mysql from 'mysql2/promise';

async function tryDrizzle() {
  console.log('[DB.Drizzle] Attempting connection...');
  const url = process.env.DATABASE_URL;
  console.log(`[DB.Drizzle] DATABASE_URL: ${url ? `${url.split('@')[0]}@***` : 'NOT SET'}`);
  
  const db = await getDb();
  if (!db) {
    console.warn('[DB.Drizzle] getDb() returned null - check DATABASE_URL validity');
    return null;
  }

  try {
    console.log('[DB.Drizzle] Executing SELECT from system_settings...');
    const sample = await db.select().from(systemSettings).limit(5);
    console.log(`[DB.Drizzle] ✅ Success! Found ${sample.length} settings rows`);
    return { via: 'drizzle', sample };
  } catch (err: any) {
    console.error('[DB.Drizzle] ❌ Query failed');
    console.error('  Error:', err?.message ?? err);
    if (err?.cause) console.error('  Cause:', err.cause);
    if (err?.code) console.error('  Code:', err.code);
    console.error('  Stack:', err?.stack ?? 'N/A');
    return null;
  }
}

async function tryMysql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL not set in environment');
  }

  console.log('[DB.MySQL] Parsing DATABASE_URL...');
  const connStr = url.replace(/:[^:]*@/, ':***@');
  console.log(`[DB.MySQL] Connection string: ${connStr}`);

  console.log('[DB.MySQL] Creating raw mysql2 connection...');
  const conn = await mysql.createConnection(url);
  
  try {
    console.log('[DB.MySQL] Testing connection with SELECT DATABASE()...');
    const [dbRow] = await conn.query('SELECT DATABASE() AS db, NOW() AS now');
    console.log(`[DB.MySQL] ✅ Connected to database:`, dbRow);

    console.log('[DB.MySQL] Fetching table list with SHOW TABLES...');
    const [tables] = await conn.query('SHOW TABLES');
    const tableCount = Array.isArray(tables) ? tables.length : 0;
    console.log(`[DB.MySQL] ✅ Found ${tableCount} tables`);
    
    if (tableCount > 0) {
      const tableNames = (tables as any[]).map((t: Record<string, any>) => {
        const key = Object.keys(t)[0];
        return key ? t[key] : JSON.stringify(t);
      });
      console.log(`[DB.MySQL] Tables (first 10): ${tableNames.slice(0, 10).join(', ')}`);
    }
    
    return { via: 'mysql2', dbRow, tables };
  } finally {
    await conn.end();
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('DATABASE CONNECTION CHECK');
  console.log('═══════════════════════════════════════════════════════\n');

  // Try Drizzle first
  console.log('[1/2] Trying Drizzle ORM + server/db.ts...\n');
  const d = await tryDrizzle();
  if (d) {
    console.log('\n✅ DATABASE CONNECTION SUCCESSFUL (via Drizzle)\n');
    process.exit(0);
  }

  // Fall back to raw mysql2
  console.log('\n[2/2] Trying raw mysql2 connection as fallback...\n');
  try {
    const m = await tryMysql();
    console.log('\n✅ DATABASE CONNECTION SUCCESSFUL (via mysql2)\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ DATABASE CONNECTION FAILED\n');
    console.error('Error message:', err?.message ?? err);
    console.error('Error code:', err?.code ?? 'N/A');
    console.error('Error errno:', err?.errno ?? 'N/A');
    console.error('Stack trace:', err?.stack ?? 'N/A');
    
    console.error('\n═══════════════════════════════════════════════════════');
    console.error('TROUBLESHOOTING STEPS:');
    console.error('1. Check MySQL is running: sudo systemctl status mysql');
    console.error('2. Verify DATABASE_URL in .env (format: mysql://user:pass@host:port/db)');
    console.error('3. Test connection: mysql -h 127.0.0.1 -u root -ppassword');
    console.error('4. Run migrations: pnpm db:push');
    console.error('5. Use Docker: docker-compose -f docker-compose.yml up -d');
    console.error('═══════════════════════════════════════════════════════\n');
    process.exit(3);
  }
}

main().catch((err) => {
  console.error('[FATAL] Uncaught error in main():', err);
  process.exit(4);
});
