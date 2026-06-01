import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Briefcase, CheckSquare, Users, UsersRound,
  BarChart3, Folder, CalendarDays, CreditCard, Settings,
  MessageSquare, Bell, Bot, UserCircle, LogOut,
  ChevronLeft, Moon, Sun, Calculator,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CalculatorDialog } from "@/components/calculator";

const adminNavItems = [
  { href: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/projects", label: "المشاريع", icon: Briefcase },
  { href: "/tasks", label: "المهام", icon: CheckSquare },
  { href: "/team", label: "فريق العمل", icon: Users },
  { href: "/clients", label: "العملاء", icon: UsersRound },
  { href: "/reports", label: "التقارير", icon: BarChart3 },
  { href: "/files", label: "الملفات", icon: Folder },
  { href: "/attendance", label: "الحضور والانصراف", icon: CalendarDays },
  { href: "/payroll", label: "الرواتب", icon: CreditCard },
  { href: "/messages", label: "المحادثات", icon: MessageSquare },
  { href: "/notifications", label: "الإشعارات", icon: Bell },
  { href: "/robots", label: "لوحة الروبوتات", icon: Bot },
  { href: "/profile", label: "الملف الشخصي", icon: UserCircle },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

interface AuthState {
  isAuthenticated: boolean;
  role: "admin" | "employee" | null;
  employeeId?: string;
  employeeName?: string;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [auth, setAuth] = useLocalStorage<AuthState>("luxen_auth", { isAuthenticated: false, role: null });
  const [collapsed, setCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [calcOpen, setCalcOpen] = useState(false);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) { html.classList.remove("dark"); localStorage.setItem("luxen_theme", "light"); }
    else { html.classList.add("dark"); localStorage.setItem("luxen_theme", "dark"); }
    setIsDark(!isDark);
  };

  const handleLogout = () => { setAuth({ isAuthenticated: false, role: null }); setLocation("/login"); };
  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "/dashboard";
    return location.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300" dir="rtl">
      <CalculatorDialog open={calcOpen} onOpenChange={setCalcOpen} />

      <aside className={`bg-sidebar border-l border-sidebar-border hidden md:flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <div className={`flex items-center justify-between p-4 border-b border-sidebar-border ${collapsed ? "px-2" : "px-6"}`}>
          {!collapsed && (
            <div>
              <h1 className="text-xl font-bold text-primary tracking-wider">LUXEN TECH</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">نظام إدارة الشركة</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0">
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {adminNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 mx-2 my-0.5 rounded-md cursor-pointer transition-all duration-150 ${
                    collapsed ? "px-3 py-2 justify-center" : "px-3 py-2"
                  } ${active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground"
                  }`}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className={`p-3 border-t border-sidebar-border space-y-1 ${collapsed ? "px-2" : ""}`}>
          {!collapsed && auth.role === "admin" && (
            <div className="flex items-center gap-2 px-2 py-2">
              <Avatar className="h-7 w-7 border border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">م</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">المدير العام</p>
                <p className="text-[10px] text-muted-foreground">admin</p>
              </div>
            </div>
          )}
          <Button variant="ghost" size={collapsed ? "icon" : "sm"}
            className={`text-muted-foreground hover:text-foreground ${collapsed ? "w-full" : "w-full justify-start"}`}
            onClick={() => setCalcOpen(true)} title="الحاسبة">
            <Calculator className="h-4 w-4" />
            {!collapsed && <span className="mr-2">الحاسبة</span>}
          </Button>
          <Button variant="ghost" size={collapsed ? "icon" : "sm"}
            className={`text-muted-foreground hover:text-foreground ${collapsed ? "w-full" : "w-full justify-start"}`}
            onClick={toggleTheme} title={isDark ? "وضع فاتح" : "وضع داكن"}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {!collapsed && <span className="mr-2">{isDark ? "وضع فاتح" : "وضع داكن"}</span>}
          </Button>
          <Button variant="ghost" size={collapsed ? "icon" : "sm"}
            className={`text-muted-foreground hover:text-destructive ${collapsed ? "w-full" : "w-full justify-start"}`}
            onClick={handleLogout} title={collapsed ? "تسجيل الخروج" : undefined}>
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="mr-2">تسجيل الخروج</span>}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            {auth.role === "admin" && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">مدير</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCalcOpen(true)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground" title="الحاسبة">
              <Calculator className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme}
              className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all hover:scale-110"
              title={isDark ? "وضع فاتح" : "وضع داكن"}>
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/profile">
              <Avatar className="cursor-pointer h-8 w-8 border border-primary/30 transition-all hover:scale-110">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">م</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
