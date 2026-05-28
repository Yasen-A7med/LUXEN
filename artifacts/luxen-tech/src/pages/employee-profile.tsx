import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight, Send, Mail, Phone, Building2, ClipboardList,
  MessageCircle, Plus, Banknote, FileUp, Download,
  Trash2, Calendar, Loader2, Copy, CheckCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getEmployee, getTasks, createTask, deleteTask, updateTask,
  getChat, sendChatMessage, getSalaries, saveSalary, deleteSalary,
  getEmployeeFiles, deleteEmployeeFile,
} from "@/lib/api";

const taskSchema = z.object({
  title: z.string().min(1, "المهمة مطلوبة"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().min(1),
  status: z.string().min(1),
});
const salarySchema = z.object({
  month: z.string().min(1, "الشهر مطلوب"),
  basic: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0),
  deductions: z.coerce.number().min(0),
  status: z.enum(["مدفوع", "قيد المراجعة"]),
});

type TaskForm = z.infer<typeof taskSchema>;
type SalaryForm = z.infer<typeof salarySchema>;

function statusColor(s: string) {
  return s === "مكتملة" ? "bg-success/20 text-success border-success/30"
    : s === "قيد التنفيذ" ? "bg-primary/20 text-primary border-primary/30"
    : "bg-muted text-muted-foreground border-border";
}
function priorityColor(p: string) {
  return p === "عالية" || p === "high" ? "bg-destructive/20 text-destructive border-destructive/30"
    : p === "متوسطة" || p === "medium" ? "bg-warning/20 text-warning border-warning/30"
    : "bg-muted text-muted-foreground border-border";
}

