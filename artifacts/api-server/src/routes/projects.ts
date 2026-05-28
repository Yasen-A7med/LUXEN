import { Router } from "express";
import { db } from "@workspace/db";
import { projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/projects", async (req, res) => {
  try {
    const rows = await db.select().from(projectsTable).orderBy(projectsTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب المشاريع" }); }
});

router.post("/projects", async (req, res) => {
  try {
    const { name, description, status, progress, client, startDate, endDate } = req.body;
    if (!name) return res.status(400).json({ error: "اسم المشروع مطلوب" });
    const [created] = await db.insert(projectsTable).values({ name, description, status, progress, client, startDate, endDate }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في إضافة المشروع" }); }
});

router.put("/projects/:id", async (req, res) => {
  try {
    const [updated] = await db.update(projectsTable).set(req.body).where(eq(projectsTable.id, parseInt(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "المشروع غير موجود" });
    res.json(updated);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في التحديث" }); }
});

router.delete("/projects/:id", async (req, res) => {
  try {
    await db.delete(projectsTable).where(eq(projectsTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
