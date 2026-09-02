import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { WindowState, SnapTarget } from '../../types';
import { SettingsApp } from '../apps/SettingsApp';
import { FilesApp } from '../apps/FilesApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { BrowserApp } from '../apps/BrowserApp';
import { TerminalApp } from '../apps/TerminalApp';
import { NotesApp } from '../apps/NotesApp';
import { GalleryApp } from '../apps/GalleryApp';
import { MusicApp } from '../apps/MusicApp';
import { MonitorApp } from '../apps/MonitorApp';
import { AppStoreApp } from '../apps/AppStoreApp';
import { Retro2048App } from '../apps/Retro2048App';
import { SnakeApp } from '../apps/SnakeApp';
import { MinesweeperApp } from '../apps/MinesweeperApp';
import { FlappyCubeApp } from '../apps/FlappyCubeApp';
import { SpaceInvadersApp } from '../apps/SpaceInvadersApp';
import { CyberMemoryApp } from '../apps/CyberMemoryApp';
import { PomodoroApp } from '../apps/PomodoroApp';
import { WeatherApp } from '../apps/WeatherApp';
import { PixelPaintApp } from '../apps/PixelPaintApp';
import { CryptoRadarApp } from '../apps/CryptoRadarApp';
import { AudioSynthApp } from '../apps/AudioSynthApp';
import { CustomAIApp } from '../apps/CustomAIApp';
import { YouTubeApp } from '../apps/YouTubeApp';
import { ChessApp } from '../apps/ChessApp';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  Folder,
  Settings,
  Calculator,
  Globe,
  Terminal,
  FileText,
  Image as ImageIcon,
  Music,
  Activity,
  ShoppingBag,
  Columns,
  Gamepad2,
  Timer,
  CloudSun,
  Paintbrush,
  TrendingUp,
  Music2,
  Sparkles,
  Bomb,
  Rocket,
  Brain,
  Crosshair,
  Zap,
  Grid3X3,
  Youtube,
  Crown,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SudokuApp } from '../apps/SudokuApp';

const APP_ICONS: Record<string, React.FC<{ className?: string }>> = {
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
  Bomb: ({ className }) => <Bomb className={className} />,
  Rocket: ({ className }) => <Rocket className={className} />,
  Brain: ({ className }) => <Brain className={className} />,
  Crosshair: ({ className }) => <Crosshair className={className} />,
  Zap: ({ className }) => <Zap className={className} />,
  Grid3X3: ({ className }) => <Grid3X3 className={className} />,
  Youtube: ({ className }) => <Youtube className={className} />,
  Crown: ({ className }) => <Crown className={className} />,
};

