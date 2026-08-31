import React, { useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import { ShaderWallpaper } from './ShaderWallpaper';
import { LOCKSCREEN_WALLPAPERS } from '../../config/lockscreenWallpapers';
import { AnimatePresence, motion } from 'motion/react';

export const Wallpaper: React.FC = () => {
  const { settings, accentConfig } = useOS();

  // Mode detection
  const isExplicitShader = settings.desktopWallpaperMode === 'shader';
  const isExplicitPhoto = settings.desktopWallpaperMode === 'photo';

  // Check if wallpaper is a shader
  const isShader =
    isExplicitShader ||
    (!isExplicitPhoto && (settings.wallpaper.startsWith('shader-') || settings.wallpaper === 'obsidian-deep'));
  const effectiveShaderId = settings.wallpaper.startsWith('shader-')
    ? settings.wallpaper
    : 'shader-obsidian';

  // Check if wallpaper is a photo or URL
  const photoMatch = useMemo(() => {
    if (isShader) {
      return null;
    }
    if (settings.desktopCustomPhotoUrl) {
      return {
        id: 'custom',
        url: settings.desktopCustomPhotoUrl,
        title: 'Benutzerdefiniertes Foto',
      };
    }
    // Match by wallpaper ID (e.g. photo-dolomites) or fallback
    const matched = LOCKSCREEN_WALLPAPERS.find((p) => p.id === settings.wallpaper);
    if (matched) return matched;

    // If wallpaper starts with http
    if (settings.wallpaper.startsWith('http')) {
      return {
        id: 'direct-url',
        url: settings.wallpaper,
        title: 'Fotohintergrund',
      };
    }

    // If desktop wallpaper is set to fixed photo or photo mode
    if (settings.desktopPhotoId) {
      return LOCKSCREEN_WALLPAPERS.find((p) => p.id === settings.desktopPhotoId);
    }

    // Default photographic wallpaper fallback if not a shader or legacy gradient
    const isLegacyGradient = [
      'violet-nebula',
      'emerald-synth',
      'ocean-abyss',
      'sunset-dusk',
      'crimson-noir',
      'anthracite-mesh',
      'cyber-grid',
      'minimal-glow',
      'golden-aurora',
      'matrix-dark',
    ].includes(settings.wallpaper);

    if (!isLegacyGradient && !isShader) {
      return LOCKSCREEN_WALLPAPERS[0];
    }

    return null;
  }, [settings.wallpaper, settings.desktopPhotoId, settings.desktopCustomPhotoUrl, settings.desktopWallpaperMode, isShader]);

  const blurPx = settings.desktopBlur ?? 0;
  const dimmingPct = settings.desktopDimming ?? 25;

  return (
    <div
      id="os-wallpaper"
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#07070a]"
    >
      {/* 1. Real High-Resolution Photography Wallpaper */}
      {photoMatch ? (
        <div className="absolute inset-0 overflow-hidden bg-black">
          <AnimatePresence mode="wait">
            <motion.img
              key={photoMatch.url}
              src={photoMatch.url}
              alt={photoMatch.title || 'Desktop Wallpaper'}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
              }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`w-full h-full select-none pointer-events-none ${
                settings.wallpaperFit === 'contain'
                  ? 'object-contain'
                  : settings.wallpaperFit === 'center'
                  ? 'object-none object-center'
                  : 'object-cover'
              }`}
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>

          {/* Photographic Depth Overlay & Legibility Dimming */}
          <div
            className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none"
            style={{ opacity: dimmingPct / 100 }}
          />

          {/* High-end vignette for desktop clarity */}
          <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />
        </div>
      ) : isShader ? (
        /* 2. WebGL Shader Wallpapers */
        <ShaderWallpaper shaderId={effectiveShaderId as any} />
      ) : (
        /* 3. CSS Gradient Fallbacks */
        <>
          {settings.wallpaper === 'violet-nebula' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(135deg, #160824 0%, #0b0a10 45%, #180928 100%)',
              }}
            >
              <div className="absolute top-1/3 right-1/4 w-[500px] h-[400px] rounded-full blur-[160px] opacity-30 bg-purple-600" />
              <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[350px] rounded-full blur-[150px] opacity-25 bg-violet-700" />
            </div>
          )}

          {settings.wallpaper === 'emerald-synth' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(circle at 60% 40%, #064e3b 0%, #022c22 45%, #050b08 100%)',
              }}
            >
              <div className="absolute top-1/4 right-1/3 w-[500px] h-[350px] rounded-full blur-[150px] opacity-20 bg-emerald-500" />
            </div>
          )}

          {settings.wallpaper === 'ocean-abyss' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(circle at 40% 30%, #0c4a6e 0%, #082f49 50%, #030712 100%)',
              }}
            >
              <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[350px] rounded-full blur-[150px] opacity-25 bg-cyan-600" />
            </div>
          )}

          {settings.wallpaper === 'sunset-dusk' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(145deg, #451a03 0%, #1f1024 45%, #09090b 100%)',
              }}
            >
              <div className="absolute top-1/3 left-1/3 w-[450px] h-[350px] rounded-full blur-[140px] opacity-25 bg-amber-600" />
            </div>
          )}

          {settings.wallpaper === 'crimson-noir' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(ellipse at center, #450a0a 0%, #180505 55%, #080303 100%)',
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] rounded-full blur-[160px] opacity-20 bg-red-600" />
            </div>
          )}

          {settings.wallpaper === 'anthracite-mesh' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'linear-gradient(180deg, #16161d 0%, #0e0e13 60%, #08080a 100%)',
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              />
            </div>
          )}

          {settings.wallpaper === 'cyber-grid' && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(ellipse at bottom, #2b1144 0%, #09090c 70%)',
              }}
            >
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, #a855f7 1px, transparent 1px), linear-gradient(to bottom, #a855f7 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
            </div>
          )}

          {settings.wallpaper === 'minimal-glow' && (
            <div className="absolute inset-0 transition-opacity duration-700 bg-[#08080a]">
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full blur-[150px] opacity-20"
                style={{ backgroundColor: accentConfig.primary }}
              />
            </div>
          )}
        </>
      )}

      {/* Subtle vignette and dark ambient noise overlay */}
      <div className="absolute inset-0 pointer-events-none bg-radial-vignette opacity-50" />
    </div>
  );
};
