import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Video, Siren, Hexagon, HardHat, BarChart3, Activity, FileCheck2, Settings, ShieldCheck, ChevronRight, GitBranch,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar, SidebarFooter, SidebarGroupLabel,
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
  { to: "/architecture", label: "Architecture", icon: GitBranch },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border py-6">
        <div className="flex items-center gap-3 px-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-base font-semibold text-foreground">Safety Sentinel<span className="text-primary">.</span></div>
              <div className="mt-1 text-[10px] text-muted-foreground">See Risks. Act Earlier.</div>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="pt-5">
          <SidebarGroupLabel className="mb-2 text-[10px] uppercase tracking-normal">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {nav.map((n) => (
                <SidebarMenuItem key={n.to}>
                  <SidebarMenuButton className="h-10 text-[13px] data-[active=true]:font-semibold" asChild isActive={path.startsWith(n.to)} tooltip={n.label}>
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
      <SidebarFooter className="border-t border-sidebar-border py-4">
        <div className="flex items-center gap-3 px-1">
          <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
          {!collapsed && <div className="text-xs"><div className="font-medium text-foreground">Edge safety platform</div><div className="mt-1 text-[10px] text-muted-foreground">PipeGen / TensorRT / DeepStream</div></div>}
        </div>
      </SidebarFooter>
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
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = nav.find((n) => path.startsWith(n.to));
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-7">
      <SidebarTrigger />
      <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex"><span>Workspace</span><ChevronRight className="h-3 w-3" /><span className="text-foreground">{current?.label}</span></div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        {mode === "demo" ? (
           <Pill tone="warn" dot>Demo mode · sample data</Pill>
        ) : health.isSuccess ? (
          <Pill tone="ok" dot>Backend connected</Pill>
        ) : health.isLoading ? (
          <Pill tone="muted" dot>Checking backend…</Pill>
        ) : (
          <Pill tone="crit" dot>Backend not connected</Pill>
        )}
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
           <main className="app-content mx-auto w-full max-w-[1600px] flex-1 p-5 md:p-7 xl:p-9">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
