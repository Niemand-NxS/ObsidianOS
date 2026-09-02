import React, { useEffect, useState, useCallback, useRef } from 'react';
import { OSProvider, useOS } from './context/OSContext';
import { Wallpaper } from './components/system/Wallpaper';
import { TopBar } from './components/system/TopBar';
import { Dock } from './components/system/Dock';
import { Window } from './components/system/Window';
import { Spotlight } from './components/system/Spotlight';
import { ControlCenter } from './components/system/ControlCenter';
import { LockScreen } from './components/system/LockScreen';
import { SetupAssistant } from './components/system/SetupAssistant';
import { DesktopGlance } from './components/system/DesktopGlance';
import { AppQuickSettings } from './components/system/AppQuickSettings';
import { APPS_REGISTRY } from './config/themeConfig';
import { AppMetadata } from './types';
import {
  Settings,
  Folder,
  Calculator,
  Globe,
  Terminal,
  Shield,
  FileText,
  Image as ImageIcon,
  Music,
  Activity,
  ShoppingBag,
  MoreVertical,
  Grid,
  Gamepad2,
  Timer,
  CloudSun,
  Paintbrush,
  TrendingUp,
  Music2,
  Sparkles,
  Zap,
  Code,
  Youtube,
  Crown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const DESKTOP_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Settings: ({ className }) => <Settings className={className} />,
  Folder: ({ className }) => <Folder className={className} />,
  Calculator: ({ className }) => <Calculator className={className} />,
  Globe: ({ className }) => <Globe className={className} />,
  Terminal: ({ className }) => <Terminal className={className} />,
  FileText: ({ className }) => <FileText className={className} />,
  Image: ({ className }) => <ImageIcon className={className} />,
  Music: ({ className }) => <Music className={className} />,
  Activity: ({ className }) => <Activity className={className} />,
  ShoppingBag: ({ className }) => <ShoppingBag className={className} />,
  Gamepad2: ({ className }) => <Gamepad2 className={className} />,
  Timer: ({ className }) => <Timer className={className} />,
  CloudSun: ({ className }) => <CloudSun className={className} />,
  Paintbrush: ({ className }) => <Paintbrush className={className} />,
  TrendingUp: ({ className }) => <TrendingUp className={className} />,
  Music2: ({ className }) => <Music2 className={className} />,
  Sparkles: ({ className }) => <Sparkles className={className} />,
  Zap: ({ className }) => <Zap className={className} />,
  Code: ({ className }) => <Code className={className} />,
  Youtube: ({ className }) => <Youtube className={className} />,
  Crown: ({ className }) => <Crown className={className} />,
};

// Grid constants for strict raster-based movement with customizable spacing
const getGridDimensions = (spacing?: string, iconSize?: string) => {
  let cellW = 104;
  let cellH = 110;
  if (spacing === 'compact') {
    cellW = 88;
    cellH = 92;
  } else if (spacing === 'spacious') {
    cellW = 124;
    cellH = 130;
  }

  let iconBoxClass = 'w-13 h-13';
  let iconSvgClass = 'w-6 h-6';
  if (iconSize === 'small') {
    iconBoxClass = 'w-10 h-10';
    iconSvgClass = 'w-5 h-5';
  } else if (iconSize === 'large') {
    iconBoxClass = 'w-16 h-16';
    iconSvgClass = 'w-8 h-8';
  }

  return { cellW, cellH, iconBoxClass, iconSvgClass };
};

const GRID_START_X = 24;
const GRID_START_Y = 48;

