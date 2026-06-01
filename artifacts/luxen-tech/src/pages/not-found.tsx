import { Link } from "wouter";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 text-center p-8 bg-background">
      <div className="text-8xl font-bold text-primary">404</div>
      <h1 className="text-2xl font-bold text-foreground">الصفحة غير موجودة</h1>
      <p className="text-muted-foreground max-w-sm">عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
      <Link href="/">
        <Button className="gap-2">
          <Home className="h-4 w-4" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
