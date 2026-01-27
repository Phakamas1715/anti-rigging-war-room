import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  pollingStations, InsertPollingStation, PollingStation,
  electionData, InsertElectionData, ElectionData,
  evidence, InsertEvidence, Evidence,
  fraudAlerts, InsertFraudAlert, FraudAlert,
  networkTransactions, InsertNetworkTransaction, NetworkTransaction,
  dataSnapshots, InsertDataSnapshot, DataSnapshot
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

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

// ============ USER QUERIES ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ POLLING STATION QUERIES ============
export async function createPollingStation(station: InsertPollingStation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(pollingStations).values(station);
  return result;
}

export async function getPollingStations(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(pollingStations).limit(limit).offset(offset);
}

export async function getPollingStationByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(pollingStations).where(eq(pollingStations.stationCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ ELECTION DATA QUERIES ============
export async function createElectionData(data: InsertElectionData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(electionData).values(data);
}

export async function getElectionDataForAnalysis() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(electionData);
}

export async function getElectionDataByStation(stationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(electionData).where(eq(electionData.stationId, stationId));
}

// ============ EVIDENCE QUERIES ============
export async function createEvidence(ev: InsertEvidence) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(evidence).values(ev);
}

export async function getEvidenceByStation(stationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(evidence).where(eq(evidence.stationId, stationId));
}

export async function updateEvidenceVerification(id: number, status: "pending" | "verified" | "tampered" | "rejected", isVerified: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(evidence).set({ verificationStatus: status, isVerified }).where(eq(evidence.id, id));
}

export async function getPendingEvidence() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(evidence).where(eq(evidence.verificationStatus, "pending"));
}

// ============ FRAUD ALERT QUERIES ============
export async function createFraudAlert(alert: InsertFraudAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(fraudAlerts).values(alert);
}

export async function getFraudAlerts(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(fraudAlerts).orderBy(desc(fraudAlerts.createdAt)).limit(limit);
}

export async function getUnresolvedAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(fraudAlerts).where(eq(fraudAlerts.isResolved, false)).orderBy(desc(fraudAlerts.createdAt));
}

export async function resolveAlert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(fraudAlerts).set({ isResolved: true }).where(eq(fraudAlerts.id, id));
}

// ============ NETWORK TRANSACTION QUERIES ============
export async function createNetworkTransaction(tx: InsertNetworkTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(networkTransactions).values(tx);
}

export async function getNetworkTransactions(limit = 500) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(networkTransactions).orderBy(desc(networkTransactions.timestamp)).limit(limit);
}

// ============ DATA SNAPSHOT QUERIES ============
export async function createDataSnapshot(snapshot: InsertDataSnapshot) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(dataSnapshots).values(snapshot);
}

export async function getDataSnapshots(source: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(dataSnapshots)
    .where(eq(dataSnapshots.source, source))
    .orderBy(desc(dataSnapshots.snapshotTime))
    .limit(limit);
}

// ============ ANALYTICS QUERIES ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalStations: 0, totalAlerts: 0, unresolvedAlerts: 0, totalEvidence: 0 };
  
  const [stationCount] = await db.select({ count: sql<number>`count(*)` }).from(pollingStations);
  const [alertCount] = await db.select({ count: sql<number>`count(*)` }).from(fraudAlerts);
  const [unresolvedCount] = await db.select({ count: sql<number>`count(*)` }).from(fraudAlerts).where(eq(fraudAlerts.isResolved, false));
  const [evidenceCount] = await db.select({ count: sql<number>`count(*)` }).from(evidence);
  
  return {
    totalStations: stationCount?.count || 0,
    totalAlerts: alertCount?.count || 0,
    unresolvedAlerts: unresolvedCount?.count || 0,
    totalEvidence: evidenceCount?.count || 0
  };
}
