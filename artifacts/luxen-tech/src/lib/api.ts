const BASE = "/api";

export async function api<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Employees ──────────────────────────────────────────────────
export interface Employee {
  id: number; code: string; name: string; jobTitle: string;
  department: string; email: string; phone: string; joinDate?: string;
}
export const getEmployees = () => api<Employee[]>("/employees");
export const getEmployee = (id: string | number) => api<Employee>(`/employees/${id}`);
export const lookupEmployee = (code: string) =>
  api<Employee>("/employees/lookup", { method: "POST", body: JSON.stringify({ code }) });
export const authEmployee = (code: string, password: string) =>
  api<Employee>("/employees/auth", { method: "POST", body: JSON.stringify({ code, password }) });
export const createEmployee = (data: {
  code: string; name: string; jobTitle: string; department: string;
  email: string; phone: string; password: string; joinDate?: string;
}) => api<Employee>("/employees", { method: "POST", body: JSON.stringify(data) });
export const updateEmployee = (id: number, data: Partial<Employee & { password?: string }>) =>
  api<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEmployee = (id: number) =>
  api<{ success: boolean }>(`/employees/${id}`, { method: "DELETE" });

// ── Attendance ─────────────────────────────────────────────────
export interface Attendance {
  id: number; employeeId: string; employeeName: string; jobTitle: string;
  department: string; date: string; dateFormatted: string;
  time: string; timeFormatted: string; status: string;
}
export const getAttendance = (employeeId?: string) =>
  api<Attendance[]>(employeeId ? `/attendance?employeeId=${employeeId}` : "/attendance");
export const createAttendance = (data: Omit<Attendance, "id">) =>
  api<Attendance>("/attendance", { method: "POST", body: JSON.stringify(data) });
export const deleteAttendance = (id: number) =>
  api<{ success: boolean }>(`/attendance/${id}`, { method: "DELETE" });

// ── Salaries ───────────────────────────────────────────────────
export interface Salary {
  id: number; employeeId: string; month: string; basic: number;
  allowances: number; deductions: number; net: number; status: string;
}
export const getSalaries = (employeeId?: string) =>
  api<Salary[]>(employeeId ? `/salaries?employeeId=${employeeId}` : "/salaries");
export const saveSalary = (data: Omit<Salary, "id">) =>
  api<Salary>("/salaries", { method: "POST", body: JSON.stringify(data) });
export const updateSalaryStatus = (id: number, status: string) =>
  api<Salary>(`/salaries/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
export const deleteSalary = (id: number) =>
  api<{ success: boolean }>(`/salaries/${id}`, { method: "DELETE" });

// ── Employee Files ─────────────────────────────────────────────
export interface EmployeeFile {
  id: number; employeeId: string; name: string; type: string;
  size: number; uploadDate: string; uploadTime: string; dataUrl: string;
}
export const getEmployeeFiles = (employeeId?: string) =>
  api<EmployeeFile[]>(employeeId ? `/employee-files?employeeId=${employeeId}` : "/employee-files");
export const uploadEmployeeFile = (data: Omit<EmployeeFile, "id">) =>
  api<EmployeeFile>("/employee-files", { method: "POST", body: JSON.stringify(data) });
export const deleteEmployeeFile = (id: number) =>
  api<{ success: boolean }>(`/employee-files/${id}`, { method: "DELETE" });

// ── Tasks ──────────────────────────────────────────────────────
export interface Task {
  id: number; employeeId: string; title: string; description?: string;
  status: string; priority: string; dueDate?: string;
}
export const getTasks = (employeeId?: string) =>
  api<Task[]>(employeeId ? `/tasks?employeeId=${employeeId}` : "/tasks");
export const createTask = (data: Omit<Task, "id">) =>
  api<Task>("/tasks", { method: "POST", body: JSON.stringify(data) });
export const updateTask = (id: number, data: Partial<Task>) =>
  api<Task>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteTask = (id: number) =>
  api<{ success: boolean }>(`/tasks/${id}`, { method: "DELETE" });

// ── Chat ───────────────────────────────────────────────────────
export interface ChatMsg {
  id: number; employeeId: string; message: string;
  isFromAdmin: boolean; createdAt: string;
  mediaType: string; mediaUrl?: string | null;
}
export const getChat = (employeeId: string) => api<ChatMsg[]>(`/chat/${employeeId}`);
export const sendChatMessage = (
  employeeId: string,
  message: string,
  isFromAdmin: boolean,
  mediaType = "text",
  mediaUrl?: string,
) => api<ChatMsg>(`/chat/${employeeId}`, {
  method: "POST",
  body: JSON.stringify({ message, isFromAdmin, mediaType, mediaUrl }),
});
export const clearChat = (employeeId: string) =>
  api<{ success: boolean }>(`/chat/${employeeId}`, { method: "DELETE" });

// ── Projects ───────────────────────────────────────────────────
export interface Project {
  id: number; name: string; description?: string; status: string;
  progress: number; client?: string; startDate?: string; endDate?: string;
}
export const getProjects = () => api<Project[]>("/projects");
export const createProject = (data: Omit<Project, "id">) =>
  api<Project>("/projects", { method: "POST", body: JSON.stringify(data) });
export const updateProject = (id: number, data: Partial<Project>) =>
  api<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteProject = (id: number) =>
  api<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" });

// ── Clients ────────────────────────────────────────────────────
export interface Client {
  id: number; name: string; company?: string; email?: string;
  phone?: string; status: string; notes?: string;
  totalAmount: number; paidAmount: number;
}
export const getClients = () => api<Client[]>("/clients");
export const createClient = (data: Omit<Client, "id">) =>
  api<Client>("/clients", { method: "POST", body: JSON.stringify(data) });
export const updateClient = (id: number, data: Partial<Client>) =>
  api<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteClient = (id: number) =>
  api<{ success: boolean }>(`/clients/${id}`, { method: "DELETE" });

// ── Backup / Restore ───────────────────────────────────────────
export const exportBackup = () => api<Record<string, unknown>>("/backup");
export const restoreBackup = (data: Record<string, unknown>) =>
  api<{ success: boolean; message: string }>("/restore", {
    method: "POST",
    body: JSON.stringify({ data }),
  });
