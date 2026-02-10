import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";

let _db: MySql2Database | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * Transaction wrapper for safe multi-table operations
 */
export async function withTransaction<T>(
  callback: (tx: MySql2Database) => Promise<T>
): Promise<T> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  return db.transaction(async (tx) => {
    return callback(tx);
  });
}

/**
 * Batch operation helper to reduce N+1 queries
 */
export async function batchOperation<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await operation(batch);
    results.push(...batchResults);
  }
  
  return results;
}
