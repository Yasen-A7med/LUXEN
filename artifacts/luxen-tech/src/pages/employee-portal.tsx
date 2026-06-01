import { useState, useEffect, useRef, useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Send, ClipboardList, MessageCircle, User, LogOut, Banknote,
  FileUp, Upload, Calendar, ClipboardCheck, CheckCircle2, Sun, Moon, Loader2, Trash2, Calculator,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getEmployee, getAttendance, createAttendance, getTasks, updateTask,
  getChat, sendChatMessage, getSalaries, getEmployeeFiles, uploadEmployeeFile, deleteEmployeeFile,
  type Employee, type Task, type ChatMsg, type Salary, type EmployeeFile,
} from "@/lib/api";
import { CalculatorDialog } from "@/components/calculator";

interface AuthState {
  isAuthenticated: boolean; role: "admin" | "employee" | null;
  employeeId?: string; employeeName?: string;
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}
function statusColor(s: string) {
  return s === "مكتملة" ? "bg-success/20 text-success border-success/30"
    : s === "قيد التنفيذ" ? "bg-primary/20 text-primary border-primary/30"
    : "bg-muted text-muted-foreground border-border";
}

const ATTENDANCE_STATUSES = [
  { key: "حاضر", color: "border-success/40 bg-success/10 text-success", selected: "border-success bg-success/20 text-success" },
  { key: "مأذون", color: "border-primary/40 bg-primary/10 text-primary", selected: "border-primary bg-primary/20 text-primary" },
  { key: "إجازة", color: "border-warning/40 bg-warning/10 text-warning", selected: "border-warning bg-warning/20 text-warning" },
  { key: "غائب", color: "border-destructive/40 bg-destructive/10 text-destructive", selected: "border-destructive bg-destructive/20 text-destructive" },
];

