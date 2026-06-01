import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/chat/:employeeId", async (req, res) => {
  try {
    const rows = await db.select().from(chatMessagesTable)
      .where(eq(chatMessagesTable.employeeId, req.params.employeeId))
      .orderBy(chatMessagesTable.createdAt);
    res.json(rows);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في جلب المحادثة" }); }
});

router.post("/chat/:employeeId", async (req, res) => {
  try {
    const { message = "", isFromAdmin, mediaType = "text", mediaUrl } = req.body;
    if (!message && !mediaUrl) return res.status(400).json({ error: "الرسالة أو المرفق مطلوب" });
    const [created] = await db.insert(chatMessagesTable).values({
      employeeId: req.params.employeeId,
      message,
      isFromAdmin: isFromAdmin ?? false,
      mediaType,
      mediaUrl: mediaUrl || null,
    }).returning();
    res.status(201).json(created);
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في إرسال الرسالة" }); }
});

router.delete("/chat/:employeeId", async (req, res) => {
  try {
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.employeeId, req.params.employeeId));
    res.json({ success: true });
  } catch (e) { req.log.error(e); res.status(500).json({ error: "فشل في الحذف" }); }
});

export default router;
