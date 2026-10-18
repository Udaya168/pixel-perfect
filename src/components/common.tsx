import type { ReactNode } from "react";
import { AlertTriangle, Loader2, RefreshCw, Inbox, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ApiError, describeError } from "@/services/api-client";

export type Tone = "ok" | "warn" | "crit" | "info" | "muted";
const toneCls: Record<Tone, string> = {
  ok: "border-success/40 bg-success/10 text-success",
  warn: "border-warning/40 bg-warning/10 text-warning",
  crit: "border-critical/40 bg-critical/10 text-critical",
  info: "border-primary/40 bg-primary/10 text-primary",
  muted: "border-border bg-muted text-muted-foreground",
};

export function Pill({ tone = "muted", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
      <span className={cn("inline-flex max-w-full items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-normal", toneCls[tone], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full bg-current", tone === "ok" && "glow-active")} />}
      {children}
    </span>
  );
}

export function stateTone(s: string | null | undefined): Tone {
  switch (s) {
    case "ok": case "online": case "delivered": case "resolved": case "open_ws": return "ok";
    case "degraded": case "pending": case "acknowledged": case "medium": case "high": return "warn";
    case "down": case "error": case "failed": case "offline": case "open": case "critical": return "crit";
    default: return "muted";
  }
}

export function Panel({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 border-t border-border", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </header>
      )}
      <div className="pb-5 pt-2">{children}</div>
    </section>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone | undefined }) {
  return (
    <div className="min-w-0 rounded-lg border bg-card p-4 lg:p-5">
      <div className="panel-title">{label}</div>
      <div className={cn("mt-3 font-mono text-3xl font-medium", tone === "crit" && "text-critical", tone === "warn" && "text-warning", tone === "ok" && "text-success")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function QueryState({ isLoading, error, onRetry, empty, emptyText = "No records received yet." }: { isLoading: boolean; error: unknown; onRetry?: () => void; empty?: boolean; emptyText?: string }) {
  if (isLoading)
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground justify-center">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  if (error) {
    const notConfigured = error instanceof ApiError && error.kind === "not_configured";
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-sm">
        {notConfigured ? <PlugZap className="h-5 w-5 text-muted-foreground" /> : <AlertTriangle className="h-5 w-5 text-critical" />}
        <div className="font-medium">{notConfigured ? "NOT CONNECTED" : "Backend request failed"}</div>
        <div className="max-w-md text-muted-foreground">{describeError(error)}</div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        )}
      </div>
    );
  }
  if (empty)
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
        <Inbox className="h-5 w-5" /> {emptyText}
      </div>
    );
  return null;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="rounded border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{children}</p>;
}
