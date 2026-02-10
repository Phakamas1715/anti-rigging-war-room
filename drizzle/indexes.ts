import { mysqlTable, int, index } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/**
 * Database schema with performance indexes
 * Run: pnpm db:push to apply these changes
 */

// Add indexes to existing schema for performance

export const pollingStationsIndexes = [
  index("idx_station_code").on(sql`stationCode`),
  index("idx_province").on(sql`province`),
  index("idx_district").on(sql`district, province`),
];

export const electionDataIndexes = [
  index("idx_station_date").on(sql`stationId, electionDate`),
  index("idx_election_date").on(sql`electionDate`),
  index("idx_source").on(sql`source`),
];

export const volunteerSubmissionsIndexes = [
  index("idx_volunteer_station").on(sql`volunteerId, stationId`),
  index("idx_station_submissions").on(sql`stationId, submittedAt DESC`),
  index("idx_status").on(sql`status`),
];

export const fraudAlertsIndexes = [
  index("idx_detected_at").on(sql`detectedAt DESC`),
  index("idx_status").on(sql`status`),
  index("idx_severity").on(sql`severity, status`),
];

/*
-- SQL Migration to add indexes
-- Add to drizzle/migrations/*.sql

CREATE INDEX idx_station_code ON polling_stations(stationCode);
CREATE INDEX idx_province ON polling_stations(province);
CREATE INDEX idx_district ON polling_stations(district, province);

CREATE INDEX idx_station_date ON election_data(stationId, electionDate);
CREATE INDEX idx_election_date ON election_data(electionDate);
CREATE INDEX idx_source ON election_data(source);

CREATE INDEX idx_volunteer_station ON volunteer_submissions(volunteerId, stationId);
CREATE INDEX idx_station_submissions ON volunteer_submissions(stationId, submittedAt DESC);
CREATE INDEX idx_status ON volunteer_submissions(status);

CREATE INDEX idx_detected_at ON fraud_alerts(detectedAt DESC);
CREATE INDEX idx_alert_status ON fraud_alerts(status);
CREATE INDEX idx_severity ON fraud_alerts(severity, status);
*/
