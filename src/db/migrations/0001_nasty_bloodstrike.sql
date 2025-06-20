CREATE TABLE `flow_metrics` (
	`id` integer PRIMARY KEY NOT NULL,
	`consecutive_sessions` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`flow_intensity` text DEFAULT 'medium' NOT NULL,
	`distraction_count` integer DEFAULT 0 NOT NULL,
	`session_start_time` integer,
	`total_focus_time` integer DEFAULT 0 NOT NULL,
	`average_session_length` real DEFAULT 25 NOT NULL,
	`best_flow_duration` real DEFAULT 0 NOT NULL,
	`last_session_date` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`type` text NOT NULL,
	`target` integer NOT NULL,
	`current` integer DEFAULT 0 NOT NULL,
	`unit` text NOT NULL,
	`is_completed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`deadline` text,
	`reward` text
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`duration` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text,
	`distractions` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`time_duration` integer DEFAULT 25 NOT NULL,
	`break_duration` integer DEFAULT 5 NOT NULL,
	`sound_effects` integer DEFAULT true NOT NULL,
	`notifications` integer DEFAULT true NOT NULL,
	`dark_mode` integer DEFAULT false NOT NULL,
	`auto_break` integer DEFAULT false NOT NULL,
	`focus_reminders` integer DEFAULT true NOT NULL,
	`weekly_reports` integer DEFAULT true NOT NULL,
	`data_sync` integer DEFAULT true NOT NULL,
	`notification_status` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `statistics` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`total_flows` integer DEFAULT 0 NOT NULL,
	`started_flows` integer DEFAULT 0 NOT NULL,
	`completed_flows` integer DEFAULT 0 NOT NULL,
	`total_focus_time` integer DEFAULT 0 NOT NULL,
	`total_breaks` integer DEFAULT 0 NOT NULL,
	`total_break_time` integer DEFAULT 0 NOT NULL,
	`interruptions` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `statistics_date_unique` ON `statistics` (`date`);--> statement-breakpoint
CREATE TABLE `theme` (
	`id` integer PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'auto' NOT NULL,
	`accent_color` text DEFAULT 'green' NOT NULL,
	`timer_style` text DEFAULT 'digital' NOT NULL,
	`custom_themes` text DEFAULT '{}' NOT NULL,
	`active_custom_theme` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
