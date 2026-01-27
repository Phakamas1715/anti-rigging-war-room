CREATE TABLE `data_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotTime` timestamp NOT NULL DEFAULT (now()),
	`source` varchar(128) NOT NULL,
	`totalVotes` int DEFAULT 0,
	`candidateATotal` int DEFAULT 0,
	`candidateBTotal` int DEFAULT 0,
	`rawData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `data_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` int NOT NULL,
	`electionDate` timestamp NOT NULL,
	`totalVoters` int DEFAULT 0,
	`validVotes` int DEFAULT 0,
	`invalidVotes` int DEFAULT 0,
	`turnout` decimal(5,4),
	`candidateAVotes` int DEFAULT 0,
	`candidateBVotes` int DEFAULT 0,
	`candidateAShare` decimal(5,4),
	`source` enum('official','crowdsourced','pvt') DEFAULT 'official',
	`isVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `election_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` int,
	`uploaderId` int,
	`fileUrl` varchar(512) NOT NULL,
	`fileKey` varchar(256) NOT NULL,
	`fileHash` varchar(128),
	`mimeType` varchar(64),
	`metadata` json,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`capturedAt` timestamp,
	`isVerified` boolean DEFAULT false,
	`verificationStatus` enum('pending','verified','tampered','rejected') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraud_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationId` int,
	`alertType` enum('ballot_stuffing','vote_stealing','benford_violation','spatial_anomaly','pvt_gap','time_jump') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`alphaScore` decimal(5,4),
	`betaScore` decimal(5,4),
	`zScore` decimal(8,4),
	`description` text,
	`evidenceIds` json,
	`isResolved` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fraud_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `network_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceNode` varchar(128) NOT NULL,
	`targetNode` varchar(128) NOT NULL,
	`transactionType` enum('money_transfer','communication','social_share') DEFAULT 'money_transfer',
	`amount` decimal(12,2),
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `network_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `polling_stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stationCode` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`province` varchar(100) NOT NULL,
	`district` varchar(100) NOT NULL,
	`subDistrict` varchar(100),
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`registeredVoters` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `polling_stations_id` PRIMARY KEY(`id`),
	CONSTRAINT `polling_stations_stationCode_unique` UNIQUE(`stationCode`)
);
