import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, UsersRound, Users, DollarSign, CheckSquare, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getProjects, getClients, getEmployees, getSalaries, getTasks } from "@/lib/api";

const MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function Dashboard() {
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const { data: clients = [] } = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
  const { data: salaries = [] } = useQuery({ queryKey: ["salaries"], queryFn: () => getSalaries() });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });

  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalSalaryExpenses = salaries.reduce((sum, s) => sum + s.net, 0);

  const monthlyData = MONTHS.map((name, idx) => {
    const monthStr = String(idx + 1).padStart(2, "0");
    const monthSalaries = salaries.filter((s) => s.month?.slice(5, 7) === monthStr);
    const revenue = clients.length > 0 ? Math.round(totalRevenue / 12) : 0;
    const expenses = monthSalaries.reduce((sum, s) => sum + s.net, 0);
    return { name, الإيرادات: revenue, المصروفات: expenses };
  }).slice(0, 6);

  const recentTasks = [...tasks]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5);

  const recentProjects = [...projects]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  const activeProjects = projects.filter((p) => p.status === "قيد التنفيذ").length;
  const completedTasks = tasks.filter((t) => t.status === "مكتملة").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <Badge variant="outline" className="text-xs text-primary border-primary/30">
          {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المشاريع", value: projects.length, sub: `${activeProjects} نشطة`, icon: Briefcase, color: "text-primary" },
          { label: "إجمالي العملاء", value: clients.length, sub: `${totalRevenue.toLocaleString()} ج.م إجمالي`, icon: UsersRound, color: "text-success" },
          { label: "الموظفين", value: employees.length, sub: `${tasks.length} مهمة مسندة`, icon: Users, color: "text-warning" },
          { label: "صافي الرواتب", value: `${totalSalaryExpenses.toLocaleString()}`, sub: "ج.م هذه الفترة", icon: DollarSign, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "مهام مكتملة", value: completedTasks, total: tasks.length, color: "bg-success" },
          { label: "مشاريع نشطة", value: activeProjects, total: projects.length, color: "bg-primary" },
          { label: "عملاء نشطون", value: clients.filter(c => c.status === "نشط").length, total: clients.length, color: "bg-warning" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{s.value}<span className="text-sm text-muted-foreground font-normal">/{s.total}</span></p>
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`}
                style={{ width: s.total > 0 ? `${Math.round((s.value / s.total) * 100)}%` : "0%" }} />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> نظرة عامة مالية (أول 6 أشهر)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="الإيرادات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المصروفات" fill="hsl(var(--destructive) / 0.7)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">أحدث المهام</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                <CheckSquare className="h-8 w-8 mb-2 opacity-20" />
                <p>لا توجد مهام بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-2 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.dueDate || "بدون موعد"}</p>
                    </div>
                    <Badge className={`text-[10px] shrink-0 ${
                      task.status === "مكتملة" ? "bg-success/20 text-success border-success/30"
                      : "bg-warning/20 text-warning border-warning/30"
                    }`}>{task.status}</Badge>
                  </div>
                ))}
                {recentProjects.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">أحدث المشاريع</p>
                    {recentProjects.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <p className="text-sm truncate flex-1">{p.name}</p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{p.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
