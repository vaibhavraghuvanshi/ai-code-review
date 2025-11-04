import { pgTable, serial, varchar, uuid, text, timestamp, boolean, jsonb, numeric, integer } from "drizzle-orm/pg-core";

// ==================== Users Table ====================
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ==================== Reviews Table ====================
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id), // optional for anonymous reviews
  language: varchar("language", { length: 20 }).notNull(),
  code: text("code").notNull(),
  // Human-readable review text produced by the automated reviewer
  reviewText: text("review_text"),
  // AI-fixed full code
  fixedCode: text("fixed_code"),
  // Aggregated suggestions (legacy string)
  suggestions: text("suggestions"),
  securityWarnings: text("security_warnings"),
  // JSON payload of issues for inline annotations
  issues: jsonb("issues"),
  // Raw AI response (optional)
  aiRaw: jsonb("ai_raw"),
  // Model/usage/cost metadata
  model: varchar("model", { length: 100 }),
  temperature: numeric("temperature"),
  tokens: integer("tokens"),
  cost: numeric("cost"),
  // Status and timestamps
  status: varchar("status", { length: 30 }).default("pending"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== Types ====================

// Auto-generated types from schema
export type User = typeof users.$inferSelect;     // For querying
export type InsertUser = typeof users.$inferInsert; // For inserting

export type Review = typeof reviews.$inferSelect;     // For querying
export type InsertReview = typeof reviews.$inferInsert; // For inserting

// ==================== Plans Table ====================
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  // Store features as JSON array (e.g., ["Feature A", "Feature B"]) or null
  features: jsonb("features"),
  isActive: boolean("is_active").default(true),
});

// ==================== Subscriptions Table ====================
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").references(() => plans.id),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active | canceled | expired | trial
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  renewalDate: timestamp("renewal_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  paymentStatus: varchar("payment_status", { length: 20 }).default("paid"),
  isAutoRenew: boolean("is_auto_renew").default(true),
  auditLog: jsonb("audit_log").default([] as any),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ==================== Types (Plans & Subscriptions) ====================
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
