import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { APPS_REGISTRY } from '../../config/themeConfig';
import { AppId } from '../../types';
import {
  Settings,
  Folder,
  Calculator,
  Globe,
  Terminal,
  Search,
  Cloud,
  FileText,
  Image as ImageIcon,
  Music,
  Activity,
  ShoppingBag,
  Gamepad2,
  Timer,
  CloudSun,
  Paintbrush,
  TrendingUp,
  Music2,
  Sparkles,
  Zap,
  Code,
  Grid3X3,
  Youtube,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ICON_COMPONENTS: Record<string, React.FC<{ className?: string }>> = {
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
  Grid3X3: ({ className }) => <Grid3X3 className={className} />,
  Youtube: ({ className }) => <Youtube className={className} />,
  Crown: ({ className }) => <Crown className={className} />,
};

export const Dock: React.FC = () => {
  const {
    openApp,
    closeWindow,
    minimizeWindow,
    focusWindow,
    windows,
    activeWindowId,
    settings,
    accentConfig,
    openSpotlight,
    triggerSync,
    cloudSync,
    recentApps,
    customApps,
  } = useOS();

  const [hoveredAppId, setHoveredAppId] = useState<string | null>(null);
  const [isEdgeHovered, setIsEdgeHovered] = useState(false);

  // Check if any window is currently maximized
  const hasMaximizedWindow = windows.some((w) => w.isOpen && !w.isMinimized && w.isMaximized);

  // Dock is visible if no auto-hide constraint or edge hovered
  const shouldAutoHide = settings.dockAutoHide || hasMaximizedWindow;
  const isDockVisible = !shouldAutoHide || isEdgeHovered;

  const getIconForApp = (iconName: string) => {
    const Component = ICON_COMPONENTS[iconName] || Settings;
    return <Component className="w-5 h-5 text-white" />;
  };

  const getWindowForApp = (appId: AppId) => {
    return windows.find((w) => w.appId === appId && w.isOpen);
  };

  const isAppRunning = (appId: AppId) => {
    return windows.some((w) => w.appId === appId && w.isOpen);
  };

  const isAppActive = (appId: AppId) => {
    const activeWin = windows.find((w) => w.id === activeWindowId);
    return activeWin?.appId === appId && !activeWin.isMinimized;
  };

  const isAppMinimized = (appId: AppId) => {
    const win = windows.find((w) => w.appId === appId && w.isOpen);
    return !!win?.isMinimized;
  };

  const iconSizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
  }[settings.dockSize];

  // User requested: "mach dass wenn mehr als 5 apps geöffnet sind sollen alle geöffnete apps im dock zu sehen sein"
  // Combine top 5 recent apps with ALL currently open running windows
  const runningAppIds = windows.filter((w) => w.isOpen).map((w) => w.appId);
  const baseAppIds = recentApps.slice(0, 5);
  const combinedAppIds = Array.from(new Set([...baseAppIds, ...runningAppIds]));

  const visibleDockApps = combinedAppIds
    .map((id) => {
      const found = APPS_REGISTRY.find((a) => a.id === id);
      if (found) return found;
      const custom = customApps.find((ca) => ca.id === id);
      if (custom) {
        return {
          id: custom.id,
          name: custom.name,
          category: 'KI Apps' as any,
          iconName: 'Sparkles',
          description: 'Benutzerdefinierte KI App',
          defaultWidth: 700,
          defaultHeight: 560,
          minWidth: 400,
          minHeight: 300,
          isPreinstalled: false,
        };
      }
      return null;
    })
    .filter(Boolean);

  const pos = settings.dockPosition || 'bottom';
  const align = settings.dockAlignment || 'center';
  const isVertical = pos === 'left' || pos === 'right';

  const dockPositionClasses = {
    bottom: `fixed bottom-2.5 inset-x-0 flex z-40 pointer-events-none ${
      align === 'left' ? 'justify-start pl-8' : align === 'right' ? 'justify-end pr-8' : 'justify-center'
    }`,
    top: `fixed top-10 inset-x-0 flex z-40 pointer-events-none ${
      align === 'left' ? 'justify-start pl-8' : align === 'right' ? 'justify-end pr-8' : 'justify-center'
    }`,
    left: `fixed left-2.5 inset-y-0 flex z-40 pointer-events-none ${
      align === 'left' ? 'items-start pt-14' : align === 'right' ? 'items-end pb-14' : 'items-center'
    }`,
    right: `fixed right-2.5 inset-y-0 flex z-40 pointer-events-none ${
      align === 'left' ? 'items-start pt-14' : align === 'right' ? 'items-end pb-14' : 'items-center'
    }`,
  }[pos];

  const getTooltipPosition = () => {
    if (pos === 'left') return 'left-14 top-1/2 -translate-y-1/2';
    if (pos === 'right') return 'right-14 top-1/2 -translate-y-1/2';
    if (pos === 'top') return 'top-12 left-1/2 -translate-x-1/2';
    return '-top-8 left-1/2 -translate-x-1/2';
  };

  return (
    <>
      {/* Invisible hover detection trigger for auto-hide */}
      {shouldAutoHide && (
        <div
          className={`fixed z-50 pointer-events-auto ${
            pos === 'left'
              ? 'left-0 inset-y-0 w-5'
              : pos === 'right'
              ? 'right-0 inset-y-0 w-5'
              : pos === 'top'
              ? 'top-8 inset-x-0 h-5'
              : 'bottom-0 inset-x-0 h-5'
          }`}
          onMouseEnter={() => setIsEdgeHovered(true)}
        />
      )}

      <motion.nav
        id="os-dock"
        aria-label="Anwendungsleiste"
        initial={{ y: 0, opacity: 1 }}
        animate={{
          y: !isDockVisible ? (pos === 'bottom' ? 80 : pos === 'top' ? -80 : 0) : 0,
          x: !isDockVisible ? (pos === 'left' ? -80 : pos === 'right' ? 80 : 0) : 0,
          opacity: isDockVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        onMouseEnter={() => setIsEdgeHovered(true)}
        onMouseLeave={() => setIsEdgeHovered(false)}
        className={dockPositionClasses}
      >
        <div
          className={`pointer-events-auto flex ${isVertical ? 'flex-col py-3 px-1.5' : 'items-center py-1.5 px-3'} glass-panel-dock rounded-2xl border border-white/[0.12] shadow-2xl gap-2 bg-[#12121a]/85 backdrop-blur-2xl`}
          style={{
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 1px rgba(255, 255, 255, 0.2), 0 0 25px ${accentConfig.glow}`,
          }}
        >
          {/* Top 5 Most Recent Apps + All Currently Open Apps */}
          {visibleDockApps.map((app) => {
            if (!app) return null;
            const running = isAppRunning(app.id);
            const active = isAppActive(app.id);
            const isMinimized = isAppMinimized(app.id);
            const isHovered = hoveredAppId === app.id;

            return (
              <div key={app.id} className="relative flex flex-col items-center">
                {/* Tooltip Label */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`absolute ${getTooltipPosition()} px-2.5 py-0.5 rounded-lg bg-[#14141d]/95 backdrop-blur-md border border-[#3f3f46]/60 text-white text-[11px] font-medium whitespace-nowrap shadow-xl pointer-events-none z-50`}
                    >
                      {app.name}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Smooth Unified Hover for all apps - Minimizes if active, Restores if minimized, Opens if closed */}
                <motion.button
                  id={`dock-app-${app.id}`}
                  onClick={() => {
                    const runningWin = getWindowForApp(app.id);
                    if (runningWin) {
                      if (runningWin.isMinimized) {
                        focusWindow(runningWin.id);
                      } else if (active) {
                        minimizeWindow(runningWin.id);
                      } else {
                        focusWindow(runningWin.id);
                      }
                    } else {
                      openApp(app.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredAppId(app.id)}
                  onMouseLeave={() => setHoveredAppId(null)}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  className={`relative rounded-xl flex items-center justify-center transition-colors ${iconSizeClasses} ${
                    active
                      ? 'bg-[#222232] border shadow-md'
                      : isMinimized
                      ? 'bg-[#151522]/80 border border-purple-500/30'
                      : 'bg-[#181822]/90 hover:bg-[#222230] border border-white/10'
                  }`}
                  style={{
                    borderColor: active ? accentConfig.primary : isMinimized ? `${accentConfig.primary}60` : undefined,
                    boxShadow: active ? `0 0 14px ${accentConfig.primary}60` : undefined,
                  }}
                  title={
                    running
                      ? isMinimized
                        ? `${app.name} (Minimiert - Klicken zum Wiederherstellen)`
                        : active
                        ? `${app.name} (Aktiv - Klicken zum Minimieren)`
                        : `${app.name} (Im Hintergrund - Klicken zum Aktivieren)`
                      : app.name
                  }
                >
                  {getIconForApp(app.iconName)}
                </motion.button>

                {/* Running & Minimized Indicator */}
                <div className="h-1.5 flex items-center justify-center mt-0.5">
                  {running && (
                    <motion.span
                      layoutId={`running-dot-${app.id}`}
                      className={`transition-all ${
                        isMinimized
                          ? 'w-2.5 h-1 rounded-full opacity-60'
                          : 'w-1.5 h-1.5 rounded-full'
                      }`}
                      style={{
                        backgroundColor: active
                          ? accentConfig.primary
                          : isMinimized
                          ? 'rgba(168, 85, 247, 0.8)'
                          : 'rgba(255,255,255,0.7)',
                        boxShadow: active ? `0 0 6px ${accentConfig.primary}` : 'none',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* Separator */}
          <div className={isVertical ? 'h-[1px] w-7 bg-white/15 my-1' : 'w-[1px] h-7 bg-white/15 mx-1'} />

          {/* Spotlight Quick Action */}
          <div className="relative flex flex-col items-center">
            <AnimatePresence>
              {hoveredAppId === 'spotlight' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute ${getTooltipPosition()} px-2.5 py-0.5 rounded-lg bg-[#14141d]/95 backdrop-blur-md border border-[#3f3f46]/60 text-white text-[11px] font-medium whitespace-nowrap shadow-xl pointer-events-none z-50`}
                >
                  Spotlight Suche (⌘ Space)
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              id="dock-btn-spotlight"
              onClick={openSpotlight}
              onMouseEnter={() => setHoveredAppId('spotlight')}
              onMouseLeave={() => setHoveredAppId(null)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className={`rounded-xl flex items-center justify-center bg-[#181822]/90 hover:bg-[#222230] border border-white/10 ${iconSizeClasses}`}
            >
              <Search className="w-4 h-4 text-purple-300" style={{ color: accentConfig.text }} />
            </motion.button>
            <div className="h-1 mt-0.5" />
          </div>
        </div>
      </motion.nav>
    </>
  );
};
