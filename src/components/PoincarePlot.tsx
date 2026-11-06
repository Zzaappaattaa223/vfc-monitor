import React, { useRef, useEffect } from 'react';
import { CircleDot, Info } from 'lucide-react';

interface PoincarePlotProps {
  rrSeries: number[];
  sd1: number;
  sd2: number;
}

export const PoincarePlot: React.FC<PoincarePlotProps> = ({
  rrSeries,
  sd1,
  sd2
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Diagonal identity line (RR_n = RR_{n+1})
    ctx.strokeStyle = '#16221E';
    ctx.lineWidth = 1.5 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, 0);
    ctx.stroke();

    if (rrSeries.length < 3) {
      ctx.fillStyle = '#6E8078';
      ctx.font = `${11 * dpr}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Acumulando latidos para gráfico de Poincaré...', width / 2, height / 2);
      return;
    }

    const minVal = 500;
    const maxVal = 1400;
    const range = maxVal - minVal;

    // Calculate center of mass for fitted ellipse
    let sumX = 0;
    let sumY = 0;
    const pairsCount = rrSeries.length - 1;

    for (let i = 0; i < pairsCount; i++) {
      sumX += rrSeries[i];
      sumY += rrSeries[i + 1];
    }
    const avgX = sumX / pairsCount;
    const avgY = sumY / pairsCount;

    const normCenterX = ((avgX - minVal) / range) * width * 0.8 + width * 0.1;
    const normCenterY = height - (((avgY - minVal) / range) * height * 0.8 + height * 0.1);

    // Scale SD1 and SD2 to canvas units
    const radiusX = Math.max(15 * dpr, (sd2 / range) * width * 1.5);
    const radiusY = Math.max(10 * dpr, (sd1 / range) * height * 2.2);

    // Draw Fitted Ellipse (Rotated at -45 deg)
    ctx.save();
    ctx.translate(normCenterX, normCenterY);
    ctx.rotate(-Math.PI / 4);

    ctx.beginPath();
    ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(104, 157, 132, 0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(104, 157, 132, 0.5)';
    ctx.lineWidth = 1.5 * dpr;
    ctx.stroke();
    ctx.restore();

    // Plot Scatter Points (RR_n, RR_{n+1})
    ctx.fillStyle = '#D4A373';
    for (let i = 0; i < pairsCount; i++) {
      const xNorm = (rrSeries[i] - minVal) / range;
      const yNorm = (rrSeries[i + 1] - minVal) / range;
      const x = xNorm * width * 0.8 + width * 0.1;
      const y = height - (yNorm * height * 0.8 + height * 0.1);

      ctx.beginPath();
      ctx.arc(x, y, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [rrSeries, sd1, sd2]);

  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-4 shadow-xl space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <CircleDot className="w-3.5 h-3.5 text-warmgold-500" />
          <span>Gráfico de Poincaré (Dispersión Vagal)</span>
        </h3>

        <div className="flex gap-2 text-[10px] font-mono">
          <span className="text-sage-400">SD1 (Vagal): <strong>{sd1}ms</strong></span>
          <span className="text-warmgold-400">SD2: <strong>{sd2}ms</strong></span>
        </div>
      </div>

      <div className="h-44 w-full bg-obsidian-950 rounded-xl border border-obsidian-800 relative flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[#6E8078] leading-tight pt-1">
        <Info className="w-3 h-3 shrink-0 text-sage-400" />
        <span>El ensanchamiento transversal (SD1) refleja directamente la activación del nervio vago durante el masaje.</span>
      </div>
    </div>
  );
};
