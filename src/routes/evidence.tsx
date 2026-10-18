import { createFileRoute } from "@tanstack/react-router";
import { Download, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note, PageHeader, Panel, Pill, QueryState } from "@/components/common";
import { useEvidence, useMode } from "@/hooks/use-data";
import { backend } from "@/services/backend";
import { apiUrl } from "@/services/api-client";
import { EVIDENCE_CATEGORIES } from "@/types/domain";
import { fmtTime } from "@/utils/format";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/evidence")({
  head: pageHead("Evidence & Reports", "PipeGen, TensorRT, runtime and test evidence files supplied by the backend."),
  component: EvidencePage,
});

function EvidencePage() {
  const { mode } = useMode();
  const ev = useEvidence();
  const items = ev.data ?? [];
  const cats = [...new Set([...EVIDENCE_CATEGORIES, ...items.map((i) => i.category)])];

  return (
    <div className="space-y-4">
      <PageHeader title="Evidence & Reports" subtitle="Only files actually returned by the backend are listed. Nothing is generated here." />
      {mode === "demo" && <Note>Demo mode: every category is shown as pending. No speed reports, engine artifacts or compliance evidence are fabricated.</Note>}
      <QueryState isLoading={ev.isLoading} error={ev.error} onRetry={() => ev.refetch()} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cats.map((c) => {
          const files = items.filter((i) => i.category === c && i.downloadable);
          return (
            <Panel key={c} title={c} action={<Pill tone={files.length ? "ok" : "muted"}>{files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : "pending"}</Pill>}>
              {files.length ? (
                <ul className="space-y-2">
                  {files.map((f) => {
                    const href = apiUrl(backend.evidenceDownloadPath(f.evidence_id));
                    return (
                      <li key={f.evidence_id} className="flex items-center justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <div className="truncate">{f.title}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">{f.filename} · {f.size_bytes != null ? `${(f.size_bytes / 1024).toFixed(1)} KB` : "?"} · {fmtTime(f.created_at)}</div>
                        </div>
                        {href && <Button asChild size="sm" variant="outline"><a href={href} download><Download className="h-4 w-4" /></a></Button>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileQuestion className="h-4 w-4" /> Not yet provided by backend</div>
              )}
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
