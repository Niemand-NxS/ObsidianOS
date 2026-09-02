import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, CheckCircle2, AlertCircle, Scan, Camera, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { sounds } from '../../services/soundService';

interface OpticIDScannerProps {
  onScanComplete: (token: string) => void;
  accentColor: string;
  isScanning: boolean;
  onStartScan: () => void;
  status: 'idle' | 'scanning' | 'completed' | 'skipped';
}

interface BiometricMetrics {
  faceDetected: boolean;
  symmetryScore: number;
  contrastScore: number;
  livenessScore: number;
  entropyHex: string;
}

export const OpticIDScanner: React.FC<OpticIDScannerProps> = ({
  onScanComplete,
  accentColor,
  isScanning,
  onStartScan,
  status,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [metrics, setMetrics] = useState<BiometricMetrics>({
    faceDetected: false,
    symmetryScore: 0,
    contrastScore: 0,
    livenessScore: 0,
    entropyHex: '0x7F...A4',
  });
  const [guidanceText, setGuidanceText] = useState<string>('Blick auf die Kamera richten');
  const [simulatedProgress, setSimulatedProgress] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Request Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false);
        setCameraError('Kamera-Schnittstelle im Browser nicht verfügbar');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 320 },
          facingMode: 'user',
        },
      });

      streamRef.current = stream;
      setHasCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable', err);
      setHasCamera(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Kamerazugriff verweigert (Simulation verfügbar)'
          : 'Keine kompatible Kamera erkannt (Simulation verfügbar)'
      );
    }
  }, []);

  useEffect(() => {
    if (isScanning && !streamRef.current && hasCamera !== false) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isScanning, startCamera, stopCamera, hasCamera]);

  // Real-time Computer Vision Algorithm
  useEffect(() => {
    if (!isScanning) return;

    let validFramesCount = 0;
    const requiredFrames = 40; // ~3-4 seconds of good frames
    let simInterval: any = null;

    if (hasCamera === false || cameraError) {
      // Fallback Simulation Algorithm
      setSimulatedProgress(true);
      let p = 0;
      simInterval = setInterval(() => {
        p += 5;
        setProgress(Math.min(100, p));
        setMetrics({
          faceDetected: true,
          symmetryScore: 88 + Math.floor(Math.random() * 10),
          contrastScore: 92 + Math.floor(Math.random() * 6),
          livenessScore: 96 + Math.floor(Math.random() * 4),
          entropyHex: '0x' + Math.random().toString(16).substring(2, 10).toUpperCase(),
        });
        setGuidanceText('Simuliere biometrische Retina-Erfassung...');

        if (p >= 100) {
          clearInterval(simInterval);
          sounds.playSuccess();
          const fakeToken = 'OPTIC-' + Math.random().toString(36).substring(2, 15).toUpperCase();
          onScanComplete(fakeToken);
        }
      }, 140);

      return () => {
        if (simInterval) clearInterval(simInterval);
      };
    }

    const analyzeFrame = () => {
      if (!videoRef.current || !canvasRef.current || status === 'completed') return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx || video.readyState !== 4) {
        animFrameRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      const w = 120;
      const h = 120;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);

      const frame = ctx.getImageData(0, 0, w, h);
      const data = frame.data;
      const len = data.length;

      // 1. Skin Tone Chrominance Detector (normalized RGB & YCbCr heuristic)
      let skinPixels = 0;
      let totalLuminance = 0;

      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += lum;

        // Skin chromaticity check
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && r - Math.min(g, b) > 15) {
          skinPixels++;
        }
      }

      const totalPixels = w * h;
      const skinRatio = skinPixels / totalPixels;
      const avgLum = totalLuminance / totalPixels;
      const faceDetected = skinRatio > 0.18 && avgLum > 35 && avgLum < 235;

      // 2. Facial Symmetry Analysis (comparing left and right hemispheres)
      let symmetryDiff = 0;
      let checkedPairs = 0;
      for (let y = 20; y < h - 20; y += 4) {
        for (let x = 10; x < w / 2 - 4; x += 4) {
          const leftIdx = (y * w + x) * 4;
          const rightIdx = (y * w + (w - 1 - x)) * 4;
          const leftLum = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
          const rightLum = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
          symmetryDiff += Math.abs(leftLum - rightLum);
          checkedPairs++;
        }
      }
      const avgSymmetryDelta = checkedPairs > 0 ? symmetryDiff / checkedPairs : 100;
      const symmetryScore = Math.max(40, Math.min(99, Math.round(100 - avgSymmetryDelta * 0.7)));

      // 3. Liveness / Micro-movement Check
      let livenessScore = 90;
      if (prevFrameRef.current) {
        let motionDiff = 0;
        const prev = prevFrameRef.current;
        for (let i = 0; i < len; i += 16) {
          motionDiff += Math.abs(data[i] - prev[i]);
        }
        const avgMotion = motionDiff / (len / 16);
        // Live person produces slight motion (0.5 to 15), static image produces ~0
        livenessScore = avgMotion > 0.4 && avgMotion < 30 ? 98 : 65;
      }
      prevFrameRef.current = new Uint8ClampedArray(data);

      const contrastScore = Math.min(99, Math.round(avgLum * 0.6 + skinRatio * 40));
      const entropyHex = '0x' + ((skinPixels * 7919) % 0xffffffff).toString(16).toUpperCase();

      setMetrics({
        faceDetected,
        symmetryScore,
        contrastScore,
        livenessScore,
        entropyHex,
      });

      if (!faceDetected) {
        setGuidanceText('Gesicht im Scan-Ring zentrieren');
        validFramesCount += 0.35;
      } else if (symmetryScore < 50) {
        setGuidanceText('Gerade in die Kamera blicken');
        validFramesCount += 0.65;
      } else {
        setGuidanceText('Netzhaut & Iris werden verschlüsselt...');
        validFramesCount += 1;
      }

      const currentProgress = Math.min(100, Math.round((validFramesCount / requiredFrames) * 100));
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        sounds.playSuccess();
        stopCamera();
        const token = `OPTIC-SHA256-${entropyHex}-${Date.now().toString(36).toUpperCase()}`;
        onScanComplete(token);
        return;
      }

      animFrameRef.current = requestAnimationFrame(analyzeFrame);
    };

    animFrameRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isScanning, hasCamera, cameraError, status, onScanComplete, stopCamera]);

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Optical HUD Biometric Circle */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Outer Rotating Hex/Dash Rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-purple-500/30 border-dashed"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="absolute inset-2 rounded-full border border-cyan-400/25 border-dotted"
        />

        {/* Outer Laser Pulse when scanning */}
        {isScanning && (
          <div className="absolute -inset-1 rounded-full border-2 border-purple-400/60 animate-ping opacity-25" />
        )}

        {/* Video / Sensor Viewport Container */}
        <div className="w-28 h-28 rounded-full bg-black/80 border-2 border-purple-500/60 relative overflow-hidden shadow-[0_0_35px_rgba(168,85,247,0.35)] flex items-center justify-center">
          {status === 'completed' ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_12px_#34d399]" />
            </motion.div>
          ) : isScanning ? (
            <>
              {/* Live Webcam Stream or Fallback Shader */}
              {hasCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1] filter contrast-110 brightness-95"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-950 via-zinc-900 to-indigo-950 flex items-center justify-center relative">
                  <div className="w-16 h-16 rounded-full border border-purple-400/40 animate-pulse" />
                  <Eye className="w-10 h-10 text-purple-300 relative z-10 opacity-70" />
                </div>
              )}

              {/* Holographic Crosshairs & Iris Ring */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border border-purple-400/70 opacity-80" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                <div className="absolute inset-x-0 h-[1px] bg-purple-400/30" />
                <div className="absolute inset-y-0 w-[1px] bg-purple-400/30" />
              </div>

              {/* Sweeping Laser Line */}
              <motion.div
                animate={{ y: [-48, 48, -48] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_8px_#22d3ee] pointer-events-none"
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-purple-300">
              <Eye className="w-10 h-10 drop-shadow" />
            </div>
          )}
        </div>

        {/* Progress Arc Around Circle */}
        {isScanning && (
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="72"
              cy="72"
              r="68"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3"
            />
            <circle
              cx="72"
              cy="72"
              r="68"
              fill="none"
              stroke={accentColor || '#a855f7'}
              strokeWidth="3"
              strokeDasharray={2 * Math.PI * 68}
              strokeDashoffset={2 * Math.PI * 68 * (1 - progress / 100)}
              strokeLinecap="round"
              className="transition-all duration-150"
            />
          </svg>
        )}
      </div>

      {/* Real-Time Status & Telemetry Metrics */}
      <div className="text-center space-y-1 max-w-sm">
        {status === 'completed' ? (
          <div>
            <h3 className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Optic ID erfolgreich kalibriert!
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Dein Gesichts- und Iris-Muster ist sicher in der lokalen Hardware-Enklave verschlüsselt.
            </p>
          </div>
        ) : isScanning ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-white">
                Analysiere Gesichts-Geometrie... ({progress}%)
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                {metrics.entropyHex}
              </span>
            </div>
            <p className="text-[11px] text-purple-300 font-medium animate-pulse">{guidanceText}</p>

            {/* Telemetry Chips */}
            <div className="flex items-center justify-center gap-2 pt-0.5 text-[10px] font-mono text-zinc-400">
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
                Symmetrie: {metrics.symmetryScore}%
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
                Liveness: {metrics.livenessScore > 75 ? 'Echtzeit' : 'Prüfe...'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
                AES-256
              </span>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-xs font-bold text-white">Biometrischer Augenscan & Gesichtserkennung</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Verwende die Kamera deines Geräts, um dich blitzschnell und passwortlos bei ObsidianOS anzumelden.
            </p>
          </div>
        )}
      </div>

      {/* Camera status notice if error / simulated */}
      {cameraError && isScanning && (
        <div className="text-[10px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 max-w-xs text-center">
          <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Controls */}
      {status !== 'completed' && !isScanning && (
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onStartScan();
          }}
          className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] flex items-center gap-2"
          style={{ backgroundColor: accentColor }}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Optic ID Kamera-Scan starten</span>
        </button>
      )}

      {isScanning && status !== 'completed' && (
        <button
          type="button"
          onClick={() => {
            sounds.playSuccess();
            stopCamera();
            const token = `OPTIC-CONFIRMED-${Date.now().toString(36).toUpperCase()}`;
            onScanComplete(token);
          }}
          className="text-[10px] text-purple-300/80 hover:text-purple-200 underline mt-0.5 transition-colors cursor-pointer"
        >
          Biometrie sofort erfassen & abschließen
        </button>
      )}
    </div>
  );
};
