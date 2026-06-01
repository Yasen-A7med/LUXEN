import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Bot } from "lucide-react";

const robotSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم الروبوت مطلوب"),
  code: z.string().min(1, "الكود مطلوب"),
  status: z.string().min(1, "الحالة مطلوبة"),
  lastRun: z.string(),
  progress: z.number(),
});

type Robot = z.infer<typeof robotSchema>;

export default function Robots() {
  const [robots, setRobots] = useLocalStorage<Robot[]>("luxen_robots", []);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<Robot>({
    resolver: zodResolver(robotSchema),
    defaultValues: {
      name: "",
      code: "",
      status: "نشط",
      lastRun: new Date().toLocaleString('ar-SA'),
      progress: 0,
    },
  });

  const onSubmit = (data: Robot) => {
    const newRobot = { ...data, id: Date.now().toString() };
    setRobots([newRobot, ...robots]);
    setIsOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          لوحة التحكم للروبوتات
        </h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ml-2 h-4 w-4" /> إضافة روبوت</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة روبوت جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الروبوت</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الكود المعرف</FormLabel>
                      <FormControl><Input dir="ltr" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الحالة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="نشط">نشط</SelectItem>
                          <SelectItem value="متوقف">متوقف</SelectItem>
                          <SelectItem value="قيد الإصلاح">قيد الإصلاح</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">حفظ الروبوت</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم الروبوت</TableHead>
              <TableHead>الكود</TableHead>
              <TableHead>آخر تشغيل</TableHead>
              <TableHead className="w-1/4">التقدم</TableHead>
              <TableHead>الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {robots.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  لا توجد روبوتات مسجلة
                </TableCell>
              </TableRow>
            ) : (
              robots.map((robot) => (
                <TableRow key={robot.id}>
                  <TableCell className="font-medium">{robot.name}</TableCell>
                  <TableCell dir="ltr" className="text-right text-muted-foreground">{robot.code}</TableCell>
                  <TableCell dir="ltr" className="text-right">{robot.lastRun}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={robot.progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground w-8">{robot.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      robot.status === "نشط" ? "bg-success" : 
                      robot.status === "قيد الإصلاح" ? "bg-warning text-warning-foreground" : "bg-destructive"
                    }>
                      {robot.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}