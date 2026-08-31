import React, { useState, useEffect, useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import {
  ArrowRight,
  Lock,
  Unlock,
  KeyRound,
  Sparkles,
  Camera,
  MapPin,
  RefreshCw,
  Check,
  User,
  UserPlus,
  Cloud,
  Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';
import { LOCKSCREEN_WALLPAPERS } from '../../config/lockscreenWallpapers';
import { UserAvatar } from '../common/UserAvatar';
import { LockscreenPhoto } from '../../types';
import { getClockFontFamilyClass, getClockMotionVariants } from '../../utils/clockUtils';
import { ShaderWallpaper } from './ShaderWallpaper';

export const LockScreen: React.FC = () => {
  const {
    users,
    currentUser,
    login,
    loginExistingAccount,
    accentConfig,
    settings,
    openSetupAssistant,
  } = useOS();

  // Filter out any unwanted guest accounts if needed
  const availableUsers = users.filter((u) => u.role !== 'Gast');
  const userList = availableUsers.length > 0 ? availableUsers : users;

  const [selectedUserId, setSelectedUserId] = useState<string>(
    currentUser?.id || userList[0]?.id || ''
  );
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [manualUsernameInput, setManualUsernameInput] = useState('');
  const [loginMode, setLoginMode] = useState<'quick' | 'manual'>('quick');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [time, setTime] = useState('');
  const [secondsStr, setSecondsStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showPhotoCredits, setShowPhotoCredits] = useState(false);

  // Active Lockscreen Photo Wallpaper index / state
  const filteredWallpapers = useMemo(() => {
    if (!settings.lockscreenCategory || settings.lockscreenCategory === 'all') {
      return LOCKSCREEN_WALLPAPERS;
    }
    const match = LOCKSCREEN_WALLPAPERS.filter(
      (p) => p.category === settings.lockscreenCategory
    );
    return match.length > 0 ? match : LOCKSCREEN_WALLPAPERS;
  }, [settings.lockscreenCategory]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(() => {
    return Math.floor(Math.random() * LOCKSCREEN_WALLPAPERS.length);
  });

  // Calculate active photo based on user settings mode
  const activePhoto: LockscreenPhoto = useMemo(() => {
    // Custom URL override
    if (settings.lockscreenCustomPhotoUrl) {
      return {
        id: 'custom',
        title: 'Benutzerdefiniertes Foto',
        category: 'minimal_nature',
        url: settings.lockscreenCustomPhotoUrl,
        thumbUrl: settings.lockscreenCustomPhotoUrl,
        location: 'Eigene Fotobibliothek',
        photographer: 'Eigener Upload',
      };
    }

    // Fixed photo mode
    if (
      settings.lockscreenMode === 'fixed' &&
      settings.lockscreenFixedPhotoId
    ) {
      const fixed = LOCKSCREEN_WALLPAPERS.find(
        (p) => p.id === settings.lockscreenFixedPhotoId
      );
      if (fixed) return fixed;
    }

    // Fallback to active index from category
    const list =
      filteredWallpapers.length > 0 ? filteredWallpapers : LOCKSCREEN_WALLPAPERS;
    return list[currentPhotoIndex % list.length] || LOCKSCREEN_WALLPAPERS[0];
  }, [
    settings.lockscreenMode,
    settings.lockscreenFixedPhotoId,
    settings.lockscreenCustomPhotoUrl,
    filteredWallpapers,
    currentPhotoIndex,
  ]);

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sounds.playClick();
    setCurrentPhotoIndex((prev) => (prev + 1) % filteredWallpapers.length);
  };

  useEffect(() => {
    if (currentUser) {
      setSelectedUserId(currentUser.id);
    } else if (userList.length > 0) {
      setSelectedUserId(userList[0].id);
    }
  }, [currentUser, users]);

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
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [settings.clockFormat24h]);

  const selectedUser =
    userList.find((u) => u.id === selectedUserId) || userList[0];

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isUnlocking || isLoadingCloud) return;

    setErrorMsg('');

    if (loginMode === 'manual' || userList.length === 0) {
      if (!manualUsernameInput.trim()) {
        setErrorMsg('Bitte Account-Namen eingeben');
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      setIsLoadingCloud(true);
      // Try local first then Firebase cloud
      let success = login(manualUsernameInput.trim(), pinInput);
      if (!success) {
        success = await loginExistingAccount(manualUsernameInput.trim(), pinInput);
      }
      setIsLoadingCloud(false);

      if (!success) {
        sounds.playError();
        setErrorMsg('Account nicht gefunden oder Passwort falsch');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      } else {
        setIsUnlocking(true);
        sounds.playUnlock();
        setPinInput('');
      }
      return;
    }

    if (!selectedUser) return;

    const success = login(selectedUser.id, pinInput);
    if (!success) {
      sounds.playError();
      setErrorMsg('Falscher PIN / Kennwort');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPinInput('');
    } else {
      setIsUnlocking(true);
      sounds.playUnlock();
      setPinInput('');
    }
  };

  const blurPx = settings.lockscreenBlur ?? 0;
  const dimmingPct = settings.lockscreenDimming ?? 35;

  // Custom clock styles
  const clockFontClass = getClockFontFamilyClass(settings.clockFont);
  const clockMotion = getClockMotionVariants(settings.clockTimeAnimation);

  const getClockSizeClass = () => {
    switch (settings.clockSize) {
      case 'compact':
        return 'text-6xl sm:text-7xl';
      case 'huge':
        return 'text-9xl sm:text-[11rem]';
      case 'normal':
      default:
        return 'text-8xl sm:text-9xl';
    }
  };

  // Custom unlock animation variants for root lockscreen transition
  const getUnlockAnimationExit = () => {
    switch (settings.unlockAnimation) {
      case 'curtain-up':
        return {
          opacity: 0,
          y: '-100%',
          filter: 'blur(8px)',
          transition: { duration: 0.65, ease: [0.76, 0, 0.24, 1] },
        };
      case 'portal-expand':
        return {
          opacity: 0,
          scale: 0.1,
          filter: 'blur(30px) brightness(2)',
          transition: { duration: 0.75, ease: 'easeInOut' },
        };
      case 'lens-blur':
        return {
          opacity: 0,
          filter: 'blur(40px)',
          scale: 1.05,
          transition: { duration: 0.7, ease: 'easeOut' },
        };
      case 'warp-speed':
        return {
          opacity: 0,
          scaleY: 3.5,
          scaleX: 0.15,
          filter: 'blur(20px)',
          transition: { duration: 0.6, ease: 'easeInOut' },
        };
      case 'smooth-fade':
        return {
          opacity: 0,
          transition: { duration: 0.55, ease: 'easeInOut' },
        };
      case 'zoom-burst':
      default:
        return {
          opacity: 0,
          scale: 1.25,
          filter: 'blur(20px)',
          transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
        };
    }
  };

  return (
    <motion.div
      id="os-lockscreen"
      initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={getUnlockAnimationExit()}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between select-none overflow-hidden bg-black"
    >
      {/* Dynamic Real Photography or WebGL Shader Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        {settings.lockscreenMode === 'shader' ? (
          <div
            className="w-full h-full"
            style={{
              filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
              transform: blurPx > 0 ? 'scale(1.05)' : 'none',
            }}
          >
            <ShaderWallpaper shaderId={(settings.lockscreenShaderId || 'shader-obsidian') as any} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.img
              key={activePhoto.url}
              src={activePhoto.url}
              alt={activePhoto.title}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full h-full object-cover select-none pointer-events-none"
              style={{
                filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none',
                transform: blurPx > 0 ? 'scale(1.05)' : 'none',
              }}
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        )}

        {/* Dynamic Dark Gradient & Dimming Overlays for Crystal Clear Contrast */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${dimmingPct / 100})`,
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 pointer-events-none bg-gradient-to-b from-black/60 to-transparent" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-10 w-full px-6 py-5 flex items-center justify-between">
        {/* Left: OS Brand Badge */}
        <motion.div
          animate={isUnlocking ? { scale: 1.05, opacity: 0.8 } : {}}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 text-white shadow-lg"
        >
          {isUnlocking ? (
            <Unlock className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-3.5 h-3.5 text-zinc-300" />
          )}
          <span className="text-xs font-semibold tracking-wide">
            ObsidianOS
          </span>
        </motion.div>

        {/* Right: Quick Action: Next Real Photo Wallpaper & Info */}
        <div className="flex items-center gap-2">
          {/* Photo Info Button */}
          <div className="relative">
            <button
              id="lockscreen-btn-photo-info"
              onClick={() => setShowPhotoCredits(!showPhotoCredits)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-xl border border-white/20 text-white text-xs font-medium transition-all shadow-lg active:scale-95"
              title="Foto-Informationen anzeigen"
            >
              <MapPin className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden sm:inline font-medium text-[11px]">
                {activePhoto.location}
              </span>
            </button>

            {/* Photo Info Popover */}
            <AnimatePresence>
              {showPhotoCredits && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl bg-[#12121b]/95 backdrop-blur-2xl border border-white/20 text-white shadow-2xl text-xs space-y-1.5 z-50"
                  style={{
                    boxShadow:
                      '0 20px 40px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                    <span className="font-bold text-white text-sm">
                      {activePhoto.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">
                      Unsplash
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 flex items-center gap-1.5 pt-0.5">
                    <MapPin className="w-3 h-3 text-purple-400 shrink-0" />
                    <span>{activePhoto.location}</span>
                  </p>
                  <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                    <Camera className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span>Foto von {activePhoto.photographer}</span>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shuffle / Next Photo Button */}
          <button
            id="lockscreen-btn-next-photo"
            onClick={handleNextPhoto}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/35 hover:bg-black/55 backdrop-blur-xl border border-white/20 text-white text-xs font-medium transition-all shadow-lg active:scale-95 hover:border-purple-400/60"
            title="Nächstes echtes Foto laden"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden md:inline text-[11px]">Hintergrund wechseln</span>
          </button>
        </div>
      </div>

      {/* Center Display: Minimalist Floating Clock & Frameless Login */}
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center justify-center px-4 my-auto">
        {/* Giant Floating Typography Clock */}
        {settings.lockscreenShowClock !== false && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={
              isUnlocking
                ? { opacity: 0, y: -30, scale: 0.95 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center mb-6 text-center"
          >
            <div className="flex items-baseline justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={time}
                  variants={clockMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={`${getClockSizeClass()} ${clockFontClass} text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] select-none leading-none`}
                >
                  {time}
                </motion.span>
              </AnimatePresence>
              {settings.clockShowSeconds && (
                <span className="text-xl sm:text-2xl text-zinc-300 font-mono ml-1.5 tracking-normal drop-shadow">
                  {secondsStr}
                </span>
              )}
            </div>
            {settings.clockShowDate !== false && (
              <div className="mt-2 px-4 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/15 text-white/90 text-sm font-medium tracking-wide shadow-md">
                {dateStr}
              </div>
            )}
          </motion.div>
        )}

        {/* Empty State: No Users Configured Yet */}
        {userList.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full max-w-sm p-6 rounded-3xl bg-black/50 backdrop-blur-2xl border border-white/20 shadow-2xl text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-xl">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Willkommen bei ObsidianOS
              </h2>
              <p className="text-xs text-zinc-300 mt-1">
                Erstelle dein persönliches Profil oder melde dich mit einem bestehenden Account an.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 w-full pt-2">
              <button
                id="lockscreen-btn-create-account"
                onClick={() => {
                  sounds.playOpen();
                  openSetupAssistant();
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
                style={{ backgroundColor: accentConfig.primary }}
              >
                <UserPlus className="w-4 h-4" /> Neues Benutzerkonto erstellen
              </button>

              <button
                id="lockscreen-btn-login-cloud"
                onClick={() => {
                  sounds.playClick();
                  setLoginMode('manual');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-white shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Cloud className="w-4 h-4 text-purple-300" /> Bestehenden Account laden
              </button>
            </div>
          </motion.div>
        ) : loginMode === 'manual' ? (
          /* Manual Username & Password Login Form */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center w-full max-w-sm ${shake ? 'animate-shake' : ''}`}
          >
            <div className="w-full p-6 rounded-3xl bg-black/55 backdrop-blur-2xl border border-white/25 shadow-2xl space-y-3.5">
              <div className="text-center pb-1">
                <h2 className="text-base font-bold text-white">Mit Account anmelden</h2>
                <p className="text-[11px] text-zinc-300">Gib deinen Benutzernamen und Passwort ein</p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-3">
                {/* Username Input */}
                <div className="relative flex items-center w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs focus-within:border-purple-400">
                  <User className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={manualUsernameInput}
                    onChange={(e) => setManualUsernameInput(e.target.value)}
                    placeholder="Account-Name / Benutzername..."
                    className="w-full bg-transparent text-white placeholder-white/40 outline-none font-medium"
                    autoFocus
                  />
                </div>

                {/* Password / PIN Input */}
                <div className="relative flex items-center w-full bg-black/40 border border-white/20 rounded-xl px-3 py-2 text-xs focus-within:border-purple-400">
                  <KeyRound className="w-4 h-4 text-white/50 mr-2 shrink-0" />
                  <input
                    type="password"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Passwort / PIN..."
                    className="w-full bg-transparent text-white placeholder-white/40 outline-none font-mono tracking-wider"
                  />
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="px-3 py-1 rounded-lg bg-red-500/80 text-white text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoadingCloud}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: accentConfig.primary }}
                >
                  {isLoadingCloud ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{isLoadingCloud ? 'Wird überprüft...' : 'Anmelden'}</span>
                </button>
              </form>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-xs">
                {userList.length > 0 && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setLoginMode('quick');
                      setErrorMsg('');
                    }}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    ← Zurück zur Schnellauswahl
                  </button>
                )}
                <button
                  onClick={() => {
                    sounds.playClick();
                    openSetupAssistant();
                  }}
                  className="text-purple-300 hover:text-purple-200 transition-colors font-medium ml-auto"
                >
                  Neuen Account erstellen
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Frameless Floating User Login (Quick Avatar Mode) */
          <motion.div
            key={selectedUser?.id}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={
              isUnlocking
                ? { scale: 1.04, opacity: 0.9 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className={`flex flex-col items-center w-full max-w-xs ${
              shake ? 'animate-shake' : ''
            }`}
          >
            {/* Glowing Profile Avatar */}
            <div className="relative mb-3.5 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                animate={isUnlocking ? { scale: 1.08 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative"
              >
                <UserAvatar
                  avatar={selectedUser?.avatar}
                  name={selectedUser?.displayName}
                  size="2xl"
                  ring={true}
                  ringColor={isUnlocking ? '#10b981' : accentConfig.primary}
                  ringGlow={isUnlocking ? 'rgba(16, 185, 129, 0.6)' : accentConfig.glow}
                  className="w-24 h-24 shadow-2xl border-2 transition-all duration-300"
                />

                {/* Status indicator dot */}
                <div
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-black shadow-md transition-colors ${
                    isUnlocking ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
                  }`}
                  title="System Bereit"
                />
              </motion.div>
            </div>

            {/* User Display Name */}
            <h2 className="text-xl font-bold text-white tracking-wide drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-0.5 text-center">
              {selectedUser?.displayName || 'Benutzer'}
            </h2>
            <p className="text-xs text-white/70 font-mono drop-shadow mb-4">
              @{selectedUser?.username} • {selectedUser?.role}
            </p>

            {/* Floating Frosted Glass Pill Input Field */}
            <form onSubmit={handleUnlock} className="w-full space-y-2">
              <div className="relative flex items-center w-full bg-black/45 hover:bg-black/55 focus-within:bg-black/65 backdrop-blur-2xl border border-white/25 hover:border-white/40 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-400/40 rounded-full px-3.5 py-1.5 shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all">
                <KeyRound className="w-4 h-4 text-white/50 ml-1.5 shrink-0 pointer-events-none" />
                <input
                  id="lockscreen-pin-input"
                  type="password"
                  value={pinInput}
                  disabled={isUnlocking}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="PIN / Kennwort eingeben..."
                  autoFocus
                  className="w-full bg-transparent pl-2.5 pr-2 py-1.5 text-sm text-white placeholder-white/40 outline-none font-mono tracking-widest transition-all"
                />
                <button
                  id="lockscreen-btn-unlock"
                  type="submit"
                  disabled={isUnlocking}
                  className="w-8 h-8 rounded-full text-white transition-all active:scale-90 hover:brightness-110 flex items-center justify-center shrink-0 shadow-lg"
                  style={{
                    backgroundColor: isUnlocking ? '#10b981' : accentConfig.primary,
                  }}
                  title="Entsperren"
                >
                  {isUnlocking ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Error Message Pill */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-md text-white text-xs font-semibold text-center shadow-lg"
                >
                  {errorMsg}
                </motion.div>
              )}

              <div className="flex items-center justify-between text-[11px] text-white/60 font-mono pt-1 drop-shadow">
                <span>Drücke Enter</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setLoginMode('manual');
                    setErrorMsg('');
                  }}
                  className="text-purple-300 hover:underline"
                >
                  Per Account-Name anmelden
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>

      {/* Bottom Section: Floating User Switcher Dock & Footer */}
      <div className="relative z-10 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Multiple Users Floating Switcher Dock */}
        <div className="flex items-center gap-2">
          {userList.length > 1 && loginMode === 'quick' && (
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 backdrop-blur-2xl border border-white/15 shadow-xl">
              {userList.map((u) => {
                const isSelected = u.id === selectedUserId;
                const isHovered = hoveredUserId === u.id;

                return (
                  <div key={u.id} className="relative">
                    {/* Tooltip on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.9 }}
                          animate={{ opacity: 1, y: -10, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.9 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-xl bg-[#12121c]/95 backdrop-blur-xl border border-white/20 text-white text-[11px] font-medium whitespace-nowrap shadow-2xl pointer-events-none z-50"
                        >
                          <span>{u.displayName}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.button
                      id={`lockscreen-user-switch-${u.id}`}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setPinInput('');
                        setErrorMsg('');
                        sounds.playClick();
                      }}
                      onMouseEnter={() => setHoveredUserId(u.id)}
                      onMouseLeave={() => setHoveredUserId(null)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative w-9 h-9 rounded-full transition-all flex items-center justify-center overflow-hidden ${
                        isSelected
                          ? 'ring-2 shadow-lg'
                          : 'opacity-65 hover:opacity-100'
                      }`}
                      style={
                        isSelected
                          ? {
                              ringColor: accentConfig.primary,
                              boxShadow: `0 0 14px ${accentConfig.glow}`,
                            }
                          : {}
                      }
                      title={u.displayName}
                    >
                      <UserAvatar
                        avatar={u.avatar}
                        name={u.displayName}
                        size="sm"
                        className="w-full h-full"
                      />
                    </motion.button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => {
              sounds.playClick();
              openSetupAssistant();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-2xl border border-white/15 text-white/80 hover:text-white text-xs font-medium transition-all shadow-md"
            title="Setup-Assistent öffnen"
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Neues Profil / Setup</span>
          </button>
        </div>

        {/* Center/Right: Photo Location Tag & OS Info */}
        <div className="flex items-center gap-3 text-[11px] text-white/70 font-mono drop-shadow">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>ObsidianOS 2.4</span>
          </span>
          <span className="text-white/30">•</span>
          <span className="text-white/60">
            Hintergrund: {activePhoto.title}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