export default function EmployeeProfile() {
  const params = useParams<{ id: string }>();
  const empId = params.id;
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: employee, isLoading: empLoading } = useQuery({ queryKey: ["employee", empId], queryFn: () => getEmployee(empId) });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", empId], queryFn: () => getTasks(empId), enabled: !!empId });
  const { data: messages = [] } = useQuery({ queryKey: ["chat", empId], queryFn: () => getChat(empId), enabled: !!empId, refetchInterval: 3000 });
  const { data: salaries = [] } = useQuery({ queryKey: ["salaries", empId], queryFn: () => getSalaries(empId), enabled: !!empId });
  const { data: files = [] } = useQuery({ queryKey: ["files", empId], queryFn: () => getEmployeeFiles(empId), enabled: !!empId });

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const tab = sp.get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMsgMutation = useMutation({
    mutationFn: (msg: string) => sendChatMessage(empId, msg, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", empId] }),
  });

  const addTaskMutation = useMutation({
    mutationFn: (data: TaskForm) => createTask({ ...data, employeeId: empId, status: data.status || "قيد الانتظار", priority: data.priority || "متوسطة" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", empId] });
      setIsAddTaskOpen(false);
      taskForm.reset();
      toast({ title: "تم إضافة المهمة" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", empId] }); toast({ title: "تم حذف المهمة", variant: "destructive" }); },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTask(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", empId] }); toast({ title: "تم تحديث الحالة" }); },
  });

  const addSalaryMutation = useMutation({
    mutationFn: (data: SalaryForm) => {
      const net = data.basic + data.allowances - data.deductions;
      return saveSalary({ ...data, employeeId: empId, net });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salaries", empId] });
      setIsAddSalaryOpen(false);
      salaryForm.reset();
      toast({ title: "تم حفظ الراتب" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: deleteSalary,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salaries", empId] }); toast({ title: "تم حذف سجل الراتب", variant: "destructive" }); },
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteEmployeeFile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", empId] }),
  });

  const taskForm = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: "", description: "", dueDate: "", priority: "متوسطة", status: "قيد الانتظار" },
  });
  const salaryForm = useForm<SalaryForm>({
    resolver: zodResolver(salarySchema),
    defaultValues: { month: new Date().toISOString().slice(0, 7), basic: 0, allowances: 0, deductions: 0, status: "قيد المراجعة" },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMsgMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const copyCode = () => {
    if (!employee?.code) return;
    navigator.clipboard.writeText(employee.code).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({ title: "تم نسخ الكود", description: employee.code });
    });
  };

  if (empLoading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );
  if (!employee) return (
    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
      <p>الموظف غير موجود</p>
      <Button variant="link" onClick={() => setLocation("/team")} className="mt-2">العودة للفريق</Button>
    </div>
  );

  const sortedSalaries = [...salaries].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/team")} className="hover:scale-110 transition-all">
          <ArrowRight className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">ملف الموظف</h1>
      </div>

      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl animate-scale-in">
        <Avatar className="h-16 w-16 border-2 border-primary/40 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{employee.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold">{employee.name}</h2>
          <p className="text-primary font-medium">{employee.jobTitle}</p>
          {employee.code && (
            <div className="flex items-center gap-1.5 mt-1">
              <code className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded tracking-wider">{employee.code}</code>
              <button onClick={copyCode} className="text-muted-foreground hover:text-primary transition-colors">
                {copiedCode ? <CheckCheck className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{employee.department}</div>
          <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /><span dir="ltr">{employee.email}</span></div>
          <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /><span dir="ltr">{employee.phone}</span></div>
          {employee.joinDate && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{employee.joinDate}</div>}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5 bg-muted">
          <TabsTrigger value="profile">الملف</TabsTrigger>
          <TabsTrigger value="tasks"><ClipboardList className="h-4 w-4 ml-1" />مهام ({tasks.length})</TabsTrigger>
          <TabsTrigger value="chat"><MessageCircle className="h-4 w-4 ml-1" />محادثة</TabsTrigger>
          <TabsTrigger value="salary"><Banknote className="h-4 w-4 ml-1" />الراتب</TabsTrigger>
          <TabsTrigger value="files"><FileUp className="h-4 w-4 ml-1" />ملفات ({files.length})</TabsTrigger>
        </TabsList>

        {/* ── Profile ── */}
        <TabsContent value="profile" className="animate-fade-in">
          <Card className="p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "الاسم الكامل", value: employee.name },
                { label: "المسمى الوظيفي", value: employee.jobTitle },
                { label: "القسم", value: employee.department },
                { label: "البريد الإلكتروني", value: employee.email, ltr: true },
                { label: "رقم الهاتف", value: employee.phone, ltr: true },
                { label: "تاريخ الانضمام", value: employee.joinDate || "—" },
                { label: "كود الدخول", value: employee.code || "—", mono: true },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={`font-medium mt-0.5 truncate ${item.mono ? "font-mono text-primary" : ""}`} dir={item.ltr ? "ltr" : undefined}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ── Tasks ── */}
        <TabsContent value="tasks" className="animate-fade-in space-y-3">
          <div className="flex justify-end">
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 transition-all hover:scale-[1.03]">
                  <Plus className="h-4 w-4" /> إضافة مهمة
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader><DialogTitle>مهمة جديدة لـ {employee.name}</DialogTitle></DialogHeader>
                <Form {...taskForm}>
                  <form onSubmit={taskForm.handleSubmit((d) => addTaskMutation.mutate(d))} className="space-y-4">
                    <FormField control={taskForm.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>عنوان المهمة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={taskForm.control} name="description" render={({ field }) => (
                      <FormItem><FormLabel>الوصف (اختياري)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={taskForm.control} name="dueDate" render={({ field }) => (
                        <FormItem><FormLabel>تاريخ التسليم</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={taskForm.control} name="priority" render={({ field }) => (
                        <FormItem><FormLabel>الأولوية</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {["عالية", "متوسطة", "منخفضة"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={taskForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>الحالة</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {["قيد الانتظار", "قيد التنفيذ", "مكتملة"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={addTaskMutation.isPending}>
                      {addTaskMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} إضافة المهمة
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {tasks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد مهام</p>
            </Card>
          ) : tasks.map((task) => (
            <Card key={task.id} className="p-4 hover:border-primary/30 transition-all animate-fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{task.title}</p>
                  {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {task.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{task.dueDate}</span>}
                    <Badge className={`text-xs ${priorityColor(task.priority)}`}>{task.priority}</Badge>
                    <Badge className={`text-xs ${statusColor(task.status)}`}>{task.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {task.status !== "مكتملة" && (
                    <Button size="sm" variant="outline" className="text-xs h-7 text-success border-success/30"
                      onClick={() => updateTaskStatusMutation.mutate({ id: task.id, status: "مكتملة" })}>
                      إنهاء
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteTaskMutation.mutate(task.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* ── Chat ── */}
        <TabsContent value="chat" className="animate-fade-in">
          <Card className="flex flex-col" style={{ height: "480px" }}>
            <CardHeader className="py-3 px-4 border-b flex-shrink-0">
              <p className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" /> المحادثة مع {employee.name}
              </p>
            </CardHeader>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل</p>}
                {messages.map((msg) => {
                  const isAdmin = msg.isFromAdmin;
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isAdmin ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                      }`}>
                        <p className="text-[10px] font-semibold mb-1 opacity-70">{isAdmin ? "الإدارة" : employee.name}</p>
                        <p>{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 flex-shrink-0">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`رسالة للموظف ${employee.name}...`} className="flex-1" />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMsgMutation.isPending}>
                {sendMsgMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* ── Salary ── */}
        <TabsContent value="salary" className="animate-fade-in space-y-3">
          <div className="flex justify-end">
            <Dialog open={isAddSalaryOpen} onOpenChange={setIsAddSalaryOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 transition-all hover:scale-[1.03]">
                  <Plus className="h-4 w-4" /> تحديد راتب
                </Button>
              </DialogTrigger>
              <DialogContent className="animate-scale-in">
                <DialogHeader><DialogTitle>تحديد راتب {employee.name}</DialogTitle></DialogHeader>
                <Form {...salaryForm}>
                  <form onSubmit={salaryForm.handleSubmit((d) => addSalaryMutation.mutate(d))} className="space-y-4">
                    <FormField control={salaryForm.control} name="month" render={({ field }) => (
                      <FormItem><FormLabel>الشهر</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-3 gap-3">
                      {(["basic", "allowances", "deductions"] as const).map((key) => (
                        <FormField key={key} control={salaryForm.control} name={key} render={({ field }) => (
                          <FormItem>
                            <FormLabel>{key === "basic" ? "الأساسي" : key === "allowances" ? "البدلات" : "الخصومات"}</FormLabel>
                            <FormControl><Input type="number" dir="ltr" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      ))}
                    </div>
                    <FormField control={salaryForm.control} name="status" render={({ field }) => (
                      <FormItem><FormLabel>الحالة</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="مدفوع">مدفوع</SelectItem>
                            <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                          </SelectContent>
                        </Select><FormMessage />
                      </FormItem>
                    )} />
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                      صافي الراتب: <strong className="text-primary">
                        {((salaryForm.watch("basic") || 0) + (salaryForm.watch("allowances") || 0) - (salaryForm.watch("deductions") || 0)).toLocaleString()} ج.م
                      </strong>
                    </div>
                    <Button type="submit" className="w-full" disabled={addSalaryMutation.isPending}>
                      {addSalaryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ الراتب
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {sortedSalaries.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground"><Banknote className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد سجلات رواتب</p></Card>
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>الشهر</TableHead>
                  <TableHead>الأساسي</TableHead>
                  <TableHead>البدلات</TableHead>
                  <TableHead>الخصومات</TableHead>
                  <TableHead>الصافي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {sortedSalaries.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.month}</TableCell>
                      <TableCell>{s.basic.toLocaleString()}</TableCell>
                      <TableCell className="text-success">+{s.allowances.toLocaleString()}</TableCell>
                      <TableCell className="text-destructive">-{s.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-primary">{s.net.toLocaleString()} ج.م</TableCell>
                      <TableCell>
                        <Badge className={s.status === "مدفوع" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => deleteSalaryMutation.mutate(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── Files ── */}
        <TabsContent value="files" className="animate-fade-in">
          {files.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground"><FileUp className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لم يرفع الموظف ملفات بعد</p></Card>
          ) : (
            <div className="space-y-2">
              {files.map((f) => (
                <Card key={f.id} className="p-3 flex items-center gap-3 hover:border-primary/30 transition-all animate-fade-in">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{f.type}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.uploadDate} — {f.uploadTime}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="h-8 text-xs gap-1"
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = f.dataUrl; a.download = f.name; a.click();
                      }}>
                      <Download className="h-3.5 w-3.5" /> تحميل
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive"
                      onClick={() => deleteFileMutation.mutate(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
