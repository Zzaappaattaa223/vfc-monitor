import { HrvMetrics } from '../types';

export function calculateHrvMetrics(rrIntervalsMs: number[]): HrvMetrics {
  if (rrIntervalsMs.length < 3) {
    return {
      bpm: 0,
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      sd1: 0,
      sd2: 0,
      sdRatio: 1,
      parasympatheticScore: 50,
      autonomicState: 'neutral'
    };
  }

  // Filter physiological outliers (300ms to 1800ms / 33 to 200 BPM)
  const validRRs = rrIntervalsMs.filter(rr => rr >= 300 && rr <= 1800);
  if (validRRs.length < 3) {
    return {
      bpm: 0,
      rmssd: 0,
      sdnn: 0,
      pnn50: 0,
      sd1: 0,
      sd2: 0,
      sdRatio: 1,
      parasympatheticScore: 50,
      autonomicState: 'neutral'
    };
  }

  // 1. Mean RR & BPM
  const sumRR = validRRs.reduce((acc, v) => acc + v, 0);
  const meanRR = sumRR / validRRs.length;
  const bpm = Math.round(60000 / meanRR);

  // 2. SDNN: Standard Deviation of NN intervals
  const variance = validRRs.reduce((acc, v) => acc + Math.pow(v - meanRR, 2), 0) / validRRs.length;
  const sdnn = Math.round(Math.sqrt(variance) * 10) / 10;

  // 3. RMSSD & pNN50: Successive Differences
  let sumDiffSq = 0;
  let count50 = 0;
  for (let i = 0; i < validRRs.length - 1; i++) {
    const diff = Math.abs(validRRs[i + 1] - validRRs[i]);
    sumDiffSq += diff * diff;
    if (diff > 50) count50++;
  }
  const rmssd = Math.round(Math.sqrt(sumDiffSq / (validRRs.length - 1)) * 10) / 10;
  const pnn50 = Math.round((count50 / (validRRs.length - 1)) * 100);

  // 4. Poincaré Geometry: SD1 (transverse) and SD2 (longitudinal)
  // SD1 = sqrt(0.5 * RMSSD^2)
  const sd1 = Math.round(Math.sqrt(0.5 * Math.pow(rmssd, 2)) * 10) / 10;
  // SD2 = sqrt(2 * SDNN^2 - 0.5 * RMSSD^2)
  const sd2Squared = Math.max(1, 2 * Math.pow(sdnn, 2) - 0.5 * Math.pow(rmssd, 2));
  const sd2 = Math.round(Math.sqrt(sd2Squared) * 10) / 10;
  const sdRatio = sd2 > 0 ? Math.round((sd1 / sd2) * 100) / 100 : 1;

  // 5. Unified Parasympathetic Score (0 - 100)
  // Weighted log-sigmoid calibration for massage/relaxation
  const pRaw = 0.7 * Math.log(rmssd + 1) + 0.3 * Math.log(sd1 + 1);
  const p0 = 3.2; // normative baseline corresponding to ~25-30ms RMSSD
  const k = 1.8;
  const sigmoidal = 1 / (1 + Math.exp(-k * (pRaw - p0)));
  const parasympatheticScore = Math.max(5, Math.min(100, Math.round(sigmoidal * 100)));

  // Autonomic state classification
  let autonomicState: HrvMetrics['autonomicState'] = 'neutral';
  if (parasympatheticScore < 25) {
    autonomicState = 'sympathetic';
  } else if (parasympatheticScore <= 55) {
    autonomicState = 'neutral';
  } else if (parasympatheticScore <= 80) {
    autonomicState = 'parasympathetic_favorable';
  } else {
    autonomicState = 'deep_vagal';
  }

  return {
    bpm,
    rmssd,
    sdnn,
    pnn50,
    sd1,
    sd2,
    sdRatio,
    parasympatheticScore,
    autonomicState
  };
}
