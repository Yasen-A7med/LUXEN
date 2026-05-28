import { useState, useEffect } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, User, AlertCircle, Search, Lock, CheckCircle2, Moon, Sun, ArrowRight, Loader2 } from "lucide-react";
import { authEmployee, lookupEmployee, type Employee } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  role: "admin" | "employee" | null;
  employeeId?: string;
  employeeName?: string;
}

const ADMIN_USERNAME = "LUXEN TECH";
const ADMIN_PASSWORD = "LUXEN TECH";

export default function Login() {
  const [, setAuth] = useLocalStorage<AuthState>("luxen_auth", { isAuthenticated: false, role: null });

  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [empPass, setEmpPass] = useState("");
  const [empError, setEmpError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) { html.classList.remove("dark"); localStorage.setItem("luxen_theme", "light"); }
    else { html.classList.add("dark"); localStorage.setItem("luxen_theme", "dark"); }
    setIsDark(!isDark);
  };

  // Live code lookup — debounced
  useEffect(() => {
    const val = codeInput.trim().toUpperCase();
    if (!val || val.length < 4) { setFoundEmployee(null); setCodeError(""); return; }
    const timer = setTimeout(async () => {
      setLookingUp(true);
      try {
        const emp = await lookupEmployee(val);
        setFoundEmployee(emp);
        setCodeError("");
      } catch {
        setFoundEmployee(null);
        setCodeError("لم يتم العثور على موظف بهذا الكود");
      } finally {
        setLookingUp(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [codeInput]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");
    if (adminUser === ADMIN_USERNAME && adminPass === ADMIN_PASSWORD) {
      setAuth({ isAuthenticated: true, role: "admin" });
    } else {
      setAdminError("اسم المستخدم أو كلمة المرور غير صحيحة");
    }
  };

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError("");
    if (!foundEmployee) { setEmpError("أدخل كود الموظف أولاً"); return; }
    if (!empPass) { setEmpError("أدخل كلمة المرور"); return; }
    setLoggingIn(true);
    try {
      const emp = await authEmployee(foundEmployee.code, empPass);
      setAuth({
        isAuthenticated: true, role: "employee",
        employeeId: String(emp.id), employeeName: emp.name,
      });
    } catch (err: unknown) {
      setEmpError((err as Error).message || "كلمة المرور غير صحيحة");
    } finally {
      setLoggingIn(false);
    }
  };

  const resetCodeSearch = () => {
    setCodeInput(""); setFoundEmployee(null); setEmpPass(""); setEmpError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 transition-colors duration-300" dir="rtl">
      <button onClick={toggleTheme}
        className="fixed top-4 left-4 p-2 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 hover:scale-110">
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-bold text-primary tracking-widest animate-scale-in">LUXEN TECH</h1>
          <p className="text-muted-foreground">نظام إدارة الشركة</p>
        </div>

        <Card className="bg-card border-border shadow-xl animate-fade-in stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-center text-lg">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="admin" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6 bg-muted">
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> المدير
                </TabsTrigger>
                <TabsTrigger value="employee" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> موظف
                </TabsTrigger>
              </TabsList>

              {/* ── Admin Tab ── */}
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="admin-user">اسم المستخدم</Label>
                    <Input id="admin-user" value={adminUser} onChange={(e) => setAdminUser(e.target.value)}
                      placeholder="LUXEN TECH" required dir="ltr"
                      className="transition-all focus:scale-[1.01]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-pass">كلمة المرور</Label>
                    <Input id="admin-pass" type="password" value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)} required dir="ltr"
                      className="transition-all focus:scale-[1.01]" />
                  </div>
                  {adminError && (
                    <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {adminError}
                    </div>
                  )}
                  <Button type="submit" className="w-full h-10 font-semibold transition-all hover:scale-[1.02]">
                    دخول المدير
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    اسم المستخدم: LUXEN TECH — كلمة المرور: LUXEN TECH
                  </p>
                </form>
              </TabsContent>

              {/* ── Employee Tab ── */}
              <TabsContent value="employee">
                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-primary" /> كود الموظف
                    </Label>
                    <div className="relative">
                      <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="مثال: LT-1042" dir="ltr"
                        className="transition-all focus:scale-[1.01] pr-10 font-mono tracking-wider" />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        {lookingUp && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        {!lookingUp && foundEmployee && <CheckCircle2 className="h-4 w-4 text-success" />}
                      </div>
                    </div>
                    {codeError && (
                      <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
                        <AlertCircle className="h-3 w-3" /> {codeError}
                      </p>
                    )}
                  </div>

                  {foundEmployee && (
                    <div className="animate-scale-in p-3 rounded-lg border border-primary/30 bg-primary/5 flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/40 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {foundEmployee.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{foundEmployee.name}</p>
                        <p className="text-xs text-primary">{foundEmployee.jobTitle}</p>
                        <p className="text-xs text-muted-foreground">{foundEmployee.department}</p>
                      </div>
                      <button type="button" onClick={resetCodeSearch}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1">
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {foundEmployee && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="emp-pass" className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-primary" /> كلمة المرور
                      </Label>
                      <Input id="emp-pass" type="password" value={empPass}
                        onChange={(e) => setEmpPass(e.target.value)}
                        placeholder="••••••••" dir="ltr" autoFocus
                        className="transition-all focus:scale-[1.01]" />
                    </div>
                  )}

                  {empError && (
                    <div className="flex items-center gap-2 text-destructive text-sm animate-fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0" /> {empError}
                    </div>
                  )}

                  <Button type="submit" className="w-full h-10 font-semibold transition-all hover:scale-[1.02]"
                    disabled={!foundEmployee || loggingIn}>
                    {loggingIn ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    دخول الموظف
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    أدخل كود موظفك للعثور على حسابك
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
