import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Flashlight, AlertTriangle, CheckCircle2, Sliders, Play, Pause } from 'lucide-react';
import { SensorMode, SignalStatus } from '../types';
import { AdaptiveDspEngine } from '../lib/dsp';

interface CameraFeedProps {
  mode: SensorMode;
  onBeat: (rrMs: number, timestampMs: number) => void;
  onSignalStatusChange: (status: SignalStatus) => void;
  isRecording: boolean;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({
  mode,
  onBeat,
  onSignalStatusChange,
  isRecording
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const dspEngineRef = useRef<AdaptiveDspEngine>(new AdaptiveDspEngine());
  const rafIdRef = useRef<number | null>(null);
  const lastPeakTimeRef = useRef<number>(0);
  const prevSamplesRef = useRef<{ val: number; time: number }[]>([]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    try {
      setPermissionError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode === 'contact' ? 'environment' : 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreamActive(true);
      }

      // Check Torch capability
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as { torch?: boolean }) : {};
      if (capabilities && capabilities.torch) {
        setTorchSupported(true);
        if (mode === 'contact') {
          try {
            await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
              advanced: [{ torch: true }]
            });
            setTorchOn(true);
          } catch (e) {
            console.warn('Could not activate torch:', e);
          }
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access failed, falling back to simulated engine:', err);
      setPermissionError('No se pudo acceder a la cámara. Se activa el motor de simulación de pulso fisiológico.');
      setIsSimulated(true);
    }
  }, [mode]);

  const stopCamera = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    if (!isSimulated) {
      startCamera();
    }
    return () => stopCamera();
  }, [mode, isSimulated, startCamera, stopCamera]);

  // Frame Processing Loop
  useEffect(() => {
    if (!isRecording) return;

    if (isSimulated) {
      // Synthetic pulse with Respiratory Sinus Arrhythmia (RSA)
      let phase = 0;
      const interval = setInterval(() => {
        phase += 0.08;
        const rsa = Math.sin(phase * 0.7) * 90; // Respiration wave
        const nominalRR = 950 + rsa + (Math.random() - 0.5) * 30; // ~63 BPM
        onBeat(nominalRR, performance.now());
        onSignalStatusChange({
          quality: 'optimal',
          activeChannel: 'red',
          snrDb: 25,
          suggestion: 'Simulador fisiológico activo (modo didáctico).'
        });
      }, 950);

      return () => clearInterval(interval);
    }

    const processFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          const sampleW = 32;
          const sampleH = 32;
          canvas.width = sampleW;
          canvas.height = sampleH;

          // Draw center ROI
          ctx.drawImage(
            video,
            (video.videoWidth - sampleW) / 2,
            (video.videoHeight - sampleH) / 2,
            sampleW,
            sampleH,
            0,
            0,
            sampleW,
            sampleH
          );

          const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
          let rSum = 0;
          let gSum = 0;
          let bSum = 0;
          const pixelCount = sampleW * sampleH;

          for (let i = 0; i < imgData.length; i += 4) {
            rSum += imgData[i];
            gSum += imgData[i + 1];
            bSum += imgData[i + 2];
          }

          const now = performance.now();
          const { filteredValue, signalStatus } = dspEngineRef.current.processSample(
            rSum / pixelCount,
            gSum / pixelCount,
            bSum / pixelCount
          );

          onSignalStatusChange(signalStatus);

          // Peak Detection with 3-point Sub-frame Interpolation
          const history = prevSamplesRef.current;
          history.push({ val: filteredValue, time: now });
          if (history.length > 5) history.shift();

          if (history.length >= 3 && signalStatus.quality !== 'no_signal' && signalStatus.quality !== 'noisy') {
            const p0 = history[history.length - 3].val;
            const p1 = history[history.length - 2].val;
            const p2 = history[history.length - 1].val;

            // Check if p1 is a local systolic maximum
            if (p1 > p0 && p1 > p2 && p1 > 0.4) {
              const nominalTime = history[history.length - 2].time;
              const frameInterval = history[history.length - 1].time - history[history.length - 2].time || 33.3;

              // Refine sub-frame peak time
              const interpolatedPeakTime = AdaptiveDspEngine.interpolateSubframePeak(
                p0,
                p1,
                p2,
                nominalTime,
                frameInterval
              );

              const elapsedSinceLast = interpolatedPeakTime - lastPeakTimeRef.current;
              // Physiological refractory period: 330ms to 1700ms (35 to 180 BPM)
              if (elapsedSinceLast >= 330 && elapsedSinceLast <= 1700) {
                lastPeakTimeRef.current = interpolatedPeakTime;
                onBeat(elapsedSinceLast, interpolatedPeakTime);
              } else if (lastPeakTimeRef.current === 0) {
                lastPeakTimeRef.current = interpolatedPeakTime;
              }
            }
          }
        }
      }
      rafIdRef.current = requestAnimationFrame(processFrame);
    };

    rafIdRef.current = requestAnimationFrame(processFrame);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isRecording, isSimulated, onBeat, onSignalStatusChange]);

  const toggleTorch = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: nextTorch }]
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Torch toggle error:', err);
    }
  };

  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-sage-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Sensor Óptico {mode === 'contact' ? '(Contacto Dedo/Zona)' : '(rPPG Facial)'}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {torchSupported && mode === 'contact' && (
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                torchOn
                  ? 'bg-warmgold-500/20 text-warmgold-400 border-warmgold-500/40 shadow-sm shadow-warmgold-500/20'
                  : 'bg-obsidian-800 text-slate-400 border-obsidian-700 hover:text-white'
              }`}
              title="Encender/Apagar Flash"
            >
              <Flashlight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsSimulated(!isSimulated)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all border ${
              isSimulated
                ? 'bg-sage-500/20 text-sage-300 border-sage-500/30'
                : 'bg-obsidian-800 text-slate-400 border-obsidian-700 hover:text-slate-200'
            }`}
          >
            {isSimulated ? 'Simulador Activo' : 'Usar Simulador'}
          </button>
        </div>
      </div>

      {permissionError && (
        <div className="p-3 mb-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{permissionError}</span>
        </div>
      )}

      {/* Video Preview Frame */}
      <div className="relative h-28 w-full bg-obsidian-950 rounded-xl overflow-hidden border border-obsidian-800 flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          className={`h-full w-full object-cover ${mode === 'contact' ? 'filter saturate-200' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Center Target Box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 border-2 border-sage-400/60 rounded-xl flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-sage-400" />
          </div>
        </div>

        {isSimulated && (
          <div className="absolute inset-0 bg-obsidian-950/80 backdrop-blur-xs flex items-center justify-center flex-col text-center p-3">
            <span className="text-xs font-medium text-sage-300">Generador Fisiológico Activo</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Simula onda pulsátil con modulación respiratoria (RSA)</span>
          </div>
        )}
      </div>
    </div>
  );
};
