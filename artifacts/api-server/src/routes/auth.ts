import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key);
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router: IRouter = Router();

function getJwtSecret(): string {
  return process.env["SESSION_SECRET"] ?? "not-my-road-jwt-secret";
}

function signToken(userId: number): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: number };
  } catch {
    return null;
  }
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password and name are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "User already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ email, passwordHash, name }).returning();
    req.session!.userId = user.id;
    const token = signToken(user.id);
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: "Registered successfully",
      token,
    });
  } catch (err) {
    req.log.error(err, "Error registering user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    req.session!.userId = user.id;
    const token = signToken(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: "Logged in successfully",
      token,
    });
  } catch (err) {
    req.log.error(err, "Error logging in");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt });
  } catch (err) {
    req.log.error(err, "Error fetching current user");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session?.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.post("/auth/oauth", async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) {
      res.status(400).json({ error: "access_token is required" });
      return;
    }
    const supabase = getSupabaseAdmin();
    const { data: { user: supaUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !supaUser) {
      res.status(401).json({ error: "Invalid OAuth token" });
      return;
    }
    const email = supaUser.email;
    const name = supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || email?.split("@")[0] || "User";
    if (!email) {
      res.status(400).json({ error: "No email from OAuth provider" });
      return;
    }
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      const placeholder = await bcrypt.hash(crypto.randomUUID(), 10);
      [user] = await db.insert(usersTable).values({ email, passwordHash: placeholder, name }).returning();
    }
    req.session!.userId = user.id;
    const token = signToken(user.id);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: "OAuth login successful",
      token,
    });
  } catch (err) {
    req.log.error(err, "Error with OAuth login");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