const snapToRasterGrid = (
  rawX: number,
  rawY: number,
  cellW: number,
  cellH: number,
  widgetBounds?: { x: number; y: number; width: number; height: number } | null
) => {
  const maxCols =
    typeof window !== 'undefined'
      ? Math.max(1, Math.floor((window.innerWidth - 60) / cellW))
      : 10;
  const maxRows =
    typeof window !== 'undefined'
      ? Math.max(1, Math.floor((window.innerHeight - 150) / cellH))
      : 8;

  let col = Math.max(
    0,
    Math.min(maxCols - 1, Math.round((rawX - GRID_START_X) / cellW))
  );
  let row = Math.max(
    0,
    Math.min(maxRows - 1, Math.round((rawY - GRID_START_Y) / cellH))
  );

  let snappedX = GRID_START_X + col * cellW;
  let snappedY = GRID_START_Y + row * cellH;

  // Collision check against DesktopGlance widget area
  if (widgetBounds) {
    const iconW = cellW;
    const iconH = cellH;
    const isColliding =
      snappedX < widgetBounds.x + widgetBounds.width + 10 &&
      snappedX + iconW > widgetBounds.x - 10 &&
      snappedY < widgetBounds.y + widgetBounds.height + 10 &&
      snappedY + iconH > widgetBounds.y - 10;

    if (isColliding) {
      // Push below widget or to next row
      row = Math.min(
        maxRows - 1,
        Math.floor((widgetBounds.y + widgetBounds.height + 16 - GRID_START_Y) / cellH) + 1
      );
      snappedY = GRID_START_Y + row * cellH;
    }
  }

  return {
    x: snappedX,
    y: snappedY,
    col,
    row,
  };
};

