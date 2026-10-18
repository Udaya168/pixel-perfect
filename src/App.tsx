import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DataModeProvider } from "@/hooks/use-data";
import { Toaster } from "@/components/ui/sonner";

// Lazy-loaded page components
import { Dashboard } from "@/routes/dashboard";
import { Monitoring } from "@/routes/monitoring";
import { Incidents } from "@/routes/incidents";
import { Zones } from "@/routes/zones";
import { Ppe } from "@/routes/ppe";
import { Analytics } from "@/routes/analytics";
import { SystemHealth } from "@/routes/system-health";
import { Evidence } from "@/routes/evidence";
import { Settings } from "@/routes/settings";
import { Architecture } from "@/routes/architecture";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-5xl font-bold">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
        <Link to="/dashboard" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Go to overview
        </Link>
      </div>
    </div>
  );
}

export function App() {
  return (
    <DataModeProvider>
      <ScrollToTop />
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/ppe" element={<Ppe />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/system-health" element={<SystemHealth />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>
      <Toaster theme="dark" />
    </DataModeProvider>
  );
}
