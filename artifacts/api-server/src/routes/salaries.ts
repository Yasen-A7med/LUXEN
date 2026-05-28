import { Router } from "express";
import { db } from "@workspace/db";
import { salariesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/salaries", async (req, res) => {
  try {
    const { employeeId } = req.query;
    const rows = employeeId
      ? await db.select().from(salariesTable).where(eq(salariesTable.employeeId, String(employeeId))).orderBy(salariesTable.createdAt)
      : await db.select().from(salariesTable).orderBy(salariesTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب الرواتب" }); }
});

router.post("/salaries", async (req, res) => {
  try {
    const { employeeId, month, basic, allowances, deductions, net, status } = req.body;
    if (!employeeId || !month) return res.status(400).json({ error: "بيانات ناقصة" });
    const [existing] = await db.select().from(salariesTable)
      .where(and(eq(salariesTable.employeeId, employeeId), eq(salariesTable.month, month)));
    if (existing) {
      const [updated] = await db.update(salariesTable)
        .set({ basic, allowances, deductions, net, status })
        .where(eq(salariesTable.id, existing.id)).returning();
      return res.json(updated);
    }
    const [created] = await db.insert(salariesTable).values({ employeeId, month, basic, allowances, deductions, net, status }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في حفظ الراتب" }); }
});

router.delete("/salaries/:id", async (req, res) => {
  try {
    await db.delete(salariesTable).where(eq(salariesTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
