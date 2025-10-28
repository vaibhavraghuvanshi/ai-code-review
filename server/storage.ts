import { db } from "./db"; // drizzle db client (configured with postgres/neon)
import { users, reviews } from "../shared/schema";
import { eq } from "drizzle-orm";

import type { 
  User, InsertUser, 
  Review, InsertReview 
} from "@shared/schema";

// Define storage interface
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Reviews
  createReview(review: InsertReview): Promise<Review>;
  getReviewById(id: number): Promise<Review | undefined>;
  getReviewsByUser(userId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;

  
}

// Implementation using Drizzle
export class DrizzleStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Reviews
  async createReview(insertReview: InsertReview): Promise<Review> {
    const result = await db.insert(reviews).values(insertReview).returning();
    return result[0];
  }

  async getReviewById(id: number): Promise<Review | undefined> {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  }

  async getReviewsByUser(userId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.userId, userId));
  }

  async getAllReviews(): Promise<Review[]> {
    return db.select().from(reviews);
  }
}

// Export a single storage instance
export const storage = new DrizzleStorage();
