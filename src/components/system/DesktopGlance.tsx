import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { LOCKSCREEN_WALLPAPERS } from '../../config/lockscreenWallpapers';
import { getClockFontFamilyClass, getClockMotionVariants } from '../../utils/clockUtils';
import { MapPin, RefreshCw, Sliders, X, GripHorizontal, Sparkles, Clock, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DesktopGlance: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds, openApp, addNotification } = useOS();
  const [time, setTime] = useState('');
  const [secondsStr, setSecondsStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const widgetRef = useRef<HTMLDivElement>(null);

  // Time & date interval
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

  if (settings.desktopShowGlanceWidget === false) return null;

  // Determine current wallpaper info if photo
  const currentPhoto =
    LOCKSCREEN_WALLPAPERS.find(
      (p) =>
        p.id === settings.wallpaper ||
        p.id === settings.desktopPhotoId ||
        (settings.lockscreenMode === 'fixed' && p.id === settings.lockscreenFixedPhotoId)
    ) || LOCKSCREEN_WALLPAPERS[0];

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
    updateSettings({ desktopShowGlanceWidget: false });
    addNotification(
      'Widget gelöscht / ausgeblendet',
      'Das Uhrzeit-Widget wurde entfernt. Du kannst es jederzeit in den Einstellungen (Uhr & Sperrbildschirm) wieder aktivieren.',
      'info',
      'Desktop'
    );
  };

  const handleOpenClockSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    openApp('settings', { activeTab: 'clock_lockscreen' });
  };

  // Safe default position (top right area of screen)
  const defaultPos = {
    x: typeof window !== 'undefined' ? Math.max(40, window.innerWidth - 310) : 880,
    y: 44,
  };

  const currentPos = settings.desktopGlancePosition || defaultPos;
  const fontClass = getClockFontFamilyClass(settings.clockFont);
  const motionVariants = getClockMotionVariants(settings.clockTimeAnimation);

  // Pointer-based rock-solid drag handler
  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
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

    const newX = Math.max(12, Math.min(screenW - 280, e.clientX - dragOffset.x));
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

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        className="group relative w-72 px-4 py-3.5 rounded-2xl bg-[#0e0e14]/80 backdrop-blur-2xl border border-white/[0.14] shadow-2xl transition-all duration-200 hover:border-white/30 hover:bg-[#0e0e14]/92"
        style={{
          boxShadow: `0 20px 45px rgba(0,0,0,0.65), 0 0 25px ${accentConfig.glow}25`,
        }}
      >
        {/* Floating Top Control Bar: Grip Handle, Settings, Close/Delete */}
        <div
          className={`absolute -top-3.5 left-3 right-3 flex items-center justify-between bg-[#161622] border border-white/20 px-2.5 py-0.5 rounded-full shadow-xl transition-all duration-200 ${
            isHovered || isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
            <GripHorizontal className="w-3 h-3 text-purple-400" />
            <span>Widget verschieben</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleOpenClockSettings}
              title="Uhrzeit-Design & Animationen anpassen"
              className="p-1 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            >
              <Clock className="w-3 h-3 text-purple-400" />
            </button>
            <button
              onClick={handleCloseWidget}
              title="Widget vom Desktop löschen"
              className="p-1 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Time & Date Display */}
        <div className="flex flex-col items-end overflow-hidden pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={time}
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`text-4xl font-extralight text-white drop-shadow-md leading-none tracking-tight ${fontClass}`}
              >
                {time}
              </motion.span>
            </AnimatePresence>
            {settings.clockShowSeconds && (
              <span className="text-sm text-zinc-400 font-mono tracking-normal leading-none">
                {secondsStr}
              </span>
            )}
          </div>
          {settings.clockShowDate !== false && (
            <span className="text-xs font-medium text-zinc-300 tracking-wide drop-shadow mt-1">
              {dateStr}
            </span>
          )}
        </div>

        {/* Photo Meta & Quick Controls */}
        <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <div className="overflow-hidden text-left">
              <p className="text-[11px] font-semibold text-white truncate drop-shadow">
                {settings.desktopCustomPhotoUrl ? 'Eigener Fotohintergrund' : currentPhoto.title}
              </p>
              <p className="text-[9px] text-zinc-400 truncate">
                {settings.desktopCustomPhotoUrl ? 'Benutzerdefiniert' : currentPhoto.location}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleNextWallpaper}
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] text-zinc-300 hover:text-white transition-all shadow-sm"
              title="Nächstes Foto-Wallpaper"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleOpenClockSettings}
              className="p-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-white transition-all shadow-sm border border-purple-500/30"
              title="Uhrzeit & Sperrbildschirm anpassen"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
