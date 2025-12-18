import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

// Users table
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Projects table
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sourceType: mysqlEnum("sourceType", ["site", "instagram", "tiktok", "description"]).notNull(),
  sourceUrl: text("sourceUrl"),
  sourceDescription: text("sourceDescription"),
  analysis: json("analysis"),
  // Kit de Marca
  logoUrl: text("logoUrl"),
  colorPaletteId: varchar("colorPaletteId", { length: 50 }),
  customColors: json("customColors"),
  defaultTemplateId: varchar("defaultTemplateId", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Ideal Clients table
export const idealClients = mysqlTable("idealClients", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  demographics: json("demographics"),
  psychographics: json("psychographics"),
  isSelected: boolean("isSelected").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Pains table
export const pains = mysqlTable("pains", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  level: mysqlEnum("level", ["primary", "secondary", "unexplored"]).notNull(),
  pain: text("pain").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Contents table
export const contents = mysqlTable("contents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["carousel", "image", "video"]).notNull(),
  template: varchar("template", { length: 100 }).notNull(),
  title: text("title"),
  description: text("description"),
  hook: text("hook"),
  hookType: varchar("hookType", { length: 50 }),
  formula: varchar("formula", { length: 20 }),
  objective: mysqlEnum("objective", ["sale", "authority", "growth"]).default("authority"),
  person: mysqlEnum("person", ["first", "second", "third"]).default("second"),
  clickbait: boolean("clickbait").default(false),
  status: mysqlEnum("status", ["draft", "generating", "ready", "published"]).default("draft"),
  batchId: varchar("batchId", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Slides table
export const slides = mysqlTable("slides", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull(),
  order: int("order").notNull(),
  text: text("text"),
  imageUrl: text("imageUrl"),
  imagePrompt: text("imagePrompt"),
  imageBank: json("imageBank"),
  selectedImageIndex: int("selectedImageIndex").default(0),
  // Template visual completo
  designTemplateId: varchar("designTemplateId", { length: 50 }),
  colorPaletteId: varchar("colorPaletteId", { length: 50 }),
  customColors: json("customColors"),
  renderedImageUrl: text("renderedImageUrl"),
  visualTemplate: varchar("visualTemplate", { length: 50 }),
  style: json("style"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Influencers table
export const influencers = mysqlTable("influencers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  niche: varchar("niche", { length: 255 }),
  type: mysqlEnum("type", ["normal", "transformation"]).default("normal"),
  description: text("description"),
  photoUrl: text("photoUrl"),
  referenceImageUrl: text("referenceImageUrl"),
  beforeImageUrl: text("beforeImageUrl"),
  afterImageUrl: text("afterImageUrl"),
  style: json("style"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Influencer Contents table
export const influencerContents = mysqlTable("influencerContents", {
  id: int("id").autoincrement().primaryKey(),
  influencerId: int("influencerId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["carousel", "image", "video"]).notNull(),
  template: varchar("template", { length: 100 }).notNull(),
  title: text("title"),
  description: text("description"),
  hook: text("hook"),
  status: mysqlEnum("status", ["draft", "generating", "ready", "published"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Influencer Slides table
export const influencerSlides = mysqlTable("influencerSlides", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull(),
  order: int("order").notNull(),
  text: text("text"),
  imageUrl: text("imageUrl"),
  imagePrompt: text("imagePrompt"),
  imageBank: json("imageBank"),
  selectedImageIndex: int("selectedImageIndex").default(0),
  style: json("style"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Trends table
export const trends = mysqlTable("trends", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: mysqlEnum("source", ["google", "tiktok"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  classification: mysqlEnum("classification", ["emerging", "rising", "peak", "declining"]),
  viralProbability: int("viralProbability"),
  suggestedNiches: json("suggestedNiches"),
  collectedAt: timestamp("collectedAt").defaultNow().notNull(),
});

// Virals table
export const virals = mysqlTable("virals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: mysqlEnum("source", ["viralhog", "reddit"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }),
  viralProbability: int("viralProbability"),
  suggestedNiches: json("suggestedNiches"),
  suggestedAngles: json("suggestedAngles"),
  expiresAt: timestamp("expiresAt"),
  collectedAt: timestamp("collectedAt").defaultNow().notNull(),
});

// User Settings table
export const userSettings = mysqlTable("userSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  defaultStyle: json("defaultStyle"),
  trendAlertEnabled: boolean("trendAlertEnabled").default(true),
  trendAlertThreshold: int("trendAlertThreshold").default(70),
  trendAlertCategories: json("trendAlertCategories"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type IdealClient = typeof idealClients.$inferSelect;
export type Pain = typeof pains.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type InsertContent = typeof contents.$inferInsert;
export type Slide = typeof slides.$inferSelect;
export type InsertSlide = typeof slides.$inferInsert;
export type Influencer = typeof influencers.$inferSelect;
export type InsertInfluencer = typeof influencers.$inferInsert;
export type InfluencerContent = typeof influencerContents.$inferSelect;
export type InfluencerSlide = typeof influencerSlides.$inferSelect;
export type Trend = typeof trends.$inferSelect;
export type Viral = typeof virals.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
