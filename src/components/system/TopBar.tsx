import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { UserAvatar } from '../common/UserAvatar';
import {
  Shield,
  Search,
  Sliders,
  Volume2,
  Lock,
  LogOut,
  Sparkles,
  Calendar as CalendarIcon,
  Plus,
  FolderPlus,
  X,
  Minus,
  Maximize2,
  Columns,
  RotateCcw,
  Copy,
  Scissors,
  Check,
  HelpCircle,
  ShoppingBag,
  Info,
  Maximize,
  Grid,
  Play,
  Pause,
  Music,
  Youtube,
  Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TopBar: React.FC = () => {
  const {
    currentUser,
    activeWindowId,
    windows,
    openApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    snapWindow,
    openSpotlight,
    toggleControlCenter,
    isControlCenterOpen,
    lockScreen,
    logout,
    accentConfig,
    addNotification,
    sounds,
    nowPlaying,
    toggleGlobalMedia,
    settings,
    effectiveTheme,
    effectiveGlassContrast,
    isLight,
    isGlassy,
  } = useOS();

  const isDarkContrast = isLight || effectiveGlassContrast === 'dark';

  const [time, setTime] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const activeWin = windows.find((w) => w.id === activeWindowId);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const is24h = settings.clockFormat24h !== false;
      const showSec = settings.clockShowSeconds ?? false;
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: showSec ? '2-digit' : undefined,
          hour12: !is24h,
        })
      );
      setDateStr(
        now.toLocaleDateString('de-DE', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [settings.clockFormat24h, settings.clockShowSeconds]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.topbar-menu-container')) {
        setOpenMenu(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleMenu = (menuName: string) => {
    setOpenMenu((prev) => (prev === menuName ? null : menuName));
  };

  const handleCloseActiveWindow = () => {
    if (activeWin) {
      closeWindow(activeWin.id);
      setOpenMenu(null);
    }
  };

  const handleMinimizeActiveWindow = () => {
    if (activeWin) {
      minimizeWindow(activeWin.id);
      setOpenMenu(null);
    }
  };

  const handleMaximizeActiveWindow = () => {
    if (activeWin) {
      maximizeWindow(activeWin.id);
      setOpenMenu(null);
    }
  };

  const handleSnapActive = (dir: 'left' | 'right') => {
    if (activeWin) {
      snapWindow(activeWin.id, dir);
      setOpenMenu(null);
    }
  };

  const headerBgClass = isLight
    ? 'bg-white/80 border-b border-black/[0.08] text-zinc-900 shadow-sm backdrop-blur-xl'
    : isGlassy
    ? isDarkContrast
      ? 'bg-white/70 border-b border-black/15 text-zinc-950 shadow-sm backdrop-blur-2xl'
      : 'bg-black/40 border-b border-white/15 text-white backdrop-blur-2xl'
    : 'bg-[#0c0c11]/85 border-b border-white/[0.07] text-[#e4e4e7] backdrop-blur-xl';

  const textBtnClass = isDarkContrast
    ? 'text-zinc-900 hover:text-black hover:bg-black/[0.08]'
    : 'text-zinc-200 hover:text-white hover:bg-white/10';

  const menuBgClass = isDarkContrast
    ? 'bg-white/95 border-slate-300 text-zinc-900 shadow-2xl backdrop-blur-2xl'
    : isGlassy
    ? 'bg-black/75 border-white/20 text-white backdrop-blur-3xl shadow-2xl'
    : 'bg-[#14141c]/95 border-[#27272a] text-zinc-200 shadow-2xl backdrop-blur-2xl';

  const menuBtnClass = isDarkContrast
    ? 'text-zinc-800 hover:bg-slate-100 hover:text-black'
    : 'text-zinc-200 hover:bg-[#22222f] hover:text-white';

  return (
    <header
      id="os-topbar"
      className={`fixed top-0 inset-x-0 h-8 z-40 px-3 flex items-center justify-between text-xs select-none font-sans shadow-sm transition-colors duration-200 ${headerBgClass}`}
    >
      {/* Left side: System Logo & App Title & Menus */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 topbar-menu-container">
        {/* Obsidian Apple-style logo button */}
        <div className="relative">
          <button
            id="btn-obsidian-menu"
            onClick={() => toggleMenu('obsidian')}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-colors font-bold tracking-wide ${
              openMenu === 'obsidian'
                ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                : isDarkContrast ? 'hover:bg-black/5 text-zinc-900' : 'hover:bg-white/10 text-white'
            }`}
          >
            <span className="text-sm">✦</span>
            <span className="font-semibold text-xs">ObsidianOS</span>
          </button>

          {/* System Dropdown Menu */}
          <AnimatePresence>
            {openMenu === 'obsidian' && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                className={`absolute top-8 left-0 w-56 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
              >
                <div className={`px-3 py-2 border-b flex items-center gap-2.5 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`}>
                  <UserAvatar
                    avatar={currentUser?.avatar}
                    name={currentUser?.displayName}
                    size="sm"
                    ring={true}
                    ringColor={accentConfig.primary}
                  />
                  <div className="overflow-hidden">
                    <p className={`font-bold text-xs truncate ${isDarkContrast ? 'text-zinc-950' : 'text-white'}`}>{currentUser?.displayName}</p>
                    <p className={`text-[10px] ${isDarkContrast ? 'text-zinc-500' : 'text-zinc-400'}`}>ObsidianOS • @{currentUser?.username}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    openApp('settings');
                    setOpenMenu(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${menuBtnClass}`}
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  Systemeinstellungen...
                </button>

                <button
                  onClick={() => {
                    openApp('appstore');
                    setOpenMenu(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors text-left ${menuBtnClass}`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  App Store öffnen
                </button>

                <button
                  onClick={() => {
                    openSpotlight();
                    setOpenMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${menuBtnClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-3.5 h-3.5 text-purple-400" />
                    Spotlight Suche
                  </div>
                  <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ Space</span>
                </button>

                <div className={`border-t my-1 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`} />

                <button
                  onClick={() => {
                    lockScreen();
                    setOpenMenu(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${menuBtnClass}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className={`w-3.5 h-3.5 ${isDarkContrast ? 'text-zinc-500' : 'text-zinc-400'}`} />
                    Bildschirm sperren
                  </div>
                  <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ L</span>
                </button>

                <button
                  onClick={() => {
                    logout();
                    setOpenMenu(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  Abmelden ({currentUser?.displayName})
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Active App Title */}
        <span className={`font-bold text-xs px-1 ${isDarkContrast ? 'text-zinc-950' : 'text-white'}`}>
          {activeWin ? activeWin.title : 'Finder'}
        </span>

        {/* Schnellaktionen Dropdown-Menüs (Ablage, Bearbeiten, Ansicht, Fenster, Hilfe) */}
        <div className={`hidden sm:flex items-center gap-0.5 text-[11px] ${isDarkContrast ? 'text-zinc-700' : 'text-zinc-300'}`}>
          {/* ABLAGE (File) Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('file')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                openMenu === 'file'
                  ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                  : textBtnClass
              }`}
            >
              Ablage
            </button>

            <AnimatePresence>
              {openMenu === 'file' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className={`absolute top-7 left-0 w-52 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
                >
                  <button
                    onClick={() => {
                      openApp('files');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Neues Finder-Fenster</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp('browser');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Neuer Browser Tab</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp('notes');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-purple-400" />
                    <span>Neue Notiz erstellen</span>
                  </button>

                  <div className={`border-t my-1 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`} />

                  <button
                    onClick={handleCloseActiveWindow}
                    disabled={!activeWin}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <X className="w-3.5 h-3.5 text-red-400" />
                      <span>Fenster schließen</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ W</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* BEARBEITEN (Edit) Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('edit')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                openMenu === 'edit'
                  ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                  : textBtnClass
              }`}
            >
              Bearbeiten
            </button>

            <AnimatePresence>
              {openMenu === 'edit' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className={`absolute top-7 left-0 w-48 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
                >
                  <button
                    onClick={() => {
                      document.execCommand('undo');
                      sounds.playClick();
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <span>Rückgängig</span>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ Z</span>
                  </button>

                  <button
                    onClick={() => {
                      document.execCommand('redo');
                      sounds.playClick();
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <span>Wiederholen</span>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⇧ ⌘ Z</span>
                  </button>

                  <div className={`border-t my-1 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`} />

                  <button
                    onClick={() => {
                      document.execCommand('copy');
                      sounds.playSuccess();
                      addNotification('Kopiert', 'Auswahl in die Zwischenablage kopiert.', 'info', 'System');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <div className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Kopieren</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ C</span>
                  </button>

                  <button
                    onClick={() => {
                      document.execCommand('selectAll');
                      sounds.playClick();
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <span>Alles auswählen</span>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ A</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ANSICHT (View) Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('view')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                openMenu === 'view'
                  ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                  : textBtnClass
              }`}
            >
              Ansicht
            </button>

            <AnimatePresence>
              {openMenu === 'view' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className={`absolute top-7 left-0 w-52 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
                >
                  <button
                    onClick={handleMaximizeActiveWindow}
                    disabled={!activeWin}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Maximize className="w-3.5 h-3.5 text-purple-400" />
                      <span>Vollbildmodus</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>F11</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleControlCenter();
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Kontrollzentrum</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp('settings');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Wallpaper & Theme</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FENSTER (Window) Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('window')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                openMenu === 'window'
                  ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                  : textBtnClass
              }`}
            >
              Fenster
            </button>

            <AnimatePresence>
              {openMenu === 'window' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className={`absolute top-7 left-0 w-52 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
                >
                  <button
                    onClick={handleMinimizeActiveWindow}
                    disabled={!activeWin}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Minus className="w-3.5 h-3.5 text-purple-400" />
                      <span>Minimieren</span>
                    </div>
                    <span className={`text-[10px] font-mono ${isDarkContrast ? 'text-zinc-400' : 'text-zinc-500'}`}>⌘ M</span>
                  </button>

                  <button
                    onClick={handleMaximizeActiveWindow}
                    disabled={!activeWin}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Maximieren / Zoom</span>
                  </button>

                  <div className={`border-t my-1 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`} />

                  <button
                    onClick={() => handleSnapActive('left')}
                    disabled={!activeWin}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5 text-zinc-400 rotate-180" />
                    <span>Links anheften (50%)</span>
                  </button>

                  <button
                    onClick={() => handleSnapActive('right')}
                    disabled={!activeWin}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-left transition-colors ${
                      activeWin
                        ? menuBtnClass
                        : isDarkContrast ? 'text-zinc-300 cursor-not-allowed' : 'text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Rechts anheften (50%)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* HILFE (Help) Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('help')}
              className={`px-2 py-0.5 rounded-md transition-colors ${
                openMenu === 'help'
                  ? isDarkContrast ? 'bg-black/10 text-zinc-950' : 'bg-white/15 text-white'
                  : textBtnClass
              }`}
            >
              Hilfe
            </button>

            <AnimatePresence>
              {openMenu === 'help' && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className={`absolute top-7 left-0 w-52 rounded-2xl border shadow-2xl p-1.5 z-50 text-xs space-y-0.5 ${menuBgClass}`}
                >
                  <button
                    onClick={() => {
                      addNotification(
                        'Tastaturkurzbefehle',
                        '⌘ Space: Spotlight | ⌘ L: Sperren | F11: Vollbild',
                        'info',
                        'ObsidianOS'
                      );
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                    <span>Tastaturkurzbefehle</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp('settings');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Systemeinstellungen</span>
                  </button>

                  <button
                    onClick={() => {
                      openApp('appstore');
                      setOpenMenu(null);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors text-left ${menuBtnClass}`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                    <span>App Store</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right side: Spotlight, Now Playing Pill, Control Center, Clock */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Spotlight search trigger */}
        <button
          id="btn-topbar-spotlight"
          onClick={openSpotlight}
          className={`p-1.5 rounded-lg transition-colors ${textBtnClass}`}
          title="Spotlight Suche (Cmd+Space)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Dynamic Global Now Playing Pill */}
        {nowPlaying && (
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all text-xs ${
            isDarkContrast ? 'bg-black/[0.06] border-black/10 text-zinc-900' : 'bg-white/[0.07] border-white/10 text-zinc-200'
          }`}>
            <button
              onClick={toggleControlCenter}
              className="flex items-center gap-1.5 truncate max-w-[140px] sm:max-w-[200px]"
              title={`${nowPlaying.title} — ${nowPlaying.artist}`}
            >
              {nowPlaying.source === 'youtube' ? (
                <Youtube className="w-3 h-3 text-red-400 shrink-0" />
              ) : nowPlaying.source === 'music' ? (
                <Music className="w-3 h-3 text-pink-400 shrink-0" />
              ) : (
                <Radio className="w-3 h-3 text-purple-400 shrink-0" />
              )}
              <span className="truncate text-[11px] font-medium">{nowPlaying.title}</span>
            </button>

            {/* Quick Play/Pause button directly on topbar */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleGlobalMedia();
                sounds.playClick();
              }}
              className={`p-1 rounded-full transition-colors shrink-0 ${isDarkContrast ? 'hover:bg-black/10 text-zinc-900' : 'hover:bg-white/20 text-white'}`}
              title={nowPlaying.isPlaying ? 'Pausieren' : 'Abspielen'}
            >
              {nowPlaying.isPlaying ? (
                <Pause className="w-2.5 h-2.5 fill-current" />
              ) : (
                <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
              )}
            </button>
          </div>
        )}

        {/* Control Center toggle */}
        <button
          id="btn-topbar-control-center"
          onClick={toggleControlCenter}
          className={`p-1.5 rounded-lg transition-colors ${
            isControlCenterOpen
              ? 'bg-purple-600 text-white'
              : textBtnClass
          }`}
          title="Kontrollzentrum öffnen"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Calendar / Date Trigger */}
        <div className="relative">
          <button
            id="btn-topbar-date"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg transition-colors text-xs font-medium ${textBtnClass}`}
          >
            <span>{dateStr}</span>
          </button>

          <AnimatePresence>
            {isCalendarOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.96 }}
                className={`absolute top-8 right-0 w-64 rounded-2xl border shadow-2xl p-3 z-50 text-xs ${menuBgClass}`}
              >
                <div className={`flex items-center gap-2 border-b pb-2 mb-2 ${isDarkContrast ? 'border-slate-200' : 'border-[#27272a]/60'}`}>
                  <CalendarIcon className="w-4 h-4 text-purple-400" />
                  <span className={`font-bold ${isDarkContrast ? 'text-zinc-950' : 'text-white'}`}>{dateStr}</span>
                </div>
                <div className="text-center py-2 text-zinc-400">
                  <p className={`text-xl font-bold font-mono ${isDarkContrast ? 'text-zinc-900' : 'text-white'}`}>{time}</p>
                  <p className={`text-[11px] mt-1 ${isDarkContrast ? 'text-zinc-500' : 'text-zinc-400'}`}>Obsidian Kalender & Zeit</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Digital Clock (HH:MM format) */}
        <div
          id="topbar-clock"
          className={`px-2 py-0.5 rounded-lg font-mono text-xs font-semibold tracking-tight ${
            isDarkContrast
              ? 'text-zinc-900 bg-black/[0.06] border border-black/10'
              : 'text-white bg-white/[0.04] border border-white/[0.06]'
          }`}
        >
          {time}
        </div>

        {/* User Avatar quick trigger */}
        <button
          id="btn-topbar-user-avatar"
          onClick={() => openApp('settings')}
          className="ml-0.5 p-0.5 rounded-full hover:ring-2 hover:ring-purple-400/50 transition-all cursor-pointer"
          title={`Angemeldet als ${currentUser?.displayName} (Klicken für Einstellungen)`}
        >
          <UserAvatar
            avatar={currentUser?.avatar}
            name={currentUser?.displayName}
            size="xs"
            ring={true}
            ringColor={accentConfig.primary}
          />
        </button>
      </div>
    </header>
  );
};
