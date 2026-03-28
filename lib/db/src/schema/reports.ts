import { pgTable, serial, text, integer, numeric, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  userName: text("user_name").notNull(),
  imageUrl: text("image_url").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: numeric("longitude", { precision: 10, scale: 6 }).notNull(),
  area: text("area").notNull(),
  issueType: text("issue_type").notNull(),
  roadType: text("road_type").notNull(),
  description: text("description"),
  authority: text("authority").notNull(),
  status: text("status").notNull().default("pending"),
  tweetDraft: text("tweet_draft").notNull(),
  timeline: json("timeline").$type<Array<{ status: string; note?: string; timestamp: string }>>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
