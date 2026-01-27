import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  pollingStations, InsertPollingStation, PollingStation,
  electionData, InsertElectionData, ElectionData,
  evidence, InsertEvidence, Evidence,
  fraudAlerts, InsertFraudAlert, FraudAlert,
  networkTransactions, InsertNetworkTransaction, NetworkTransaction,
  dataSnapshots, InsertDataSnapshot, DataSnapshot,
  volunteers, InsertVolunteer, Volunteer,
  volunteerSubmissions, InsertVolunteerSubmission, VolunteerSubmission,
  volunteerCodes, InsertVolunteerCode, VolunteerCode,
  systemSettings
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

// ============ VOLUNTEER QUERIES ============
export async function createVolunteer(volunteer: InsertVolunteer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(volunteers).values(volunteer);
}

export async function getVolunteerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(volunteers).where(eq(volunteers.userId, userId)).limit(1);
  return result[0];
}

export async function getVolunteerByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(volunteers).where(eq(volunteers.volunteerCode, code)).limit(1);
  return result[0];
}

export async function updateVolunteerStatus(id: number, status: "pending" | "active" | "inactive") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(volunteers).set({ status, lastActiveAt: new Date() }).where(eq(volunteers.id, id));
}

export async function assignVolunteerToStation(volunteerId: number, stationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(volunteers).set({ 
    stationId, 
    assignedAt: new Date(),
    status: "active" 
  }).where(eq(volunteers.id, volunteerId));
}

export async function getVolunteers(status?: "pending" | "active" | "inactive") {
  const db = await getDb();
  if (!db) return [];
  
  if (status) {
    return db.select().from(volunteers).where(eq(volunteers.status, status)).orderBy(desc(volunteers.createdAt));
  }
  return db.select().from(volunteers).orderBy(desc(volunteers.createdAt));
}

export async function getVolunteerStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, pending: 0, submissions: 0 };
  
  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteers);
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteers).where(eq(volunteers.status, "active"));
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteers).where(eq(volunteers.status, "pending"));
  const [submissionCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteerSubmissions);
  
  return {
    total: totalCount?.count || 0,
    active: activeCount?.count || 0,
    pending: pendingCount?.count || 0,
    submissions: submissionCount?.count || 0
  };
}

// ============ VOLUNTEER SUBMISSION QUERIES ============
export async function createVolunteerSubmission(submission: InsertVolunteerSubmission) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Create submission
  const result = await db.insert(volunteerSubmissions).values(submission);
  
  // Update volunteer submission count
  await db.update(volunteers)
    .set({ 
      submissionCount: sql`${volunteers.submissionCount} + 1`,
      lastActiveAt: new Date()
    })
    .where(eq(volunteers.id, submission.volunteerId));
  
  return result;
}

export async function getVolunteerSubmissions(volunteerId?: number, stationId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  if (volunteerId) {
    return db.select().from(volunteerSubmissions)
      .where(eq(volunteerSubmissions.volunteerId, volunteerId))
      .orderBy(desc(volunteerSubmissions.createdAt))
      .limit(limit);
  }
  if (stationId) {
    return db.select().from(volunteerSubmissions)
      .where(eq(volunteerSubmissions.stationId, stationId))
      .orderBy(desc(volunteerSubmissions.createdAt))
      .limit(limit);
  }
  return db.select().from(volunteerSubmissions).orderBy(desc(volunteerSubmissions.createdAt)).limit(limit);
}

export async function getPendingSubmissions() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(volunteerSubmissions)
    .where(eq(volunteerSubmissions.status, "pending"))
    .orderBy(desc(volunteerSubmissions.createdAt));
}

export async function verifySubmission(id: number, verifiedBy: number, status: "verified" | "rejected") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(volunteerSubmissions).set({ 
    status, 
    verifiedBy,
    verifiedAt: new Date()
  }).where(eq(volunteerSubmissions.id, id));
}

