import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Server as ServerIcon, Activity, Database, Cpu } from "lucide-react";

const serverSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "اسم السيرفر مطلوب"),
  ip: z.string().min(1, "عنوان IP مطلوب"),
  status: z.string(),
  cpu: z.number(),
  ram: z.number(),
  storage: z.number(),
});

type ServerType = z.infer<typeof serverSchema>;

export default function Servers() {
  const [servers, setServers] = useLocalStorage<ServerType[]>("luxen_servers", [
    { id: "1", name: "Main Database", ip: "192.168.1.100", status: "Online", cpu: 45, ram: 60, storage: 80 },
    { id: "2", name: "Web App Server", ip: "192.168.1.101", status: "Online", cpu: 25, ram: 40, storage: 35 },
  ]);
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<ServerType>({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      name: "",
      ip: "",
      status: "Online",
      cpu: 0,
      ram: 0,
      storage: 0,
    },
  });

  const onSubmit = (data: ServerType) => {
    const newServer = { ...data, id: Date.now().toString() };
    setServers([...servers, newServer]);
    setIsOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">الأنظمة والسيرفرات</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="ml-2 h-4 w-4" /> إضافة سيرفر</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة سيرفر جديد</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم السيرفر</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان IP</FormLabel>
                      <FormControl><Input dir="ltr" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">حفظ السيرفر</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servers.map((server) => (
          <Card key={server.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <ServerIcon className="h-5 w-5 text-primary" />
                {server.name}
              </CardTitle>
              <Badge variant={server.status === "Online" ? "default" : "destructive"}>
                {server.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="text-sm text-muted-foreground mb-4 text-right" dir="ltr">{server.ip}</div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU</div>
                  <span>{server.cpu}%</span>
                </div>
                <Progress value={server.cpu} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Activity className="h-4 w-4" /> RAM</div>
                  <span>{server.ram}%</span>
                </div>
                <Progress value={server.ram} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Database className="h-4 w-4" /> Storage</div>
                  <span>{server.storage}%</span>
                </div>
                <Progress value={server.storage} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}