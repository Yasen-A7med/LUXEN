import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Trash2, Users, Mail, Phone, Building2, Pencil, TrendingUp, Banknote, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getClients, createClient, updateClient, deleteClient, type Client } from "@/lib/api";

const clientSchema = z.object({
  name: z.string().min(1, "اسم العميل مطلوب"),
  company: z.string().optional(),
  email: z.string().email("بريد غير صالح").optional().or(z.literal("")),
  phone: z.string().optional(),
  status: z.string().min(1, "الحالة مطلوبة"),
  notes: z.string().optional(),
  totalAmount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
});
type ClientForm = z.infer<typeof clientSchema>;

function statusBadge(s: string) {
  if (s === "نشط") return "bg-success/20 text-success border-success/30";
  if (s === "محتمل") return "bg-warning/20 text-warning border-warning/30";
  return "bg-muted text-muted-foreground border-border";
}

function ClientFormContent({ form, onSubmit, loading, label }: {
  form: ReturnType<typeof useForm<ClientForm>>;
  onSubmit: (d: ClientForm) => void;
  loading: boolean;
  label: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem><FormLabel>اسم العميل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="company" render={({ field }) => (
            <FormItem><FormLabel>الشركة</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>الهاتف</FormLabel><FormControl><Input dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>الحالة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{["نشط", "محتمل", "غير نشط"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="totalAmount" render={({ field }) => (
            <FormItem><FormLabel>إجمالي العقد (ج.م)</FormLabel><FormControl><Input type="number" min={0} dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="paidAmount" render={({ field }) => (
            <FormItem><FormLabel>المبلغ المدفوع (ج.م)</FormLabel><FormControl><Input type="number" min={0} dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>ملاحظات</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />} {label}
        </Button>
      </form>
    </Form>
  );
}

export default function Clients() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({ queryKey: ["clients"], queryFn: getClients });

  const addMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setIsAddOpen(false); addForm.reset(); toast({ title: "تم إضافة العميل" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Client> }) => updateClient(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); setEditClient(null); toast({ title: "تم تحديث بيانات العميل" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["clients"] }); toast({ title: "تم حذف العميل", variant: "destructive" }); },
  });

  const defaultVals = { name: "", company: "", email: "", phone: "", status: "نشط", notes: "", totalAmount: 0, paidAmount: 0 };
  const addForm = useForm<ClientForm>({ resolver: zodResolver(clientSchema), defaultValues: defaultVals });
  const editForm = useForm<ClientForm>({ resolver: zodResolver(clientSchema), defaultValues: defaultVals });

  const openEdit = (c: Client) => {
    setEditClient(c);
    editForm.reset({ name: c.name, company: c.company || "", email: c.email || "", phone: c.phone || "", status: c.status, notes: c.notes || "", totalAmount: c.totalAmount || 0, paidAmount: c.paidAmount || 0 });
  };

  const totalRevenue = clients.reduce((s, c) => s + (c.totalAmount || 0), 0);
  const totalPaid = clients.reduce((s, c) => s + (c.paidAmount || 0), 0);
  const totalRemaining = totalRevenue - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> العملاء</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} عميل مسجل</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="transition-all hover:scale-[1.03]"><Plus className="ml-2 h-4 w-4" /> إضافة عميل</Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in max-w-lg">
            <DialogHeader><DialogTitle>إضافة عميل جديد</DialogTitle></DialogHeader>
            <ClientFormContent form={addForm} onSubmit={(d) => addMutation.mutate(d)} loading={addMutation.isPending} label="إضافة" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editClient} onOpenChange={(o) => { if (!o) setEditClient(null); }}>
        <DialogContent className="animate-scale-in max-w-lg">
          <DialogHeader><DialogTitle>تعديل بيانات العميل</DialogTitle></DialogHeader>
          <ClientFormContent form={editForm}
            onSubmit={(d) => editClient && editMutation.mutate({ id: editClient.id, data: d })}
            loading={editMutation.isPending} label="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      {/* Financial summary */}
      {clients.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "إجمالي العقود", value: totalRevenue, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
            { label: "إجمالي المدفوع", value: totalPaid, icon: Banknote, color: "text-success", bg: "bg-success/10" },
            { label: "المتبقي للتحصيل", value: totalRemaining, icon: AlertCircle, color: "text-warning", bg: "bg-warning/10" },
          ].map((s) => (
            <Card key={s.label} className="p-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
                <div>
                  <p className={`text-xl font-bold ${s.color}`}>{s.value.toLocaleString()} ج.م</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead><TableHead>الشركة</TableHead><TableHead>التواصل</TableHead>
                <TableHead>إجمالي العقد</TableHead><TableHead>المدفوع</TableHead><TableHead>المتبقي</TableHead>
                <TableHead>الحالة</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">لا يوجد عملاء</TableCell></TableRow>
              ) : clients.map((c) => {
                const remaining = (c.totalAmount || 0) - (c.paidAmount || 0);
                const pct = c.totalAmount ? Math.round((c.paidAmount / c.totalAmount) * 100) : 0;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                    <TableCell>
                      <p className="font-semibold">{c.name}</p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-0.5 max-w-[120px] truncate">{c.notes}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" />{c.company || "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        {c.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /><span dir="ltr">{c.email}</span></div>}
                        {c.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /><span dir="ltr">{c.phone}</span></div>}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{(c.totalAmount || 0).toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-success">{(c.paidAmount || 0).toLocaleString()} ج.م</p>
                        {c.totalAmount > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-success rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">{pct}%</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-semibold ${remaining > 0 ? "text-warning" : "text-success"}`}>
                        {remaining.toLocaleString()} ج.م
                      </span>
                    </TableCell>
                    <TableCell><Badge className={`text-xs ${statusBadge(c.status)}`}>{c.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(c.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
