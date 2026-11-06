import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { HrvMetrics } from '../types';

interface ParasympatheticGaugeProps {
  metrics: HrvMetrics;
  signalQuality: string;
}

export const ParasympatheticGauge: React.FC<ParasympatheticGaugeProps> = ({
  metrics,
  signalQuality
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const getStateLabel = (state: HrvMetrics['autonomicState']) => {
    switch (state) {
      case 'deep_vagal':
        return { text: 'Tono Vagal Profundo (Regeneración / Calma)', color: 'text-sage-300', dot: 'bg-sage-400' };
      case 'parasympathetic_favorable':
        return { text: 'Activación Parasimpática Favorable', color: 'text-sage-400', dot: 'bg-sage-500' };
      case 'neutral':
        return { text: 'Estado Autonómico Neutro', color: 'text-slate-300', dot: 'bg-slate-400' };
      case 'sympathetic':
        return { text: 'Predominio Simpático (Tensión / Alerta)', color: 'text-amber-400', dot: 'bg-amber-400' };
    }
  };

  const stateInfo = getStateLabel(metrics.autonomicState);

  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Índice Parasimpático</span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-4xl font-bold font-mono text-sage-300">
              {metrics.parasympatheticScore}
            </span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
          <p className={`text-xs font-medium ${stateInfo.color} mt-1 flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${stateInfo.dot} animate-pulse`} />
            <span>{stateInfo.text}</span>
          </p>
        </div>

        {/* Vital Quick Badges */}
        <div className="text-right space-y-1.5">
          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Frecuencia</div>
            <div className="text-base font-bold font-mono text-white flex items-center justify-end gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 animate-pulse" />
              <span>{metrics.bpm > 0 ? metrics.bpm : '--'}</span>
              <span className="text-[10px] text-slate-500">BPM</span>
            </div>
          </div>

          <div className="bg-obsidian-800 border border-obsidian-700 rounded-xl px-3 py-1.5 text-right">
            <div className="text-[10px] text-slate-400 uppercase font-mono">RMSSD (Vagal)</div>
            <div className="text-base font-bold font-mono text-warmgold-400">
              <span>{metrics.rmssd > 0 ? metrics.rmssd : '--'}</span>
              <span className="text-[10px] text-slate-500">ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Technical Drawer for University Teaching */}
      <div className="mt-4 pt-3 border-t border-obsidian-800">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-500" />
            <span>Desglose Fisiológico Didáctico</span>
          </span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnicalDetails && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-[11px] font-mono animate-in fade-in duration-200">
            <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
              <div className="text-slate-500 text-[10px]">SDNN (Total)</div>
              <div className="text-slate-200 font-semibold">{metrics.sdnn} ms</div>
            </div>
            <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
              <div className="text-slate-500 text-[10px]">pNN50</div>
              <div className="text-slate-200 font-semibold">{metrics.pnn50}%</div>
            </div>
            <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
              <div className="text-slate-500 text-[10px]">SD1 (Vagal)</div>
              <div className="text-sage-400 font-semibold">{metrics.sd1} ms</div>
            </div>
            <div className="bg-obsidian-950 p-2.5 rounded-xl border border-obsidian-800">
              <div className="text-slate-500 text-[10px]">Ratio SD1/SD2</div>
              <div className="text-warmgold-400 font-semibold">{metrics.sdRatio}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