export async function getStationSubmissionStatus() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all stations with their submission status
  const stations = await db.select().from(pollingStations);
  const submissions = await db.select().from(volunteerSubmissions);
  
  const submissionMap = new Map<number, { count: number; latestStatus: string }>();
  submissions.forEach(sub => {
    const existing = submissionMap.get(sub.stationId);
    if (!existing || sub.createdAt > new Date(0)) {
      submissionMap.set(sub.stationId, {
        count: (existing?.count || 0) + 1,
        latestStatus: sub.status || "pending"
      });
    }
  });
  
  return stations.map(station => ({
    ...station,
    hasSubmission: submissionMap.has(station.id),
    submissionCount: submissionMap.get(station.id)?.count || 0,
    latestStatus: submissionMap.get(station.id)?.latestStatus || null
  }));
}


// ============ PVT COMPARISON QUERIES ============
export async function createCrowdsourcedResult(result: {
  stationId: number;
  volunteerId: number | null;
  totalVoters: number;
  validVotes: number;
  invalidVotes: number;
  candidateAVotes: number;
  candidateBVotes: number;
  photoUrl: string | null;
  submittedAt: Date;
  status: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Store as volunteer submission with source = "ocr"
  return db.insert(volunteerSubmissions).values({
    stationId: result.stationId,
    volunteerId: result.volunteerId || 0,
    totalVoters: result.totalVoters,
    validVotes: result.validVotes,
    invalidVotes: result.invalidVotes,
    candidateAVotes: result.candidateAVotes,
    candidateBVotes: result.candidateBVotes,
    photoUrl: result.photoUrl,
    status: result.status as "pending" | "verified" | "rejected",
  });
}

export async function getCrowdsourcedResults(stationId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get latest verified submission for this station
  const results = await db.select()
    .from(volunteerSubmissions)
    .where(eq(volunteerSubmissions.stationId, stationId))
    .orderBy(desc(volunteerSubmissions.createdAt))
    .limit(1);
  
  return results[0] || null;
}

export async function getOfficialResults(stationId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Get official election data for this station
  const results = await db.select()
    .from(electionData)
    .where(eq(electionData.stationId, stationId))
    .orderBy(desc(electionData.createdAt))
    .limit(1);
  
  return results[0] || null;
}


// ============ VOLUNTEER CODE QUERIES (No Registration Login) ============

/**
 * Generate a unique 6-digit volunteer code
 */
export function generateVolunteerCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create a new volunteer access code
 */
export async function createVolunteerCode(data: {
  stationId?: number;
  volunteerName?: string;
  phone?: string;
  lineId?: string;
  expiresAt?: Date;
  createdBy?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Generate unique code
  let code = generateVolunteerCode();
  let attempts = 0;
  
  // Ensure code is unique
  while (attempts < 10) {
    const existing = await db.select().from(volunteerCodes).where(eq(volunteerCodes.code, code)).limit(1);
    if (existing.length === 0) break;
    code = generateVolunteerCode();
    attempts++;
  }
  
  const result = await db.insert(volunteerCodes).values({
    code,
    stationId: data.stationId,
    volunteerName: data.volunteerName,
    phone: data.phone,
    lineId: data.lineId,
    expiresAt: data.expiresAt,
    createdBy: data.createdBy,
  });
  
  return { code, insertId: result[0].insertId };
}

/**
 * Bulk create volunteer codes
 */
export async function bulkCreateVolunteerCodes(count: number, createdBy?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const codes: string[] = [];
  const existingCodes = new Set<string>();
  
  // Get all existing codes first
  const existing = await db.select({ code: volunteerCodes.code }).from(volunteerCodes);
  existing.forEach(e => existingCodes.add(e.code));
  
  // Generate unique codes
  while (codes.length < count) {
    const code = generateVolunteerCode();
    if (!existingCodes.has(code) && !codes.includes(code)) {
      codes.push(code);
    }
  }
  
  // Insert all codes
  const values = codes.map(code => ({
    code,
    createdBy,
  }));
  
  await db.insert(volunteerCodes).values(values);
  
  return codes;
}

/**
 * Validate and login with volunteer code
 */
export async function loginWithVolunteerCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select().from(volunteerCodes)
    .where(and(
      eq(volunteerCodes.code, code),
      eq(volunteerCodes.isActive, true)
    ))
    .limit(1);
  
  if (results.length === 0) {
    return { success: false, error: "รหัสไม่ถูกต้องหรือถูกยกเลิกแล้ว" };
  }
  
  const volunteerCode = results[0];
  
  // Check expiration
  if (volunteerCode.expiresAt && new Date(volunteerCode.expiresAt) < new Date()) {
    return { success: false, error: "รหัสหมดอายุแล้ว" };
  }
  
  // Update usage status
  await db.update(volunteerCodes)
    .set({ 
      isUsed: true, 
      usedAt: volunteerCode.usedAt || new Date(),
      lastAccessAt: new Date()
    })
    .where(eq(volunteerCodes.id, volunteerCode.id));
  
  return { 
    success: true, 
    volunteerCode,
    stationId: volunteerCode.stationId
  };
}

/**
 * Get volunteer code by code string
 */
export async function getVolunteerCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  
  const results = await db.select().from(volunteerCodes)
    .where(eq(volunteerCodes.code, code))
    .limit(1);
  
  return results[0] || null;
}

