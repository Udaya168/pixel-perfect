export type NodeRole = 'input' | 'inference' | 'analytics' | 'storage' | 'output';
export type ArchitectureNode = { id: string; label: string; role: NodeRole; detail: string; x: number; y: number; optional?: boolean; status: 'Planned' };
export type ArchitectureEdge = { from: string; to: string; control?: boolean; optional?: boolean };
export type ArchitectureDiagram = { id: string; title: string; description: string; nodes: ArchitectureNode[]; edges: ArchitectureEdge[]; height: number; boundaries?: { label: string; x: number; y: number; width: number; height: number }[]; details: string[] };
type Step = [string, NodeRole, string, boolean?];
function sequence(id: string, title: string, description: string, steps: Step[], details: string[]): ArchitectureDiagram {
  const nodes: ArchitectureNode[] = steps.map(([label, role, detail, optional], i) => {
    const row = Math.floor(i / 3);
    return { id: `${id}-${i}`, label, role, detail, x: 30 + (row % 2 === 0 ? i % 3 : 2 - i % 3) * 310, y: 55 + row * 145, optional, status: 'Planned' };
  });
  return { id, title, description, nodes, edges: nodes.slice(1).map((node, i) => ({ from: nodes[i]?.id ?? '', to: node.id, optional: node.optional })), height: Math.ceil(steps.length / 3) * 145 + 40, details };
}
export const architectureDiagrams: ArchitectureDiagram[] = [
  sequence('overall', 'Overall System Architecture', 'From video ingestion to actionable safety events, with independent reporting and alerting paths.', [
    ['CCTV / Local Video', 'input', 'Repeatable local video is the MVP input. CCTV and NVR ingestion are planned.'],
    ['NVR / Video Source', 'input', 'A source manager supplies local video; an NVR adapter is a planned alternative.'],
    ['Stream Processing', 'inference', 'Decode and preprocess frames before inference.'],
    ['Deep Learning Models', 'inference', 'Model selection, supported classes and engine compatibility are unverified.'],
    ['Business Logic Layer', 'analytics', 'Evaluate safety rules against tracked detection metadata.'],
    ['Alerting Engine', 'output', 'Produce actionable notifications and incident records.'],
  ], ['Video ingestion supplies frames; stream processing normalizes them; AI inference produces detections.', 'Safety-rule evaluation creates incidents. The central database supplies the reporting engine, while the alerting engine supplies notifications and incident records.']),
  sequence('pipegen', 'PipeGen Compilation & Runtime', 'PipeGen v0.5.1 is the core compiler workflow; runtime inference is a separate execution stage.', [
    ['Requirement', 'input', 'Restricted-zone entry from a repeatable input video.'],
    ['Pipeline IR', 'inference', 'PipeGen Intermediate Representation expresses pipeline requirements.'],
    ['Model Integration', 'inference', 'Select compatible model artifacts and confirm person classes.'],
    ['Compiler & Validation', 'inference', 'PipeGen v0.5.1 validates pipeline configuration and generates artifacts. No compilation success is claimed.'],
    ['TensorRT Engine', 'inference', 'Build a target-compatible engine; retain build logs and engine artifacts.'],
    ['DeepStream Runtime', 'inference', 'Run the compiled pipeline on an NVIDIA GPU using the configured input video.'],
    ['Actionable Output', 'output', 'Structured detections feed safety events, JSON logs and dashboard integration.'],
    ['Runtime Monitoring', 'analytics', 'Collect runtime diagnostics and only report measurements actually supplied by the pipeline.'],
  ], ['Compilation: requirement → IR → model integration → compiler validation → TensorRT engine. Configuration, selected models, generated artifacts and validation logs must be retained.', 'Runtime: input video + engine + runtime configuration → DeepStream on NVIDIA GPU → actionable output. Compilation and runtime execution are both unverified.']),
  sequence('inference', 'Video Inference & Metadata Flow', 'Detection and tracking remain on the edge; the browser only receives backend-provided streams and metadata.', [
    ['Video Input', 'input', 'A repeatable local video source.'], ['Frame Decoding', 'inference', 'Extract and decode video frames.'], ['Preprocessing', 'inference', 'Resize and normalize according to the chosen model.'], ['Object Detection', 'inference', 'Detector and supported classes are not yet confirmed; no YOLO or PPE capability is assumed.'], ['Boxes / Classes / Scores', 'inference', 'Bounding boxes, class labels and confidence scores from the detector.'], ['Postprocessing / NMS', 'inference', 'Apply non-maximum suppression where the selected model requires it.'], ['Object Tracking', 'inference', 'Associate person detections with tracking IDs.'], ['Detection Metadata', 'output', 'A backend adapter converts runtime metadata into validated payloads.'], ['Safety Analytics', 'analytics', 'Use structured metadata for zone evaluation and safety rules.'],
  ], ['Model choice and class mappings must be confirmed before claiming person or PPE detection capabilities.', 'The DeepStream metadata adapter is required. The proposed frontend contract does not establish the actual pipeline output format.']),
  sequence('events', 'Safety-Event Processing', 'Restricted-zone entry is the primary MVP; incident review and notification follow event generation.', [
    ['Video Frames', 'input', 'Decoded frames with source timestamps.'], ['Person Detection', 'inference', 'Requires a confirmed person class.'], ['Object Tracking', 'inference', 'Associate detections with stable tracking IDs.'], ['Restricted-Zone Evaluation', 'analytics', 'Compare person position against configured camera-zone polygons.'], ['Zone-Entry Rule', 'analytics', 'Evaluate an outside-to-inside transition; suppress duplicate entries per camera, track and zone.'], ['Incident Generation', 'analytics', 'Generate timestamped event IDs and optional evidence references.'], ['JSON Incident Log', 'storage', 'Persist incidents independently of MQTT delivery.'], ['Dashboard / Notification', 'output', 'Show incident records and status review; notifications are an optional integration.'],
  ], ['Configurable zone polygons exist in the frontend; backend application and real detection remain unverified.', 'Duplicate-event suppression must be implemented and tested in the event engine. Review status must remain independent from delivery status.', 'Near-miss detection, dwell time, PPE checks and advanced spatial analytics are optional future extensions, not verified pipeline features.']),
  sequence('deployment', 'Deployment Architecture', 'Target environment only — installation, GPU passthrough, compilation and runtime operation require separate evidence.', [
    ['Windows / RTX 3050', 'input', 'Target hardware: NVIDIA RTX 3050 with 4 GB VRAM; installation and hardware validation are unverified.'], ['WSL2 Ubuntu 24.04', 'inference', 'Target Linux environment; not confirmed installed.'], ['Docker / NVIDIA Toolkit', 'inference', 'Target container runtime and GPU access; not confirmed installed.'], ['PipeGen v0.5.1', 'inference', 'Target compiler workflow in the GPU container.'], ['DeepStream / TensorRT', 'inference', 'Target runtime and engine stack; not confirmed compiled or executed.'], ['NVIDIA GPU Inference', 'inference', 'GPU passthrough alone does not verify inference.'], ['Safety Analytics', 'analytics', 'Restricted-zone entry processing from tracking metadata.'], ['Incident Output', 'storage', 'Timestamped JSON incident logs and evidence references.'], ['External Consumer', 'output', 'Optional MQTT broker, dashboard or notification consumer.', true],
  ], ['Local test video, pipeline configuration and logs are mounted into the container as input/output artifacts.', 'Status meanings: Installed = installation evidence; In Progress = confirmed ongoing setup; Planned = target only; Verified Working = observed operation. All external components are Planned because status evidence is unavailable.']),
  sequence('mqtt', 'MQTT & Actionable Output', 'Optional notification transport. JSON incident logging does not depend on MQTT being enabled or connected.', [
    ['Safety Event Engine', 'analytics', 'Creates a restricted-zone incident.'], ['Event Publisher', 'output', 'Backend publisher handles connection failures and optional MQTT transport.', true], ['MQTT Broker', 'output', 'Broker connection and operation are unverified.', true], ['Subscriber / Dashboard', 'output', 'MQTT consumer or external monitoring dashboard; browser integration uses the backend, not MQTT directly.', true],
  ], ['Connection handling, reconnect with bounded backoff and delivery failure reporting belong in the backend publisher. QoS is configurable (0, 1 or 2); QoS 1 is a proposal, not an observed setting.', 'Optional TLS requires trusted broker certificates and server-side credentials. Secrets never belong in browser configuration.', 'The sample event below is illustrative, not a confirmed backend schema. JSON logs remain independent of optional transport.']),
  sequence('modules', 'Software-Module Architecture', 'Separate real-time inference, incident persistence and optional notification paths.', [
    ['Video Source Manager', 'input', 'Choose and validate video source configuration.'], ['Decoder & Preprocessor', 'inference', 'Decode, resize and normalize frames.'], ['Detection Inference', 'inference', 'Run a confirmed model through TensorRT / DeepStream.'], ['Object Tracking', 'inference', 'Associate detections with person track IDs.'], ['Spatial / Zone Manager', 'analytics', 'Manage restricted-zone geometry and spatial membership.'], ['Safety Rules Engine', 'analytics', 'Evaluate zone-entry transitions and suppress duplicates.'], ['Incident Manager', 'analytics', 'Assign event IDs, timestamps and severity.'], ['Evidence & JSON Logging', 'storage', 'Persist event logs and available evidence references.'], ['Dashboard/API Integration', 'output', 'Adapt validated records and streams for the existing dashboard.'], ['MQTT Publisher', 'output', 'Optional asynchronous notification transport, not part of the inference path.', true], ['Configuration & Health', 'analytics', 'Control configuration and expose measured diagnostics.'],
  ], ['Real-time path: source → decoder → inference → tracking → spatial analytics → rules → incident manager.', 'Reporting path: incident manager → evidence and JSON logging → dashboard/API. Notification path: incident manager → optional MQTT publisher.', 'Configuration and health monitoring control the pipeline and consume diagnostics; they are not a serial inference stage.']),
];
// Branches replace misleading serial connections for reporting and control paths.
const overall = architectureDiagrams[0];
if (overall) {
  overall.nodes.push({ id: 'database', label: 'Central Database', role: 'storage', detail: 'Planned persistent incident store; the dashboard currently uses demo data or the proposed external backend.', x: 340, y: 345, status: 'Planned' }, { id: 'reporting', label: 'Reporting Engine', role: 'output', detail: 'Aggregate persisted incident records for reporting.', x: 650, y: 345, status: 'Planned' }, { id: 'notifications', label: 'Notifications / Incidents', role: 'output', detail: 'Actionable output from the alerting engine.', x: 30, y: 345, status: 'Planned' });
  overall.edges.push({ from: 'overall-4', to: 'database' }, { from: 'database', to: 'reporting' }, { from: 'overall-5', to: 'notifications' }); overall.height = 490;
}
const pipegen = architectureDiagrams[1];
if (pipegen) {
  pipegen.boundaries = [{ label: 'COMPILATION · PipeGen v0.5.1 + TensorRT', x: 15, y: 22, width: 930, height: 280 }];
  pipegen.nodes.push({ id: 'runtime-video', label: 'Input Video / Config', role: 'input', detail: 'Input video and generated pipeline configuration feed runtime execution.', x: 650, y: 345, status: 'Planned' });
  pipegen.edges.push({ from: 'runtime-video', to: 'pipegen-5', control: true });
}
const deploy = architectureDiagrams[4];
if (deploy) {
  deploy.boundaries = [{ label: 'WINDOWS HOST → WSL2 → GPU CONTAINER (TARGET)', x: 15, y: 22, width: 930, height: 430 }];
  deploy.nodes.push({ id: 'local-artifacts', label: 'Test Video / Config / Logs', role: 'input', detail: 'Local video and configuration enter the runtime; generated logs provide verification evidence.', x: 340, y: 490, status: 'Planned' });
  deploy.edges.push({ from: 'local-artifacts', to: 'deployment-7', control: true }); deploy.height = 635;
}
const mqtt = architectureDiagrams[5];
if (mqtt) {
  mqtt.nodes.push({ id: 'json-independent', label: 'JSON Incident Logging', role: 'storage', detail: 'Local JSON persistence is independent of optional MQTT publishing.', x: 30, y: 200, status: 'Planned' });
  mqtt.edges.push({ from: 'mqtt-0', to: 'json-independent' });
}
const modules = architectureDiagrams[6];
if (modules) {
  modules.edges = modules.edges.filter(e => e.to !== 'modules-9' && e.to !== 'modules-10');
  modules.edges.push({ from: 'modules-6', to: 'modules-9', optional: true }, { from: 'modules-10', to: 'modules-7', control: true }, { from: 'modules-10', to: 'modules-4', control: true });
}
export const sampleEvent = { event_id: 'SAMPLE-ZONE-0001', event_type: 'restricted_zone_entry', timestamp: '2026-10-18T07:00:00Z', camera_id: 'SAMPLE-CAMERA-01', track_id: 42, zone_id: 'SAMPLE-ZONE-A', confidence: 0.94, evidence_path: null, severity: 'high' };
