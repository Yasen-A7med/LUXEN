import { Router } from "express";
import { db } from "@workspace/db";
import { employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/employees", async (req, res) => {
  try {
    const employees = await db.select().from(employeesTable).orderBy(employeesTable.createdAt);
    res.json(employees);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في جلب الموظفين" });
  }
});

router.get("/employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.id, id));
    if (!emp) return res.status(404).json({ error: "الموظف غير موجود" });
    res.json(emp);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في جلب الموظف" });
  }
});

router.post("/employees/lookup", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "الكود مطلوب" });
    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.code, code.toUpperCase()));
    if (!emp) return res.status(404).json({ error: "لم يتم العثور على موظف بهذا الكود" });
    const { password: _pw, ...safe } = emp;
    res.json(safe);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في البحث" });
  }
});

router.post("/employees/auth", async (req, res) => {
  try {
    const { code, password } = req.body;
    if (!code || !password) return res.status(400).json({ error: "الكود وكلمة المرور مطلوبان" });
    const [emp] = await db.select().from(employeesTable).where(eq(employeesTable.code, code.toUpperCase()));
    if (!emp) return res.status(404).json({ error: "الكود غير صحيح" });
    if (emp.password !== password) return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    const { password: _pw, ...safe } = emp;
    res.json(safe);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في تسجيل الدخول" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const { code, name, jobTitle, department, email, phone, password, joinDate } = req.body;
    if (!code || !name || !jobTitle || !department || !email || !phone || !password) {
      return res.status(400).json({ error: "جميع الحقول مطلوبة" });
    }
    const [existing] = await db.select().from(employeesTable).where(eq(employeesTable.code, code.toUpperCase()));
    if (existing) return res.status(409).json({ error: "الكود مستخدم بالفعل" });
    const [created] = await db.insert(employeesTable).values({
      code: code.toUpperCase(), name, jobTitle, department, email, phone, password, joinDate,
    }).returning();
    const { password: _pw, ...safe } = created;
    res.status(201).json(safe);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في إضافة الموظف" });
  }
});

router.put("/employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const [updated] = await db.update(employeesTable).set(updates).where(eq(employeesTable.id, id)).returning();
    if (!updated) return res.status(404).json({ error: "الموظف غير موجود" });
    const { password: _pw, ...safe } = updated;
    res.json(safe);
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في تحديث الموظف" });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(employeesTable).where(eq(employeesTable.id, id));
    res.json({ success: true });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في حذف الموظف" });
  }
});

export default router;
