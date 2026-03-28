import { Router, type IRouter } from "express";
import { db, reportsTable, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function generateTweetDraft(area: string, issueType: string, roadType: string, authority: string): string {
  const issueMap: Record<string, string> = {
    pothole: "Pothole",
    broken_road: "Broken Road",
    waterlogging: "Waterlogging",
    damaged_divider: "Damaged Divider",
    missing_signage: "Missing Signage",
    other: "Road Issue",
  };
  const roadMap: Record<string, string> = {
    main_road: "main road",
    internal_road: "internal road",
    highway: "highway",
  };
  const issue = issueMap[issueType] ?? issueType;
  const road = roadMap[roadType] ?? roadType;
  return `🚨 Road issue reported in ${area}, Delhi! ${issue} on a ${road}. Authority: @${authority}. This needs urgent attention! #Delhi #NotMyRoad #RoadSafety`;
}

function formatReport(report: typeof reportsTable.$inferSelect, daysUnresolved?: number) {
  return {
    id: report.id,
    userId: report.userId,
    userName: report.userName,
    imageUrl: report.imageUrl,
    latitude: parseFloat(String(report.latitude)),
    longitude: parseFloat(String(report.longitude)),
    area: report.area,
    issueType: report.issueType,
    roadType: report.roadType,
    description: report.description ?? undefined,
    authority: report.authority,
    status: report.status,
    tweetDraft: report.tweetDraft,
    timeline: report.timeline ?? [],
    daysUnresolved: daysUnresolved ?? Math.floor((Date.now() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}

router.get("/reports", async (req, res) => {
  try {
    const { userId, status, limit: rawLimit } = req.query;
    const limit = parseInt(String(rawLimit ?? "50"), 10) || 50;

    const conditions = [];
    if (userId) conditions.push(eq(reportsTable.userId, parseInt(String(userId), 10)));
    if (status) conditions.push(eq(reportsTable.status, String(status)));

    const reports = await db
      .select()
      .from(reportsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reportsTable.createdAt))
      .limit(limit);

    res.json(reports.map((r) => formatReport(r)));
  } catch (err) {
    req.log.error(err, "Error listing reports");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reports", async (req, res) => {
  try {
    const { userId, userName, imageUrl, latitude, longitude, area, issueType, roadType, description, authority } = req.body;

    if (!userId || !userName || !imageUrl || !latitude || !longitude || !area || !issueType || !roadType || !authority) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const tweetDraft = generateTweetDraft(area, issueType, roadType, authority);
    const timeline = [{ status: "pending", note: "Report submitted", timestamp: new Date().toISOString() }];

    const [report] = await db
      .insert(reportsTable)
      .values({
        userId: parseInt(String(userId), 10),
        userName,
        imageUrl,
        latitude: String(latitude),
        longitude: String(longitude),
        area,
        issueType,
        roadType,
        description: description ?? null,
        authority,
        status: "pending",
        tweetDraft,
        timeline,
      })
      .returning();

    res.status(201).json(formatReport(report));
  } catch (err) {
    req.log.error(err, "Error creating report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json(formatReport(report));
  } catch (err) {
    req.log.error(err, "Error fetching report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, note } = req.body;

    if (!status) {
      res.status(400).json({ error: "Status is required" });
      return;
    }

    const [existing] = await db.select().from(reportsTable).where(eq(reportsTable.id, id)).limit(1);
    if (!existing) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    const newTimeline = [
      ...(existing.timeline ?? []),
      { status, note: note ?? undefined, timestamp: new Date().toISOString() },
    ];

    const [updated] = await db
      .update(reportsTable)
      .set({ status, timeline: newTimeline, updatedAt: new Date() })
      .where(eq(reportsTable.id, id))
      .returning();

    res.json(formatReport(updated));
  } catch (err) {
    req.log.error(err, "Error updating report");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const allReports = await db.select({ status: reportsTable.status }).from(reportsTable);
    const total = allReports.length;
    const resolved = allReports.filter((r) => r.status === "resolved").length;
    const inProgress = allReports.filter((r) => r.status === "in_progress").length;
    const pending = allReports.filter((r) => r.status === "pending").length;
    const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;

    res.json({
      totalReports: total,
      resolvedReports: resolved,
      resolvedPercentage: resolvedPct,
      pendingReports: pending,
      inProgressReports: inProgress,
    });
  } catch (err) {
    req.log.error(err, "Error fetching stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
