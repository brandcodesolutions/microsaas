CREATE TABLE `appointments` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_name` text NOT NULL,
	`email` text,
	`phone` text,
	`service` text NOT NULL,
	`professional` text,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`observations` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`user_id` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);