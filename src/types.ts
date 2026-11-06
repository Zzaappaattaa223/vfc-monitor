export type SensorMode = 'contact' | 'rppg';

export type SignalQuality = 'optimal' | 'low_perfusion' | 'excessive_pressure' | 'noisy' | 'no_signal';

export type ChromaticChannel = 'red' | 'green' | 'chrom';

export interface SignalStatus {
  quality: SignalQuality;
  activeChannel: ChromaticChannel;
  snrDb: number;
  suggestion: string;
}

export interface BeatInfo {
  timestampMs: number;
  rrMs: number;
  instantBpm: number;
  confidence: number;
}

export interface HrvMetrics {
  bpm: number;
  rmssd: number; // Root Mean Square of Successive Differences (ms)
  sdnn: number; // Standard Deviation of NN intervals (ms)
  pnn50: number; // Percentage of intervals > 50ms diff (%)
  sd1: number; // Poincaré transverse axis (parasympathetic)
  sd2: number; // Poincaré longitudinal axis (sympathetic + parasympathetic)
  sdRatio: number; // SD1 / SD2
  parasympatheticScore: number; // 0 - 100 unified index
  autonomicState: 'sympathetic' | 'neutral' | 'parasympathetic_favorable' | 'deep_vagal';
}

export interface SessionSnapshot {
  timestamp: string;
  durationSeconds: number;
  avgBpm: number;
  rmssd: number;
  parasympatheticScore: number;
  sd1: number;
  sd2: number;
  rrHistory: number[];
}
