import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  projects, InsertProject, Project,
  idealClients, IdealClient,
  pains, Pain,
  contents, InsertContent, Content,
  slides, InsertSlide, Slide,
  influencers, InsertInfluencer, Influencer,
  influencerContents, InfluencerContent,
  influencerSlides, InfluencerSlide,
  trends, Trend,
  virals, Viral,
  userSettings, UserSettings
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER FUNCTIONS =====
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  if (user.name !== undefined) { values.name = user.name; updateSet.name = user.name; }
  if (user.email !== undefined) { values.email = user.email; updateSet.email = user.email; }
  if (user.loginMethod !== undefined) { values.loginMethod = user.loginMethod; updateSet.loginMethod = user.loginMethod; }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ===== PROJECT FUNCTIONS =====
export async function createProject(data: InsertProject): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return result[0].insertId;
}

export async function getProjectsByUser(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function updateProject(id: number, data: Partial<Project>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

export async function updateProjectBrandKit(id: number, data: {
  logoUrl?: string;
  colorPaletteId?: string;
  customColors?: { background?: string; text?: string; accent?: string };
  defaultTemplateId?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = {};
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.colorPaletteId !== undefined) updateData.colorPaletteId = data.colorPaletteId;
  if (data.customColors !== undefined) updateData.customColors = data.customColors;
  if (data.defaultTemplateId !== undefined) updateData.defaultTemplateId = data.defaultTemplateId;
  if (Object.keys(updateData).length > 0) {
    await db.update(projects).set(updateData).where(eq(projects.id, id));
  }
}

// ===== IDEAL CLIENTS FUNCTIONS =====
export async function createIdealClients(projectId: number, clients: { name: string; description?: string; demographics?: unknown; psychographics?: unknown }[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values = clients.map(c => ({
    projectId,
    name: c.name || 'Cliente',
    description: c.description || null,
    demographics: c.demographics || null,
    psychographics: c.psychographics || null,
  }));
  if (values.length > 0) {
    await db.insert(idealClients).values(values);
  }
}

export async function getIdealClientsByProject(projectId: number): Promise<IdealClient[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(idealClients).where(eq(idealClients.projectId, projectId));
}

export async function updateIdealClient(id: number, data: Partial<IdealClient>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(idealClients).set(data).where(eq(idealClients.id, id));
}

export async function deleteIdealClientsByProject(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(idealClients).where(eq(idealClients.projectId, projectId));
}

export async function getSelectedIdealClientsByProject(projectId: number): Promise<IdealClient[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(idealClients).where(and(eq(idealClients.projectId, projectId), eq(idealClients.isSelected, true)));
}

// ===== PAINS FUNCTIONS =====
export async function createPains(projectId: number, painsList: Omit<Pain, "id" | "projectId" | "createdAt">[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values = painsList.map(p => ({ ...p, projectId }));
  await db.insert(pains).values(values);
}

export async function getPainsByProject(projectId: number): Promise<Pain[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pains).where(eq(pains.projectId, projectId));
}

export async function deletePainsByProject(projectId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(pains).where(eq(pains.projectId, projectId));
}

// ===== CONTENT FUNCTIONS =====
export async function createContent(data: InsertContent): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contents).values(data);
  return result[0].insertId;
}

export async function getContentsByProject(projectId: number): Promise<Content[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contents).where(eq(contents.projectId, projectId)).orderBy(desc(contents.createdAt));
}

export async function getContentsByBatch(batchId: string): Promise<Content[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(contents).where(eq(contents.batchId, batchId)).orderBy(contents.createdAt);
}

export async function getContentById(id: number): Promise<Content | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contents).where(eq(contents.id, id)).limit(1);
  return result[0];
}

export async function updateContent(id: number, data: Partial<Content>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(contents).set(data).where(eq(contents.id, id));
}

export async function deleteContent(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(slides).where(eq(slides.contentId, id));
  await db.delete(contents).where(eq(contents.id, id));
}

// ===== SLIDES FUNCTIONS =====
export async function createSlides(contentId: number, slidesList: Omit<InsertSlide, "contentId">[]): Promise<void> {
  console.log("[createSlides] Called with contentId:", contentId, "slides count:", slidesList.length);
  console.log("[createSlides] Slides data:", JSON.stringify(slidesList, null, 2));
  const db = await getDb();
  if (!db) {
    console.log("[createSlides] No database connection");
    return;
  }
  if (slidesList.length === 0) {
    console.log("[createSlides] No slides to insert");
    return;
  }
  const values = slidesList.map(s => ({ ...s, contentId }));
  console.log("[createSlides] Inserting values:", JSON.stringify(values, null, 2));
  try {
    await db.insert(slides).values(values);
    console.log("[createSlides] Insert successful");
  } catch (e) {
    console.error("[createSlides] Insert error:", e);
    throw e;
  }
}

export async function getSlidesByContent(contentId: number): Promise<Slide[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(slides).where(eq(slides.contentId, contentId)).orderBy(slides.order);
}

export async function updateSlide(id: number, data: Partial<Slide>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(slides).set(data).where(eq(slides.id, id));
}

export async function deleteSlidesByContent(contentId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(slides).where(eq(slides.contentId, contentId));
}

export async function getSlideById(id: number): Promise<Slide | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(slides).where(eq(slides.id, id)).limit(1);
  return result[0];
}

// ===== INFLUENCER FUNCTIONS =====
export async function createInfluencer(data: InsertInfluencer): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(influencers).values(data);
  return result[0].insertId;
}

export async function getInfluencersByUser(userId: number): Promise<Influencer[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(influencers).where(eq(influencers.userId, userId)).orderBy(desc(influencers.createdAt));
}

