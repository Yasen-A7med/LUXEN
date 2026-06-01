import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck, Users, Search, Trash2, UserCheck, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAttendance, deleteAttendance, getEmployees, createAttendance } from "@/lib/api";

const STATUS_OPTS = ["حاضر", "غائب", "إجازة", "مأذون"];

function statusBadge(s: string) {
  switch (s) {
    case "حاضر": return "bg-success/20 text-success border-success/30";
    case "غائب": return "bg-destructive/20 text-destructive border-destructive/30";
    case "إجازة": return "bg-warning/20 text-warning border-warning/30";
    case "مأذون": return "bg-primary/20 text-primary border-primary/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

export default function Attendance() {
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addEmpId, setAddEmpId] = useState("");
  const [addStatus, setAddStatus] = useState("حاضر");
  const [addDate, setAddDate] = useState(new Date().toISOString().split("T")[0]);
  const { toast } = useToast();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: records = [], isLoading } = useQuery({ queryKey: ["attendance"], queryFn: () => getAttendance() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const deleteMutation = useMutation({
    mutationFn: deleteAttendance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); toast({ title: "تم حذف السجل", variant: "destructive" }); },
  });

  const addMutation = useMutation({
    mutationFn: createAttendance,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["attendance"] }); setIsAddOpen(false); toast({ title: "تم تسجيل الحضور" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const handleManualAdd = () => {
    const emp = employees.find((e) => String(e.id) === addEmpId);
    if (!emp) return;
    const now = new Date();
    const dateObj = new Date(addDate);
    addMutation.mutate({
      employeeId: addEmpId, employeeName: emp.name, jobTitle: emp.jobTitle, department: emp.department,
      date: addDate,
      dateFormatted: dateObj.toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: now.toTimeString().slice(0, 5),
      timeFormatted: now.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      status: addStatus,
    });
  };

  const filtered = records
    .filter((r) => {
      const matchSearch = r.employeeName.includes(search) || (r.department || "").includes(search) || (r.jobTitle || "").includes(search);
      const matchDate = filterDate ? r.date === filterDate : true;
      return matchSearch && matchDate;
    })
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(a.time);
    });

  const todayRecords = records.filter((r) => r.date === today);
  const totalEmployees = employees.length;
  const presentToday = todayRecords.filter((r) => r.status === "حاضر" || !r.status).length;
  const absentToday = Math.max(0, totalEmployees - todayRecords.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" /> الحضور والانصراف
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">سجلات الحضور اليومية</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Plus className="ml-2 h-4 w-4" /> تسجيل يدوي</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm animate-scale-in">
            <DialogHeader><DialogTitle>تسجيل حضور يدوي</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1.5">الموظف</p>
                <Select value={addEmpId} onValueChange={setAddEmpId}>
                  <SelectTrigger><SelectValue placeholder="اختر موظفاً" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">التاريخ</p>
                <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">الحالة</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTS.map((s) => (
                    <button key={s} onClick={() => setAddStatus(s)}
                      className={`h-10 rounded-lg border text-sm font-medium transition-all ${addStatus === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={handleManualAdd} disabled={!addEmpId || addMutation.isPending}>
                {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} تسجيل
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الموظفين", value: totalEmployees, icon: Users, color: "text-primary", bg: "bg-primary/10" },
          { label: "حاضرون اليوم", value: presentToday, icon: UserCheck, color: "text-success", bg: "bg-success/10" },
          { label: "غائبون اليوم (تقديري)", value: absentToday, icon: ClipboardCheck, color: "text-destructive", bg: "bg-destructive/10" },
        ].map((s) => (
          <Card key={s.label} className="p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </div>
          </Card>
        ))}
      </div>

      {todayRecords.length > 0 && (
        <Card className="p-4 bg-success/5 border-success/20 animate-fade-in">
          <p className="text-sm font-semibold text-success mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4" /> سجلات اليوم ({todayRecords.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {todayRecords.map((r) => (
              <div key={r.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1 border text-xs font-medium ${statusBadge(r.status || "حاضر")}`}>
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{r.employeeName.charAt(0)}</AvatarFallback></Avatar>
                <span>{r.employeeName}</span>
                <span className="opacity-60">{r.status || "حاضر"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو القسم..." className="pr-9" />
        </div>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-44" />
        {filterDate && <Button variant="outline" onClick={() => setFilterDate("")}>مسح</Button>}
      </div>

      <Card className="overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead><TableHead>القسم</TableHead>
                <TableHead>التاريخ</TableHead><TableHead>الوقت</TableHead>
                <TableHead>الحالة</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">لا توجد سجلات</TableCell></TableRow>
              ) : filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-primary/10 text-primary">{r.employeeName.charAt(0)}</AvatarFallback></Avatar>
                      <div><p className="text-sm font-medium">{r.employeeName}</p><p className="text-xs text-muted-foreground">{r.jobTitle}</p></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{r.department}</TableCell>
                  <TableCell className="text-sm">{r.dateFormatted}</TableCell>
                  <TableCell className="text-sm font-mono">{r.timeFormatted}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${statusBadge(r.status || "حاضر")}`}>{r.status || "حاضر"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                      onClick={() => deleteMutation.mutate(r.id)} disabled={deleteMutation.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
