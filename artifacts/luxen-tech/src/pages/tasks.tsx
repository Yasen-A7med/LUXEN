import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Filter, ClipboardList, Trash2, CheckCircle2, Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEmployees, getTasks, createTask, deleteTask, updateTask, type Task } from "@/lib/api";

const taskSchema = z.object({
  title: z.string().min(1, "عنوان المهمة مطلوب"),
  description: z.string().optional(),
  employeeId: z.string().min(1, "يجب تحديد موظف"),
  dueDate: z.string().optional(),
  priority: z.string().min(1),
  status: z.string().min(1),
});
type TaskForm = z.infer<typeof taskSchema>;

function statusBadge(s: string) {
  if (s === "مكتملة") return "bg-success/20 text-success border-success/30";
  if (s === "قيد التنفيذ") return "bg-primary/20 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}
function priorityBadge(p: string) {
  if (p === "عالية" || p === "high") return "bg-destructive/20 text-destructive border-destructive/30";
  if (p === "متوسطة" || p === "medium") return "bg-warning/20 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-border";
}

const PRIORITIES = ["عالية", "متوسطة", "منخفضة"];
const STATUSES = ["قيد الانتظار", "قيد التنفيذ", "مكتملة"];

function TaskFormContent({ form, employees, onSubmit, loading, label }: {
  form: ReturnType<typeof useForm<TaskForm>>;
  employees: Array<{ id: number; name: string; jobTitle: string }>;
  onSubmit: (d: TaskForm) => void;
  loading: boolean;
  label: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>عنوان المهمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>الوصف (اختياري)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="employeeId" render={({ field }) => (
          <FormItem><FormLabel>الموظف المسؤول</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue placeholder="اختر موظفاً" /></SelectTrigger></FormControl>
              <SelectContent>
                {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name} — {e.jobTitle}</SelectItem>)}
              </SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="dueDate" render={({ field }) => (
            <FormItem><FormLabel>تاريخ التسليم</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem><FormLabel>الأولوية</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="status" render={({ field }) => (
          <FormItem><FormLabel>الحالة</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select><FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />} {label}
        </Button>
      </form>
    </Form>
  );
}

const defaultVals: TaskForm = { title: "", description: "", employeeId: "", dueDate: "", priority: "متوسطة", status: "قيد الانتظار" };

export default function Tasks() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const addMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setIsAddOpen(false); addForm.reset(defaultVals); toast({ title: "تم إضافة المهمة" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Task> }) => updateTask(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); setEditTask(null); toast({ title: "تم تحديث المهمة" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: "تم حذف المهمة", variant: "destructive" }); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTask(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks"] }); toast({ title: "تم تحديث الحالة" }); },
  });

  const addForm = useForm<TaskForm>({ resolver: zodResolver(taskSchema), defaultValues: defaultVals });
  const editForm = useForm<TaskForm>({ resolver: zodResolver(taskSchema), defaultValues: defaultVals });

  const openEdit = (t: Task) => {
    setEditTask(t);
    editForm.reset({ title: t.title, description: t.description || "", employeeId: t.employeeId, dueDate: t.dueDate || "", priority: t.priority, status: t.status });
  };

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return t.status !== "مكتملة";
    if (filter === "done") return t.status === "مكتملة";
    return true;
  });

  const getEmployeeName = (empId: string) => employees.find((e) => String(e.id) === empId)?.name || empId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> المهام</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tasks.length} مهمة إجمالاً</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="transition-all hover:scale-[1.03]"><Plus className="ml-2 h-4 w-4" /> إضافة مهمة</Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader><DialogTitle>إضافة مهمة جديدة</DialogTitle></DialogHeader>
            <TaskFormContent form={addForm} employees={employees} onSubmit={(d) => addMutation.mutate(d)} loading={addMutation.isPending} label="إضافة" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTask} onOpenChange={(o) => { if (!o) setEditTask(null); }}>
        <DialogContent className="animate-scale-in">
          <DialogHeader><DialogTitle>تعديل المهمة</DialogTitle></DialogHeader>
          <TaskFormContent form={editForm} employees={employees}
            onSubmit={(d) => editTask && editMutation.mutate({ id: editTask.id, data: d })}
            loading={editMutation.isPending} label="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "الكل", value: tasks.length, key: "all" },
          { label: "قيد التنفيذ", value: tasks.filter((t) => t.status !== "مكتملة").length, key: "pending" },
          { label: "مكتملة", value: tasks.filter((t) => t.status === "مكتملة").length, key: "done" },
        ].map((s) => (
          <Card key={s.key} onClick={() => setFilter(s.key)}
            className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${filter === s.key ? "border-primary bg-primary/5" : ""}`}>
            <p className={`text-2xl font-bold ${filter === s.key ? "text-primary" : ""}`}>{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Filter className="h-4 w-4 mt-2.5 text-muted-foreground" />
        {["all", "pending", "done"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)} className="text-xs">
            {f === "all" ? "الكل" : f === "pending" ? "قيد التنفيذ" : "مكتملة"}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>المهمة</TableHead><TableHead>الموظف</TableHead><TableHead>الأولوية</TableHead><TableHead>التسليم</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">لا توجد مهام</TableCell></TableRow>
              ) : filtered.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                  <TableCell>
                    <p className="font-medium">{task.title}</p>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{getEmployeeName(task.employeeId)}</TableCell>
                  <TableCell><Badge className={`text-xs ${priorityBadge(task.priority)}`}>{task.priority}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{task.dueDate || "—"}</TableCell>
                  <TableCell><Badge className={`text-xs ${statusBadge(task.status)}`}>{task.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {task.status !== "مكتملة" && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:bg-success/10"
                          onClick={() => updateStatusMutation.mutate({ id: task.id, status: "مكتملة" })}>
                          <CheckCircle2 className="h-3.5 w-3.5 ml-1" /> إنهاء
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                        onClick={() => openEdit(task)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(task.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
