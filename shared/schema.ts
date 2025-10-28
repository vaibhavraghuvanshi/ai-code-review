import { pgTable, serial, varchar, uuid, text, timestamp } from "drizzle-orm/pg-core";

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
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id), // foreign key to users table
  language: varchar("language", { length: 20 }).notNull(),
  code: text("code").notNull(),
  // Human-readable review text produced by the automated reviewer
  reviewText: text("review_text"),
  // Status of the review (e.g. pending, completed)
  status: varchar("status", { length: 20 }).default("pending"),
  fixedCode: text("fixed_code"),
  suggestions: text("suggestions"),
  securityWarnings: text("security_warnings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==================== Types ====================

// Auto-generated types from schema
export type User = typeof users.$inferSelect;     // For querying
export type InsertUser = typeof users.$inferInsert; // For inserting

export type Review = typeof reviews.$inferSelect;     // For querying
export type InsertReview = typeof reviews.$inferInsert; // For inserting
