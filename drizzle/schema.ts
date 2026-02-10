import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Polling stations table - stores information about each voting unit
 */
export const pollingStations = mysqlTable("polling_stations", {
  id: int("id").autoincrement().primaryKey(),
  stationCode: varchar("stationCode", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  district: varchar("district", { length: 100 }).notNull(),
  subDistrict: varchar("subDistrict", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  registeredVoters: int("registeredVoters").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PollingStation = typeof pollingStations.$inferSelect;
export type InsertPollingStation = typeof pollingStations.$inferInsert;

/**
 * Election data table - stores voting results from each station
 */
export const electionData = mysqlTable("election_data", {
  id: int("id").autoincrement().primaryKey(),
  stationId: int("stationId").notNull(),
  electionDate: timestamp("electionDate").notNull(),
  totalVoters: int("totalVoters").default(0),
  validVotes: int("validVotes").default(0),
  invalidVotes: int("invalidVotes").default(0),
  turnout: decimal("turnout", { precision: 5, scale: 4 }),
  candidateAVotes: int("candidateAVotes").default(0),
  candidateBVotes: int("candidateBVotes").default(0),
  candidateAShare: decimal("candidateAShare", { precision: 5, scale: 4 }),
  source: mysqlEnum("source", ["official", "crowdsourced", "pvt"]).default("official"),
  isVerified: boolean("isVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ElectionData = typeof electionData.$inferSelect;
export type InsertElectionData = typeof electionData.$inferInsert;

/**
 * Evidence table - stores uploaded photos and their verification status
 */
export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  stationId: int("stationId"),
  uploaderId: int("uploaderId"),
  fileUrl: varchar("fileUrl", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 256 }).notNull(),
  fileHash: varchar("fileHash", { length: 128 }),
  mimeType: varchar("mimeType", { length: 64 }),
  metadata: json("metadata"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  capturedAt: timestamp("capturedAt"),
  isVerified: boolean("isVerified").default(false),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "tampered", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Evidence = typeof evidence.$inferSelect;
export type InsertEvidence = typeof evidence.$inferInsert;

/**
 * Fraud alerts table - stores detected anomalies
 */
export const fraudAlerts = mysqlTable("fraud_alerts", {
  id: int("id").autoincrement().primaryKey(),
  stationId: int("stationId"),
  alertType: mysqlEnum("alertType", ["ballot_stuffing", "vote_stealing", "benford_violation", "spatial_anomaly", "pvt_gap", "time_jump"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium"),
  alphaScore: decimal("alphaScore", { precision: 5, scale: 4 }),
  betaScore: decimal("betaScore", { precision: 5, scale: 4 }),
  zScore: decimal("zScore", { precision: 8, scale: 4 }),
  description: text("description"),
  evidenceIds: json("evidenceIds"),
  isResolved: boolean("isResolved").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FraudAlert = typeof fraudAlerts.$inferSelect;
export type InsertFraudAlert = typeof fraudAlerts.$inferInsert;

/**
 * Network transactions table - for Social Network Analysis
 */
export const networkTransactions = mysqlTable("network_transactions", {
  id: int("id").autoincrement().primaryKey(),
  sourceNode: varchar("sourceNode", { length: 128 }).notNull(),
  targetNode: varchar("targetNode", { length: 128 }).notNull(),
  transactionType: mysqlEnum("transactionType", ["money_transfer", "communication", "social_share"]).default("money_transfer"),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetworkTransaction = typeof networkTransactions.$inferSelect;
export type InsertNetworkTransaction = typeof networkTransactions.$inferInsert;

/**
 * Data snapshots table - for time-series anomaly detection
 */
export const dataSnapshots = mysqlTable("data_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  snapshotTime: timestamp("snapshotTime").defaultNow().notNull(),
  source: varchar("source", { length: 128 }).notNull(),
  totalVotes: int("totalVotes").default(0),
  candidateATotal: int("candidateATotal").default(0),
  candidateBTotal: int("candidateBTotal").default(0),
  rawData: json("rawData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DataSnapshot = typeof dataSnapshots.$inferSelect;
export type InsertDataSnapshot = typeof dataSnapshots.$inferInsert;

/**
 * Volunteers table - for tracking volunteer assignments and submissions
 */
export const volunteers = mysqlTable("volunteers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stationId: int("stationId"),
  volunteerCode: varchar("volunteerCode", { length: 32 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  status: mysqlEnum("status", ["pending", "active", "inactive"]).default("pending"),
  assignedAt: timestamp("assignedAt"),
  lastActiveAt: timestamp("lastActiveAt"),
  submissionCount: int("submissionCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;

/**
 * Volunteer submissions table - for tracking PVT data submissions
 * Supports both OAuth-based volunteers (volunteerId) and code-based volunteers (volunteerCode)
 */
export const volunteerSubmissions = mysqlTable("volunteer_submissions", {
  id: int("id").autoincrement().primaryKey(),
  volunteerId: int("volunteerId"), // nullable - for OAuth volunteers
  volunteerCode: varchar("volunteerCode", { length: 6 }), // nullable - for code-based volunteers
  stationId: int("stationId").notNull(),
  photoUrl: varchar("photoUrl", { length: 512 }),
  photoKey: varchar("photoKey", { length: 256 }),
  totalVoters: int("totalVoters").default(0),
  validVotes: int("validVotes").default(0),
  invalidVotes: int("invalidVotes").default(0),
  candidateAVotes: int("candidateAVotes").default(0),
  candidateBVotes: int("candidateBVotes").default(0),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending"),
  verifiedBy: int("verifiedBy"),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VolunteerSubmission = typeof volunteerSubmissions.$inferSelect;
export type InsertVolunteerSubmission = typeof volunteerSubmissions.$inferInsert;


/**
 * Volunteer access codes table - for login without registration
 * Codes are 6-digit numbers generated by admin
 */
export const volunteerCodes = mysqlTable("volunteer_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 6 }).notNull().unique(),
  stationId: int("stationId"),
  volunteerName: varchar("volunteerName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  lineId: varchar("lineId", { length: 100 }),
  isUsed: boolean("isUsed").default(false),
  isActive: boolean("isActive").default(true),
  usedAt: timestamp("usedAt"),
  lastAccessAt: timestamp("lastAccessAt"),
  expiresAt: timestamp("expiresAt"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VolunteerCode = typeof volunteerCodes.$inferSelect;
export type InsertVolunteerCode = typeof volunteerCodes.$inferInsert;

/**
 * OCR Results table - stores OCR scan results from each polling station image
 */
export const ocrResults = mysqlTable('ocr_results', {
  id: int('id').autoincrement().primaryKey(),
  stationCode: varchar('station_code', { length: 64 }),
  province: varchar('province', { length: 100 }),
  constituency: varchar('constituency', { length: 10 }),
  district: varchar('district', { length: 100 }),
  documentType: mysqlEnum('document_type', ['ss5_11', 'ss5_18', 'unknown']).default('unknown'),
  scoringMethod: mysqlEnum('scoring_method', ['tally', 'numeric', 'mixed']).default('numeric'),
  provider: varchar('provider', { length: 32 }),
  totalVoters: int('total_voters'),
  totalBallots: int('total_ballots'),
  spoiledBallots: int('spoiled_ballots').default(0),
  votesData: json('votes_data'),
  rawText: text('raw_text'),
  confidence: int('confidence').default(0),
  imageUrl: varchar('image_url', { length: 512 }),
  imageKey: varchar('image_key', { length: 256 }),
  uploadedBy: varchar('uploaded_by', { length: 64 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type OcrResult = typeof ocrResults.$inferSelect;
export type InsertOcrResult = typeof ocrResults.$inferInsert;

/**
 * Cross-validation alerts - stores discrepancies between ส.ส.5/11 and ส.ส.5/18
 */
export const crossValidationAlerts = mysqlTable('cross_validation_alerts', {
  id: int('id').autoincrement().primaryKey(),
  stationCode: varchar('station_code', { length: 64 }).notNull(),
  province: varchar('province', { length: 100 }),
  constituency: varchar('constituency', { length: 10 }),
  district: varchar('district', { length: 100 }),
  ss511ResultId: int('ss511_result_id'),
  ss518ResultId: int('ss518_result_id'),
  isMatch: boolean('is_match').default(false),
  overallConfidence: int('overall_confidence').default(0),
  discrepancies: json('discrepancies'),
  candidateMatches: json('candidate_matches'),
  summary: text('summary'),
  severity: mysqlEnum('severity', ['low', 'medium', 'high', 'critical']).default('medium'),
  isResolved: boolean('is_resolved').default(false),
  resolvedBy: varchar('resolved_by', { length: 64 }),
  resolvedAt: timestamp('resolved_at'),
  resolvedNote: text('resolved_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export type CrossValidationAlert = typeof crossValidationAlerts.$inferSelect;
export type InsertCrossValidationAlert = typeof crossValidationAlerts.$inferInsert;

// System Settings table for storing configuration
export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey().autoincrement(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});
