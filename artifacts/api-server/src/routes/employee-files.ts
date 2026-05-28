import { Router } from "express";
import { db } from "@workspace/db";
import { employeeFilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/employee-files", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const rows = employeeId
      ? await db.select().from(employeeFilesTable).where(eq(employeeFilesTable.employeeId, String(employeeId))).orderBy(employeeFilesTable.createdAt)
      : await db.select().from(employeeFilesTable).orderBy(employeeFilesTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب الملفات" }); }
});

router.post("/employee-files", async (req, res) => {
  try {
    const { employeeId, name, type, size, uploadDate, uploadTime, dataUrl } = req.body;
    if (!employeeId || !name || !dataUrl) return res.status(400).json({ error: "بيانات ناقصة" });
    const [created] = await db.insert(employeeFilesTable).values({ employeeId, name, type, size, uploadDate, uploadTime, dataUrl }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في رفع الملف" }); }
});

router.delete("/employee-files/:id", async (req, res) => {
  try {
    await db.delete(employeeFilesTable).where(eq(employeeFilesTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
