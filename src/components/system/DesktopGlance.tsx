import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { LOCKSCREEN_WALLPAPERS } from '../../config/lockscreenWallpapers';
import { getClockFontFamilyClass, getClockMotionVariants } from '../../utils/clockUtils';
import {
  MapPin,
  RefreshCw,
  Sliders,
  X,
  GripHorizontal,
  Clock,
  CloudSun,
  Cpu,
  StickyNote,
  Music,
  TrendingUp,
  Play,
  Pause,
  Volume2,
  Check,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DesktopGlance: React.FC = () => {
  const {
    settings,
    updateSettings,
    accentConfig,
    sounds,
    openApp,
    addNotification,
    effectiveGlassContrast,
  } = useOS();

  const [time, setTime] = useState('');
  const [secondsStr, setSecondsStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Audio player state for 'player' widget
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<'lofi' | 'rain' | 'space' | 'synth'>('lofi');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioNodesRef = useRef<any[]>([]);

  // System monitor simulated stats
  const [cpuUsage, setCpuUsage] = useState(18);
  const [ramUsage, setRamUsage] = useState(4.2);

  const widgetRef = useRef<HTMLDivElement>(null);
  const currentWidget = settings.desktopWidgetType || 'clock';

  // Clock time update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const format24 = settings.clockFormat24h !== false;
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      if (format24) {
        setTime(`${String(hours).padStart(2, '0')}:${minutes}`);
      } else {
        const h12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        setTime(`${h12}:${minutes} ${ampm}`);
      }
      setSecondsStr(`:${seconds}`);

      setDateStr(
        now.toLocaleDateString('de-DE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [settings.clockFormat24h]);

  // System stats oscillation
  useEffect(() => {
    if (currentWidget !== 'system') return;
    const interval = setInterval(() => {
      setCpuUsage((prev) => Math.min(85, Math.max(12, Math.round(prev + (Math.random() * 8 - 4)))));
      setRamUsage((prev) => +(Math.min(9.5, Math.max(3.8, prev + (Math.random() * 0.2 - 0.1)))).toFixed(1));
    }, 2500);
    return () => clearInterval(interval);
  }, [currentWidget]);

  // Ambient sound synthesizer
  const stopAudio = () => {
    try {
      audioNodesRef.current.forEach((n) => {
        try {
          n.stop?.();
          n.disconnect?.();
        } catch {}
      });
      audioNodesRef.current = [];
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch {}
    setIsPlayingAudio(false);
  };

  const startAudio = (track: 'lofi' | 'rain' | 'space' | 'synth') => {
    stopAudio();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (track === 'space') {
        // Drone oscillator
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(110, ctx.currentTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(165, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        audioNodesRef.current = [osc1, osc2, filter, masterGain];
      } else if (track === 'rain') {
        // Pink noise generator for rain
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          output[i] *= 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        audioNodesRef.current = [whiteNoise, filter, masterGain];
      } else {
        // Lo-Fi / Synth ambient chord
        const freqs = track === 'lofi' ? [220, 277.18, 329.63] : [146.83, 220, 293.66];
        const oscs = freqs.map((f) => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, ctx.currentTime);
          return osc;
        });

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        oscs.forEach((o) => {
          o.connect(filter);
          o.start();
        });
        filter.connect(masterGain);
        audioNodesRef.current = [...oscs, filter, masterGain];
      }

      setIsPlayingAudio(true);
    } catch {
      setIsPlayingAudio(false);
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  if (settings.desktopShowGlanceWidget === false) return null;

  // Safe default position (bottom-left area of screen)
  const defaultPos = {
    x: 28,
    y: typeof window !== 'undefined' ? Math.max(100, window.innerHeight - 220) : 560,
  };

  const currentPos = settings.desktopGlancePosition || defaultPos;
  const fontClass = getClockFontFamilyClass(settings.clockFont);
  const motionVariants = getClockMotionVariants(settings.clockTimeAnimation);

  // Current photo for clock widget
  const currentPhoto =
    LOCKSCREEN_WALLPAPERS.find(
      (p) =>
        p.id === settings.wallpaper ||
        p.id === settings.desktopPhotoId ||
        (settings.lockscreenMode === 'fixed' && p.id === settings.lockscreenFixedPhotoId)
    ) || LOCKSCREEN_WALLPAPERS[0];

  // Pointer drag handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - currentPos.x,
      y: e.clientY - currentPos.y,
    });
    sounds.playClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragOffset) return;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const newX = Math.max(12, Math.min(screenW - 290, e.clientX - dragOffset.x));
    const newY = Math.max(38, Math.min(screenH - 180, e.clientY - dragOffset.y));

    updateSettings({
      desktopGlancePosition: { x: Math.round(newX), y: Math.round(newY) },
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      setDragOffset(null);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  const handleNextWallpaper = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    const currentIndex = LOCKSCREEN_WALLPAPERS.findIndex((p) => p.id === settings.wallpaper);
    const nextIndex = (currentIndex + 1) % LOCKSCREEN_WALLPAPERS.length;
    const nextPhoto = LOCKSCREEN_WALLPAPERS[nextIndex];
    updateSettings({
      wallpaper: nextPhoto.id,
      desktopPhotoId: nextPhoto.id,
    });
  };

  const handleCloseWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClose();
    stopAudio();
    updateSettings({ desktopShowGlanceWidget: false });
    addNotification(
      'Widget ausgeblendet',
      'Das Desktop-Widget wurde entfernt. Du kannst es in den Einstellungen unter „Fenster & Taskleiste“ wieder einblenden.',
      'info',
      'Desktop'
    );
  };

  const handleOpenDesktopSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    openApp('settings', { activeTab: 'windows' });
  };

  const widgetTypesList = [
    { id: 'clock', label: 'Uhrzeit & Datum', icon: Clock },
    { id: 'weather', label: 'Wetter-Station', icon: CloudSun },
    { id: 'system', label: 'System-Monitor', icon: Cpu },
    { id: 'notes', label: 'Schnellnotiz', icon: StickyNote },
    { id: 'player', label: 'Klanglandschaft', icon: Music },
    { id: 'crypto', label: 'Finanz-Ticker', icon: TrendingUp },
  ];

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTypeSelector(false);
      }}
      style={{
        left: `${currentPos.x}px`,
        top: `${currentPos.y}px`,
        position: 'absolute',
        touchAction: 'none',
      }}
      className={`z-20 select-none cursor-grab active:cursor-grabbing transition-shadow ${
        isDragging ? 'scale-[1.02] shadow-2xl ring-2 ring-purple-500/70' : ''
      }`}
    >
      <div
        id="desktop-glance-widget"
        className={`group relative w-76 px-4 py-3.5 rounded-2xl backdrop-blur-2xl shadow-2xl transition-all duration-200 ${
          effectiveGlassContrast === 'dark'
            ? 'bg-white/80 border border-black/15 text-zinc-900 shadow-slate-300/40 hover:bg-white/90 hover:border-black/30'
            : 'bg-[#0e0e14]/85 border border-white/[0.14] text-white shadow-2xl hover:border-white/30 hover:bg-[#0e0e14]/92'
        }`}
        style={{
          boxShadow: `0 20px 45px rgba(0,0,0,0.4), 0 0 25px ${accentConfig.glow}25`,
        }}
      >
        {/* Floating Top Control Bar */}
        <div
          className={`absolute -top-3.5 left-2.5 right-2.5 flex items-center justify-between px-2.5 py-0.5 rounded-full shadow-xl transition-all duration-200 z-30 ${
            effectiveGlassContrast === 'dark'
              ? 'bg-white/95 border border-black/15 text-zinc-800'
              : 'bg-[#161622] border border-white/20 text-zinc-400'
          } ${
            isHovered || isDragging || showTypeSelector
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          {/* Widget Switcher Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTypeSelector((prev) => !prev);
              }}
              className="flex items-center gap-1 text-[10px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              <span>
                {widgetTypesList.find((w) => w.id === currentWidget)?.label || 'Widget'}
              </span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {/* Switcher Menu */}
            {showTypeSelector && (
              <div
                className={`absolute top-6 left-0 w-36 rounded-xl border p-1 shadow-2xl z-40 backdrop-blur-xl ${
                  effectiveGlassContrast === 'dark'
                    ? 'bg-white/95 border-black/10 text-zinc-900'
                    : 'bg-[#161722]/95 border-white/15 text-zinc-200'
                }`}
              >
                {widgetTypesList.map((wt) => {
                  const Icon = wt.icon;
                  const isCur = wt.id === currentWidget;
                  return (
                    <button
                      key={wt.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateSettings({ desktopWidgetType: wt.id as any });
                        sounds.playClick();
                        setShowTypeSelector(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                        isCur
                          ? 'bg-purple-600 text-white font-medium'
                          : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{wt.label}</span>
                      {isCur && <Check className="w-2.5 h-2.5 ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 text-[9px] text-zinc-500 mr-1">
              <GripHorizontal className="w-3 h-3 text-zinc-400" />
            </div>
            <button
              onClick={handleOpenDesktopSettings}
              title="Widget- und Desktop-Optionen anpassen"
              className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-zinc-400 hover:text-purple-400 transition-colors"
            >
              <Sliders className="w-3 h-3" />
            </button>
            <button
              onClick={handleCloseWidget}
              title="Widget schließen"
              className="p-1 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 1: CLOCK & PHOTO GLANCE */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'clock' && (
          <div>
            <div className="flex flex-col items-end overflow-hidden pt-0.5">
              <div className="flex items-baseline gap-1.5">
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={time}
                    variants={motionVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className={`text-4xl font-extralight drop-shadow-md leading-none tracking-tight ${
                      effectiveGlassContrast === 'dark' ? 'text-zinc-950 font-light' : 'text-white'
                    } ${fontClass}`}
                  >
                    {time}
                  </motion.span>
                </AnimatePresence>
                {settings.clockShowSeconds && (
                  <span
                    className={`text-sm font-mono tracking-normal leading-none ${
                      effectiveGlassContrast === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {secondsStr}
                  </span>
                )}
              </div>
              {settings.clockShowDate !== false && (
                <span
                  className={`text-xs font-medium tracking-wide drop-shadow mt-1 ${
                    effectiveGlassContrast === 'dark' ? 'text-zinc-700' : 'text-zinc-300'
                  }`}
                >
                  {dateStr}
                </span>
              )}
            </div>

            <div
              className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-2 ${
                effectiveGlassContrast === 'dark' ? 'border-black/10' : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden max-w-[170px]">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="overflow-hidden text-left">
                  <p
                    className={`text-[11px] font-semibold truncate drop-shadow ${
                      effectiveGlassContrast === 'dark' ? 'text-zinc-900' : 'text-white'
                    }`}
                  >
                    {settings.desktopCustomPhotoUrl ? 'Eigener Fotohintergrund' : currentPhoto.title}
                  </p>
                  <p
                    className={`text-[9px] truncate ${
                      effectiveGlassContrast === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {settings.desktopCustomPhotoUrl ? 'Benutzerdefiniert' : currentPhoto.location}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleNextWallpaper}
                  className={`p-1.5 rounded-xl transition-all shadow-sm ${
                    effectiveGlassContrast === 'dark'
                      ? 'bg-black/[0.06] hover:bg-black/[0.12] text-zinc-700 hover:text-black'
                      : 'bg-white/[0.06] hover:bg-white/[0.15] text-zinc-300 hover:text-white'
                  }`}
                  title="Nächstes Foto-Wallpaper"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 2: WEATHER */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'weather' && (
          <div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-3xl font-extralight tracking-tight block">22°C</span>
                <span className="text-xs font-semibold text-purple-400 flex items-center gap-1 mt-0.5">
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>Sonnig & Mild</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium block">Berlin, DE</span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">H: 24° • T: 14°</span>
              </div>
            </div>

            <div
              className={`mt-3 pt-2.5 border-t grid grid-cols-3 gap-1.5 text-center text-[10px] ${
                effectiveGlassContrast === 'dark' ? 'border-black/10 text-zinc-600' : 'border-white/[0.08] text-zinc-400'
              }`}
            >
              <div className="p-1 rounded-lg bg-white/[0.04]">
                <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Morgen</span>
                <span className="font-semibold text-white">24°C ☀️</span>
              </div>
              <div className="p-1 rounded-lg bg-white/[0.04]">
                <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Fr</span>
                <span className="font-semibold text-white">20°C ⛅</span>
              </div>
              <div className="p-1 rounded-lg bg-white/[0.04]">
                <span className="block text-[8px] uppercase tracking-wider text-zinc-500">Sa</span>
                <span className="font-semibold text-white">19°C 🌧️</span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 3: SYSTEM MONITOR */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'system' && (
          <div className="space-y-2 pt-0.5">
            {/* CPU */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Cpu className="w-3 h-3 text-purple-400" />
                  <span>CPU Obsidian M4</span>
                </span>
                <span className="font-mono text-purple-300">{cpuUsage}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${cpuUsage}%` }}
                />
              </div>
            </div>

            {/* RAM */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                <span className="text-zinc-300">Unified Memory</span>
                <span className="font-mono text-zinc-300">{ramUsage} GB / 16 GB</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${(ramUsage / 16) * 100}%` }}
                />
              </div>
            </div>

            {/* Battery & SSD summary */}
            <div
              className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                effectiveGlassContrast === 'dark' ? 'border-black/10 text-zinc-700' : 'border-white/[0.08] text-zinc-400'
              }`}
            >
              <span>⚡ 98% Geladen</span>
              <span>💾 184 GB / 512 GB frei</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 4: QUICK NOTE */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'notes' && (
          <div className="pt-0.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-400">
              <span className="flex items-center gap-1.5">
                <StickyNote className="w-3 h-3" />
                <span>Schreibtisch-Notiz</span>
              </span>
              <span className="text-[9px] text-zinc-500">Auto-gespeichert</span>
            </div>
            <textarea
              value={settings.desktopQuickNoteText || ''}
              onChange={(e) => updateSettings({ desktopQuickNoteText: e.target.value })}
              placeholder="Schnelle Notiz oder To-Do eingeben..."
              rows={3}
              className={`w-full text-xs p-2 rounded-xl border resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors ${
                effectiveGlassContrast === 'dark'
                  ? 'bg-black/5 border-black/10 text-zinc-900 placeholder:text-zinc-500'
                  : 'bg-white/[0.04] border-white/10 text-zinc-100 placeholder:text-zinc-500'
              }`}
            />
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 5: AMBIENT SOUND PLAYER */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'player' && (
          <div className="pt-0.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold block truncate">
                  {currentTrack === 'lofi' && 'Lo-Fi Chill Wave'}
                  {currentTrack === 'rain' && 'Cyber Regen & Wind'}
                  {currentTrack === 'space' && 'Deep Space Drone'}
                  {currentTrack === 'synth' && 'Synthwave Pulse'}
                </span>
                <span className="text-[10px] text-purple-400 block">Klanglandschaften</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isPlayingAudio) {
                    stopAudio();
                  } else {
                    startAudio(currentTrack);
                  }
                  sounds.playClick();
                }}
                className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>

            {/* Track selector buttons */}
            <div className="grid grid-cols-4 gap-1">
              {[
                { id: 'lofi', label: 'Lo-Fi' },
                { id: 'rain', label: 'Regen' },
                { id: 'space', label: 'Space' },
                { id: 'synth', label: 'Synth' },
              ].map((t) => {
                const isCur = currentTrack === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setCurrentTrack(t.id as any);
                      if (isPlayingAudio) {
                        startAudio(t.id as any);
                      }
                      sounds.playClick();
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[9px] font-medium transition-all ${
                      isCur
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold'
                        : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WIDGET 6: CRYPTO & MARKET TICKER */}
        {/* ------------------------------------------------------------- */}
        {currentWidget === 'crypto' && (
          <div className="pt-0.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-purple-400 mb-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Marktübersicht</span>
              </span>
              <span className="text-[9px] text-emerald-400 font-mono">Bullenmarkt 🟢</span>
            </div>

            <div className="space-y-1">
              {[
                { name: 'Bitcoin', symbol: 'BTC', price: '$91,420', change: '+3.8%' },
                { name: 'Ethereum', symbol: 'ETH', price: '$3,480', change: '+2.4%' },
                { name: 'Solana', symbol: 'SOL', price: '$194.50', change: '+5.7%' },
                { name: 'Obsidian Index', symbol: 'OBS', price: '$42.10', change: '+12.3%' },
              ].map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center justify-between text-[11px] p-1 rounded-lg bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-200">{coin.name}</span>
                    <span className="text-[9px] text-zinc-500 font-mono">{coin.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="font-medium text-white">{coin.price}</span>
                    <span className="text-emerald-400 font-semibold">{coin.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
