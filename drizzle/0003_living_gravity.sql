CREATE TABLE `volunteer_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`stationId` int,
	`volunteerName` varchar(255),
	`phone` varchar(20),
	`lineId` varchar(100),
	`isUsed` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`usedAt` timestamp,
	`lastAccessAt` timestamp,
	`expiresAt` timestamp,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `volunteer_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteer_codes_code_unique` UNIQUE(`code`)
);
