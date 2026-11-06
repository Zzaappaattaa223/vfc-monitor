import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Activity, Wind, Eye, Award, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SensorMode, SignalStatus, HrvMetrics, SessionSnapshot } from './types';
import { calculateHrvMetrics } from './lib/metrics';
import { CameraFeed } from './components/CameraFeed';
import { TachogramChart } from './components/TachogramChart';
import { PoincarePlot } from './components/PoincarePlot';
import { ParasympatheticGauge } from './components/ParasympatheticGauge';
import { PrePostModal } from './components/PrePostModal';

export const App: React.FC = () => {
  const [mode, setMode] = useState<SensorMode>('contact');
  const [isRecording, setIsRecording] = useState(true);
  const [signalStatus, setSignalStatus] = useState<SignalStatus>({
    quality: 'optimal',
    activeChannel: 'red',
    snrDb: 22,
    suggestion: 'Coloque el sensor suavemente sobre cualquier zona con pulso.'
  });

  const [rrSeries, setRrSeries] = useState<number[]>([]);
  const [metrics, setMetrics] = useState<HrvMetrics>({
    bpm: 0,
    rmssd: 0,
    sdnn: 0,
    pnn50: 0,
    sd1: 0,
    sd2: 0,
    sdRatio: 1,
    parasympatheticScore: 50,
    autonomicState: 'neutral'
  });

  const [preSession, setPreSession] = useState<SessionSnapshot | null>(null);
  const [postSession, setPostSession] = useState<SessionSnapshot | null>(null);
  const [showPrePostModal, setShowPrePostModal] = useState(false);

  // Wake Lock API to prevent phone screen from dimming/sleeping during massage
  useEffect(() => {
    let wakeLock: unknown = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as unknown as { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    };
    requestWakeLock();
    return () => {
      if (wakeLock && typeof (wakeLock as { release?: () => void }).release === 'function') {
        (wakeLock as { release: () => void }).release();
      }
    };
  }, []);

  // Handle incoming beat from Camera / DSP
  const handleBeat = useCallback((rrMs: number) => {
    setRrSeries(prev => {
      const next = [...prev, rrMs];
      // Keep last 45 beats in sliding window
      return next.length > 45 ? next.slice(next.length - 45) : next;
    });
  }, []);

  // Update metrics when RR series changes
  useEffect(() => {
    if (rrSeries.length >= 3) {
      const computed = calculateHrvMetrics(rrSeries);
      setMetrics(computed);
    }
  }, [rrSeries]);

  const saveCurrentSnapshot = (type: 'pre' | 'post') => {
    const snapshot: SessionSnapshot = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationSeconds: 60,
      avgBpm: metrics.bpm,
      rmssd: metrics.rmssd,
      parasympatheticScore: metrics.parasympatheticScore,
      sd1: metrics.sd1,
      sd2: metrics.sd2,
      rrHistory: [...rrSeries]
    };

    if (type === 'pre') setPreSession(snapshot);
    else setPostSession(snapshot);
    setShowPrePostModal(true);
  };

  const getQualityBadge = () => {
    switch (signalStatus.quality) {
      case 'optimal':
        return { bg: 'bg-sage-500/10 text-sage-300 border-sage-500/30', label: 'Señal Óptima', icon: CheckCircle2 };
      case 'low_perfusion':
        return { bg: 'bg-warmgold-500/10 text-warmgold-400 border-warmgold-500/30', label: 'Perfusión Baja (AGC Activo)', icon: AlertTriangle };
      case 'excessive_pressure':
        return { bg: 'bg-rose-950/20 text-rose-300 border-rose-500/30', label: 'Presión Excesiva', icon: AlertTriangle };
      case 'noisy':
      case 'no_signal':
      default:
        return { bg: 'bg-obsidian-800 text-slate-400 border-obsidian-700', label: 'Esperando Pulso', icon: Activity };
    }
  };

  const qualityBadge = getQualityBadge();
  const QualityIcon = qualityBadge.icon;

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-sage-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-obsidian-800/80 bg-obsidian-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sage-500 to-sage-600 flex items-center justify-center text-slate-950 shadow-md shadow-sage-500/20">
              <Heart className="w-4 h-4 fill-current stroke-none" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                <span>VFC Monitor</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-500/10 text-sage-300 border border-sage-500/30 font-mono">
                  Polivagal
                </span>
              </h1>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div className="flex items-center bg-obsidian-950 p-1 rounded-xl border border-obsidian-800">
            <button
              type="button"
              onClick={() => setMode('contact')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                mode === 'contact'
                  ? 'bg-sage-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Dedo / Contacto
            </button>
            <button
              type="button"
              onClick={() => setMode('rppg')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                mode === 'rppg'
                  ? 'bg-sage-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              rPPG Facial
            </button>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main className="max-w-md w-full mx-auto p-4 space-y-4 flex-1">
        {/* Dynamic Quality Indicator & Smart Suggestion */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs ${qualityBadge.bg}`}>
          <div className="flex items-center space-x-2.5 min-w-0">
            <QualityIcon className="w-4 h-4 shrink-0" />
            <span className="truncate">{signalStatus.suggestion}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-black/20 shrink-0">
            {signalStatus.activeChannel}
          </span>
        </div>

        {/* Unified Score & Vagal State Gauge */}
        <ParasympatheticGauge
          metrics={metrics}
          signalQuality={signalStatus.quality}
        />

        {/* Real-time Cardiotachogram Canvas */}
        <TachogramChart rrSeries={rrSeries} />

        {/* Poincaré Plot Dynamic Scatter */}
        <PoincarePlot
          rrSeries={rrSeries}
          sd1={metrics.sd1}
          sd2={metrics.sd2}
        />

        {/* Optical Sensor Camera Feed (Adaptive ROI + AGC) */}
        <CameraFeed
          mode={mode}
          onBeat={handleBeat}
          onSignalStatusChange={setSignalStatus}
          isRecording={isRecording}
        />

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
              isRecording
                ? 'bg-gradient-to-r from-sage-500 to-sage-600 text-slate-950 hover:from-sage-400 hover:to-sage-500 shadow-sage-500/20'
                : 'bg-obsidian-800 text-slate-300 border border-obsidian-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isRecording ? 'Monitoreo Activo' : 'Iniciar Monitoreo'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrePostModal(true)}
            className="py-3 px-4 rounded-xl font-medium text-xs bg-obsidian-900 hover:bg-obsidian-800 text-sage-300 border border-obsidian-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <Award className="w-4 h-4 text-warmgold-400" />
            <span>Comparativa Pre/Post</span>
          </button>
        </div>
      </main>

      {/* Pre/Post Comparison Modal */}
      {showPrePostModal && (
        <PrePostModal
          preSession={preSession}
          postSession={postSession}
          onClose={() => setShowPrePostModal(false)}
          onSetAsPre={() => saveCurrentSnapshot('pre')}
          onSetAsPost={() => saveCurrentSnapshot('post')}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-obsidian-800/80 bg-obsidian-950 py-4 text-center text-xs text-slate-600">
        <p>VFC Monitor · Estética Serena Impeccable · EGM Verified</p>
      </footer>
    </div>
  );
};
export default App;
