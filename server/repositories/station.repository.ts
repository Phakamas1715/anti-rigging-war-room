import { eq } from "drizzle-orm";
import { pollingStations, type InsertPollingStation, type PollingStation } from "../../drizzle/schema";
import { getDb } from "../db";

export class StationRepository {
  /**
   * Find station by unique code
   */
  async findByCode(code: string): Promise<PollingStation | null> {
    const db = await getDb();
    if (!db) return null;
    
    const results = await db
      .select()
      .from(pollingStations)
      .where(eq(pollingStations.stationCode, code))
      .limit(1);
    
    return results[0] || null;
  }
  
  /**
   * Find station by ID
   */
  async findById(id: number): Promise<PollingStation | null> {
    const db = await getDb();
    if (!db) return null;
    
    const results = await db
      .select()
      .from(pollingStations)
      .where(eq(pollingStations.id, id))
      .limit(1);
    
    return results[0] || null;
  }
  
  /**
   * Get all stations
   */
  async findAll(): Promise<PollingStation[]> {
    const db = await getDb();
    if (!db) return [];
    
    return db.select().from(pollingStations);
  }
  
  /**
   * Create new station with transaction support
   */
  async create(data: InsertPollingStation): Promise<PollingStation> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    const [result] = await db.insert(pollingStations).values(data);
    
    // Fetch the created station
    const created = await this.findById(Number(result.insertId));
    if (!created) throw new Error("Failed to create station");
    
    return created;
  }
  
  /**
   * Bulk create stations
   */
  async bulkCreate(stations: InsertPollingStation[]): Promise<number> {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    
    await db.insert(pollingStations).values(stations);
    return stations.length;
  }
}

export const stationRepository = new StationRepository();
