import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Loader2 } from "lucide-react";
import { getSalaries, getClients, getProjects, getTasks, getEmployees } from "@/lib/api";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const STATUS_COLORS: Record<string, string> = {
  "مكتملة": "hsl(142 71% 45%)",
  "قيد التنفيذ": "hsl(221 83% 53%)",
  "متوقفة": "hsl(0 84% 60%)",
  "جديد": "hsl(38 92% 50%)",
};

export default function Reports() {
  const [dateRange, setDateRange] = useState("year");

  const { data: salaries = [], isLoading: salLoad } = useQuery({ queryKey: ["salaries"], queryFn: () => getSalaries() });
  const { data: clients = [], isLoading: cliLoad } = useQuery({ queryKey: ["clients"], queryFn: getClients });
  const { data: projects = [], isLoading: projLoad } = useQuery({ queryKey: ["projects"], queryFn: getProjects });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks"], queryFn: () => getTasks() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });

  const isLoading = salLoad || cliLoad || projLoad;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);

  const filterByRange = (month: string) => {
    const [y, m] = month.split("-").map(Number);
    if (dateRange === "month") return y === currentYear && m - 1 === currentMonth;
    if (dateRange === "quarter") return y === currentYear && Math.floor((m - 1) / 3) === currentQuarter;
    return y === currentYear;
  };

  const filteredSalaries = salaries.filter((s) => filterByRange(s.month));
  const totalExpenses = filteredSalaries.reduce((sum, s) => sum + s.net, 0);
  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalPaid = clients.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;

  const monthlyData = MONTHS_AR.map((name, idx) => {
    const monthStr = `${currentYear}-${String(idx + 1).padStart(2, "0")}`;
    const monthSalaries = salaries.filter((s) => s.month === monthStr);
    const expenses = monthSalaries.reduce((sum, s) => sum + s.net, 0);
    const revenue = Math.round(totalRevenue / 12);
    return { name, الإيرادات: revenue, المصروفات: expenses };
  });

  const statusGroups = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.entries(statusGroups).map(([name, value]) => ({
    name, value, fill: STATUS_COLORS[name] || "hsl(var(--muted))",
  }));

  const completedTasks = tasks.filter((t) => t.status === "مكتملة").length;
  const pendingTasks = tasks.filter((t) => t.status !== "مكتملة").length;
  const taskCompletion = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="الفترة الزمنية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">هذا الشهر</SelectItem>
            <SelectItem value="quarter">هذا الربع</SelectItem>
            <SelectItem value="year">هذا العام</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{totalRevenue.toLocaleString()} <span className="text-base font-normal">ج.م</span></div>
            <p className="text-xs text-muted-foreground mt-1">مدفوع: {totalPaid.toLocaleString()} ج.م</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الرواتب</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{totalExpenses.toLocaleString()} <span className="text-base font-normal">ج.م</span></div>
            <p className="text-xs text-muted-foreground mt-1">{filteredSalaries.length} سجل راتب</p>
          </CardContent>
        </Card>
        <Card className={netProfit >= 0 ? "border-success/20" : "border-destructive/20"}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">صافي الربح</CardTitle>
            <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? "text-success" : "text-destructive"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {netProfit.toLocaleString()} <span className="text-base font-normal">ج.م</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{netProfit >= 0 ? "ربح" : "خسارة"}</p>
          </CardContent>
        </Card>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "الموظفين", value: employees.length, icon: "👥" },
          { label: "إجمالي المشاريع", value: projects.length, icon: "📁" },
          { label: "اكتمال المهام", value: `${taskCompletion}%`, icon: "✅" },
          { label: "العملاء النشطون", value: clients.filter(c => c.status === "نشط").length, icon: "🤝" },
        ].map((k) => (
          <Card key={k.label} className="p-4 text-center">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> الأداء المالي الشهري</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="الإيرادات" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="المصروفات" fill="hsl(0 84% 60% / 0.8)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> حالة المشاريع</CardTitle>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm">
                <Briefcase className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>لا توجد مشاريع بعد</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                  />
                  <Legend formatter={(value) => <span className="text-xs">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tasks breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص المهام</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted/40 rounded-xl">
              <p className="text-3xl font-bold">{tasks.length}</p>
              <p className="text-sm text-muted-foreground mt-1">إجمالي المهام</p>
            </div>
            <div className="p-4 bg-success/10 rounded-xl">
              <p className="text-3xl font-bold text-success">{completedTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">مكتملة</p>
            </div>
            <div className="p-4 bg-warning/10 rounded-xl">
              <p className="text-3xl font-bold text-warning">{pendingTasks}</p>
              <p className="text-sm text-muted-foreground mt-1">معلقة</p>
            </div>
          </div>
          {tasks.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>نسبة الإنجاز</span><span>{taskCompletion}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-700" style={{ width: `${taskCompletion}%` }} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
