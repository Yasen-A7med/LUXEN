import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Mail, Phone, Building2, Users, MessageCircle, ClipboardList,
  Eye, Trash2, Calendar, Banknote, FileUp, Copy, CheckCheck, Loader2, Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee } from "@/lib/api";

const memberSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  password: z.string().min(4, "كلمة المرور يجب أن تكون 4 أحرف على الأقل"),
  joinDate: z.string().optional(),
});
const editSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  department: z.string().min(1, "القسم مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  password: z.string().optional(),
  joinDate: z.string().optional(),
  code: z.string().min(1, "الكود مطلوب"),
});
type MemberForm = z.infer<typeof memberSchema>;
type EditForm = z.infer<typeof editSchema>;

function generateCode(existing: Employee[]): string {
  const existingCodes = new Set(existing.map((m) => m.code));
  let code = ""; let attempts = 0;
  do { code = `LT-${Math.floor(1000 + Math.random() * 9000)}`; attempts++; }
  while (existingCodes.has(code) && attempts < 100);
  return code;
}

export default function Team() {
  const [isOpen, setIsOpen] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [newMemberCode, setNewMemberCode] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: team = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const addMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: (emp) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      setNewMemberCode(emp.code); setIsOpen(false);
      addForm.reset({ name: "", jobTitle: "", department: "", email: "", phone: "", password: "", joinDate: new Date().toISOString().split("T")[0] });
      toast({ title: `تم إنشاء حساب — كود: ${emp.code}`, description: `موظف: ${emp.name}` });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Employee & { password?: string }> }) => updateEmployee(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); setEditEmp(null); toast({ title: "تم تحديث بيانات الموظف" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); toast({ title: "تم حذف الموظف", variant: "destructive" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const addForm = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", jobTitle: "", department: "", email: "", phone: "", password: "", joinDate: new Date().toISOString().split("T")[0] },
  });
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: "", jobTitle: "", department: "", email: "", phone: "", password: "", joinDate: "", code: "" },
  });

  const onAdd = (data: MemberForm) => addMutation.mutate({ ...data, code: generateCode(team) });

  const openEdit = (emp: Employee) => {
    setEditEmp(emp);
    editForm.reset({ name: emp.name, jobTitle: emp.jobTitle, department: emp.department, email: emp.email, phone: emp.phone, joinDate: emp.joinDate || "", password: "", code: emp.code });
  };

  const onEdit = (data: EditForm) => {
    if (!editEmp) return;
    const update: Partial<Employee & { password?: string }> = { name: data.name, jobTitle: data.jobTitle, department: data.department, email: data.email, phone: data.phone, joinDate: data.joinDate, code: data.code };
    if (data.password) update.password = data.password;
    editMutation.mutate({ id: editEmp.id, data: update });
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "تم نسخ الكود", description: code });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">فريق العمل</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{team.length} موظف مسجل</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(o) => { setIsOpen(o); if (!o) setNewMemberCode(null); }}>
          <DialogTrigger asChild>
            <Button className="transition-all hover:scale-[1.03]"><Plus className="ml-2 h-4 w-4" /> إضافة موظف</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg animate-scale-in">
            <DialogHeader><DialogTitle>إضافة موظف جديد</DialogTitle></DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAdd)} className="space-y-4">
                <FormField control={addForm.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={addForm.control} name="jobTitle" render={({ field }) => (
                    <FormItem><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addForm.control} name="department" render={({ field }) => (
                    <FormItem><FormLabel>القسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={addForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={addForm.control} name="phone" render={({ field }) => (
                    <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addForm.control} name="joinDate" render={({ field }) => (
                    <FormItem><FormLabel>تاريخ الانضمام</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={addForm.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>كلمة مرور الموظف</FormLabel><FormControl>
                    <Input type="password" dir="ltr" placeholder="للدخول على النظام" {...field} />
                  </FormControl><FormMessage /></FormItem>
                )} />
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><span className="text-primary font-mono font-semibold">LT-XXXX</span> سيتم توليد كود تلقائي عند الحفظ</p>
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} إنشاء حساب الموظف
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editEmp} onOpenChange={(o) => { if (!o) setEditEmp(null); }}>
        <DialogContent className="max-w-lg animate-scale-in">
          <DialogHeader><DialogTitle>تعديل بيانات الموظف — {editEmp?.name}</DialogTitle></DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <FormField control={editForm.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editForm.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>كود الموظف</FormLabel><FormControl><Input dir="ltr" placeholder="LT-XXXX" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="jobTitle" render={({ field }) => (
                  <FormItem><FormLabel>المسمى الوظيفي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="department" render={({ field }) => (
                  <FormItem><FormLabel>القسم</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editForm.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="joinDate" render={({ field }) => (
                  <FormItem><FormLabel>تاريخ الانضمام</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editForm.control} name="password" render={({ field }) => (
                <FormItem><FormLabel>كلمة مرور جديدة (اتركها فارغة للإبقاء على القديمة)</FormLabel><FormControl>
                  <Input type="password" dir="ltr" placeholder="••••" {...field} />
                </FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" className="w-full" disabled={editMutation.isPending}>
                {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ التغييرات
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {newMemberCode && (
        <div className="animate-scale-in p-4 bg-success/10 border border-success/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-success">✓ تم إنشاء الحساب بنجاح</p>
            <p className="text-xs text-muted-foreground mt-0.5">كود الدخول الخاص بالموظف:</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="text-xl font-bold font-mono text-primary tracking-widest px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">{newMemberCode}</code>
            <Button size="sm" variant="outline" onClick={() => copyCode(newMemberCode, -1)} className="h-9"><Copy className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => setNewMemberCode(null)} className="h-9 text-muted-foreground">✕</Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : team.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-card border border-border rounded-xl animate-fade-in">
          <Users className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg">لا يوجد موظفون حتى الآن</p>
          <p className="text-sm mt-1">اضغط على "إضافة موظف" لإنشاء حساب موظف جديد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {team.map((member, i) => (
            <Card key={member.id}
              className={`overflow-hidden border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 animate-fade-in stagger-${Math.min(i + 1, 4)}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/30 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{member.name}</h3>
                    <p className="text-sm text-primary font-medium">{member.jobTitle}</p>
                    {member.code && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded tracking-wider">{member.code}</code>
                        <button onClick={() => copyCode(member.code, member.id)} className="text-muted-foreground hover:text-primary transition-colors">
                          {copiedId === member.id ? <CheckCheck className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    )}
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Building2 className="h-3 w-3 shrink-0" /><span className="truncate">{member.department}</span></div>
                      <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate" dir="ltr">{member.email}</span></div>
                      <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /><span dir="ltr">{member.phone}</span></div>
                      {member.joinDate && <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3 shrink-0" /><span>انضم: {member.joinDate}</span></div>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/employee/${member.id}`)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all">
                    <Eye className="h-4 w-4" /> الملف
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/employee/${member.id}?tab=chat`)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all">
                    <MessageCircle className="h-4 w-4 text-primary" /> مراسلة
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(member)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all hover:border-primary/50">
                    <Pencil className="h-4 w-4 text-primary" /> تعديل
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/employee/${member.id}?tab=salary`)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all">
                    <Banknote className="h-4 w-4 text-success" /> الراتب
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/employee/${member.id}?tab=tasks`)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all">
                    <ClipboardList className="h-4 w-4 text-warning" /> مهام
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLocation(`/employee/${member.id}?tab=files`)}
                    className="flex flex-col items-center gap-1 h-auto py-2 text-xs hover:scale-[1.04] transition-all">
                    <FileUp className="h-4 w-4" /> الملفات
                  </Button>
                </div>

                <Button size="sm" variant="ghost"
                  className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                  onClick={() => deleteMutation.mutate(member.id)} disabled={deleteMutation.isPending}>
                  <Trash2 className="h-3.5 w-3.5 ml-1" /> حذف الموظف
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
