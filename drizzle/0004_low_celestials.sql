ALTER TABLE `projects` ADD `logoUrl` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `colorPaletteId` varchar(50);--> statement-breakpoint
ALTER TABLE `projects` ADD `customColors` json;--> statement-breakpoint
ALTER TABLE `projects` ADD `defaultTemplateId` varchar(50);--> statement-breakpoint
ALTER TABLE `slides` ADD `designTemplateId` varchar(50);--> statement-breakpoint
ALTER TABLE `slides` ADD `colorPaletteId` varchar(50);--> statement-breakpoint
ALTER TABLE `slides` ADD `customColors` json;--> statement-breakpoint
ALTER TABLE `slides` ADD `renderedImageUrl` text;