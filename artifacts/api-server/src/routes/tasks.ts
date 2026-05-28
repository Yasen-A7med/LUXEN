import { Router } from "express";
import { db } from "@workspace/db";
import { tasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/tasks", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const rows = employeeId
      ? await db.select().from(tasksTable).where(eq(tasksTable.employeeId, String(employeeId))).orderBy(tasksTable.createdAt)
      : await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب المهام" }); }
});

router.post("/tasks", async (req, res) => {
  try {
    const { employeeId, title, description, status, priority, dueDate } = req.body;
    if (!employeeId || !title) return res.status(400).json({ error: "بيانات ناقصة" });
    const [created] = await db.insert(tasksTable).values({ employeeId, title, description, status, priority, dueDate }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في إضافة المهمة" }); }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const [updated] = await db.update(tasksTable).set(req.body).where(eq(tasksTable.id, parseInt(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "المهمة غير موجودة" });
    res.json(updated);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في تحديث المهمة" }); }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    await db.delete(tasksTable).where(eq(tasksTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
