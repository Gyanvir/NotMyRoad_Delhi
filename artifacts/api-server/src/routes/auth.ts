import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const router: IRouter = Router();

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
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: "Registered successfully",
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
    res.json({
      user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
      message: "Logged in successfully",
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

export default router;
