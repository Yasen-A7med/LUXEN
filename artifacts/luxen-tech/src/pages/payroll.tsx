import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Trash2, Banknote } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { getEmployees, getSalaries, saveSalary, deleteSalary } from "@/lib/api";

const payrollSchema = z.object({
  employeeId: z.string().min(1, "الموظف مطلوب"),
  month: z.string().min(1, "الشهر مطلوب"),
  basic: z.coerce.number().min(0),
  allowances: z.coerce.number().min(0).default(0),
  deductions: z.coerce.number().min(0).default(0),
  status: z.enum(["مدفوع", "قيد المراجعة"]),
});
type PayrollForm = z.infer<typeof payrollSchema>;

export default function PayrollPage() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: salaries = [], isLoading } = useQuery({ queryKey: ["salaries"], queryFn: () => getSalaries() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const addMutation = useMutation({
    mutationFn: (data: PayrollForm) => {
      const net = data.basic + data.allowances - data.deductions;
      return saveSalary({ ...data, net });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salaries"] }); setIsOpen(false); form.reset(); toast({ title: "تم حفظ الراتب" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalary,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["salaries"] }); toast({ title: "تم الحذف", variant: "destructive" }); },
  });

  const form = useForm<PayrollForm>({
    resolver: zodResolver(payrollSchema),
    defaultValues: { employeeId: "", month: new Date().toISOString().slice(0, 7), basic: 0, allowances: 0, deductions: 0, status: "قيد المراجعة" },
  });

  const paidCount = salaries.filter((s) => s.status === "مدفوع").length;
  const pendingCount = salaries.filter((s) => s.status !== "مدفوع").length;
  const totalNet = salaries.reduce((sum, s) => sum + s.net, 0);

  const pieData = [
    { name: "مدفوع", value: paidCount || 1, fill: "hsl(var(--success))" },
    { name: "قيد المراجعة", value: pendingCount || 1, fill: "hsl(var(--primary))" },
  ];

  const getEmployeeName = (empId: string) => employees.find((e) => String(e.id) === empId)?.name || empId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Banknote className="h-6 w-6 text-primary" /> الرواتب والمصروفات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إجمالي الصافي: <strong className="text-primary">{totalNet.toLocaleString()} ج.م</strong></p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="transition-all hover:scale-[1.03]"><Plus className="ml-2 h-4 w-4" /> إضافة راتب</Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader><DialogTitle>تسجيل راتب جديد</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((d) => addMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="employeeId" render={({ field }) => (
                  <FormItem><FormLabel>الموظف</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="اختر موظفاً" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {employees.map((e) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="month" render={({ field }) => (
                  <FormItem><FormLabel>الشهر</FormLabel><FormControl><Input type="month" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-3 gap-3">
                  {(["basic", "allowances", "deductions"] as const).map((key) => (
                    <FormField key={key} control={form.control} name={key} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{key === "basic" ? "الأساسي" : key === "allowances" ? "البدلات" : "الخصومات"}</FormLabel>
                        <FormControl><Input type="number" dir="ltr" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>الحالة</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent><SelectItem value="مدفوع">مدفوع</SelectItem><SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem></SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
                  صافي الراتب: <strong className="text-primary">
                    {((form.watch("basic") || 0) + (form.watch("allowances") || 0) - (form.watch("deductions") || 0)).toLocaleString()} ج.م
                  </strong>
                </div>
                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2" />} حفظ
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 animate-fade-in">
          <CardHeader><CardTitle className="text-base">توزيع الرواتب</CardTitle></CardHeader>
          <CardContent className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
                </Pie>
                <RechartsTooltip formatter={(val, name) => [`${val} سجل`, name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" />مدفوع ({paidCount})</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />قيد المراجعة ({pendingCount})</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>الموظف</TableHead><TableHead>الشهر</TableHead><TableHead>الأساسي</TableHead><TableHead>البدلات</TableHead><TableHead>الخصومات</TableHead><TableHead>الصافي</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {salaries.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">لا توجد سجلات رواتب</TableCell></TableRow>
                ) : salaries.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                    <TableCell className="font-medium">{getEmployeeName(s.employeeId)}</TableCell>
                    <TableCell dir="ltr" className="text-right">{s.month}</TableCell>
                    <TableCell dir="ltr" className="text-right">{s.basic.toLocaleString()}</TableCell>
                    <TableCell dir="ltr" className="text-right text-success">+{s.allowances.toLocaleString()}</TableCell>
                    <TableCell dir="ltr" className="text-right text-destructive">-{s.deductions.toLocaleString()}</TableCell>
                    <TableCell dir="ltr" className="text-right font-bold text-primary">{s.net.toLocaleString()} ج.م</TableCell>
                    <TableCell>
                      <Badge className={s.status === "مدفوع" ? "bg-success/20 text-success border-success/30" : "bg-warning/20 text-warning border-warning/30"}>
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(s.id)}>
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
    </div>
  );
}
