ALTER TABLE `volunteer_submissions` MODIFY COLUMN `volunteerId` int;--> statement-breakpoint
ALTER TABLE `volunteer_submissions` ADD `volunteerCode` varchar(6);