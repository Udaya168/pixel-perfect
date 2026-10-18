import { useMemo, useRef, useState, useEffect } from 'react';
import { ReactFlow, Background, Handle, Position, MarkerType, getNodesBounds, getViewportForBounds, type Node, type NodeProps, type ReactFlowInstance } from '@xyflow/react';
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
      const { toPng, toSvg } = await import('html-to-image');
      const bounds = getNodesBounds(instance.getNodes());
      const width = 1600, height = Math.max(900, Math.ceil((bounds.height / bounds.width) * width));
      const fit = getViewportForBounds(bounds, width, height, 0.1, 2, 0.15);
      const backgroundColor = getComputedStyle(workspace.current ?? viewport).getPropertyValue('--panel').trim();
      const url = await (format === 'png' ? toPng : toSvg)(viewport, { backgroundColor, width, height, pixelRatio: 1, style: { width: `${width}px`, height: `${height}px`, transform: `translate(${fit.x}px, ${fit.y}px) scale(${fit.zoom})` } });
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