export async function getInfluencerById(id: number): Promise<Influencer | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(influencers).where(eq(influencers.id, id)).limit(1);
  return result[0];
}

export async function updateInfluencer(id: number, data: Partial<Influencer>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(influencers).set(data).where(eq(influencers.id, id));
}

export async function deleteInfluencer(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(influencers).where(eq(influencers.id, id));
}

// ===== INFLUENCER CONTENT FUNCTIONS =====
export async function createInfluencerContent(data: Omit<InfluencerContent, "id" | "createdAt" | "updatedAt">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(influencerContents).values(data);
  return result[0].insertId;
}

export async function getInfluencerContentsByInfluencer(influencerId: number): Promise<InfluencerContent[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(influencerContents).where(eq(influencerContents.influencerId, influencerId)).orderBy(desc(influencerContents.createdAt));
}

export async function getInfluencerContentById(id: number): Promise<InfluencerContent | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(influencerContents).where(eq(influencerContents.id, id)).limit(1);
  return result[0];
}

// ===== INFLUENCER SLIDES FUNCTIONS =====
export async function createInfluencerSlides(contentId: number, slidesList: Omit<InfluencerSlide, "id" | "contentId" | "createdAt" | "updatedAt">[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values = slidesList.map(s => ({ ...s, contentId }));
  await db.insert(influencerSlides).values(values);
}

export async function getInfluencerSlidesByContent(contentId: number): Promise<InfluencerSlide[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(influencerSlides).where(eq(influencerSlides.contentId, contentId)).orderBy(influencerSlides.order);
}

export async function updateInfluencerSlide(id: number, data: Partial<Omit<InfluencerSlide, "id" | "contentId" | "createdAt">>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(influencerSlides).set({ ...data, updatedAt: new Date() }).where(eq(influencerSlides.id, id));
}

// ===== TRENDS FUNCTIONS =====
export async function createTrends(userId: number, trendsList: Omit<Trend, "id" | "userId" | "collectedAt">[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values = trendsList.map(t => ({ ...t, userId }));
  await db.insert(trends).values(values);
}

export async function getTrendsByUser(userId: number, source?: "google" | "tiktok", limit = 50): Promise<Trend[]> {
  const db = await getDb();
  if (!db) return [];
  if (source) {
    return db.select().from(trends).where(and(eq(trends.userId, userId), eq(trends.source, source))).orderBy(desc(trends.collectedAt)).limit(limit);
  }
  return db.select().from(trends).where(eq(trends.userId, userId)).orderBy(desc(trends.collectedAt)).limit(limit);
}

export async function getTrendsBySource(userId: number, source: "google" | "tiktok"): Promise<Trend[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trends).where(and(eq(trends.userId, userId), eq(trends.source, source))).orderBy(desc(trends.collectedAt));
}

// ===== VIRALS FUNCTIONS =====
export async function createVirals(userId: number, viralsList: Omit<Viral, "id" | "userId" | "collectedAt">[]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const values = viralsList.map(v => ({ ...v, userId }));
  await db.insert(virals).values(values);
}

export async function getViralsByUser(userId: number, source?: "viralhog" | "reddit", limit = 50): Promise<Viral[]> {
  const db = await getDb();
  if (!db) return [];
  if (source) {
    return db.select().from(virals).where(and(eq(virals.userId, userId), eq(virals.source, source))).orderBy(desc(virals.collectedAt)).limit(limit);
  }
  return db.select().from(virals).where(eq(virals.userId, userId)).orderBy(desc(virals.collectedAt)).limit(limit);
}

export async function getViralsBySource(userId: number, source: "viralhog" | "reddit"): Promise<Viral[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(virals).where(and(eq(virals.userId, userId), eq(virals.source, source))).orderBy(desc(virals.collectedAt));
}

// ===== USER SETTINGS FUNCTIONS =====
export async function getUserSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0];
}

export async function upsertUserSettings(userId: number, data: Partial<UserSettings>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(userSettings).values({ userId, ...data }).onDuplicateKeyUpdate({ set: data });
}

// ===== HISTORY/STATS FUNCTIONS =====
export async function getContentStats(userId: number) {
  const db = await getDb();
  if (!db) return { total: 0, byType: {}, byStatus: {} };
  
  const result = await db.select({
    type: contents.type,
    status: contents.status,
    count: sql<number>`count(*)`
  }).from(contents)
    .innerJoin(projects, eq(contents.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .groupBy(contents.type, contents.status);
  
  const stats = { total: 0, byType: {} as Record<string, number>, byStatus: {} as Record<string, number> };
  result.forEach(r => {
    stats.total += r.count;
    stats.byType[r.type] = (stats.byType[r.type] || 0) + r.count;
    stats.byStatus[r.status || 'draft'] = (stats.byStatus[r.status || 'draft'] || 0) + r.count;
  });
  
  return stats;
}

export async function getRecentContents(userId: number, limit = 10): Promise<Content[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select({
    id: contents.id,
    projectId: contents.projectId,
    userId: contents.userId,
    type: contents.type,
    template: contents.template,
    title: contents.title,
    description: contents.description,
    hook: contents.hook,
    hookType: contents.hookType,
    formula: contents.formula,
    objective: contents.objective,
    person: contents.person,
    clickbait: contents.clickbait,
    status: contents.status,
    batchId: contents.batchId,
    createdAt: contents.createdAt,
    updatedAt: contents.updatedAt
  }).from(contents)
    .innerJoin(projects, eq(contents.projectId, projects.id))
    .where(eq(projects.userId, userId))
    .orderBy(desc(contents.createdAt))
    .limit(limit);
}