export default function EmployeePortal() {
  const [auth, setAuth] = useLocalStorage<AuthState>("luxen_auth", { isAuthenticated: false, role: null });
  const [newMessage, setNewMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState("حاضر");
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [calcOpen, setCalcOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const empId = auth.employeeId || "";
  const today = new Date().toISOString().split("T")[0];

  const { data: employee, isLoading: empLoading } = useQuery({ queryKey: ["employee", empId], queryFn: () => getEmployee(empId), enabled: !!empId });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", empId], queryFn: () => getTasks(empId), enabled: !!empId });
  const { data: messages = [], refetch: refetchMessages } = useQuery({ queryKey: ["chat", empId], queryFn: () => getChat(empId), enabled: !!empId });
  const { data: salaries = [] } = useQuery({ queryKey: ["salaries", empId], queryFn: () => getSalaries(empId), enabled: !!empId });
  const { data: files = [] } = useQuery({ queryKey: ["files", empId], queryFn: () => getEmployeeFiles(empId), enabled: !!empId });
  const { data: attendance = [] } = useQuery({ queryKey: ["attendance", empId], queryFn: () => getAttendance(empId), enabled: !!empId });

  useEffect(() => {
    if (!empId || attendance.length === 0) return undefined;
    const alreadyIn = attendance.some((r) => r.employeeId === empId && r.date === today);
    setCheckedInToday(alreadyIn);
    if (!alreadyIn) {
      const timer = setTimeout(() => setShowAttendanceDialog(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [attendance, empId, today]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const checkInMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", empId] });
      setCheckedInToday(true); setShowAttendanceDialog(false);
      const now = new Date();
      const statusLabel = attendanceStatus;
      toast({ title: `✓ تم تسجيل ${statusLabel === "حاضر" ? "حضورك" : statusLabel}`, description: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) });
    },
  });

  const sendMsgMutation = useMutation({
    mutationFn: ({ msg }: { msg: string }) => sendChatMessage(empId, msg, false),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["chat", empId] }); refetchMessages(); },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTask(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tasks", empId] }); toast({ title: "تم تحديث حالة المهمة" }); },
  });

  const deleteFileMutation = useMutation({
    mutationFn: deleteEmployeeFile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["files", empId] }),
  });

  const handleCheckIn = () => {
    if (!employee) return;
    const now = new Date();
    checkInMutation.mutate({
      employeeId: empId, employeeName: employee.name, jobTitle: employee.jobTitle,
      department: employee.department, date: today,
      dateFormatted: now.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: now.toTimeString().slice(0, 5),
      timeFormatted: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      status: attendanceStatus,
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMsgMutation.mutate({ msg: newMessage.trim() });
    setNewMessage("");
  };

  const processFile = useCallback((file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "الملف كبير جداً", description: "الحد الأقصى 20 ميجابايت", variant: "destructive" }); return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const ext = file.name.split(".").pop()?.toUpperCase() || "ملف";
      const now = new Date();
      try {
        await uploadEmployeeFile({
          employeeId: empId, name: file.name, type: ext, size: file.size,
          uploadDate: now.toLocaleDateString("ar-SA"),
          uploadTime: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
          dataUrl,
        });
        qc.invalidateQueries({ queryKey: ["files", empId] });
        toast({ title: "تم رفع الملف", description: `${file.name} — ${formatBytes(file.size)}` });
      } catch { toast({ title: "فشل رفع الملف", variant: "destructive" }); }
      finally { setUploading(false); }
    };
    reader.onerror = () => { setUploading(false); toast({ title: "فشل قراءة الملف", variant: "destructive" }); };
    reader.readAsDataURL(file);
  }, [empId, qc, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) Array.from(e.target.files).forEach(processFile);
    e.target.value = "";
  };

  const handleLogout = () => setAuth({ isAuthenticated: false, role: null });
  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) { html.classList.remove("dark"); localStorage.setItem("luxen_theme", "light"); }
    else { html.classList.add("dark"); localStorage.setItem("luxen_theme", "dark"); }
    setIsDark(!isDark);
  };

  const latestSalary = [...salaries].sort((a, b) => b.month.localeCompare(a.month))[0];
  const completedCount = tasks.filter((t) => t.status === "مكتملة").length;
  const pendingCount = tasks.filter((t) => t.status !== "مكتملة").length;
  const todayRecord = attendance.find((r) => r.date === today);

  if (empLoading) return <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!employee) return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground" dir="rtl">
      <div className="text-center space-y-4">
        <p className="text-lg">لم يتم العثور على بيانات الموظف</p>
        <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4 ml-2" /> تسجيل الخروج</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300" dir="rtl">
      <CalculatorDialog open={calcOpen} onOpenChange={setCalcOpen} />

      {/* Attendance Dialog */}
      <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
        <DialogContent className="max-w-sm animate-scale-in">
          <DialogHeader><DialogTitle>تسجيل الحضور اليومي</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-2" />
              <p className="font-semibold">مرحباً {employee.name}!</p>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-center">اختر حالة الحضور</p>
              <div className="grid grid-cols-2 gap-2">
                {ATTENDANCE_STATUSES.map((s) => (
                  <button key={s.key} onClick={() => setAttendanceStatus(s.key)}
                    className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all ${attendanceStatus === s.key ? s.selected + " scale-[1.03]" : s.color}`}>
                    {s.key}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCheckIn} disabled={checkInMutation.isPending}>
                {checkInMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <ClipboardCheck className="h-4 w-4 ml-2" />}
                تأكيد التسجيل
              </Button>
              <Button variant="outline" onClick={() => setShowAttendanceDialog(false)}>لاحقاً</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-primary tracking-wider hidden sm:block">LUXEN TECH</span>
          <Badge variant="outline" className="text-xs text-primary border-primary/30">موظف</Badge>
          {checkedInToday ? (
            <Badge className={`text-xs ${
              todayRecord?.status === "حاضر" || !todayRecord?.status ? "bg-success/20 text-success border-success/30"
              : todayRecord?.status === "مأذون" ? "bg-primary/20 text-primary border-primary/30"
              : todayRecord?.status === "إجازة" ? "bg-warning/20 text-warning border-warning/30"
              : "bg-destructive/20 text-destructive border-destructive/30"
            }`}>
              <CheckCircle2 className="h-3 w-3 ml-1" /> {todayRecord?.status || "حاضر"} اليوم
            </Badge>
          ) : (
            <button onClick={() => setShowAttendanceDialog(true)}
              className="text-xs bg-warning/10 text-warning border border-warning/30 rounded-full px-2 py-0.5 hover:bg-warning/20 transition-colors">
              سجّل حضورك
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setCalcOpen(true)} className="h-8 w-8" title="الحاسبة">
            <Calculator className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {!checkedInToday && (
        <div className="bg-warning/10 border-b border-warning/30 px-6 py-2.5 flex items-center justify-between">
          <p className="text-sm text-warning font-medium">⚠ لم يتم تسجيل حضورك اليوم</p>
          <Button size="sm" variant="outline" className="border-warning/40 text-warning hover:bg-warning/10 text-xs h-7"
            onClick={() => setShowAttendanceDialog(true)}>سجّل الآن</Button>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Profile summary */}
        <div className="flex items-center gap-4 mb-6 animate-fade-in">
          <Avatar className="h-14 w-14 border-2 border-primary/40">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{employee.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-bold">{employee.name}</h1>
            <p className="text-sm text-primary">{employee.jobTitle} — {employee.department}</p>
            {employee.code && (
              <code className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">{employee.code}</code>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "مهام منتظرة", value: pendingCount, color: "text-warning" },
            { label: "مهام مكتملة", value: completedCount, color: "text-success" },
            { label: "ملفات مرفوعة", value: files.length, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center animate-fade-in">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList className="w-full grid grid-cols-6 bg-muted">
            <TabsTrigger value="tasks" className="text-xs sm:text-sm"><ClipboardList className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">المهام</span></TabsTrigger>
            <TabsTrigger value="chat" className="text-xs sm:text-sm"><MessageCircle className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">المراسلة</span></TabsTrigger>
            <TabsTrigger value="salary" className="text-xs sm:text-sm"><Banknote className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">الراتب</span></TabsTrigger>
            <TabsTrigger value="files" className="text-xs sm:text-sm"><FileUp className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">ملفاتي</span></TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs sm:text-sm"><Calculator className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">الحاسبة</span></TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm"><User className="h-4 w-4 sm:ml-1" /><span className="hidden sm:inline">ملفي</span></TabsTrigger>
          </TabsList>

          {/* ── Tasks ── */}
          <TabsContent value="tasks" className="animate-fade-in">
            {tasks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>لا توجد مهام مسندة إليك</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="p-4 hover:border-primary/30 transition-all animate-fade-in">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{task.title}</p>
                        {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          {task.dueDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{task.dueDate}</span>}
                          <span className={`text-xs font-medium ${task.priority === "high" || task.priority === "عالية" ? "text-destructive" : task.priority === "medium" || task.priority === "متوسطة" ? "text-warning" : "text-muted-foreground"}`}>
                            {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : task.priority === "low" ? "منخفضة" : task.priority}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={`text-xs ${statusColor(task.status)}`}>{task.status}</Badge>
                        {task.status !== "مكتملة" && (
                          <Button size="sm" variant="outline" className="text-xs h-7 text-success border-success/30"
                            onClick={() => updateTaskMutation.mutate({ id: task.id, status: "مكتملة" })}
                            disabled={updateTaskMutation.isPending}>
                            <CheckCircle2 className="h-3 w-3 ml-1" /> إنهاء
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Chat ── */}
          <TabsContent value="chat" className="animate-fade-in">
            <Card className="flex flex-col" style={{ height: "450px" }}>
              <CardHeader className="py-3 px-4 border-b border-border flex-shrink-0">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-primary" /> المراسلة مع الإدارة
                </p>
              </CardHeader>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">لا توجد رسائل بعد</p>}
                  {messages.map((msg) => {
                    const isMe = !msg.isFromAdmin;
                    const bubbleClass = `max-w-[75%] rounded-2xl px-4 py-2.5 text-sm space-y-1.5 ${
                      isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                    }`;
                    const timeClass = `text-[10px] mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-start" : "justify-end"}`}>
                        <div className={bubbleClass}>
                          {msg.mediaType === "image" && msg.mediaUrl ? (
                            <div className="space-y-1">
                              <img
                                src={msg.mediaUrl}
                                alt={msg.message || "صورة"}
                                className="rounded-xl max-w-full max-h-52 object-cover border border-white/20"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                              {msg.message && <p className="text-xs opacity-80">{msg.message}</p>}
                            </div>
                          ) : msg.mediaType === "link" && msg.mediaUrl ? (
                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer"
                              className={`flex items-center gap-2 p-2 rounded-xl border ${
                                isMe ? "border-white/20 bg-white/10 hover:bg-white/20" : "border-border bg-background/50 hover:bg-background"
                              } transition-colors`}>
                              <span className="text-sm shrink-0">🔗</span>
                              <div className="min-w-0">
                                <p className="font-medium text-xs truncate">{msg.message || msg.mediaUrl}</p>
                                <p className="text-[10px] opacity-60 truncate" dir="ltr">{msg.mediaUrl}</p>
                              </div>
                            </a>
                          ) : (
                            <p>{msg.message}</p>
                          )}
                          <p className={timeClass}>
                            {new Date(msg.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex gap-2 flex-shrink-0">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="اكتب رسالتك للإدارة..." className="flex-1" />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMsgMutation.isPending}>
                  {sendMsgMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </Card>
          </TabsContent>

          {/* ── Salary ── */}
          <TabsContent value="salary" className="animate-fade-in">
            {latestSalary && (
              <Card className="p-5 mb-4 border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-primary mb-3">آخر راتب — {latestSalary.month}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-muted-foreground text-xs">الراتب الأساسي</p><p className="font-bold text-lg">{latestSalary.basic.toLocaleString()} ج.م</p></div>
                  <div><p className="text-muted-foreground text-xs">البدلات</p><p className="font-semibold text-success">+{latestSalary.allowances.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">الخصومات</p><p className="font-semibold text-destructive">-{latestSalary.deductions.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground text-xs">الصافي</p><p className="font-bold text-xl text-primary">{latestSalary.net.toLocaleString()} ج.م</p></div>
                </div>
                <Badge className={`mt-3 ${latestSalary.status === "مدفوع" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}`}>
                  {latestSalary.status}
                </Badge>
              </Card>
            )}
            {salaries.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground"><Banknote className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد سجلات رواتب بعد</p></Card>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>الشهر</TableHead><TableHead>الأساسي</TableHead><TableHead>البدلات</TableHead><TableHead>الخصومات</TableHead><TableHead>الصافي</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...salaries].sort((a, b) => b.month.localeCompare(a.month)).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.month}</TableCell>
                      <TableCell>{s.basic.toLocaleString()}</TableCell>
                      <TableCell className="text-success">+{s.allowances.toLocaleString()}</TableCell>
                      <TableCell className="text-destructive">-{s.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-bold text-primary">{s.net.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={s.status === "مدفوع" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* ── Files ── */}
          <TabsContent value="files" className="animate-fade-in">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); Array.from(e.dataTransfer.files).forEach(processFile); }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center mb-4 cursor-pointer transition-all ${
                isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {uploading ? <Loader2 className="h-8 w-8 mx-auto mb-2 text-primary animate-spin" /> : <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />}
              <p className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "اسحب الملفات هنا أو انقر للاختيار"}</p>
              <p className="text-xs text-muted-foreground mt-1">الحد الأقصى 20 ميجابايت</p>
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileInput} />
            </div>
            {files.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground"><FileUp className="h-10 w-10 mx-auto mb-3 opacity-20" /><p>لا توجد ملفات مرفوعة</p></Card>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <Card key={f.id} className="p-3 flex items-center gap-3 hover:border-primary/30 transition-all animate-fade-in">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-primary">{f.type}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(f.size)} — {f.uploadDate} {f.uploadTime}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteFileMutation.mutate(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Calculator ── */}
          <TabsContent value="calculator" className="animate-fade-in">
            <Card className="p-6">
              <div className="text-center mb-4">
                <Calculator className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="font-semibold">الحاسبة</p>
                <p className="text-sm text-muted-foreground">حاسبة متعددة العمليات</p>
              </div>
              <Button className="w-full" onClick={() => setCalcOpen(true)}>
                <Calculator className="h-4 w-4 ml-2" /> فتح الحاسبة
              </Button>
            </Card>
          </TabsContent>

          {/* ── Profile ── */}
          <TabsContent value="profile" className="animate-fade-in">
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/40">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold">{employee.name}</h2>
                  <p className="text-primary">{employee.jobTitle}</p>
                  {employee.code && (
                    <code className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded mt-1 inline-block">
                      كود الدخول: {employee.code}
                    </code>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">القسم</p><p className="font-medium mt-0.5">{employee.department}</p></div>
                <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">البريد الإلكتروني</p><p className="font-medium mt-0.5 truncate" dir="ltr">{employee.email}</p></div>
                <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">الهاتف</p><p className="font-medium mt-0.5" dir="ltr">{employee.phone}</p></div>
                {employee.joinDate && (
                  <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">تاريخ الانضمام</p><p className="font-medium mt-0.5">{employee.joinDate}</p></div>
                )}
              </div>
              {checkedInToday && todayRecord && (
                <div className="p-3 bg-success/5 border border-success/20 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">حالة اليوم</p>
                  <p className="font-semibold text-success mt-0.5">✓ {todayRecord.status || "حاضر"} — {todayRecord.timeFormatted}</p>
                </div>
              )}
              {!checkedInToday && (
                <Button onClick={() => setShowAttendanceDialog(true)} className="w-full">
                  <ClipboardCheck className="h-4 w-4 ml-2" /> تسجيل الحضور الآن
                </Button>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
