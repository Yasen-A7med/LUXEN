import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/clients", async (req, res) => {
  try {
    const rows = await db.select().from(clientsTable).orderBy(clientsTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب العملاء" }); }
});

router.post("/clients", async (req, res) => {
  try {
    const { name, company, email, phone, status, notes, totalAmount, paidAmount } = req.body;
    if (!name) return res.status(400).json({ error: "اسم العميل مطلوب" });
    const [created] = await db.insert(clientsTable).values({
      name, company, email, phone, status: status || "نشط", notes,
      totalAmount: totalAmount || 0, paidAmount: paidAmount || 0,
    }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في إضافة العميل" }); }
});

router.put("/clients/:id", async (req, res) => {
  try {
    const [updated] = await db.update(clientsTable).set(req.body).where(eq(clientsTable.id, parseInt(req.params.id))).returning();
    if (!updated) return res.status(404).json({ error: "العميل غير موجود" });
    res.json(updated);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في التحديث" }); }
});

router.delete("/clients/:id", async (req, res) => {
  try {
    await db.delete(clientsTable).where(eq(clientsTable.id, parseInt(req.params.id)));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