const DesktopContent: React.FC = () => {
  const {
    windows,
    openApp,
    openSpotlight,
    lockScreen,
    accentConfig,
    iconPositions,
    updateIconPosition,
    sounds,
    settings,
    installedAppIds,
    customApps,
    isLocked,
    isSetupCompleted,
    snapPreview: windowSnapPreview,
    effectiveTheme,
    effectiveGlassContrast,
    isLight,
  } = useOS();

  const [selectedQuickApp, setSelectedQuickApp] = useState<{
    app: AppMetadata;
    position: { x: number; y: number };
  } | null>(null);

  // High-precision pointer-based dragging engine for desktop icons
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [currentDragPos, setCurrentDragPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [iconSnapPreview, setIconSnapPreview] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const dragStartRef = useRef<{
    appId: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    hasMoved: boolean;
  } | null>(null);

  // Derive visible desktop apps: Preinstalled + Installed from Store + Custom AI apps
  const visibleDesktopApps: AppMetadata[] = [
    ...APPS_REGISTRY.filter(
      (app) => app.isPreinstalled || installedAppIds.includes(app.id)
    ),
    ...customApps.map((ca) => ({
      id: ca.id,
      name: ca.name,
      category: 'Entwicklung' as const,
      iconName: ca.icon || 'Sparkles',
      description: 'Benutzerdefinierte KI-Anwendung',
      defaultWidth: 860,
      defaultHeight: 580,
      minWidth: 500,
      minHeight: 400,
      isPreinstalled: false,
    })),
  ];

  // Resolve active Icon Appearance
  const resolvedIconStyle = React.useMemo(() => {
    if (settings.iconStyle && settings.iconStyle !== 'auto') {
      return settings.iconStyle;
    }
    if (effectiveTheme === 'glassy') return 'glassy';
    if (effectiveTheme === 'light') return 'light';
    return 'glassy';
  }, [settings.iconStyle, effectiveTheme]);

  const iconGlassOpacity = (settings.iconGlassOpacity ?? 55) / 100;
  const iconGlassBlur = settings.iconGlassBlur ?? 20;
  const iconRadiusClass = settings.iconRadius || 'rounded-2xl';
  const iconGlowEnabled = settings.iconGlow ?? true;

  // Global Keyboard Shortcuts (Cmd+Space / Ctrl+Space for Spotlight, Cmd+L for Lock)
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        openSpotlight();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        lockScreen();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [openSpotlight, lockScreen]);

  const { cellW, cellH, iconBoxClass, iconSvgClass } = getGridDimensions(
    settings.desktopGridSpacing,
    settings.desktopIconSize
  );

  const widgetBounds =
    settings.desktopShowGlanceWidget !== false
      ? {
          x: settings.desktopGlancePosition?.x ?? 28,
          y: settings.desktopGlancePosition?.y ?? 28,
          width: 270,
          height: 140,
        }
      : null;

  // Pointer movement listener for drag
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const { startX, startY, initialX, initialY, appId } = dragStartRef.current;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      if (!dragStartRef.current.hasMoved && Math.hypot(deltaX, deltaY) > 5) {
        dragStartRef.current.hasMoved = true;
        setDraggingAppId(appId);
      }

      if (dragStartRef.current.hasMoved) {
        const nextRawX = initialX + deltaX;
        const nextRawY = initialY + deltaY;

        setCurrentDragPos({ x: nextRawX, y: nextRawY });
        const snapped = snapToRasterGrid(nextRawX, nextRawY, cellW, cellH, widgetBounds);
        setIconSnapPreview({ x: snapped.x, y: snapped.y });
      }
    };

    const handlePointerUp = () => {
      if (dragStartRef.current && dragStartRef.current.hasMoved) {
        const appId = dragStartRef.current.appId;
        if (currentDragPos) {
          const snapped = snapToRasterGrid(currentDragPos.x, currentDragPos.y, cellW, cellH, widgetBounds);
          updateIconPosition(appId, snapped.x, snapped.y);
          sounds.playClick();
        }
      }

      dragStartRef.current = null;
      setDraggingAppId(null);
      setCurrentDragPos(null);
      setIconSnapPreview(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [currentDragPos, updateIconPosition, sounds, cellW, cellH, widgetBounds]);

  const currentScale = settings.uiScalePercent || (settings.uiScale === 'compact' ? 80 : settings.uiScale === 'large' ? 120 : 100);

  return (
    <div
      id="obsidian-os-root"
      className={`relative w-screen h-screen overflow-hidden select-none font-sans theme-${effectiveTheme} glass-contrast-${effectiveGlassContrast} ${
        effectiveGlassContrast === 'dark' ? 'text-zinc-900' : 'text-white'
      }`}
      style={{
        filter: `${settings.brightness && settings.brightness !== 100 ? `brightness(${settings.brightness}%) ` : ''}${
          settings.nightShift ? 'sepia(25%) hue-rotate(-10deg) ' : ''
        }`.trim() || undefined,
        zoom: `${currentScale}%`,
        ['--os-blur' as any]: `${settings.glassBlurEnabled !== false ? (settings.glassBlur ?? 24) : 0}px`,
        ['--os-glass-opacity' as any]: `${(settings.glassOpacity ?? 65) / 100}`,
        ['--os-window-radius' as any]: `${settings.windowRadius ?? 16}px`,
        ['--os-accent-primary' as any]: accentConfig.primary,
      }}
    >
      {/* 1. Global Wallpaper Layer (Supports Real Unsplash 4K Photos & WebGL Shaders) */}
      <Wallpaper />

      {/* 2. Top System Bar with unlock slide-down entrance */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        className="relative z-40"
      >
        <TopBar />
      </motion.div>

      {/* 3. Floating Desktop Glance Widget mirroring Lockscreen aesthetic */}
      <DesktopGlance />

      {/* 4. Desktop Main Workspace & Icon Grid */}
      <main
        id="desktop-main-workspace"
        className="absolute inset-0 pt-8 pb-24 overflow-hidden z-10"
        onClick={() => setSelectedQuickApp(null)}
      >
        {/* Realtime Snap Target Raster Ghost Box */}
        <AnimatePresence>
          {iconSnapPreview && draggingAppId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute w-22 h-24 rounded-2xl border-2 border-dashed border-purple-400/60 bg-purple-500/10 pointer-events-none z-10 transition-all duration-75 flex items-center justify-center"
              style={{
                left: iconSnapPreview.x,
                top: iconSnapPreview.y,
              }}
            >
              <Grid className="w-5 h-5 text-purple-400/50" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Render Raster-Snapped Desktop Icons with Lockscreen Frosted Glass & Stagger */}
        {visibleDesktopApps.map((app, index) => {
          const IconComp =
            DESKTOP_ICONS[app.iconName] || DESKTOP_ICONS[app.iconName] || Sparkles;

          // Default grid slot
          const defaultCol = Math.floor(index / 5);
          const defaultRow = index % 5;
          const defaultX = GRID_START_X + defaultCol * cellW;
          const defaultY = GRID_START_Y + defaultRow * cellH;

          const savedPos = iconPositions[app.id] || { x: defaultX, y: defaultY };
          const isDragging = draggingAppId === app.id;
          const currentX =
            isDragging && currentDragPos ? currentDragPos.x : savedPos.x;
          const currentY =
            isDragging && currentDragPos ? currentDragPos.y : savedPos.y;

          return (
            <motion.div
              key={`desktop-${app.id}`}
              id={`desktop-icon-${app.id}`}
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.12 + Math.min(index, 10) * 0.03,
              }}
              onPointerDown={(e) => {
                if (e.button !== 0) return; // only left click
                dragStartRef.current = {
                  appId: app.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  initialX: savedPos.x,
                  initialY: savedPos.y,
                  hasMoved: false,
                };
              }}
              onClick={(e) => {
                e.stopPropagation();
                // If it was not a drag gesture
                if (!dragStartRef.current?.hasMoved) {
                  const isSingleClickMode = settings.desktopIconClickMode === 'single';
                  if (isSingleClickMode) {
                    openApp(app.id);
                  } else {
                    sounds.playClick();
                  }
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (!dragStartRef.current?.hasMoved) {
                  openApp(app.id);
                }
              }}
              onTouchEnd={(e) => {
                // On touch devices, direct touch opens without requiring desktop double click
                if (!dragStartRef.current?.hasMoved) {
                  openApp(app.id);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelectedQuickApp({
                  app,
                  position: { x: savedPos.x, y: savedPos.y },
                });
              }}
              style={{
                position: 'absolute',
                left: currentX,
                top: currentY,
                width: cellW - 12,
                height: cellH - 10,
                zIndex: isDragging ? 50 : 20,
              }}
              className={`flex flex-col items-center justify-center p-1.5 rounded-2xl cursor-grab active:cursor-grabbing group transition-all duration-200 ${
                isDragging
                  ? 'scale-110 shadow-2xl opacity-90'
                  : 'hover:scale-105 hover:bg-white/[0.08]'
              }`}
            >
              {/* Desktop App Icon Box - Customizable Aesthetic */}
              <div
                className={`${iconBoxClass} ${iconRadiusClass} flex items-center justify-center transition-all ${
                  resolvedIconStyle === 'glassy'
                    ? effectiveGlassContrast === 'dark'
                      ? 'border border-black/15 group-hover:border-black/30'
                      : 'border border-white/20 group-hover:border-white/40'
                    : resolvedIconStyle === 'light'
                    ? 'bg-white/95 border border-black/10 text-zinc-900 shadow-md'
                    : resolvedIconStyle === 'dark'
                    ? 'bg-[#12121a]/95 border border-white/10 text-white shadow-xl'
                    : 'border border-white/20 text-white shadow-xl'
                }`}
                style={{
                  backgroundColor:
                    resolvedIconStyle === 'glassy'
                      ? effectiveGlassContrast === 'dark'
                        ? `rgba(255, 255, 255, ${iconGlassOpacity})`
                        : `rgba(18, 18, 26, ${iconGlassOpacity})`
                      : resolvedIconStyle === 'colored'
                      ? accentConfig.primary
                      : undefined,
                  backdropFilter:
                    resolvedIconStyle === 'glassy' && iconGlassBlur > 0
                      ? `blur(${iconGlassBlur}px)`
                      : undefined,
                  WebkitBackdropFilter:
                    resolvedIconStyle === 'glassy' && iconGlassBlur > 0
                      ? `blur(${iconGlassBlur}px)`
                      : undefined,
                  boxShadow: iconGlowEnabled
                    ? `0 12px 30px rgba(0,0,0,0.5), 0 0 18px ${accentConfig.glow}`
                    : '0 8px 24px rgba(0,0,0,0.4)',
                }}
              >
                <IconComp
                  className={`${iconSvgClass} transition-colors drop-shadow ${
                    resolvedIconStyle === 'light'
                      ? 'text-zinc-800 group-hover:text-black'
                      : resolvedIconStyle === 'dark' || resolvedIconStyle === 'colored'
                      ? 'text-white'
                      : effectiveGlassContrast === 'dark'
                      ? 'text-zinc-900 group-hover:text-black'
                      : 'text-zinc-100 group-hover:text-white'
                  }`}
                  style={{
                    color:
                      resolvedIconStyle === 'light'
                        ? accentConfig.primary
                        : resolvedIconStyle === 'colored'
                        ? '#ffffff'
                        : accentConfig.text,
                  }}
                />
              </div>

              {/* App Label with Auto-Contrast Shadow & Color */}
              {settings.desktopShowIconLabels !== false && (
                <span
                  className={`mt-1 text-[11px] font-medium text-center leading-tight truncate w-full transition-colors ${
                    effectiveGlassContrast === 'dark'
                      ? 'text-zinc-900 group-hover:text-black drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] font-semibold'
                      : 'text-white/95 group-hover:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]'
                  }`}
                >
                  {app.name}
                </span>
              )}

              {/* Quick Settings Action Trigger Dot on Hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedQuickApp({
                    app,
                    position: { x: savedPos.x, y: savedPos.y },
                  });
                }}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 border border-white/20 text-zinc-300 opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity z-20"
                title="Schnell-Einstellungen"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </motion.div>
          );
        })}
      </main>

      {/* Interactive App Quick Settings Context Menu */}
      <AnimatePresence>
        {selectedQuickApp && (
          <AppQuickSettings
            app={selectedQuickApp.app}
            position={selectedQuickApp.position}
            onClose={() => setSelectedQuickApp(null)}
          />
        )}
      </AnimatePresence>

      {/* Floating macOS-Style Dock with unlock spring entrance */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <Dock />
      </motion.div>

      {/* Aero Snap Realtime Window Ghost Preview Overlay */}
      <AnimatePresence>
        {windowSnapPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: windowSnapPreview.x + 6,
              top: windowSnapPreview.y + 6,
              width: windowSnapPreview.width - 12,
              height: windowSnapPreview.height - 12,
            }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            className="fixed pointer-events-none z-25 rounded-2xl border-2 border-white/40 bg-white/[0.08] backdrop-blur-md shadow-2xl overflow-hidden"
            style={{
              borderColor: accentConfig.border,
              backgroundColor: accentConfig.bgLight,
              boxShadow: `0 0 40px ${accentConfig.glow}`,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider backdrop-blur-xl border border-white/20 shadow-lg text-white"
                style={{ backgroundColor: `${accentConfig.primary}66` }}
              >
                {windowSnapPreview.snapType === 'maximize'
                  ? 'Vollbild'
                  : windowSnapPreview.snapType === 'left'
                  ? 'Linke Bildschirmhälfte'
                  : windowSnapPreview.snapType === 'right'
                  ? 'Rechte Bildschirmhälfte'
                  : windowSnapPreview.snapType === 'top-left'
                  ? 'Oben Links'
                  : windowSnapPreview.snapType === 'top-right'
                  ? 'Oben Rechts'
                  : windowSnapPreview.snapType === 'bottom-left'
                  ? 'Unten Links'
                  : windowSnapPreview.snapType === 'bottom-right'
                  ? 'Unten Rechts'
                  : 'Fenster anheften'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Window Manager Layer */}
      <div id="windows-layer" className="absolute inset-0 pointer-events-none z-30">
        {windows.map((win) => (
          <div key={win.id} className="pointer-events-auto">
            <Window win={win} />
          </div>
        ))}
      </div>

      {/* Global Spotlight Search Overlay (Cmd+Space) */}
      <Spotlight />

      {/* Control Center Panel */}
      <ControlCenter />

      {/* Lock Screen with Cinematic Unlock Exit Animation */}
      <AnimatePresence mode="wait">
        {!isSetupCompleted ? (
          <SetupAssistant key="setup-assistant-screen" />
        ) : isLocked ? (
          <LockScreen key="lockscreen-overlay" />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export function App() {
  return (
    <OSProvider>
      <DesktopContent />
    </OSProvider>
  );
}

export default App;
