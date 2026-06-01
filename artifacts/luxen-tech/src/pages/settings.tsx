import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { exportBackup, restoreBackup } from "@/lib/api";
import { Download, Upload, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "تم الحفظ بنجاح", description: "تم تحديث الإعدادات" });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup = await exportBackup();
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `luxen-tech-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "تم تصدير النسخة الاحتياطية", description: `luxen-tech-backup-${date}.json` });
    } catch (e) {
      toast({ title: "فشل التصدير", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data) throw new Error("ملف غير صالح");
      await restoreBackup(parsed.data);
      toast({ title: "تم استعادة البيانات بنجاح", description: "تم استيراد جميع البيانات" });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      toast({ title: "فشل الاستعادة", description: "تأكد من صحة الملف", variant: "destructive" });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">الإعدادات</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الشركة</CardTitle>
            <CardDescription>قم بتحديث معلومات الشركة الأساسية</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">اسم الشركة</Label>
                  <Input id="companyName" defaultValue="LUXEN TECH" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان</Label>
                  <Input id="address" defaultValue="القاهرة، مصر" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" dir="ltr" defaultValue="+20 10 0000 0000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" dir="ltr" defaultValue="info@luxentech.com" />
                </div>
              </div>
              <Button type="submit">حفظ التغييرات</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات النظام</CardTitle>
            <CardDescription>تخصيص تفضيلات النظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>لغة النظام</Label>
                <div className="text-sm text-muted-foreground">اختر لغة واجهة المستخدم</div>
              </div>
              <Select defaultValue="ar">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="اختر اللغة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                  <SelectItem value="en">English (الإنجليزية)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>تفعيل الإشعارات</Label>
                <div className="text-sm text-muted-foreground">السماح بإرسال إشعارات النظام</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>الوضع الليلي</Label>
                <div className="text-sm text-muted-foreground">تفعيل الوضع الداكن دائماً</div>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>إعدادات الأمان</CardTitle>
            <CardDescription>تحديث كلمة المرور الخاصة بك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                <Input id="currentPassword" type="password" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                <Input id="newPassword" type="password" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <Input id="confirmPassword" type="password" dir="ltr" />
              </div>
              <Button type="submit" variant="destructive">تغيير كلمة المرور</Button>
            </form>
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> النسخ الاحتياطي والاستعادة
            </CardTitle>
            <CardDescription>
              صدّر نسخة احتياطية من جميع بياناتك أو استعدها في حال فقدانها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Export */}
            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div>
                <p className="font-semibold text-sm">تصدير النسخة الاحتياطية</p>
                <p className="text-xs text-muted-foreground mt-0.5">تنزيل جميع بيانات النظام (موظفون، حضور، رواتب، مهام، مشاريع، عملاء) كملف JSON</p>
              </div>
              <Button onClick={handleExport} disabled={exporting} className="shrink-0">
                {exporting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Download className="h-4 w-4 ml-2" />}
                تنزيل النسخة
              </Button>
            </div>

            {/* Import */}
            <div className="flex items-start justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-xl gap-4">
              <div className="flex-1">
                <p className="font-semibold text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> استعادة البيانات
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  تحذير: سيتم مسح جميع البيانات الحالية واستبدالها بالبيانات الموجودة في ملف النسخة الاحتياطية. هذا الإجراء لا يمكن التراجع عنه.
                </p>
              </div>
              <Button variant="destructive" onClick={() => fileInputRef.current?.click()} disabled={restoring} className="shrink-0">
                {restoring ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Upload className="h-4 w-4 ml-2" />}
                رفع ملف الاستعادة
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              يُنصح بتصدير نسخة احتياطية بشكل دوري للحفاظ على بياناتك
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
