import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeeFilesTable = pgTable("employee_files", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull().default(0),
  uploadDate: text("upload_date").notNull(),
  uploadTime: text("upload_time").notNull(),
  dataUrl: text("data_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEmployeeFileSchema = createInsertSchema(employeeFilesTable).omit({ id: true, createdAt: true });
export type InsertEmployeeFile = z.infer<typeof insertEmployeeFileSchema>;
export type EmployeeFile = typeof employeeFilesTable.$inferSelect;
