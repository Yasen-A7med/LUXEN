import { Router } from "express";
import { db } from "@workspace/db";
import { attendanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/attendance", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const rows = employeeId
      ? await db.select().from(attendanceTable).where(eq(attendanceTable.employeeId, String(employeeId))).orderBy(attendanceTable.createdAt)
      : await db.select().from(attendanceTable).orderBy(attendanceTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب سجلات الحضور" }); }
});

router.post("/attendance", async (req, res) => {
  try {
    const { employeeId, employeeName, jobTitle, department, date, dateFormatted, time, timeFormatted, status } = req.body;
    if (!employeeId || !date) return res.status(400).json({ error: "بيانات ناقصة" });
    const [created] = await db.insert(attendanceTable).values({
      employeeId, employeeName, jobTitle, department, date, dateFormatted, time, timeFormatted,
      status: status || "حاضر",
    }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في تسجيل الحضور" }); }
});

router.delete("/attendance/:id", async (req, res) => {
  try {
    await db.delete(attendanceTable).where(eq(attendanceTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
