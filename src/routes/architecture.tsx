import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowRight, GitBranch, Cpu, ChevronDown, ExternalLink, FileJson, ShieldCheck } from 'lucide-react';
import { PageHeader, Pill } from '@/components/common';
import { Button } from '@/components/ui/button';
import { ArchitectureDiagram } from '@/components/architecture/ArchitectureDiagram';
import { architectureDiagrams, sampleEvent } from '@/components/architecture/architecture-data';
import { pageHead } from '@/lib/seo';

export const Route = createFileRoute('/architecture')({
  head: pageHead('System Architecture', 'Seven intended architecture diagrams for the Workplace Safety Sentinel PipeGen, TensorRT and DeepStream edge pipeline.'),
  component: ArchitecturePage,
});
const relatedPages = [
  { to: '/dashboard', label: 'Overview' }, { to: '/monitoring', label: 'Live Monitoring' }, { to: '/incidents', label: 'Incident Centre' },
  { to: '/zones', label: 'Hazard Zones' }, { to: '/ppe', label: 'PPE Monitoring' }, { to: '/analytics', label: 'Safety Analytics' },
  { to: '/system-health', label: 'System Health' }, { to: '/evidence', label: 'Evidence & Reports' }, { to: '/settings', label: 'Settings' },
] as const;
function ArchitecturePage() {
  return <div className="space-y-8">
    <PageHeader title="System Architecture" subtitle="Workplace Safety Sentinel · Track A — PipeGen (Perception)" actions={<Pill tone="warn" dot>Intended · pipeline unverified</Pill>} />
    <section className="space-y-5 border-t pt-5">
      <div className="flex items-center gap-2 text-primary"><GitBranch className="h-5 w-5" /><h2 className="text-lg font-semibold text-foreground">Workplace Safety Sentinel</h2></div>
      <p className="max-w-3xl text-sm text-muted-foreground">Edge vision pipeline that produces actionable workplace-safety events.</p>
      <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Target hardware', 'NVIDIA RTX 3050 · 4 GB VRAM'], ['Runtime target', 'PipeGen v0.5.1 / TensorRT / DeepStream'],
          ['Primary MVP', 'Restricted-zone entry detection'], ['Input', 'Repeatable local test video'],
        ].map(([term, value]) => <div key={term}><dt className="mb-1 text-xs text-muted-foreground">{term}</dt><dd className="font-medium">{value}</dd></div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-3 border-y py-5 text-sm font-medium">
        <span>Video Input</span><ArrowRight className="h-4 w-4 text-muted-foreground" /><span className="text-primary">PipeGen / TensorRT / DeepStream Inference</span><ArrowRight className="h-4 w-4 text-muted-foreground" /><span>Safety Analytics</span><ArrowRight className="h-4 w-4 text-muted-foreground" /><span className="text-warning">Incident Output</span>
      </div>
      <p className="text-xs text-muted-foreground">Intended output: timestamped JSON incident events and dashboard-visible incident records. No end-to-end pipeline verification is available.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="text-sm"><h3 className="font-medium">Existing frontend</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Dashboard pages, demo records, zone editing and proposed backend adapters are implemented. Demo behavior is not proof of inference.</p></div></div>
        <div className="flex gap-3"><Cpu className="mt-0.5 h-4 w-4 shrink-0 text-warning" /><div className="text-sm"><h3 className="font-medium">External pipeline · Planned</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Installation, model classes, engine compilation, runtime execution and MQTT operation have no supplied verification evidence.</p></div></div>
      </div>
    </section>
    <nav aria-label="Architecture sections" className="flex flex-wrap gap-x-5 gap-y-3 border-t pt-4">
      {architectureDiagrams.map((diagram, i) => <a key={diagram.id} href={`#architecture-${diagram.id}`} className="text-xs text-muted-foreground hover:text-primary"><span className="mr-1.5 font-mono text-primary">0{i + 1}</span>{diagram.title}</a>)}
    </nav>
    <section aria-label="Diagram legend" className="flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
      {(['input', 'inference', 'analytics', 'storage', 'output'] as const).map(role => <span key={role} className={`architecture-role-${role} flex items-center gap-2 capitalize`}><span className="architecture-legend-dot h-2 w-2 rounded-sm" />{role}</span>)}
      <span>→ Data flow</span><span className="border-b border-dashed pb-1">⇢ Control flow</span><span className="border border-dashed px-2 py-0.5">Optional component / transport</span><span className="border px-2 py-0.5">Deployment / compilation boundary</span>
    </section>
    {architectureDiagrams.map((diagram, i) => <section key={diagram.id} id={`architecture-${diagram.id}`} className="scroll-mt-24 border-t pt-6">
      <header className="mb-5 flex items-start gap-4"><span className="pt-1 font-mono text-sm text-primary">0{i + 1}</span><div><h2 className="text-xl font-semibold">{diagram.title}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{diagram.description}</p></div></header>
      <ArchitectureDiagram diagram={diagram} />
      <details className="group mt-4 border-y py-3"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium">Technical details & component notes<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary><div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
        {diagram.details.map(detail => <p key={detail}>{detail}</p>)}
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">{diagram.nodes.map(node => <div key={node.id}><dt className="font-medium text-foreground">{node.label} <span className="text-xs font-normal text-muted-foreground">· {node.optional ? 'Optional / Planned' : node.status}</span></dt><dd className="mt-1 text-xs">{node.detail}</dd></div>)}</dl>
      </div></details>
      {diagram.id === 'mqtt' && <div className="mt-5"><h3 className="mb-2 flex items-center gap-2 text-sm font-medium"><FileJson className="h-4 w-4 text-warning" />Sample restricted-zone event <Pill tone="warn">Illustrative only</Pill></h3><p className="mb-3 text-xs text-muted-foreground">Proposed payload, not an emitted event or confirmed backend contract. Sample confidence is not a measurement; evidence is unavailable.</p><pre className="overflow-x-auto rounded border bg-panel p-4 font-mono text-xs leading-relaxed text-foreground"><code>{JSON.stringify(sampleEvent, null, 2)}</code></pre></div>}
    </section>)}
    <section className="border-t pt-6"><h2 className="mb-4 text-lg font-semibold">Connected dashboard pages</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{relatedPages.map(page => <Button key={page.to} asChild variant="ghost" className="justify-between"><Link to={page.to}>{page.label}<ExternalLink className="h-4 w-4 text-muted-foreground" /></Link></Button>)}</div></section>
  </div>;
}
