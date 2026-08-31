import React, { useState, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { WALLPAPERS } from '../../../config/themeConfig';
import { LOCKSCREEN_WALLPAPERS } from '../../../config/lockscreenWallpapers';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Check,
  Eye,
  Trash2,
  Sparkles,
  Lock,
  Layers,
  Clock,
  Shuffle,
  Camera,
  Flame,
} from 'lucide-react';

export const WallpaperTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds, addNotification } = useOS();
  const [activeScreenTab, setActiveScreenTab] = useState<'desktop' | 'lockscreen'>('desktop');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [customLockUrlInput, setCustomLockUrlInput] = useState('');
  const desktopFileRef = useRef<HTMLInputElement | null>(null);
  const lockFileRef = useRef<HTMLInputElement | null>(null);

  const shadersList = WALLPAPERS.filter((w) => w.id.startsWith('shader-') || w.id === 'obsidian-deep');

  // Handle Desktop File Upload
  const handleDesktopUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification('Ungültiges Format', 'Bitte wähle eine Bilddatei (PNG, JPG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        updateSettings({
          wallpaper: 'custom-uploaded' as any,
          desktopWallpaperMode: 'photo',
          desktopCustomPhotoUrl: base64,
        });
        sounds.playSuccess();
        addNotification('Schreibtisch-Hintergrund gesetzt', 'Eigenes Bild erfolgreich für den Schreibtisch geladen.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Lockscreen File Upload
  const handleLockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addNotification('Ungültiges Format', 'Bitte wähle eine Bilddatei (PNG, JPG, WebP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        updateSettings({
          lockscreenMode: 'custom_photo' as any,
          lockscreenCustomPhotoUrl: base64,
        });
        sounds.playSuccess();
        addNotification('Sperrbildschirm gesetzt', 'Eigenes Bild erfolgreich für den Sperrbildschirm geladen.', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDesktopUrl = () => {
    if (!customUrlInput.trim()) return;
    updateSettings({
      wallpaper: 'custom-url' as any,
      desktopWallpaperMode: 'photo',
      desktopCustomPhotoUrl: customUrlInput.trim(),
    });
    sounds.playSuccess();
    addNotification('Schreibtisch-Hintergrund geändert', 'Bild per URL erfolgreich festgelegt.', 'success');
    setCustomUrlInput('');
  };

  const handleLockUrl = () => {
    if (!customLockUrlInput.trim()) return;
    updateSettings({
      lockscreenMode: 'custom_photo' as any,
      lockscreenCustomPhotoUrl: customLockUrlInput.trim(),
    });
    sounds.playSuccess();
    addNotification('Sperrbildschirm geändert', 'Bild per URL erfolgreich festgelegt.', 'success');
    setCustomLockUrlInput('');
  };

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Top Header */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Hintergrund & Sperrbildschirm</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Passe Schreibtisch (Home Screen) und Sperrbildschirm unabhängig voneinander mit Shaders oder Fotos an.
        </p>
      </div>

      {/* Screen Segment Selector */}
      <div className="flex p-1 rounded-xl bg-black/40 border border-white/[0.08]">
        <button
          onClick={() => {
            setActiveScreenTab('desktop');
            sounds.playClick();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeScreenTab === 'desktop'
              ? 'bg-white/[0.12] text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
          style={{
            borderColor: activeScreenTab === 'desktop' ? accentConfig.primary : undefined,
          }}
        >
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Schreibtisch (Home Screen)</span>
        </button>

        <button
          onClick={() => {
            setActiveScreenTab('lockscreen');
            sounds.playClick();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeScreenTab === 'lockscreen'
              ? 'bg-white/[0.12] text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Sperrbildschirm (Lock Screen)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP / HOME SCREEN TAB */}
      {/* ========================================================================= */}
      {activeScreenTab === 'desktop' && (
        <div className="space-y-6">
          {/* Mode Selector for Desktop: Shader vs Photo */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Schreibtisch-Modus
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  updateSettings({
                    desktopWallpaperMode: 'shader',
                    wallpaper: settings.desktopShaderId || 'shader-obsidian',
                  });
                  sounds.playToggle();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  settings.desktopWallpaperMode === 'shader' || (!settings.desktopWallpaperMode && settings.wallpaper?.startsWith('shader-'))
                    ? 'bg-white/[0.12] border-white/30 ring-1 shadow-sm'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: settings.desktopWallpaperMode === 'shader' ? accentConfig.primary : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">WebGL Live-Shader</span>
                  <span className="text-[10px] text-zinc-400">Interaktive flüssige Partikel & Plasmas</span>
                </div>
              </button>

              <button
                onClick={() => {
                  updateSettings({
                    desktopWallpaperMode: 'photo',
                    wallpaper: settings.desktopPhotoId || 'photo-dolomites',
                  });
                  sounds.playToggle();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  settings.desktopWallpaperMode === 'photo'
                    ? 'bg-white/[0.12] border-white/30 ring-1 shadow-sm'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: settings.desktopWallpaperMode === 'photo' ? accentConfig.primary : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">4K Fotografie</span>
                  <span className="text-[10px] text-zinc-400">Kuratiert oder eigenes Bild</span>
                </div>
              </button>
            </div>
          </div>

          {/* WebGL Shader Collection */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                WebGL Live-Shader Galerie
              </label>
              <span className="text-[11px] text-purple-400 font-mono">60/120 FPS</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {shadersList.map((w) => {
                const isSelected =
                  settings.desktopWallpaperMode === 'shader' &&
                  (settings.wallpaper === w.id || settings.desktopShaderId === w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      updateSettings({
                        wallpaper: w.id as any,
                        desktopWallpaperMode: 'shader',
                        desktopShaderId: w.id as any,
                        desktopCustomPhotoUrl: undefined,
                      });
                      sounds.playClick();
                    }}
                    className={`group relative h-20 rounded-xl overflow-hidden border text-left transition-all ${
                      isSelected ? 'border-white ring-2' : 'border-white/[0.08] hover:border-white/30'
                    }`}
                    style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
                  >
                    <div className="w-full h-full" style={{ background: w.previewGradient || '#18181b' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                      <span className="text-xs font-semibold text-white truncate">{w.name}</span>
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow"
                        style={{ backgroundColor: accentConfig.primary }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4K Real Photography Grid */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              4K Foto-Galerie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {LOCKSCREEN_WALLPAPERS.map((p) => {
                const isSelected =
                  settings.desktopWallpaperMode === 'photo' &&
                  !settings.desktopCustomPhotoUrl &&
                  (settings.wallpaper === p.id || settings.desktopPhotoId === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      updateSettings({
                        wallpaper: p.id as any,
                        desktopWallpaperMode: 'photo',
                        desktopPhotoId: p.id,
                        desktopCustomPhotoUrl: undefined,
                      });
                      sounds.playClick();
                    }}
                    className={`group relative aspect-video rounded-xl overflow-hidden border transition-all ${
                      isSelected ? 'border-white ring-2' : 'border-white/[0.08] hover:border-white/30'
                    }`}
                    style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
                  >
                    <img
                      src={p.thumbUrl || p.url}
                      alt={p.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                      <span className="text-[10px] font-medium text-white block truncate">{p.title}</span>
                    </div>
                    {isSelected && (
                      <div
                        className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: accentConfig.primary }}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Custom Upload & URL */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Eigenes Schreibtisch-Foto
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="file"
                ref={desktopFileRef}
                onChange={handleDesktopUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => desktopFileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Vom Gerät hochladen</span>
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDesktopUrl()}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleDesktopUrl}
                  disabled={!customUrlInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-all shrink-0"
                  style={{ backgroundColor: accentConfig.primary }}
                >
                  URL anwenden
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Blur & Dimming Sliders */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Schreibtisch-Filter (Blur & Dimming)
            </label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Schreibtisch Unschärfe (Blur)</span>
                  <span className="font-mono text-purple-400 font-bold">{settings.desktopBlur ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={settings.desktopBlur ?? 0}
                  onChange={(e) => updateSettings({ desktopBlur: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Schreibtisch Abdunklung (Dimming)</span>
                  <span className="font-mono text-purple-400 font-bold">{settings.desktopDimming ?? 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={settings.desktopDimming ?? 0}
                  onChange={(e) => updateSettings({ desktopDimming: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LOCK SCREEN TAB */}
      {/* ========================================================================= */}
      {activeScreenTab === 'lockscreen' && (
        <div className="space-y-6">
          {/* Mode Selector for Lockscreen: Shader vs Fixed Photo vs Slideshow vs Custom */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Sperrbildschirm-Modus
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  updateSettings({
                    lockscreenMode: 'shader' as any,
                    lockscreenShaderId: settings.lockscreenShaderId || 'shader-obsidian',
                  });
                  sounds.playToggle();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  settings.lockscreenMode === 'shader'
                    ? 'bg-white/[0.12] border-white/30 ring-1 shadow-sm'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: settings.lockscreenMode === 'shader' ? accentConfig.primary : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">WebGL Shader</span>
                  <span className="text-[10px] text-zinc-400">Dynamische Shaders auf dem Sperrbildschirm</span>
                </div>
              </button>

              <button
                onClick={() => {
                  updateSettings({
                    lockscreenMode: 'fixed',
                    lockscreenFixedPhotoId: settings.lockscreenFixedPhotoId || 'photo-dolomites',
                  });
                  sounds.playToggle();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  settings.lockscreenMode === 'fixed'
                    ? 'bg-white/[0.12] border-white/30 ring-1 shadow-sm'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: settings.lockscreenMode === 'fixed' ? accentConfig.primary : 'transparent' }}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Festes Foto</span>
                  <span className="text-[10px] text-zinc-400">Dauerhaft gewähltes 4K Foto</span>
                </div>
              </button>

              <button
                onClick={() => {
                  updateSettings({
                    lockscreenMode: 'random_photo',
                    lockscreenCategory: 'all',
                  });
                  sounds.playToggle();
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  settings.lockscreenMode === 'random_photo' || settings.lockscreenMode === 'category'
                    ? 'bg-white/[0.12] border-white/30 ring-1 shadow-sm'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{
                  ringColor:
                    settings.lockscreenMode === 'random_photo' || settings.lockscreenMode === 'category'
                      ? accentConfig.primary
                      : 'transparent',
                }}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Shuffle className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block">Zufall / Diashow</span>
                  <span className="text-[10px] text-zinc-400">Wechselnde Unsplash 4K Fotos</span>
                </div>
              </button>
            </div>
          </div>

          {/* WebGL Shader Selection for Lockscreen */}
          {settings.lockscreenMode === 'shader' && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Sperrbildschirm-Shader wählen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {shadersList.map((w) => {
                  const isSelected = (settings.lockscreenShaderId || 'shader-obsidian') === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => {
                        updateSettings({
                          lockscreenMode: 'shader' as any,
                          lockscreenShaderId: w.id as any,
                          lockscreenCustomPhotoUrl: undefined,
                        });
                        sounds.playClick();
                      }}
                      className={`group relative h-20 rounded-xl overflow-hidden border text-left transition-all ${
                        isSelected ? 'border-white ring-2' : 'border-white/[0.08] hover:border-white/30'
                      }`}
                      style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
                    >
                      <div className="w-full h-full" style={{ background: w.previewGradient || '#18181b' }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2">
                        <span className="text-xs font-semibold text-white truncate">{w.name}</span>
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-white shadow"
                          style={{ backgroundColor: accentConfig.primary }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fixed Photo Selection for Lockscreen */}
          {settings.lockscreenMode === 'fixed' && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                Festes Foto für Sperrbildschirm wählen
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {LOCKSCREEN_WALLPAPERS.map((p) => {
                  const isSelected =
                    !settings.lockscreenCustomPhotoUrl &&
                    (settings.lockscreenFixedPhotoId || 'photo-dolomites') === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        updateSettings({
                          lockscreenMode: 'fixed',
                          lockscreenFixedPhotoId: p.id,
                          lockscreenCustomPhotoUrl: undefined,
                        });
                        sounds.playClick();
                      }}
                      className={`group relative aspect-video rounded-xl overflow-hidden border transition-all ${
                        isSelected ? 'border-white ring-2' : 'border-white/[0.08] hover:border-white/30'
                      }`}
                      style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
                    >
                      <img
                        src={p.thumbUrl || p.url}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 to-transparent">
                        <span className="text-[10px] font-medium text-white block truncate">{p.title}</span>
                      </div>
                      {isSelected && (
                        <div
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: accentConfig.primary }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lockscreen Custom Photo Upload / URL */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Eigenes Foto für den Sperrbildschirm
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="file"
                ref={lockFileRef}
                onChange={handleLockUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => lockFileRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Vom Gerät hochladen</span>
              </button>

              <div className="flex-1 flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customLockUrlInput}
                  onChange={(e) => setCustomLockUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLockUrl()}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleLockUrl}
                  disabled={!customLockUrlInput.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 transition-all shrink-0"
                  style={{ backgroundColor: accentConfig.primary }}
                >
                  URL anwenden
                </button>
              </div>
            </div>
          </div>

          {/* Lockscreen Blur & Dimming */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
              Sperrbildschirm Filter (Blur & Dimming)
            </label>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Sperrbildschirm Unschärfe (Blur)</span>
                  <span className="font-mono text-purple-400 font-bold">{settings.lockscreenBlur ?? 0}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="32"
                  value={settings.lockscreenBlur ?? 0}
                  onChange={(e) => updateSettings({ lockscreenBlur: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Sperrbildschirm Abdunklung (Dimming)</span>
                  <span className="font-mono text-purple-400 font-bold">{settings.lockscreenDimming ?? 25}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={settings.lockscreenDimming ?? 25}
                  onChange={(e) => updateSettings({ lockscreenDimming: Number(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
