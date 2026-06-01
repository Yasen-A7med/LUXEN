import { useState } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, CheckSquare, UsersRound } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  title: z.string().min(1, "المسمى الوظيفي مطلوب"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [profile, setProfile] = useLocalStorage<ProfileData>("luxen_profile", {
    name: "المدير العام",
    title: "مدير تنفيذي",
    email: "admin@luxentech.com",
    phone: "+966 50 000 0000",
  });

  const [projects] = useLocalStorage("luxen_projects", []);
  const [tasks] = useLocalStorage("luxen_tasks", []);
  const [clients] = useLocalStorage("luxen_clients", []);

  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  const onSubmit = (data: ProfileData) => {
    setProfile(data);
    toast({
      title: "تم الحفظ",
      description: "تم تحديث الملف الشخصي بنجاح",
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Avatar className="h-32 w-32 mb-4 border-2 border-primary">
              <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold">{profile.name}</h2>
            <p className="text-primary font-medium">{profile.title}</p>
            <div className="w-full mt-6 space-y-2 text-sm text-muted-foreground border-t border-border pt-4">
              <p dir="ltr">{profile.email}</p>
              <p dir="ltr">{profile.phone}</p>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المشاريع</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المهام</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العملاء</p>
                  <p className="text-2xl font-bold">{clients.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تعديل البيانات</CardTitle>
              <CardDescription>قم بتحديث معلومات ملفك الشخصي</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المسمى الوظيفي</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl><Input type="email" dir="ltr" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl><Input dir="ltr" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit">حفظ التغييرات</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}