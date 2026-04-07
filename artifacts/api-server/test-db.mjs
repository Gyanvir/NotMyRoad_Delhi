import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

const { Pool } = pg;
const connectionString = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  phoneNumber: text('phone_number'),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

const pool = new Pool({
  connectionString,
  ssl: process.env.SUPABASE_DATABASE_URL ? { rejectUnauthorized: false } : undefined,
});
const db = drizzle(pool);

async function test() {
  try {
    console.log("Attempting insert...");
    const [user] = await db.insert(usersTable).values({
      email: "test.db@example.com_" + Date.now(),
      passwordHash: "dummy",
      name: "Test User",
      phoneNumber: "1234567890",
    }).returning();
    console.log("Success:", user);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}
test();
