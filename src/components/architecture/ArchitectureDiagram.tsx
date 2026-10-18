import { useMemo, useRef, useState, useEffect } from 'react';
import { ReactFlow, Background, Handle, Position, MarkerType, getNodesBounds, type Node, type NodeProps, type ReactFlowInstance } from '@xyflow/react';
import { Camera, Cpu, ScanLine, Database, Radio, Download, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, Scan, Network, List, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NodeDetails, StatusBadge } from './NodeDetails';
import type { ArchitectureDiagram as DiagramData, ArchitectureNode } from './architecture-data';
type FlowNode = Node<{ component: ArchitectureNode }, 'component'>;
const icons = { input: Camera, inference: Cpu, analytics: ScanLine, storage: Database, output: Radio };
function ComponentNode({ data, selected }: NodeProps<FlowNode>) {
  const node = data.component;
  const Icon = icons[node.role];
  return <div className={`architecture-flow-node architecture-role-${node.role} ${selected ? 'is-selected' : ''} ${node.optional ? 'is-optional' : ''}`}>
    <Handle type="target" position={Position.Top} /><Handle type="source" position={Position.Bottom} />
    <div className="mb-3 flex items-center justify-between"><Icon className="h-5 w-5 architecture-node-icon" /><span className="font-mono text-[10px] uppercase text-muted-foreground">{node.role}</span></div>
    <h3 className="mb-2 text-sm font-semibold">{node.label}</h3><p className="mb-3 text-xs leading-relaxed text-muted-foreground">{node.summary}</p>
    <div className="flex items-center gap-2"><StatusBadge node={node} />{node.external && <span className="text-[10px] text-muted-foreground">External</span>}</div>
  </div>;
}
const nodeTypes = { component: ComponentNode };
export function ArchitectureDiagram({ diagram }: { diagram: DiagramData }) {
  const [instance, setInstance] = useState<ReactFlowInstance<FlowNode> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<ArchitectureNode | null>(null);
  const [view, setView] = useState<'diagram' | 'details'>('diagram');
  const [fullscreen, setFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const workspace = useRef<HTMLDivElement>(null);
  const nodes = useMemo<FlowNode[]>(() => diagram.nodes.map(node => ({ id: node.id, type: 'component', position: { x: node.x, y: node.y }, data: { component: node }, ariaLabel: `${node.label} component`, focusable: true })), [diagram]);
  const edges = useMemo(() => diagram.edges.map((edge, i) => ({ id: `${diagram.id}-edge-${i}`, source: edge.from, target: edge.to, label: edge.label, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, className: edge.optional || edge.control ? 'architecture-flow-dashed' : '' })), [diagram]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setFullscreen(false); };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => { const timer = setTimeout(() => { void instance?.fitView({ padding: 0.16 }); }, 80); return () => clearTimeout(timer); }, [fullscreen, instance, view]);
  useEffect(() => {
    const element = workspace.current;
    if (!element || !instance) return;
    let timer: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => { void instance.fitView({ padding: 0.16 }); }, 200); });
    observer.observe(element);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [instance]);
  async function download(format: 'png' | 'svg') {
    const viewport = workspace.current?.querySelector<HTMLElement>('.react-flow__viewport');
    if (!viewport || !instance) return;
    setExporting(true); setError('');
    try {
      const bounds = getNodesBounds(instance.getNodes());
      const css = getComputedStyle(viewport);
      const color = (token: string) => css.getPropertyValue(token).trim();
      const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[character] ?? character);
      const lines = (value: string) => value.split(' ').reduce<string[]>((result, word) => { const last = result.at(-1); if (last && `${last} ${word}`.length <= 30) result[result.length - 1] = `${last} ${word}`; else result.push(word); return result; }, []);
      const width = Math.ceil(bounds.width + 120), height = Math.ceil(bounds.height + 160);
      const edgeSvg = Array.from(viewport.querySelectorAll('.react-flow__edge')).map(edge => {
        const path = edge.querySelector('path.react-flow__edge-path');
        const label = edge.querySelector('.react-flow__edge-text');
        return `<path d="${escape(path?.getAttribute('d') ?? '')}" fill="none" stroke="${color('--muted-foreground')}" stroke-width="1.5" ${edge.classList.contains('architecture-flow-dashed') ? 'stroke-dasharray="5 4"' : ''} marker-end="url(#arrow)"/>${label ? `<text x="${label.getAttribute('x')}" y="${label.getAttribute('y')}" text-anchor="middle" font-size="10" fill="${color('--muted-foreground')}" paint-order="stroke" stroke="${color('--panel')}" stroke-width="4">${escape(label.textContent ?? '')}</text>` : ''}`;
      }).join('');
      const nodeSvg = diagram.nodes.map(node => {
        const roleColor = color(`--architecture-${node.role}`);
        const title = lines(node.label), summary = lines(node.summary);
        return `<g transform="translate(${node.x},${node.y})"><rect width="265" height="172" rx="6" fill="${color('--card')}" stroke="${roleColor}" ${node.optional ? 'stroke-dasharray="5 4"' : ''}/><text x="16" y="25" font-size="10" fill="${roleColor}">${node.role.toUpperCase()}</text>${title.map((line, i) => `<text x="16" y="${49 + i * 18}" font-size="14" font-weight="600" fill="${color('--foreground')}">${escape(line)}</text>`).join('')}${summary.map((line, i) => `<text x="16" y="${55 + title.length * 18 + i * 16}" font-size="11" fill="${color('--muted-foreground')}">${escape(line)}</text>`).join('')}<text x="16" y="155" font-size="10" fill="${color(node.status === 'Implemented' ? '--success' : node.status === 'Planned' ? '--architecture-input' : '--warning')}">${node.status}${node.external ? ' · External' : ''}${node.optional ? ' · Optional' : ''}</text></g>`;
      }).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color('--panel')}"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${color('--muted-foreground')}"/></marker></defs><g font-family="Arial, sans-serif"><text x="40" y="30" font-size="16" fill="${color('--foreground')}">${escape(diagram.title)} · Intended / pipeline unverified</text><g transform="translate(${60 - bounds.x},${80 - bounds.y})">${edgeSvg}${nodeSvg}</g></g></svg>`;
      let url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      if (format === 'png') {
        const image = new Image(); image.src = url; await image.decode();
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image export unavailable');
        context.drawImage(image, 0, 0); url = canvas.toDataURL('image/png');
      }
      const link = document.createElement('a'); link.download = `safety-sentinel-${diagram.id}.${format}`; link.href = url; link.click();
    } catch { setError('Export failed. Please try again.'); } finally { setExporting(false); }
  }
  return <div ref={workspace} className={`architecture-workspace ${fullscreen ? 'architecture-fullscreen' : ''}`}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-panel px-4 py-3">
      <div className="min-w-0"><h2 className="text-sm font-semibold">{diagram.title}</h2><p className="mt-1 font-mono text-[10px] text-muted-foreground">{diagram.nodes.length} components · {diagram.edges.length} connections</p></div>
      <div className="flex items-center gap-1" aria-label="Architecture view"><Button size="sm" variant={view === 'diagram' ? 'secondary' : 'ghost'} aria-pressed={view === 'diagram'} onClick={() => { setView('diagram'); setSelected(null); }}><Network />Diagram View</Button><Button size="sm" variant={view === 'details' ? 'secondary' : 'ghost'} aria-pressed={view === 'details'} onClick={() => { setView('details'); setSelected(null); }}><List />Details View</Button></div>
    </header>
    {view === 'diagram' ? <div className="architecture-canvas" aria-label={`${diagram.title} diagram canvas`}>
      <ReactFlow<FlowNode> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setInstance} onMove={(_, viewport) => setZoom(viewport.zoom)} onNodeClick={(_, node) => setSelected(node.data.component)} onNodeDoubleClick={(_, node) => { void instance?.fitView({ nodes: [{ id: node.id }], padding: 0.5, maxZoom: 1.4 }); }} onPaneClick={() => setSelected(null)} nodesDraggable={false} nodesConnectable={false} minZoom={0.15} maxZoom={2.5} fitView fitViewOptions={{ padding: 0.16 }} colorMode="dark" proOptions={{ hideAttribution: true }}><Background gap={24} size={1} /></ReactFlow>
      <div className="architecture-canvas-toolbar" aria-label="Diagram controls">
        <Button size="icon" variant="ghost" title="Zoom out" aria-label="Zoom out" onClick={() => { void instance?.zoomOut(); }}><ZoomOut /></Button><output aria-label="Zoom level" className="w-11 text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</output>
        <Button size="icon" variant="ghost" title="Zoom in" aria-label="Zoom in" onClick={() => { void instance?.zoomIn(); }}><ZoomIn /></Button>
        <span className="mx-1 h-5 border-l" /><Button size="icon" variant="ghost" title="Fit to screen" aria-label="Fit to screen" onClick={() => { void instance?.fitView({ padding: 0.16 }); }}><Scan /></Button>
        <Button size="icon" variant="ghost" title="Reset view" aria-label="Reset view" onClick={() => { setSelected(null); void instance?.fitView({ padding: 0.16 }); }}><RotateCcw /></Button>
        <Button size="icon" variant="ghost" title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={() => setFullscreen(value => !value)}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</Button>
        <span className="mx-1 h-5 border-l" /><Button size="sm" variant="ghost" aria-label="Export PNG" title="Export PNG" disabled={exporting} onClick={() => { void download('png'); }}>{exporting ? <LoaderCircle className="animate-spin" /> : <Download />}PNG</Button><Button size="sm" variant="ghost" aria-label="Export SVG" title="Export SVG" disabled={exporting} onClick={() => { void download('svg'); }}>SVG</Button>
      </div>
      {selected && <aside className="architecture-inspector"><NodeDetails node={selected} onClose={() => setSelected(null)} /></aside>}
      {error && <p role="alert" className="absolute bottom-16 left-4 text-xs text-critical">{error}</p>}
    </div> : <div className="architecture-details-list"><p className="border-b px-5 py-4 text-sm leading-relaxed text-muted-foreground">{diagram.description}</p><div className="grid divide-y lg:grid-cols-2">{diagram.nodes.map(node => <NodeDetails key={node.id} node={node} />)}</div><div className="space-y-2 border-t p-5 text-sm text-muted-foreground">{diagram.details.map(detail => <p key={detail}>{detail}</p>)}</div>{fullscreen && <Button className="m-4" variant="outline" onClick={() => setFullscreen(false)}><Minimize2 />Exit fullscreen</Button>}</div>}
    <footer className="flex flex-wrap gap-x-4 gap-y-2 border-t bg-panel px-4 py-3 text-[10px] text-muted-foreground" aria-label="Implementation status legend"><span className="architecture-status-implemented">● Implemented</span><span className="architecture-status-planned">● Planned</span><span className="architecture-status-unverified">● Unverified</span><span className="architecture-status-external">◇ External component</span><span>→ Data flow</span><span>⇢ Optional / control</span></footer>
  </div>;
}
