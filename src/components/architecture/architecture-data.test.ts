import { describe, expect, it } from 'vitest';
import { architectureDiagrams, sampleEvent } from './architecture-data';

describe('Architecture truthfulness constraints', () => {
  it('never marks external pipeline components implemented without verification', () => {
    for (const diagram of architectureDiagrams) {
      for (const node of diagram.nodes.filter(node => node.external)) expect(['Planned', 'Unverified']).toContain(node.status);
    }
  });
  it('distinguishes the existing frontend from external runtime components', () => {
    const frontend = architectureDiagrams.find(diagram => diagram.id === 'overall')?.nodes.find(node => node.label === 'Frontend Dashboard');
    expect(frontend?.status).toBe('Implemented');
    expect(frontend?.external).toBe(false);
  });
  it('keeps JSON incident logging independent of optional MQTT transport', () => {
    const mqtt = architectureDiagrams.find(diagram => diagram.id === 'mqtt');
    const logging = mqtt?.nodes.find(node => node.id === 'json-independent');
    expect(logging?.optional).not.toBe(true);
    expect(mqtt?.edges).toContainEqual({ from: 'mqtt-3', to: 'json-independent', label: 'Persist independently' });
    expect(mqtt?.nodes.find(node => node.label === 'MQTT Broker')?.optional).toBe(true);
  });
  it('does not invent evidence for the illustrative restricted-zone event', () => {
    expect(sampleEvent.event_type).toBe('restricted_zone_entry');
    expect(sampleEvent.evidence_path).toBeNull();
    expect(sampleEvent.confidence).toBeNull();
  });
  it('defines seven connected diagrams with complete component contracts', () => {
    expect(architectureDiagrams).toHaveLength(7);
    for (const diagram of architectureDiagrams) {
      const ids = diagram.nodes.map(node => node.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const edge of diagram.edges) {
        expect(ids).toContain(edge.from);
        expect(ids).toContain(edge.to);
        expect(edge.label.length).toBeGreaterThan(0);
      }
      for (const node of diagram.nodes) {
        expect(node.inputs.length).toBeGreaterThan(0);
        expect(node.outputs.length).toBeGreaterThan(0);
        expect(node.dependencies.length).toBeGreaterThan(0);
      }
    }
  });
});