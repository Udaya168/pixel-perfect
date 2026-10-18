import { X, ArrowDownToLine, ArrowUpFromLine, Boxes, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ArchitectureNode } from './architecture-data';
export function StatusBadge({ node }: { node: ArchitectureNode }) {
  return <span className={`architecture-status architecture-status-${node.status.toLowerCase()}`}>{node.status}</span>;
}
export function NodeDetails({ node, onClose }: { node: ArchitectureNode; onClose?: () => void }) {
  return <section aria-label={`${node.label} details`} className="space-y-5 p-5">
    <header className="flex items-start justify-between gap-3"><div><p className="mb-2 font-mono text-[10px] uppercase text-muted-foreground">Component details</p><h3 className="text-lg font-semibold">{node.label}</h3></div>{onClose && <Button variant="ghost" size="icon" aria-label="Close component details" title="Close component details" onClick={onClose}><X /></Button>}</header>
    <div className="flex flex-wrap gap-2"><StatusBadge node={node} />{node.external && <span className="architecture-status architecture-status-external">External</span>}{node.optional && <span className="text-xs text-muted-foreground">Optional</span>}</div>
    <div><h4 className="mb-2 flex items-center gap-2 text-xs font-semibold"><Info className="h-3.5 w-3.5" />Purpose</h4><p className="text-sm leading-relaxed text-muted-foreground">{node.detail}</p></div>
    {([{ title: 'Inputs', icon: ArrowDownToLine, items: node.inputs }, { title: 'Outputs', icon: ArrowUpFromLine, items: node.outputs }, { title: 'Dependencies', icon: Boxes, items: node.dependencies }]).map(({ title, icon: Icon, items }) => <div key={title} className="border-t pt-4"><h4 className="mb-2 flex items-center gap-2 text-xs font-semibold"><Icon className="h-3.5 w-3.5" />{title}</h4><ul className="space-y-1 text-sm text-muted-foreground">{items.map(item => <li key={item}>{item}</li>)}</ul></div>)}
  </section>;
}
