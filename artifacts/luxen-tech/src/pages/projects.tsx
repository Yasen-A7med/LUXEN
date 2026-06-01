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
import { Plus, Loader2, Trash2, FolderOpen, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProjects, createProject, updateProject, deleteProject, type Project } from "@/lib/api";

const projectSchema = z.object({
  name: z.string().min(1, "اسم المشروع مطلوب"),
  client: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().min(1, "الحالة مطلوبة"),
  progress: z.coerce.number().min(0).max(100).default(0),
});
type ProjectForm = z.infer<typeof projectSchema>;

function statusBadge(s: string) {
  switch (s) {
    case "مكتمل": return "bg-success/20 text-success border-success/30";
    case "قيد التنفيذ": return "bg-primary/20 text-primary border-primary/30";
    case "متوقف": return "bg-destructive/20 text-destructive border-destructive/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}

const STATUSES = ["جديد", "قيد التنفيذ", "مكتمل", "متوقف"];

function ProjectFormContent({ form, onSubmit, loading, label }: {
  form: ReturnType<typeof useForm<ProjectForm>>;
  onSubmit: (d: ProjectForm) => void;
  loading: boolean;
  label: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>اسم المشروع</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="client" render={({ field }) => (
            <FormItem><FormLabel>العميل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>الحالة</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem><FormLabel>تاريخ البدء</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem><FormLabel>تاريخ الانتهاء</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="progress" render={({ field }) => (
          <FormItem><FormLabel>نسبة الإنجاز (%)</FormLabel><FormControl><Input type="number" min={0} max={100} dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>الوصف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />} {label}
        </Button>
      </form>
    </Form>
  );
}

export default function Projects() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: getProjects });

  const addMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setIsAddOpen(false); addForm.reset(); toast({ title: "تم إضافة المشروع" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); setEditProject(null); toast({ title: "تم تحديث المشروع" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast({ title: "تم حذف المشروع", variant: "destructive" }); },
  });

  const addForm = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", client: "", description: "", startDate: "", endDate: "", status: "جديد", progress: 0 },
  });

  const editForm = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", client: "", description: "", startDate: "", endDate: "", status: "جديد", progress: 0 },
  });

  const openEdit = (p: Project) => {
    setEditProject(p);
    editForm.reset({ name: p.name, client: p.client || "", description: p.description || "", startDate: p.startDate || "", endDate: p.endDate || "", status: p.status, progress: p.progress });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="h-6 w-6 text-primary" /> المشاريع</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} مشروع</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="transition-all hover:scale-[1.03]"><Plus className="ml-2 h-4 w-4" /> مشروع جديد</Button>
          </DialogTrigger>
          <DialogContent className="animate-scale-in">
            <DialogHeader><DialogTitle>إضافة مشروع جديد</DialogTitle></DialogHeader>
            <ProjectFormContent form={addForm} onSubmit={(d) => addMutation.mutate(d)} loading={addMutation.isPending} label="إضافة" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editProject} onOpenChange={(o) => { if (!o) setEditProject(null); }}>
        <DialogContent className="animate-scale-in">
          <DialogHeader><DialogTitle>تعديل المشروع</DialogTitle></DialogHeader>
          <ProjectFormContent form={editForm}
            onSubmit={(d) => editProject && editMutation.mutate({ id: editProject.id, data: d })}
            loading={editMutation.isPending} label="حفظ التغييرات" />
        </DialogContent>
      </Dialog>

      <Card className="overflow-hidden animate-fade-in">
        {isLoading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>المشروع</TableHead><TableHead>العميل</TableHead><TableHead>البدء</TableHead><TableHead>الانتهاء</TableHead><TableHead>الإنجاز</TableHead><TableHead>الحالة</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-10">لا توجد مشاريع</TableCell></TableRow>
              ) : projects.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors animate-fade-in">
                  <TableCell>
                    <p className="font-semibold">{p.name}</p>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{p.client || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.startDate || "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.endDate || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{p.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={`text-xs ${statusBadge(p.status)}`}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                        onClick={() => openEdit(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => deleteMutation.mutate(p.id)}>
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
