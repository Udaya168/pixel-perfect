import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Video, Siren, Hexagon, HardHat, BarChart3, Activity, FileCheck2, Settings, ShieldAlert,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Pill } from "@/components/common";
import { useApiHealth, useMode } from "@/hooks/use-data";

const nav = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/monitoring", label: "Live Monitoring", icon: Video },
  { to: "/incidents", label: "Incident Centre", icon: Siren },
  { to: "/zones", label: "Hazard Zones", icon: Hexagon },
  { to: "/ppe", label: "PPE Monitoring", icon: HardHat },
  { to: "/analytics", label: "Safety Analytics", icon: BarChart3 },
  { to: "/system-health", label: "System Health", icon: Activity },
  { to: "/evidence", label: "Evidence & Reports", icon: FileCheck2 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/15 text-primary">
            <ShieldAlert className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-sm font-semibold">Safety Sentinel</div>
              <div className="text-[11px] text-muted-foreground">See Risks. Act Earlier.</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.to}>
                  <SidebarMenuButton asChild isActive={path.startsWith(n.to)} tooltip={n.label}>
                    <Link to={n.to} onClick={() => setOpenMobile(false)}>
                      <n.icon className="h-4 w-4" />
                      <span>{n.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{now?.toLocaleTimeString() ?? ""}</span>;
}

function StatusBar() {
  const { mode } = useMode();
  const health = useApiHealth();
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="flex flex-1 items-center gap-2 overflow-x-auto">
        {mode === "demo" ? (
          <Pill tone="warn" dot>Demo mode — sample data</Pill>
        ) : health.isSuccess ? (
          <Pill tone="ok" dot>Backend connected</Pill>
        ) : health.isLoading ? (
          <Pill tone="muted" dot>Checking backend…</Pill>
        ) : (
          <Pill tone="crit" dot>Backend not connected</Pill>
        )}
        <span className="hidden text-xs text-muted-foreground md:inline">PipeGen · TensorRT · DeepStream edge pipeline</span>
      </div>
      <Clock />
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <StatusBar />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
