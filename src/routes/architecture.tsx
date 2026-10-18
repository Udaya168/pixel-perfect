import { useState } from 'react';
import { Search, GitBranch, ChevronRight, Cpu } from 'lucide-react';
import { PageHeader, Pill } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArchitectureDiagram } from '@/components/architecture/ArchitectureDiagram';
import { architectureDiagrams } from '@/components/architecture/architecture-data';
import { pageHead } from '@/lib/seo';

export function Architecture() {
  const [selectedId, setSelectedId] = useState('overall');
  const [search, setSearch] = useState('');
  const selected = architectureDiagrams.find(diagram => diagram.id === selectedId) ?? architectureDiagrams[0];
  if (!selected) return null;
  const visible = architectureDiagrams.filter(diagram => `${diagram.title} ${diagram.description}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5">
    <PageHeader title="System Architecture" subtitle="Workplace Safety Sentinel · Track A — PipeGen (Perception)" actions={<Pill tone="warn" dot>Pipeline unverified</Pill>} />
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y py-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Cpu className="h-4 w-4 text-primary" />PipeGen v0.5.1 · TensorRT · DeepStream</span><span>NVIDIA RTX 3050 · 4 GB VRAM</span><span>Frontend: demo/sample data</span></div>
    <div className="architecture-explorer">
      <aside className="architecture-navigation" aria-label="Architecture diagrams">
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold"><GitBranch className="h-4 w-4 text-primary" />ARCHITECTURES <span className="ml-auto font-mono text-muted-foreground">07</span></h2>
        <div className="relative mb-4"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} aria-label="Search architectures" placeholder="Search architectures…" className="pl-9 text-xs" /></div>
        <nav className="architecture-diagram-list">{visible.map(diagram => <Button key={diagram.id} variant="ghost" aria-label={`Select ${diagram.title}`} aria-pressed={selectedId === diagram.id} className={`architecture-nav-item ${selectedId === diagram.id ? 'is-active' : ''}`} onClick={() => setSelectedId(diagram.id)}><span className="pt-0.5 font-mono text-[10px] text-muted-foreground">0{architectureDiagrams.indexOf(diagram) + 1}</span><span className="min-w-0 flex-1 text-left"><span className="block text-xs font-medium">{diagram.title}</span><span className="mt-1 block text-[10px] font-normal text-muted-foreground">{diagram.nodes.length} components</span></span><ChevronRight className="h-3.5 w-3.5 shrink-0" /></Button>)}</nav>
        {visible.length === 0 && <p className="py-3 text-xs text-muted-foreground">No matching architectures.</p>}
        <p className="mt-6 border-t pt-4 text-[11px] leading-relaxed text-muted-foreground">Intended system design. External installation, compilation and inference have no supplied verification evidence.</p>
      </aside>
      <ArchitectureDiagram key={selected.id} diagram={selected} />
    </div>
  </div>;
}
