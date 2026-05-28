import { Router } from "express";
import { db } from "@workspace/db";
import {
  employeesTable, attendanceTable, salariesTable, employeeFilesTable,
  tasksTable, chatMessagesTable, projectsTable, clientsTable,
} from "@workspace/db";

const router = Router();

router.get("/backup", async (req, res) => {
  try {
    const [employees, attendance, salaries, files, tasks, chat, projects, clients] = await Promise.all([
      db.select().from(employeesTable),
      db.select().from(attendanceTable),
      db.select().from(salariesTable),
      db.select().from(employeeFilesTable),
      db.select().from(tasksTable),
      db.select().from(chatMessagesTable),
      db.select().from(projectsTable),
      db.select().from(clientsTable),
    ]);
    res.json({
      exportedAt: new Date().toISOString(),
      version: "1.0",
      data: { employees, attendance, salaries, files, tasks, chat, projects, clients },
    });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في تصدير البيانات" });
  }
});

router.post("/restore", async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: "بيانات غير صالحة" });

    // Clear all tables then re-insert
    await db.delete(chatMessagesTable);
    await db.delete(employeeFilesTable);
    await db.delete(salariesTable);
    await db.delete(attendanceTable);
    await db.delete(tasksTable);
    await db.delete(projectsTable);
    await db.delete(clientsTable);
    await db.delete(employeesTable);

    if (data.employees?.length) await db.insert(employeesTable).values(data.employees.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.attendance?.length) await db.insert(attendanceTable).values(data.attendance.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.salaries?.length) await db.insert(salariesTable).values(data.salaries.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.files?.length) await db.insert(employeeFilesTable).values(data.files.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.tasks?.length) await db.insert(tasksTable).values(data.tasks.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.chat?.length) await db.insert(chatMessagesTable).values(data.chat.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.projects?.length) await db.insert(projectsTable).values(data.projects.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));
    if (data.clients?.length) await db.insert(clientsTable).values(data.clients.map((e: Record<string,unknown>) => {
      const { id: _id, createdAt: _ca, ...rest } = e as { id: unknown; createdAt: unknown; [k: string]: unknown };
      return rest;
    }));

    res.json({ success: true, message: "تم استعادة البيانات بنجاح" });
  } catch (e) {
    req.log.error(e);
    res.status(500).json({ error: "فشل في استعادة البيانات" });
  }
});

export default router;