export const Window: React.FC<{ window?: WindowState; win?: WindowState }> = (props) => {
  const win = props.win || props.window;

  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    updateWindowBounds,
    snapWindow,
    unsnapWindow,
    setSnapPreview,
    isDraggingAnyWindow,
    setIsDraggingAnyWindow,
    accentConfig,
    settings,
    effectiveTheme,
    effectiveGlassContrast,
  } = useOS();

  // Custom 120fps Dragging State & Ref
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Active snap target while dragging near edges
  const activeSnapRef = useRef<SnapTarget | null>(null);

  // Custom 120fps Resizing State & Ref (Corners strictly disabled, edges only)
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startPosX: number;
    startPosY: number;
    dir: string;
  } | null>(null);

  // Dock Target coordinates for smooth Minimize & Restore Genie-to-Dock effect
  const [dockTarget, setDockTarget] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!win) return;
    const updateTarget = () => {
      const el = document.getElementById(`dock-app-${win.appId}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setDockTarget({
          x: rect.left + rect.width / 2 - win.width / 2,
          y: rect.top + rect.height / 2 - win.height / 2,
        });
      } else {
        const fallbackX = typeof window !== 'undefined' ? (window.innerWidth - win.width) / 2 : 100;
        const fallbackY = typeof window !== 'undefined' ? window.innerHeight - 40 - win.height / 2 : 600;
        setDockTarget({ x: fallbackX, y: fallbackY });
      }
    };

    updateTarget();
    if (win.isMinimized) {
      updateTarget();
    }
  }, [win?.isMinimized, win?.appId, win?.width, win?.height, settings.dockPosition]);

  if (!win || !win.isOpen) {
    return null;
  }

  const isActive = activeWindowId === win.id;
  const isMaximized = win.isMaximized;

  // Robust Native Title Bar Drag Handler with Snap Detection & Unsnap on drag
  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    focusWindow(win.id);
    setIsDragging(true);
    setIsDraggingAnyWindow(true);
    activeSnapRef.current = null;

    let initX = win.x;
    let initY = win.y;

    // If currently maximized or snapped, seamlessly unsnap and center cursor on title bar
    if (win.isMaximized || win.snapState) {
      const restoredW = win.prevBounds ? win.prevBounds.width : 860;
      const restoredH = win.prevBounds ? win.prevBounds.height : 560;
      // Position window so that cursor is proportionately positioned on titlebar
      initX = Math.max(0, Math.min(window.innerWidth - restoredW, e.clientX - restoredW * 0.5));
      initY = Math.max(32, e.clientY - 18);
      unsnapWindow(win.id, initX, initY);
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: initX,
      initialY: initY,
    };

    let rafId: number | null = null;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!dragRef.current) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!dragRef.current) return;
        const deltaX = moveEvent.clientX - dragRef.current.startX;
        const deltaY = moveEvent.clientY - dragRef.current.startY;

        const currentWinW = win.width || 800;
        // Allow dragging far beyond screen bounds while keeping a safe tab reachable
        const minX = -(currentWinW - 60);
        const maxX = window.innerWidth - 60;
        const minY = 32;
        const maxY = window.innerHeight - 40;

        const newX = Math.max(minX, Math.min(maxX, dragRef.current.initialX + deltaX));
        const newY = Math.max(minY, Math.min(maxY, dragRef.current.initialY + deltaY));

        updateWindowBounds(win.id, { x: newX, y: newY });

        // Aero Snap Edge Detection
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const topOffset = 32;
        const usableH = screenH - topOffset;
        const halfW = Math.floor(screenW / 2);
        const halfH = Math.floor(usableH / 2);

        const curX = moveEvent.clientX;
        const curY = moveEvent.clientY;

        // If snap layouts are enabled, check proximity to edges
        if (settings.windowSnapLayouts !== false) {
          // Top edge: Maximize
          if (curY <= 14) {
            activeSnapRef.current = 'maximize';
            setSnapPreview({
              x: 0,
              y: topOffset,
              width: screenW,
              height: usableH,
              snapType: 'maximize',
            });
          }
          // Left edge
          else if (curX <= 22) {
            if (curY <= 110) {
              activeSnapRef.current = 'top-left';
              setSnapPreview({
                x: 0,
                y: topOffset,
                width: halfW,
                height: halfH,
                snapType: 'top-left',
              });
            } else if (curY >= screenH - 110) {
              activeSnapRef.current = 'bottom-left';
              setSnapPreview({
                x: 0,
                y: topOffset + halfH,
                width: halfW,
                height: usableH - halfH,
                snapType: 'bottom-left',
              });
            } else {
              activeSnapRef.current = 'left';
              setSnapPreview({
                x: 0,
                y: topOffset,
                width: halfW,
                height: usableH,
                snapType: 'left',
              });
            }
          }
          // Right edge
          else if (curX >= screenW - 22) {
            if (curY <= 110) {
              activeSnapRef.current = 'top-right';
              setSnapPreview({
                x: halfW,
                y: topOffset,
                width: screenW - halfW,
                height: halfH,
                snapType: 'top-right',
              });
            } else if (curY >= screenH - 110) {
              activeSnapRef.current = 'bottom-right';
              setSnapPreview({
                x: halfW,
                y: topOffset + halfH,
                width: screenW - halfW,
                height: usableH - halfH,
                snapType: 'bottom-right',
              });
            } else {
              activeSnapRef.current = 'right';
              setSnapPreview({
                x: halfW,
                y: topOffset,
                width: screenW - halfW,
                height: usableH,
                snapType: 'right',
              });
            }
          }
          // Not in snap zone
          else {
            activeSnapRef.current = null;
            setSnapPreview(null);
          }
        }
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      setIsDraggingAnyWindow(false);
      if (rafId) cancelAnimationFrame(rafId);
      dragRef.current = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);

      // If a snap target was active on release, execute snap
      if (activeSnapRef.current) {
        snapWindow(win.id, activeSnapRef.current);
        activeSnapRef.current = null;
        setSnapPreview(null);
      }
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
  };

  // Robust Native Edge Resize Handler
  const startResize = (e: React.PointerEvent, dir: string) => {
    if (isMaximized) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setIsDraggingAnyWindow(true);
    focusWindow(win.id);

    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: win.width,
      startH: win.height,
      startPosX: win.x,
      startPosY: win.y,
      dir,
    };

    let rafId: number | null = null;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!resizeRef.current) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!resizeRef.current) return;
        const { startX, startY, startW, startH, startPosX, startPosY, dir: direction } = resizeRef.current;
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newWidth = startW;
        let newHeight = startH;
        let newX = startPosX;
        let newY = startPosY;

        const MIN_W = 340;
        const MIN_H = 240;

        // East (Right)
        if (direction.includes('e')) {
          newWidth = Math.max(MIN_W, Math.min(window.innerWidth - startPosX - 8, startW + deltaX));
        }
        // West (Left)
        if (direction.includes('w')) {
          const rawW = startW - deltaX;
          if (rawW >= MIN_W) {
            newWidth = Math.min(startPosX + startW - 8, rawW);
            newX = Math.max(0, startPosX + deltaX);
          } else {
            newWidth = MIN_W;
            newX = startPosX + (startW - MIN_W);
          }
        }
        // South (Bottom)
        if (direction.includes('s')) {
          newHeight = Math.max(MIN_H, Math.min(window.innerHeight - startPosY - 40, startH + deltaY));
        }
        // North (Top)
        if (direction.includes('n')) {
          const rawH = startH - deltaY;
          if (rawH >= MIN_H) {
            newHeight = Math.min(startPosY + startH - 32, rawH);
            newY = Math.max(32, startPosY + deltaY);
          } else {
            newHeight = MIN_H;
            newY = startPosY + (startH - MIN_H);
          }
        }

        updateWindowBounds(win.id, { width: newWidth, height: newHeight, x: newX, y: newY });
      });
    };

    const handlePointerUp = () => {
      setIsResizing(false);
      setIsDraggingAnyWindow(false);
      if (rafId) cancelAnimationFrame(rafId);
      resizeRef.current = null;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove, { passive: false });
    document.addEventListener('pointerup', handlePointerUp);
  };

  const renderAppContent = () => {
    if (win.customData?.code) {
      return <CustomAIApp appName={win.title} initialCode={win.customData.code} />;
    }

    switch (win.appId) {
      case 'settings':
        return <SettingsApp initialTab={win.customData?.activeTab} />;
      case 'files':
        return <FilesApp />;
      case 'notes':
        return <NotesApp />;
      case 'gallery':
        return <GalleryApp />;
      case 'youtube':
        return <YouTubeApp />;
      case 'music':
        return <MusicApp />;
      case 'monitor':
        return <MonitorApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'browser':
        return <BrowserApp />;
      case 'terminal':
        return <TerminalApp />;
      case 'appstore':
        return <AppStoreApp />;
      case 'retro-2048':
        return <Retro2048App />;
      case 'snake':
        return <SnakeApp />;
      case 'minesweeper':
        return <MinesweeperApp />;
      case 'flappy-cube':
        return <FlappyCubeApp />;
      case 'space-invaders':
        return <SpaceInvadersApp />;
      case 'cyber-memory':
        return <CyberMemoryApp />;
      case 'sudoku':
        return <SudokuApp />;
      case 'pomodoro':
        return <PomodoroApp />;
      case 'weather':
        return <WeatherApp />;
      case 'pixel-paint':
        return <PixelPaintApp />;
      case 'crypto-radar':
        return <CryptoRadarApp />;
      case 'audio-synth':
        return <AudioSynthApp />;
      case 'chess':
        return <ChessApp />;
      case 'custom-ai-app':
        return <CustomAIApp appName={win.title} initialCode={win.customData?.code} />;
      default:
        return <div className="p-8 text-zinc-400">Anwendung wird geladen...</div>;
    }
  };

  const IconComponent = APP_ICONS[win.iconName] || Settings;

  return (
    <motion.div
      id={`window-${win.id}`}
      initial={{ opacity: 0, scale: 0.92, y: win.y + 20 }}
      animate={{
        opacity: win.isMinimized ? 0 : 1,
        scale: win.isMinimized ? 0.05 : 1,
        scaleY: win.isMinimized ? 0.02 : 1,
        x: win.isMinimized
          ? (dockTarget ? dockTarget.x : win.x)
          : (isMaximized ? 0 : win.x),
        y: win.isMinimized
          ? (dockTarget ? dockTarget.y : (typeof window !== 'undefined' ? window.innerHeight - 30 : 600))
          : (isMaximized ? 32 : win.y),
        width: isMaximized ? '100vw' : win.width,
        height: isMaximized ? 'calc(100vh - 32px)' : win.height,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={
        isDragging || isResizing || settings.animationsEnabled === false
          ? { duration: 0 } // Zero-latency updates during movement or resize
          : {
              type: 'spring',
              stiffness: 420,
              damping: 32,
              mass: 0.55,
            }
      }
      onMouseDown={() => focusWindow(win.id)}
      className={`overflow-hidden flex flex-col ${
        win.isMinimized ? 'pointer-events-none' : 'pointer-events-auto'
      } ${
        isMaximized
          ? 'rounded-none border-0 shadow-none'
          : isActive
          ? 'ring-1 shadow-2xl'
          : 'opacity-95 shadow-2xl'
      }`}
      style={{
        zIndex: win.zIndex,
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: win.isMinimized ? 'none' : 'auto',
        transformOrigin: '50% 100%',
        userSelect: isDragging || isResizing ? 'none' : 'auto',
        borderRadius: isMaximized ? 0 : `${settings.windowRadius ?? 16}px`,
        backgroundColor: isMaximized
          ? effectiveTheme === 'light'
            ? '#ffffff'
            : effectiveTheme === 'glassy'
            ? effectiveGlassContrast === 'dark'
              ? 'rgba(255, 255, 255, 0.88)'
              : 'rgba(15, 15, 24, 0.88)'
            : '#000000'
          : effectiveTheme === 'light'
          ? 'rgba(255, 255, 255, 0.96)'
          : effectiveTheme === 'glassy'
          ? effectiveGlassContrast === 'dark'
            ? `rgba(255, 255, 255, ${(settings.glassOpacity ?? 65) / 100})`
            : `rgba(15, 15, 24, ${(settings.glassOpacity ?? 65) / 100})`
          : '#09090d',
        backdropFilter:
          isMaximized || settings.glassBlurEnabled === false
            ? 'none'
            : `blur(${settings.glassBlur ?? 24}px)`,
        color:
          effectiveTheme === 'light' || (effectiveTheme === 'glassy' && effectiveGlassContrast === 'dark')
            ? '#0f172a'
            : '#f8fafc',
        boxShadow: isMaximized
          ? 'none'
          : settings.windowShadowIntensity === 'none'
          ? 'none'
          : settings.windowShadowIntensity === 'subtle'
          ? '0 6px 16px rgba(0, 0, 0, 0.2)'
          : settings.windowShadowIntensity === 'medium'
          ? '0 15px 35px -10px rgba(0, 0, 0, 0.45)'
          : settings.windowShadowIntensity === 'deep'
          ? '0 30px 60px -15px rgba(0, 0, 0, 0.65), 0 0 2px rgba(255, 255, 255, 0.15)'
          : isActive && (settings.windowGlow ?? true)
          ? `0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 25px ${accentConfig.glow}`
          : '0 20px 40px -15px rgba(0, 0, 0, 0.45)',
        border: isMaximized
          ? 'none'
          : effectiveTheme === 'light'
          ? `1px solid ${isActive ? accentConfig.primary : '#cbd5e1'}`
          : effectiveTheme === 'glassy'
          ? effectiveGlassContrast === 'dark'
            ? `1px solid ${isActive ? accentConfig.primary : 'rgba(0, 0, 0, 0.15)'}`
            : `1px solid ${isActive ? accentConfig.primary : 'rgba(255, 255, 255, 0.22)'}`
          : `1px solid ${isActive ? accentConfig.border : 'rgba(255, 255, 255, 0.08)'}`,
      }}
    >
      {/* Window Title Bar */}
      <div
        onPointerDown={startDrag}
        onDoubleClick={() => maximizeWindow(win.id)}
        className={`h-10 px-3.5 border-b flex items-center justify-between select-none cursor-move shrink-0 ${
          isMaximized
            ? effectiveTheme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-900'
              : effectiveTheme === 'glassy'
              ? effectiveGlassContrast === 'dark'
                ? 'bg-white/70 border-black/10 text-zinc-900'
                : 'bg-white/[0.12] border-white/15 text-white'
              : 'bg-[#0e0e14] border-zinc-800 text-white'
            : effectiveTheme === 'light'
            ? 'bg-slate-100/90 border-slate-200 text-slate-900'
            : effectiveTheme === 'glassy'
            ? effectiveGlassContrast === 'dark'
              ? 'bg-white/40 border-black/10 text-zinc-900'
              : 'bg-white/[0.12] border-white/15 text-white'
            : 'bg-[#14141d]/95 border-white/[0.08] text-zinc-200'
        }`}
        style={{
          backdropFilter: isMaximized || settings.glassBlurEnabled === false ? 'none' : `blur(${settings.glassBlur ?? 24}px)`,
        }}
      >
        {/* If buttons on left */}
        {settings.windowButtonsPosition === 'left' ? (
          <>
            {/* Window Control Dots: Close, Minimize, Maximize */}
            <div className="flex items-center gap-2 group/dots">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#ef4444] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-red-500/40"
                title="Schließen"
              >
                <X className="w-2 h-2 text-[#450a0a] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#a855f7] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-purple-500/40"
                title="Minimieren"
              >
                <Minus className="w-2 h-2 text-[#3b0764] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  maximizeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#3b82f6] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-blue-500/40"
                title={isMaximized ? 'Wiederherstellen' : 'Vollbild'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-2 h-2 text-[#172554] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
                ) : (
                  <Maximize2 className="w-2 h-2 text-[#172554] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
                )}
              </button>
            </div>

            {/* Title & Icon */}
            <div className="flex items-center gap-2 text-xs font-medium truncate px-2">
              <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: accentConfig.text }} />
              <span className="truncate">{win.title}</span>
            </div>

            {/* Snap Controls */}
            <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindow(win.id, 'left');
                }}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                title="Links anheften (50%)"
              >
                <Columns className="w-3 h-3 rotate-180" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  snapWindow(win.id, 'right');
                }}
                className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                title="Rechts anheften (50%)"
              >
                <Columns className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          /* Default: 3 Control Dots on the RIGHT side */
          <>
            {/* Left side: Icon, Title & Quick Tiling */}
            <div className="flex items-center gap-3 truncate">
              <div className="flex items-center gap-2 text-xs font-medium truncate">
                <IconComponent className="w-3.5 h-3.5 shrink-0" style={{ color: accentConfig.text }} />
                <span className={`truncate font-medium ${effectiveTheme === 'light' ? 'text-slate-800 font-semibold' : 'text-zinc-200'}`}>
                  {win.title}
                </span>
              </div>

              {/* Snap Controls */}
              <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindow(win.id, 'left');
                  }}
                  className={`p-1 rounded transition-colors ${
                    effectiveTheme === 'light'
                      ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                      : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title="Links anheften (50%)"
                >
                  <Columns className="w-3 h-3 rotate-180" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    snapWindow(win.id, 'right');
                  }}
                  className={`p-1 rounded transition-colors ${
                    effectiveTheme === 'light'
                      ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                      : 'hover:bg-white/10 text-zinc-400 hover:text-white'
                  }`}
                  title="Rechts anheften (50%)"
                >
                  <Columns className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Right side: 3 colored dots in standard order: Minimize (Violet), Maximize (Blue), Close (Red) */}
            <div className="flex items-center gap-2 group/dots pl-2 shrink-0">
              {/* Minimize - Violet */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  minimizeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#a855f7] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-purple-500/40"
                title="Minimieren"
              >
                <Minus className="w-2 h-2 text-[#3b0764] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
              </button>

              {/* Maximize - Blue */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  maximizeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#3b82f6] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-blue-500/40"
                title={isMaximized ? 'Wiederherstellen' : 'Vollbild'}
              >
                {isMaximized ? (
                  <Minimize2 className="w-2 h-2 text-[#172554] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
                ) : (
                  <Maximize2 className="w-2 h-2 text-[#172554] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
                )}
              </button>

              {/* Close - Red */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(win.id);
                }}
                className="w-3 h-3 rounded-full bg-[#ef4444] hover:brightness-110 flex items-center justify-center transition-all shadow-sm shadow-red-500/40"
                title="Schließen"
              >
                <X className="w-2 h-2 text-[#450a0a] opacity-0 group-hover/dots:opacity-100 transition-opacity stroke-[3]" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Window Body Container */}
      <div
        className={`flex-1 overflow-hidden relative ${
          effectiveTheme === 'light'
            ? 'bg-[#f8fafc] text-slate-900'
            : effectiveTheme === 'glassy'
            ? 'bg-transparent text-white'
            : 'bg-[#09090d] text-zinc-100'
        }`}
      >
        {renderAppContent()}

        {/* Pointer Shield during drag/resize so iframes or heavy apps don't intercept events or lag */}
        {(isDragging || isResizing || isDraggingAnyWindow) && (
          <div className="absolute inset-0 z-40 bg-transparent" />
        )}
      </div>

      {/* Resizing Handles across all 4 edges and all 4 corners */}
      {!isMaximized && (
        <>
          {/* East (Right) Edge */}
          <div
            className="absolute top-3 bottom-3 right-0 w-2 cursor-ew-resize hover:bg-purple-500/20 z-30"
            onPointerDown={(e) => startResize(e, 'e')}
          />
          {/* South (Bottom) Edge */}
          <div
            className="absolute left-3 bottom-0 right-3 h-2 cursor-ns-resize hover:bg-purple-500/20 z-30"
            onPointerDown={(e) => startResize(e, 's')}
          />
          {/* West (Left) Edge */}
          <div
            className="absolute top-3 bottom-3 left-0 w-2 cursor-ew-resize hover:bg-purple-500/20 z-30"
            onPointerDown={(e) => startResize(e, 'w')}
          />
          {/* North (Top) Edge */}
          <div
            className="absolute left-3 top-0 right-3 h-2 cursor-ns-resize hover:bg-purple-500/20 z-30"
            onPointerDown={(e) => startResize(e, 'n')}
          />

          {/* South-East (Bottom-Right) Corner */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-purple-500/40 z-40"
            onPointerDown={(e) => startResize(e, 'se')}
          />
          {/* South-West (Bottom-Left) Corner */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-purple-500/40 z-40"
            onPointerDown={(e) => startResize(e, 'sw')}
          />
          {/* North-East (Top-Right) Corner */}
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-purple-500/40 z-40"
            onPointerDown={(e) => startResize(e, 'ne')}
          />
          {/* North-West (Top-Left) Corner */}
          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-purple-500/40 z-40"
            onPointerDown={(e) => startResize(e, 'nw')}
          />
        </>
      )}
    </motion.div>
  );
};
