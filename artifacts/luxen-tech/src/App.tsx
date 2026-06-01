import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Layout } from "@/components/layout";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import Tasks from "@/pages/tasks";
import Team from "@/pages/team";
import Clients from "@/pages/clients";
import Reports from "@/pages/reports";
import Files from "@/pages/files";
import Attendance from "@/pages/attendance";
import Payroll from "@/pages/payroll";
import Settings from "@/pages/settings";
import Messages from "@/pages/messages";
import Notifications from "@/pages/notifications";
import Robots from "@/pages/robots";
import Profile from "@/pages/profile";
import EmployeeProfile from "@/pages/employee-profile";
import EmployeePortal from "@/pages/employee-portal";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

interface AuthState {
  isAuthenticated: boolean;
  role: "admin" | "employee" | null;
  employeeId?: string;
  employeeName?: string;
}

const defaultAuth: AuthState = { isAuthenticated: false, role: null };

function AppRoutes() {
  const [auth] = useLocalStorage<AuthState>("luxen_auth", defaultAuth);

  if (!auth.isAuthenticated) {
    return <Login />;
  }

  if (auth.role === "employee") {
    return <EmployeePortal />;
  }

  return (
    <Switch>
      <Route path="/employee/:id">
        <Layout><EmployeeProfile /></Layout>
      </Route>
      <Route path="/projects">
        <Layout><Projects /></Layout>
      </Route>
      <Route path="/tasks">
        <Layout><Tasks /></Layout>
      </Route>
      <Route path="/team">
        <Layout><Team /></Layout>
      </Route>
      <Route path="/clients">
        <Layout><Clients /></Layout>
      </Route>
      <Route path="/reports">
        <Layout><Reports /></Layout>
      </Route>
      <Route path="/files">
        <Layout><Files /></Layout>
      </Route>
      <Route path="/attendance">
        <Layout><Attendance /></Layout>
      </Route>
      <Route path="/payroll">
        <Layout><Payroll /></Layout>
      </Route>
      <Route path="/settings">
        <Layout><Settings /></Layout>
      </Route>
      <Route path="/messages">
        <Layout><Messages /></Layout>
      </Route>
      <Route path="/notifications">
        <Layout><Notifications /></Layout>
      </Route>
      <Route path="/robots">
        <Layout><Robots /></Layout>
      </Route>
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/dashboard">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route path="/">
        <Layout><Dashboard /></Layout>
      </Route>
      <Route>
        <Layout><NotFound /></Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
