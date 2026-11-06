import React, { useRef, useEffect } from 'react';
import { Activity, Wind } from 'lucide-react';

interface TachogramChartProps {
  rrSeries: number[];
  maxPoints?: number;
}

export const TachogramChart: React.FC<TachogramChartProps> = ({
  rrSeries,
  maxPoints = 40
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth * dpr;
    const height = canvas.clientHeight * dpr;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    // Subtle background grid
    ctx.strokeStyle = '#121A17';
    ctx.lineWidth = 1 * dpr;
    for (let y = 0.25; y < 1; y += 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, y * height);
      ctx.lineTo(width, y * height);
      ctx.stroke();
    }

    if (rrSeries.length < 2) {
      ctx.fillStyle = '#6E8078';
      ctx.font = `${11 * dpr}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Esperando latidos para proyectar tacograma...', width / 2, height / 2);
      return;
    }

    // Dynamic min and max scale
    const minVal = Math.max(400, Math.min(...rrSeries) - 50);
    const maxVal = Math.min(1500, Math.max(...rrSeries) + 50);
    const range = Math.max(100, maxVal - minVal);

    const stepX = width / Math.max(rrSeries.length - 1, maxPoints - 1);

    // Gradient fill under curve
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(104, 157, 132, 0.25)');
    gradient.addColorStop(1, 'rgba(104, 157, 132, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < rrSeries.length; i++) {
      const x = i * stepX;
      const normY = (rrSeries[i] - minVal) / range;
      const y = height - (normY * height * 0.8 + height * 0.1);
      ctx.lineTo(x, y);
    }

    ctx.lineTo((rrSeries.length - 1) * stepX, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Smooth stroke curve
    ctx.beginPath();
    ctx.strokeStyle = '#689D84';
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < rrSeries.length; i++) {
      const x = i * stepX;
      const normY = (rrSeries[i] - minVal) / range;
      const y = height - (normY * height * 0.8 + height * 0.1);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Pulse current beat dot
    const lastX = (rrSeries.length - 1) * stepX;
    const lastVal = rrSeries[rrSeries.length - 1];
    const lastNormY = (lastVal - minVal) / range;
    const lastY = height - (lastNormY * height * 0.8 + height * 0.1);

    ctx.fillStyle = '#A2E3C4';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4 * dpr, 0, Math.PI * 2);
    ctx.fill();
  }, [rrSeries, maxPoints]);

  const currentRR = rrSeries.length > 0 ? Math.round(rrSeries[rrSeries.length - 1]) : 0;
  const minRR = rrSeries.length > 0 ? Math.round(Math.min(...rrSeries)) : 0;
  const maxRR = rrSeries.length > 0 ? Math.round(Math.max(...rrSeries)) : 0;
  const deltaRR = maxRR - minRR;

  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-4 shadow-xl space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-sage-500" />
          <span>Cardiotacograma en Tiempo Real</span>
        </h3>

        <div className="flex items-center gap-2.5 text-[10px] font-mono">
          <span className="text-slate-400">RR actual: <strong className="text-sage-300">{currentRR}ms</strong></span>
          <span className="text-slate-400">Δ RSA: <strong className="text-warmgold-400">±{Math.round(deltaRR / 2)}ms</strong></span>
        </div>
      </div>

      <div className="h-32 w-full bg-obsidian-950 rounded-xl border border-obsidian-800 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#6E8078] pt-1">
        <span className="flex items-center gap-1">
          <Wind className="w-3 h-3 text-sage-400" />
          <span>Oscilación por Arritmia Sinusal Respiratoria (RSA)</span>
        </span>
        <span className="font-mono text-[10px]">Ventana 30s</span>
      </div>
    </div>
  );
};
