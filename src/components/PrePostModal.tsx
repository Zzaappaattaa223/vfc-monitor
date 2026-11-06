import React from 'react';
import { X, TrendingUp, Heart, CheckCircle2, Award } from 'lucide-react';
import { SessionSnapshot } from '../types';

interface PrePostModalProps {
  preSession: SessionSnapshot | null;
  postSession: SessionSnapshot | null;
  onClose: () => void;
  onSetAsPre: () => void;
  onSetAsPost: () => void;
}

export const PrePostModal: React.FC<PrePostModalProps> = ({
  preSession,
  postSession,
  onClose,
  onSetAsPre,
  onSetAsPost
}) => {
  const deltaScore =
    preSession && postSession
      ? postSession.parasympatheticScore - preSession.parasympatheticScore
      : 0;

  const deltaRmssd =
    preSession && postSession
      ? Math.round((postSession.rmssd - preSession.rmssd) * 10) / 10
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-obsidian-900 border border-obsidian-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-obsidian-800 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-sage-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Comparativa Pre / Post Masaje
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-obsidian-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pre-Session Card */}
          <div className="bg-obsidian-950 border border-obsidian-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">1. Línea Base Pre-Masaje</span>
            {preSession ? (
              <div>
                <div className="text-2xl font-bold font-mono text-slate-200">
                  {preSession.parasympatheticScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  RMSSD: <strong className="text-slate-300 font-mono">{preSession.rmssd} ms</strong>
                </div>
                <div className="text-xs text-slate-400">
                  FC: <strong className="text-slate-300 font-mono">{preSession.avgBpm} BPM</strong>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">No registrada</p>
                <button
                  type="button"
                  onClick={onSetAsPre}
                  className="mt-2 text-xs font-medium text-sage-400 hover:text-sage-300 underline"
                >
                  Guardar lectura actual como Pre
                </button>
              </div>
            )}
          </div>

          {/* Post-Session Card */}
          <div className="bg-obsidian-950 border border-obsidian-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-sage-400 font-mono">2. Resultado Post-Masaje</span>
            {postSession ? (
              <div>
                <div className="text-2xl font-bold font-mono text-sage-300">
                  {postSession.parasympatheticScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  RMSSD: <strong className="text-sage-300 font-mono">{postSession.rmssd} ms</strong>
                </div>
                <div className="text-xs text-slate-400">
                  FC: <strong className="text-sage-300 font-mono">{postSession.avgBpm} BPM</strong>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-500">No registrada</p>
                <button
                  type="button"
                  onClick={onSetAsPost}
                  className="mt-2 text-xs font-medium text-sage-400 hover:text-sage-300 underline"
                >
                  Guardar lectura actual como Post
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delta Analysis */}
        {preSession && postSession && (
          <div className="p-4 rounded-2xl bg-sage-500/10 border border-sage-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sage-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-sage-400" />
                <span>Delta de Activación Vagal</span>
              </span>
              <span className={`text-sm font-bold font-mono ${deltaScore >= 0 ? 'text-sage-300' : 'text-amber-400'}`}>
                {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} pts
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {deltaScore >= 15 ? (
                <span>
                  El masaje indujo un <strong>incremento notable del tono parasimpático</strong> (+{deltaRmssd} ms en RMSSD), facilitando la regeneración somática y la reducción del estado de alerta simpática.
                </span>
              ) : deltaScore >= 0 ? (
                <span>
                  Se observa una estabilización favorable de la autorregulación vagal en relación con la línea de base inicial.
                </span>
              ) : (
                <span>
                  El tono parasimpático se mantuvo similar o con leve reactividad simpática.
                </span>
              )}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-obsidian-800 rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
