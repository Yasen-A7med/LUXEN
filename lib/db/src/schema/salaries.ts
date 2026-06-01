import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const salariesTable = pgTable("salaries", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  month: text("month").notNull(),
  basic: integer("basic").notNull().default(0),
  allowances: integer("allowances").notNull().default(0),
  deductions: integer("deductions").notNull().default(0),
  net: integer("net").notNull().default(0),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSalarySchema = createInsertSchema(salariesTable).omit({ id: true, createdAt: true });
export type InsertSalary = z.infer<typeof insertSalarySchema>;
export type Salary = typeof salariesTable.$inferSelect;
