CREATE TABLE `volunteer_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`volunteerId` int NOT NULL,
	`stationId` int NOT NULL,
	`photoUrl` varchar(512),
	`photoKey` varchar(256),
	`totalVoters` int DEFAULT 0,
	`validVotes` int DEFAULT 0,
	`invalidVotes` int DEFAULT 0,
	`candidateAVotes` int DEFAULT 0,
	`candidateBVotes` int DEFAULT 0,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`notes` text,
	`status` enum('pending','verified','rejected') DEFAULT 'pending',
	`verifiedBy` int,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteer_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stationId` int,
	`volunteerCode` varchar(32) NOT NULL,
	`phone` varchar(20),
	`status` enum('pending','active','inactive') DEFAULT 'pending',
	`assignedAt` timestamp,
	`lastActiveAt` timestamp,
	`submissionCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteers_volunteerCode_unique` UNIQUE(`volunteerCode`)
);
