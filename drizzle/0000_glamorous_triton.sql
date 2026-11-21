CREATE TABLE `clips` (
	`slug` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`image` text NOT NULL,
	`genre` text NOT NULL,
	`sub` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clips_url_unique` ON `clips` (`url`);