/**
 * Get all volunteer codes with optional filters
 */
export async function getVolunteerCodes(filters?: {
  isUsed?: boolean;
  isActive?: boolean;
  stationId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(volunteerCodes);
  
  const conditions = [];
  if (filters?.isUsed !== undefined) {
    conditions.push(eq(volunteerCodes.isUsed, filters.isUsed));
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(volunteerCodes.isActive, filters.isActive));
  }
  if (filters?.stationId !== undefined) {
    conditions.push(eq(volunteerCodes.stationId, filters.stationId));
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  return query.orderBy(desc(volunteerCodes.createdAt));
}

/**
 * Update volunteer code info (name, phone, lineId, station)
 */
export async function updateVolunteerCode(code: string, data: {
  volunteerName?: string;
  phone?: string;
  lineId?: string;
  stationId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(volunteerCodes)
    .set(data)
    .where(eq(volunteerCodes.code, code));
}

/**
 * Deactivate a volunteer code
 */
export async function deactivateVolunteerCode(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.update(volunteerCodes)
    .set({ isActive: false })
    .where(eq(volunteerCodes.code, code));
}

/**
 * Get volunteer code statistics
 */
export async function getVolunteerCodeStats() {
  const db = await getDb();
  if (!db) return { total: 0, used: 0, unused: 0, active: 0 };
  
  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteerCodes);
  const [usedCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteerCodes).where(eq(volunteerCodes.isUsed, true));
  const [activeCount] = await db.select({ count: sql<number>`count(*)` }).from(volunteerCodes).where(eq(volunteerCodes.isActive, true));
  
  return {
    total: totalCount?.count || 0,
    used: usedCount?.count || 0,
    unused: (totalCount?.count || 0) - (usedCount?.count || 0),
    active: activeCount?.count || 0
  };
}

// System Settings functions

export async function getSetting(key: string, defaultValue: string = ''): Promise<string> {
  const db = await getDb();
  if (!db) return defaultValue;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return result[0]?.value ?? defaultValue;
}
export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(systemSettings)
    .values({ key, value })
    .onDuplicateKeyUpdate({ set: { value } });
}
export async function getAllSettings(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) return {};
  const results = await db.select().from(systemSettings);
  return results.reduce((acc: Record<string, string>, row: { key: string; value: string | null }) => {
    acc[row.key] = row.value ?? '';
    return acc;
  }, {} as Record<string, string>);
}
