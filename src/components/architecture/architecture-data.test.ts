import { describe, expect, it } from 'vitest';
import { architectureDiagrams, sampleEvent } from './architecture-data';

describe('Architecture truthfulness constraints', () => {
  it('keeps every external pipeline component planned until verification is supplied', () => {
    for (const diagram of architectureDiagrams) {
      for (const node of diagram.nodes) expect(node.status).toBe('Planned');
    }
  });
  it('keeps JSON incident logging independent of optional MQTT transport', () => {
    const mqtt = architectureDiagrams.find(diagram => diagram.id === 'mqtt');
    const logging = mqtt?.nodes.find(node => node.id === 'json-independent');
    expect(logging?.optional).not.toBe(true);
    expect(mqtt?.edges).toContainEqual({ from: 'mqtt-0', to: 'json-independent' });
    expect(mqtt?.nodes.find(node => node.label === 'MQTT Broker')?.optional).toBe(true);
  });
  it('does not invent evidence for the illustrative restricted-zone event', () => {
    expect(sampleEvent.event_type).toBe('restricted_zone_entry');
    expect(sampleEvent.evidence_path).toBeNull();
  });
});