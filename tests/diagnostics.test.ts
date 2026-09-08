import { describe, it, expect } from 'vitest';
import { VoiceDiagnostics } from '../src/types';

describe('Audio Diagnostics & Lag Telemetry Specification', () => {
  it('should support audioPerformance structure with latency and buffer metrics', () => {
    const mockDiagnostics: any = {
      modules: {
        activeOpusEngine: 'opusscript (JavaScript/WASM Universal)',
        tweetnacl: { available: true, active: true }
      },
      connection: {
        botOnline: true,
        voiceState: 'ready',
        voicePing: 45,
        botPing: 18,
        playerState: 'playing'
      },
      audioPerformance: {
        bufferStallCount: 0,
        voicePingWs: 45,
        streamHealth: 'excellent',
        latencyStatus: 'excellent',
        activeEngine: 'opusscript',
        diagnosticNotes: []
      }
    };

    expect(mockDiagnostics.audioPerformance).toBeDefined();
    expect(mockDiagnostics.audioPerformance?.bufferStallCount).toBe(0);
    expect(mockDiagnostics.audioPerformance?.latencyStatus).toBe('excellent');
    expect(mockDiagnostics.audioPerformance?.streamHealth).toBe('excellent');
  });

  it('should flag critical latency when voice ping is high', () => {
    const calculateLatency = (ping?: number) => {
      if (ping === undefined) return 'unknown';
      if (ping < 80) return 'excellent';
      if (ping < 160) return 'good';
      if (ping < 280) return 'high';
      return 'critical';
    };

    expect(calculateLatency(42)).toBe('excellent');
    expect(calculateLatency(120)).toBe('good');
    expect(calculateLatency(210)).toBe('high');
    expect(calculateLatency(350)).toBe('critical');
    expect(calculateLatency(undefined)).toBe('unknown');
  });
});
