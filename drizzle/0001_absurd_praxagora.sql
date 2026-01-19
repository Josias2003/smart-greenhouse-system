CREATE TABLE `actuators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`greenhouseId` int NOT NULL,
	`type` enum('PUMP','FAN','LIGHT') NOT NULL,
	`state` int NOT NULL DEFAULT 0,
	`lastToggled` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actuators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`scientificName` varchar(150),
	`stages` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crops_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `decisionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`greenhouseId` int NOT NULL,
	`actuatorType` enum('PUMP','FAN','LIGHT') NOT NULL,
	`action` enum('ON','OFF') NOT NULL,
	`reason` text NOT NULL,
	`cropName` varchar(100),
	`growthStage` varchar(50),
	`sensorValues` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `decisionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `greenhouses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`selectedCropId` int,
	`plantingDate` timestamp,
	`systemMode` enum('AUTO','MANUAL') NOT NULL DEFAULT 'AUTO',
	`cloudConnected` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `greenhouses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensorReadings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`greenhouseId` int NOT NULL,
	`temperature` int NOT NULL,
	`humidity` int NOT NULL,
	`soilMoisture` int NOT NULL,
	`lightLevel` int NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensorReadings_id` PRIMARY KEY(`id`)
);
