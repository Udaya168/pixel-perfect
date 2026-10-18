import { useId, useRef, useState } from 'react';
import { Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { ArchitectureDiagram as DiagramData, ArchitectureNode } from './architecture-data';

const nodeWidth = 260;
const nodeHeight = 98;
function labelLines(label: string) {
  const lines: string[] = [];
  for (const word of label.split(' ')) {
    const last = lines.at(-1);
    if (last && (last + ' ' + word).length <= 27) lines[lines.length - 1] = last + ' ' + word;
    else lines.push(word);
  }
  return lines;
}
function connector(from: ArchitectureNode, to: ArchitectureNode) {
  if (from.y === to.y) {
    const right = to.x > from.x;
    return `M ${from.x + (right ? nodeWidth : 0)} ${from.y + 49} H ${to.x + (right ? 0 : nodeWidth)}`;
  }
  const down = to.y > from.y;
  const sx = from.x + nodeWidth / 2, sy = from.y + (down ? nodeHeight : 0);
  const tx = to.x + nodeWidth / 2, ty = to.y + (down ? 0 : nodeHeight);
  const mid = (sy + ty) / 2;
  return `M ${sx} ${sy} V ${mid} H ${tx} V ${ty}`;
}
export function ArchitectureDiagram({ diagram }: { diagram: DiagramData }) {
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<SVGSVGElement>(null);
  const marker = useId().replace(/:/g, '');
  function download() {
    const source = ref.current;
    if (!source) return;
    const clone = source.cloneNode(true) as SVGSVGElement;
    const originals = [source, ...Array.from(source.querySelectorAll('*'))];
    const copies = [clone, ...Array.from(clone.querySelectorAll('*'))];
    originals.forEach((element, i) => {
      const copy = copies[i];
      if (!copy) return;
      const computed = getComputedStyle(element);
      for (const key of ['fill', 'stroke', 'color', 'font-family', 'font-size', 'font-weight', 'stroke-dasharray', 'stroke-width']) copy.setAttribute(key, computed.getPropertyValue(key));
    });
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '960'); clone.setAttribute('height', String(diagram.height));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' }));
    const a = document.createElement('a'); a.href = url; a.download = `safety-sentinel-${diagram.id}.svg`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const canvas = (large = false) => <div className="architecture-scroll overflow-auto" tabIndex={0} aria-label={`${diagram.title} diagram canvas`}>
    <svg ref={large ? undefined : ref} viewBox={`0 0 960 ${diagram.height}`} className={`architecture-svg architecture-zoom-${Math.round(zoom * 100)}`} role="img" aria-label={`${diagram.title}: intended architecture, not verified end to end`}>
      <title>{diagram.title}</title>
      <defs><marker id={`${marker}-${large ? 'large' : 'inline'}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" className="architecture-arrow" /></marker></defs>
      <rect width="960" height={diagram.height} className="architecture-background" />
      {diagram.boundaries?.map(b => <g key={b.label}><rect x={b.x} y={b.y} width={b.width} height={b.height} rx="6" className="architecture-boundary" /><text x={b.x + 14} y={b.y + 20} className="architecture-boundary-label">{b.label}</text></g>)}
      {diagram.edges.map((edge, i) => {
        const from = diagram.nodes.find(n => n.id === edge.from), to = diagram.nodes.find(n => n.id === edge.to);
        if (!from || !to) return null;
        return <path key={i} d={connector(from, to)} className={`architecture-edge ${edge.control ? 'architecture-control' : ''} ${edge.optional ? 'architecture-optional-edge' : ''}`} markerEnd={`url(#${marker}-${large ? 'large' : 'inline'})`} />;
      })}
      {diagram.nodes.map(node => <g key={node.id} className={`architecture-node architecture-role-${node.role} ${node.optional ? 'architecture-optional' : ''}`}><title>{`${node.detail} Status: ${node.status}.`}</title>
        <rect x={node.x} y={node.y} width={nodeWidth} height={nodeHeight} rx="6" />
        <rect x={node.x} y={node.y + 12} width="3" height="74" className="architecture-node-accent" />
        <text x={node.x + 16} y={node.y + 21} className="architecture-node-category">{node.role.toUpperCase()}{node.optional ? ' · OPTIONAL' : ''}</text>
        <text x={node.x + 16} y={node.y + 46} className="architecture-node-label">{labelLines(node.label).map((line, i) => <tspan key={line} x={node.x + 16} dy={i === 0 ? 0 : 19}>{line}</tspan>)}</text>
        <text x={node.x + 16} y={node.y + 86} className="architecture-node-status">{node.status}</text>
      </g>)}
    </svg>
  </div>;
  return <div className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <span className="font-mono text-[10px] uppercase text-muted-foreground">Intended architecture · end-to-end unverified</span>
      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" title="Zoom out" aria-label={`Zoom out ${diagram.title}`} disabled={zoom <= 0.75} onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}><ZoomOut /></Button>
        <span className="w-10 text-center font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" title="Zoom in" aria-label={`Zoom in ${diagram.title}`} disabled={zoom >= 1.5} onClick={() => setZoom(z => Math.min(1.5, z + 0.25))}><ZoomIn /></Button>
        <Button size="icon" variant="ghost" title="Reset zoom" aria-label={`Reset zoom ${diagram.title}`} onClick={() => setZoom(1)}><RotateCcw /></Button>
        <Button size="icon" variant="ghost" title="Fullscreen view" aria-label={`Expand ${diagram.title}`} onClick={() => setExpanded(true)}><Maximize2 /></Button>
        <Button size="icon" variant="outline" title="Download SVG diagram" aria-label={`Download ${diagram.title}`} onClick={download}><Download /></Button>
      </div>
    </div>
    {canvas()}
    <Dialog open={expanded} onOpenChange={setExpanded}><DialogContent className="h-[90dvh] max-w-[96vw] grid-rows-[auto_auto_1fr] overflow-hidden"><DialogTitle className="pr-6">{diagram.title}</DialogTitle><DialogDescription>Intended architecture · external pipeline operation is unverified.</DialogDescription>{canvas(true)}</DialogContent></Dialog>
  </div>;
}
