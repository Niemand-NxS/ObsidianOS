import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { AVATAR_PRESETS } from '../../config/avatarPresets';
import { ACCENT_COLORS, WALLPAPERS } from '../../config/themeConfig';
import {
  Sparkles,
  User,
  Shield,
  Palette,
  Sliders,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Globe,
  Camera,
  Upload,
  CheckCircle2,
  RefreshCw,
  LogIn,
  KeyRound,
  Laptop,
  Moon,
  Sun,
  Volume2,
  Clock,
  HardDrive,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';
import { AccentColorId, WallpaperId, ClockFont, UserProfile } from '../../types';
import { FirebaseService } from '../../services/firebaseService';

interface SetupAssistantProps {
  onComplete?: () => void;
}

type SetupStep = 'welcome' | 'account' | 'appearance' | 'system' | 'finish';

export const SetupAssistant: React.FC<SetupAssistantProps> = ({ onComplete }) => {
  const {
    completeSetup,
    loginExistingAccount,
    users,
    accentConfig,
    settings,
    updateSettings,
  } = useOS();

  const [currentStep, setCurrentStep] = useState<SetupStep>('welcome');
  const [isDirectLoginOpen, setIsDirectLoginOpen] = useState(false);
  const [directLoginUserId, setDirectLoginUserId] = useState<string>('');
  const [directLoginUsername, setDirectLoginUsername] = useState<string>('');
  const [directLoginPin, setDirectLoginPin] = useState<string>('');
  const [directLoginError, setDirectLoginError] = useState<string>('');
  const [isDirectLoggingIn, setIsDirectLoggingIn] = useState(false);

  // Synced cloud accounts list for direct login
  const [cloudUsers, setCloudUsers] = useState<UserProfile[]>(users);
  const [isLoadingCloudUsers, setIsLoadingCloudUsers] = useState(false);

  // Step 1: Language & Region
  const [language, setLanguage] = useState<'de' | 'en' | 'fr'>('de');
  const [keyboardLayout, setKeyboardLayout] = useState<'de' | 'us' | 'ch'>('de');

  // Step 2: User Profile State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [role, setRole] = useState<'Administrator' | 'Benutzer'>('Administrator');
  const [bio, setBio] = useState('ObsidianOS Hauptbenutzer');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'custom'>('presets');
  const [userFormError, setUserFormError] = useState('');

  // Step 3: Appearance State
  const [themeMode, setThemeMode] = useState<'shader' | 'photo'>('shader');
  const [selectedAccent, setSelectedAccent] = useState<AccentColorId>('violet-classic');
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperId>('obsidian-deep');

  // Step 4: System & Desktop State
  const [clockFont, setClockFont] = useState<ClockFont>('sans-ultralight');
  const [clockFormat24h, setClockFormat24h] = useState(true);
  const [clockShowSeconds, setClockShowSeconds] = useState(false);
  const [dockMagnification, setDockMagnification] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);

  // Step 5: Finalizing state
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Load cloud accounts for direct login
  useEffect(() => {
    setIsLoadingCloudUsers(true);
    FirebaseService.fetchUsersRegistry()
      .then((res) => {
        if (res.success && res.users && res.users.length > 0) {
          setCloudUsers(res.users);
          if (!directLoginUserId && res.users.length > 0) {
            setDirectLoginUserId(res.users[0].id);
          }
        }
      })
      .finally(() => {
        setIsLoadingCloudUsers(false);
      });
  }, []);

  const handleNext = () => {
    sounds.playClick();
    if (currentStep === 'welcome') {
      setCurrentStep('account');
    } else if (currentStep === 'account') {
      if (!displayName.trim()) {
        setUserFormError('Bitte gib einen vollständigen Namen oder Anzeigenamen ein.');
        return;
      }
      if (!username.trim()) {
        setUserFormError('Bitte wähle einen Benutzernamen (@username).');
        return;
      }
      if (pin.length > 0 && pin.length < 4) {
        setUserFormError('Die Sicherheits-PIN muss mindestens 4 Zeichen lang sein.');
        return;
      }
      if (pin !== confirmPin) {
        setUserFormError('Die PIN-Bestätigung stimmt nicht überein.');
        return;
      }
      setUserFormError('');
      setCurrentStep('appearance');
    } else if (currentStep === 'appearance') {
      setCurrentStep('system');
    } else if (currentStep === 'system') {
      setCurrentStep('finish');
    }
  };

  const handleBack = () => {
    sounds.playClick();
    if (currentStep === 'account') setCurrentStep('welcome');
    else if (currentStep === 'appearance') setCurrentStep('account');
    else if (currentStep === 'system') setCurrentStep('appearance');
    else if (currentStep === 'finish') setCurrentStep('system');
  };

  const handleLaunchOS = async () => {
    setIsFinalizing(true);
    sounds.playSuccess();

    const avatarUrl = avatarTab === 'custom' && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : selectedAvatar;

    try {
      await completeSetup(
        {
          displayName: displayName.trim() || 'Benutzer',
          username: username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'admin',
          pin: pin,
          avatar: avatarUrl,
          role: role,
          bio: bio,
        },
        {
          accentColor: selectedAccent,
          wallpaper: selectedWallpaper,
          desktopWallpaperMode: themeMode,
          clockFont: clockFont,
          clockFormat24h: clockFormat24h,
          clockShowSeconds: clockShowSeconds,
          dockMagnification: dockMagnification,
          soundEffects: soundEffects,
        }
      );
      if (onComplete) onComplete();
    } catch (e) {
      setIsFinalizing(false);
    }
  };

  // Direct login execution
  const handleExecuteDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDirectLoginError('');
    setIsDirectLoggingIn(true);

    try {
      // Find selected user
      let targetUserId = directLoginUserId;
      if (!targetUserId && directLoginUsername) {
        const found = cloudUsers.find(
          (u) => u.username.toLowerCase() === directLoginUsername.trim().toLowerCase()
        );
        if (found) targetUserId = found.id;
      }

      if (!targetUserId && cloudUsers.length > 0) {
        targetUserId = cloudUsers[0].id;
      }

      const success = await loginExistingAccount(targetUserId, directLoginPin);
      if (success) {
        sounds.playSuccess();
        if (onComplete) onComplete();
      } else {
        setDirectLoginError('Ungültige PIN oder Benutzer nicht gefunden.');
        sounds.playError();
      }
    } catch (err: any) {
      setDirectLoginError('Anmeldung fehlgeschlagen: ' + (err?.message || 'Unbekannter Fehler'));
      sounds.playError();
    } finally {
      setIsDirectLoggingIn(false);
    }
  };

  const stepsList: { id: SetupStep; title: string; icon: React.ReactNode }[] = [
    { id: 'welcome', title: 'Sprache & Region', icon: <Globe className="w-4 h-4" /> },
    { id: 'account', title: 'Account erstellen', icon: <User className="w-4 h-4" /> },
    { id: 'appearance', title: 'Erscheinungsbild', icon: <Palette className="w-4 h-4" /> },
    { id: 'system', title: 'System & Desktop', icon: <Sliders className="w-4 h-4" /> },
    { id: 'finish', title: 'Bereitstellen', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 select-none bg-[#0c0d12]/95 backdrop-blur-3xl overflow-hidden font-sans">
      {/* Dynamic Background Shader & Ambient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full blur-[120px] mix-blend-screen animate-pulse"
          style={{ backgroundColor: `${accentConfig.primary}44`, animationDuration: '8s' }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full blur-[140px] mix-blend-screen"
          style={{ backgroundColor: `${accentConfig.glow}` }}
        />
      </div>

      {/* Top Bar with Direct Login Switch (Clean, full-screen setup style) */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => {
            sounds.playClick();
            setIsDirectLoginOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/15 text-zinc-200 transition-all hover:scale-[1.02] shadow-sm backdrop-blur-xl"
        >
          <LogIn className="w-3.5 h-3.5 text-purple-400" />
          <span>Bereits ein Konto? Anmelden</span>
        </button>
      </div>

      {/* Main Setup Card Container (No window dots, no sidebar) */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative w-full max-w-2xl h-[620px] max-h-[88vh] rounded-[28px] bg-[#161720]/80 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-3xl text-zinc-100"
      >
        {/* Main Stage Content */}
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 overflow-y-auto custom-scrollbar">
            {/* Step 1: Welcome, Language & Region */}
            {currentStep === 'welcome' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-xl mx-auto w-full my-auto"
              >
                <div className="text-center space-y-2">
                  <div
                    className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-2xl border border-white/20 mb-3"
                    style={{
                      backgroundColor: accentConfig.primary,
                      boxShadow: `0 12px 30px ${accentConfig.glow}`,
                    }}
                  >
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    Willkommen bei ObsidianOS
                  </h2>
                  <p className="text-sm text-zinc-400">
                    Richte dein System in wenigen Schritten ein oder melde dich mit einem bestehenden Account an.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Language Selection */}
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 block flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-purple-400" />
                      Bevorzugte Sprache
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { code: 'de', label: 'Deutsch (Deutschland)' },
                        { code: 'en', label: 'English (US)' },
                        { code: 'fr', label: 'Français' },
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setLanguage(lang.code as any);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                            language === lang.code
                              ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span>{lang.label}</span>
                          {language === lang.code && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Keyboard Layout */}
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-3">
                    <label className="text-xs font-semibold text-zinc-300 block flex items-center gap-2">
                      <Laptop className="w-3.5 h-3.5 text-purple-400" />
                      Tastaturlayout
                    </label>
                    <div className="space-y-1.5">
                      {[
                        { code: 'de', label: 'Deutsch (QWERTZ)' },
                        { code: 'us', label: 'US International (QWERTY)' },
                        { code: 'ch', label: 'Schweiz (QWERTZ)' },
                      ].map((kb) => (
                        <button
                          key={kb.code}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setKeyboardLayout(kb.code as any);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between border transition-all ${
                            keyboardLayout === kb.code
                              ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                              : 'bg-black/20 border-white/5 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span>{kb.label}</span>
                          {keyboardLayout === kb.code && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Login Banner */}
                <div
                  onClick={() => setIsDirectLoginOpen(true)}
                  className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between cursor-pointer hover:bg-purple-500/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                      <HardDrive className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-200">
                        Bereits auf einem anderen Gerät eingerichtet?
                      </p>
                      <p className="text-[11px] text-purple-300/80">
                        Melde dich direkt an, um deine Cloud-Dateien & Einstellungen zu laden.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400" />
                </div>
              </motion.div>
            )}

            {/* Step 2: Account Creation */}
            {currentStep === 'account' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 max-w-xl mx-auto w-full"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Computeraccount erstellen</h2>
                  <p className="text-xs text-zinc-400">
                    Dieser Account wird für die Anmeldung und Verschlüsselung auf diesem Gerät genutzt.
                  </p>
                </div>

                {userFormError && (
                  <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{userFormError}</span>
                  </div>
                )}

                {/* Avatar Selection Grid */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Profilbild auswählen</span>
                    <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAvatarTab('presets')}
                        className={`px-2.5 py-0.5 rounded-md ${
                          avatarTab === 'presets' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400'
                        }`}
                      >
                        Vorlagen
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvatarTab('custom')}
                        className={`px-2.5 py-0.5 rounded-md ${
                          avatarTab === 'custom' ? 'bg-purple-600 text-white font-medium' : 'text-zinc-400'
                        }`}
                      >
                        Eigenes Foto
                      </button>
                    </div>
                  </div>

                  {avatarTab === 'presets' ? (
                    <div className="grid grid-cols-6 gap-2.5 pt-1">
                      {AVATAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedAvatar(preset.url);
                          }}
                          className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all group ${
                            selectedAvatar === preset.url
                              ? 'border-purple-500 scale-105 shadow-md ring-2 ring-purple-500/30'
                              : 'border-transparent opacity-75 hover:opacity-100 hover:border-white/40'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedAvatar === preset.url && (
                            <div className="absolute inset-0 bg-purple-600/30 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Bild-URL eingeben (https://...)"
                          value={customAvatarUrl}
                          onChange={(e) => setCustomAvatarUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                        {customAvatarUrl && (
                          <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shrink-0">
                            <img
                              src={customAvatarUrl}
                              alt="Avatar Vorschau"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Vollständiger Name / Anzeigename *
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. Lia C. oder Administrator"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        if (!username) {
                          setUsername(
                            e.target.value
                              .toLowerCase()
                              .replace(/\s+/g, '')
                              .replace(/[^a-z0-9]/g, '')
                          );
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      Accountname (@username) *
                    </label>
                    <input
                      type="text"
                      placeholder="z. B. lia oder admin"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-medium text-zinc-300">
                        Sicherheits-PIN / Passwort
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="text-[10px] text-purple-400 hover:underline"
                      >
                        {showPin ? 'Verbergen' : 'Anzeigen'}
                      </button>
                    </div>
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="z. B. 1234 oder leer für Schnellzugriff"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                      PIN bestätigen
                    </label>
                    <input
                      type={showPin ? 'text' : 'password'}
                      placeholder="PIN wiederholen"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                </div>

                {/* Account Type & Role */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <div>
                      <p className="text-xs font-semibold text-white">Kontotyp</p>
                      <p className="text-[11px] text-zinc-400">
                        Als Administrator hast du vollen Zugriff auf Systemeinstellungen & Backups.
                      </p>
                    </div>
                  </div>
                  <div className="flex bg-black/40 p-0.5 rounded-lg border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setRole('Administrator')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        role === 'Administrator' ? 'bg-purple-600 text-white font-semibold' : 'text-zinc-400'
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('Benutzer')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        role === 'Benutzer' ? 'bg-purple-600 text-white font-semibold' : 'text-zinc-400'
                      }`}
                    >
                      Standard
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Appearance & Personalization */}
            {currentStep === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-xl mx-auto w-full my-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">Erscheinungsbild anpassen</h2>
                  <p className="text-xs text-zinc-400">
                    Wähle dein bevorzugtes Designthema und deine Akzentfarbe für Fenster und Menüs.
                  </p>
                </div>

                {/* Theme Mode Selection Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setThemeMode('shader');
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      themeMode === 'shader'
                        ? 'bg-purple-900/20 border-purple-500 shadow-lg ring-2 ring-purple-500/20'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {themeMode === 'shader' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Cyber Shader Theme</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Prozedurale flüssige Farbwellen & dynamische Glas-Unschärfe.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setThemeMode('photo');
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      themeMode === 'photo'
                        ? 'bg-purple-900/20 border-purple-500 shadow-lg ring-2 ring-purple-500/20'
                        : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-300">
                        <Palette className="w-5 h-5" />
                      </div>
                      {themeMode === 'photo' && <Check className="w-4 h-4 text-purple-400" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Natur & Wallpaper</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Kuratierte hochauflösende Fotolandschaften & minimalistische Motive.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Accent Color Palette */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 block">Akzentfarbe auswählen</span>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                    {Object.entries(ACCENT_COLORS).map(([id, conf]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedAccent(id as AccentColorId);
                        }}
                        className={`group flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${
                          selectedAccent === id
                            ? 'bg-white/15 border-white/40 scale-105 shadow-md'
                            : 'bg-black/20 border-white/5 hover:border-white/20'
                        }`}
                        title={conf.name}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ backgroundColor: conf.primary }}
                        >
                          {selectedAccent === id && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </div>
                        <span className="text-[10px] text-zinc-300 truncate w-full text-center">
                          {conf.name.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallpaper Preview Selection */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 block">Hintergrundbild</span>
                  <div className="grid grid-cols-4 gap-2.5">
                    {WALLPAPERS.slice(0, 4).map((wp) => (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedWallpaper(wp.id as WallpaperId);
                        }}
                        className={`relative rounded-xl overflow-hidden aspect-video border-2 transition-all ${
                          selectedWallpaper === wp.id
                            ? 'border-purple-500 scale-105 shadow-md ring-2 ring-purple-500/30'
                            : 'border-transparent opacity-75 hover:opacity-100 hover:border-white/30'
                        }`}
                      >
                        <div
                          className="w-full h-full"
                          style={{ background: wp.previewGradient }}
                        />
                        <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] font-medium text-white truncate drop-shadow bg-black/50 px-1 py-0.5 rounded">
                          {wp.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: System & Desktop Preferences */}
            {currentStep === 'system' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5 max-w-xl mx-auto w-full my-auto"
              >
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-bold text-white">System & Desktop konfigurieren</h2>
                  <p className="text-xs text-zinc-400">
                    Passe das Verhalten von Uhr, Dock und Audioeffekten an deine Vorlieben an.
                  </p>
                </div>

                {/* Clock Font Styles */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 block flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    Uhrzeit-Typografie
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'sans-ultralight', label: 'Ultraleicht', font: 'font-extralight' },
                      { id: 'cyber-mono', label: 'Cyber Mono', font: 'font-mono' },
                      { id: 'luxury-serif', label: 'Serif Elegant', font: 'font-serif' },
                      { id: 'matrix-digital', label: 'Matrix LED', font: 'font-mono' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setClockFont(f.id as ClockFont);
                        }}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          clockFont === f.id
                            ? 'bg-purple-600/30 border-purple-500 text-white font-semibold'
                            : 'bg-black/20 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <div className={`text-base ${f.font} mb-0.5`}>12:45</div>
                        <span className="text-[10px] text-zinc-400">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Toggles */}
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">24-Stunden-Uhrzeitformat</p>
                      <p className="text-[11px] text-zinc-400">Nutze das 24h-Format statt 12h AM/PM.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playToggle();
                        setClockFormat24h(!clockFormat24h);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        clockFormat24h ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          clockFormat24h ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Dock-Vergrößerungseffekt</p>
                      <p className="text-[11px] text-zinc-400">Icons im Dock vergrößern sich beim Drüberfahren.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playToggle();
                        setDockMagnification(!dockMagnification);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        dockMagnification ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          dockMagnification ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Volume2 className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="text-xs font-semibold text-white">System-Sounds & Haptik</p>
                        <p className="text-[11px] text-zinc-400">
                          Akustisches Feedback bei Aktionen, Klicks und Fenstern.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playToggle();
                        setSoundEffects(!soundEffects);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                        soundEffects ? 'bg-purple-600' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          soundEffects ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Finish & Launch */}
            {currentStep === 'finish' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 max-w-xl mx-auto w-full my-auto text-center"
              >
                <div
                  className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl border border-white/20 relative"
                  style={{
                    backgroundColor: ACCENT_COLORS[selectedAccent]?.primary || '#9333ea',
                    boxShadow: `0 16px 40px ${ACCENT_COLORS[selectedAccent]?.glow || 'rgba(147,51,234,0.5)'}`,
                  }}
                >
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-2xl font-bold text-white tracking-tight">Alles bereit!</h2>
                  <p className="text-sm text-zinc-300">
                    Dein ObsidianOS-Benutzerkonto ist konfiguriert und wird verschlüsselt gespeichert.
                  </p>
                </div>

                {/* Profile Summary Card */}
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 max-w-md mx-auto flex items-center gap-4 text-left shadow-lg">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/20 shrink-0 shadow">
                    <img
                      src={
                        avatarTab === 'custom' && customAvatarUrl.trim()
                          ? customAvatarUrl
                          : selectedAvatar
                      }
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{displayName || 'Administrator'}</h4>
                    <p className="text-xs text-purple-400 font-mono">@{username || 'admin'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {role}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {pin ? 'PIN-Schutz aktiv' : 'Passwortfrei'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                  Deine Daten werden in Browser-Cookies, lokalem Speicher und Firebase Firestore synchronisiert.
                </p>
              </motion.div>
            )}

            {/* Bottom Actions Bar with Compact Setup Steps */}
            <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-4">
              {currentStep !== 'welcome' ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Zurück</span>
                </button>
              ) : (
                <div className="w-16" />
              )}

              {/* Compact Step Indicator Dots / Pills */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-white/10 shadow-inner">
                {stepsList.map((step, idx) => {
                  const isCurrent = currentStep === step.id;
                  const stepIndex = stepsList.findIndex((s) => s.id === currentStep);
                  const isDone = idx < stepIndex;

                  return (
                    <div
                      key={step.id}
                      title={step.title}
                      className="flex items-center gap-1"
                    >
                      <div
                        className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                          isCurrent
                            ? 'w-6 h-6 bg-purple-600 text-white text-[10px] font-bold shadow-md shadow-purple-500/40 ring-2 ring-purple-400/40'
                            : isDone
                            ? 'w-4 h-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px]'
                            : 'w-2 h-2 bg-white/20'
                        }`}
                      >
                        {isCurrent ? idx + 1 : isDone ? <Check className="w-2.5 h-2.5" /> : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentStep !== 'finish' ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: accentConfig.primary,
                    boxShadow: `0 8px 20px ${accentConfig.glow}`,
                  }}
                >
                  <span>Fortfahren</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isFinalizing}
                  onClick={handleLaunchOS}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    backgroundColor: ACCENT_COLORS[selectedAccent]?.primary || '#9333ea',
                    boxShadow: `0 8px 25px ${ACCENT_COLORS[selectedAccent]?.glow || 'rgba(147,51,234,0.6)'}`,
                  }}
                >
                  {isFinalizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Richte System ein...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>ObsidianOS starten</span>
                    </>
                  )}
                </button>
              )}
            </div>
        </div>
      </motion.div>

      {/* Direct Login Modal Overlay for Existing Users */}
      <AnimatePresence>
        {isDirectLoginOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-md p-6 rounded-3xl bg-[#1a1b23] border border-white/20 shadow-2xl text-zinc-100 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Bestehendes Konto anmelden</h3>
                    <p className="text-[11px] text-zinc-400">Überspringe das Setup und lade deine Cloud-Daten.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDirectLoginOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {directLoginError && (
                <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>{directLoginError}</span>
                </div>
              )}

              <form onSubmit={handleExecuteDirectLogin} className="space-y-4">
                {/* Synced Profile List */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-300 block">
                    Konto auswählen
                  </label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {cloudUsers.map((u) => {
                      const isSelected = (directLoginUserId || cloudUsers[0]?.id) === u.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setDirectLoginUserId(u.id);
                            setDirectLoginUsername(u.username);
                          }}
                          className={`w-full p-2.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                            isSelected
                              ? 'bg-purple-600/30 border-purple-500 text-white shadow'
                              : 'bg-black/30 border-white/10 text-zinc-300 hover:border-white/20'
                          }`}
                        >
                          <img
                            src={u.avatar}
                            alt={u.displayName}
                            className="w-8 h-8 rounded-full object-cover border border-white/20"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{u.displayName}</p>
                            <p className="text-[10px] text-zinc-400 font-mono">@{u.username} • {u.role}</p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* PIN Input */}
                <div>
                  <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                    PIN / Passwort
                  </label>
                  <input
                    type="password"
                    placeholder="PIN eingeben (Standard z. B. 1234)"
                    value={directLoginPin}
                    onChange={(e) => setDirectLoginPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectLoginOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-all"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isDirectLoggingIn}
                    className="flex-1 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isDirectLoggingIn ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Lade...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Anmelden & Starten</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
