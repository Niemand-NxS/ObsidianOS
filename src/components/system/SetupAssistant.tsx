import React, { useState, useEffect, useMemo } from 'react';
import { useOS } from '../../context/OSContext';
import { AVATAR_PRESETS } from '../../config/avatarPresets';
import { ACCENT_COLORS, WALLPAPERS } from '../../config/themeConfig';
import { OBSIDIAN_DEFAULT_WALLPAPERS } from '../../config/defaultWallpapers';
import {
  Globe,
  Accessibility,
  Wifi,
  Laptop,
  User,
  Eye,
  ShieldCheck,
  Palette,
  Check,
  ArrowRight,
  ArrowLeft,
  Lock,
  EyeOff,
  Sparkles,
  RefreshCw,
  LogIn,
  Sliders,
  Camera,
  Mic,
  MapPin,
  Clock,
  HardDrive,
  CheckCircle2,
  Volume2,
  FileText,
  AlertCircle,
  Scan,
  Radio,
  Share2,
  Upload,
  FileArchive,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';
import { AccentColorId, WallpaperId, ClockFont, UserProfile } from '../../types';
import { FirebaseService } from '../../services/firebaseService';
import { OpticIDScanner } from './OpticIDScanner';
import { LicenseAgreementModal } from './LicenseAgreementModal';
import { CrystalWelcomeScreen } from './CrystalWelcomeScreen';

interface SetupAssistantProps {
  onComplete?: () => void;
}

// 8 Defined Steps according to specification
type SetupStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface CountryConfig {
  id: string;
  name: string;
  localName?: string;
  flag: string;
  lang: string;
  kb: 'de' | 'us' | 'ch';
  currency: string;
  units: 'metric' | 'imperial';
  dateFormat: string;
}

const DEFAULT_SETUP_STRINGS: Record<string, string> = {
  assistantTitle: "ObsidianOS Assistent",
  step1Title: "Land, Region & Tastatur",
  step1Subtitle: "System-Lokalisierung und Eingabemethoden",
  step2Title: "Barrierefreiheit",
  step2Subtitle: "Eingabe- und Sehhilfen konfigurieren",
  step3Title: "Netzwerkverbindung",
  step3Subtitle: "Internet & Cloud-Infrastruktur verbinden",
  step4Title: "Datenübertragung",
  step4Subtitle: "Migrationsassistent für Backups & Accounts",
  step5Title: "Konto & Authentifizierung",
  step5Subtitle: "Computer-Account und Lizenzbedingungen",
  step6Title: "Sicherheit & Verschlüsselung",
  step6Subtitle: "Optic ID Augenscan für biometrischen Login",
  step7Title: "Ortung, Diagnose & Dienste",
  step7Subtitle: "Hintergrunddienste & Datenschutz",
  step8Title: "Personalisierung & Finale",
  step8Subtitle: "UI-Erscheinungsbild und Systemstart",
  btnContinue: "Fortfahren",
  btnBack: "Zurück",
  btnSkip: "Überspringen",
  btnStartOS: "ObsidianOS starten",
  btnExistingAccount: "Bestehenden Account anmelden",
  chooseCountry: "Heimatland wählen",
  searchCountry: "Land suchen...",
  regionalSettings: "Automatische Regionaleinstellungen",
  currency: "Währung",
  units: "Maßeinheiten",
  dateFormat: "Datumsformat",
  keyboardLayout: "Tastaturlayout",
  fullName: "Vollständiger Name",
  accountName: "Benutzername (Ordner ~/Users/)",
  password: "Passwort",
  confirmPassword: "Passwort bestätigen",
  passwordHint: "Passwort-Hinweis (Optional)",
  readyTitle: "Alles bereit für den Start!",
  readySubtitle: "Klicke unten rechts auf „ObsidianOS starten“, um deinen Desktop zu laden.",
  settingUpDesktop: "Richte Desktop ein...",
};

const COUNTRIES: CountryConfig[] = [
  { id: 'de', name: 'Deutschland', flag: '🇩🇪', lang: 'de', kb: 'de', currency: 'EUR (€)', units: 'metric', dateFormat: 'TT.MM.JJJJ' },
  { id: 'at', name: 'Österreich', flag: '🇦🇹', lang: 'de', kb: 'de', currency: 'EUR (€)', units: 'metric', dateFormat: 'TT.MM.JJJJ' },
  { id: 'ch', name: 'Schweiz', flag: '🇨🇭', lang: 'de', kb: 'ch', currency: 'CHF (Fr.)', units: 'metric', dateFormat: 'TT.MM.JJJJ' },
  { id: 'us', name: 'Vereinigte Staaten', flag: '🇺🇸', lang: 'en', kb: 'us', currency: 'USD ($)', units: 'imperial', dateFormat: 'MM/DD/YYYY' },
  { id: 'gb', name: 'Großbritannien', flag: '🇬🇧', lang: 'en', kb: 'us', currency: 'GBP (£)', units: 'metric', dateFormat: 'DD/MM/YYYY' },
  { id: 'fr', name: 'Frankreich', flag: '🇫🇷', lang: 'fr', kb: 'de', currency: 'EUR (€)', units: 'metric', dateFormat: 'JJ/MM/AAAA' },
];

export const SetupAssistant: React.FC<SetupAssistantProps> = ({ onComplete }) => {
  const {
    completeSetup,
    loginExistingAccount,
    users,
    accentConfig,
    settings,
    restoreFullBackup,
  } = useOS();

  const [currentStep, setCurrentStep] = useState<SetupStep>(1);
  const [showWelcomeIntro, setShowWelcomeIntro] = useState<boolean>(true);

  // Synced cloud accounts list for direct login or migration
  const [cloudUsers, setCloudUsers] = useState<UserProfile[]>(users);
  const [isDirectLoginOpen, setIsDirectLoginOpen] = useState(false);
  const [directLoginUserId, setDirectLoginUserId] = useState<string>('');
  const [directLoginPin, setDirectLoginPin] = useState<string>('');
  const [directLoginError, setDirectLoginError] = useState<string>('');
  const [isDirectLoggingIn, setIsDirectLoggingIn] = useState(false);

  // -------------------------------------------------------------
  // STEP 1: Land, Region & Tastatur (mit API Anbindung)
  // -------------------------------------------------------------
  const [availableCountries, setAvailableCountries] = useState<CountryConfig[]>(COUNTRIES);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig>(COUNTRIES[0]);
  const [primaryLang, setPrimaryLang] = useState<string>('de');
  const [keyboardLayout, setKeyboardLayout] = useState<'de' | 'us' | 'ch'>('de');
  const [dictationEnabled, setDictationEnabled] = useState(true);

  // Dynamic API Translations State
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>(DEFAULT_SETUP_STRINGS);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const t = (key: keyof typeof DEFAULT_SETUP_STRINGS, fallback?: string): string => {
    return translatedTexts[key] || fallback || DEFAULT_SETUP_STRINGS[key] || key;
  };

  // Fetch Countries from API on mount
  useEffect(() => {
    fetch('/api/setup/countries')
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        if (data && data.countries && Array.isArray(data.countries) && data.countries.length > 0) {
          setAvailableCountries(data.countries);
        }
      })
      .catch((err) => console.warn('Countries API fetch warning, fallback active:', err));
  }, []);

  // Update language/keyboard on country change and translate all setup assistant texts via API
  const handleSelectCountry = async (country: CountryConfig) => {
    sounds.playClick();
    setSelectedCountry(country);
    setPrimaryLang(country.lang);
    setKeyboardLayout(country.kb as any);

    if (country.lang === 'de') {
      setTranslatedTexts(DEFAULT_SETUP_STRINGS);
      return;
    }

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          texts: DEFAULT_SETUP_STRINGS,
          targetLang: country.lang,
          sourceLang: 'de',
        }),
      });
      const data = await res.json();
      if (data && data.translations) {
        setTranslatedTexts((prev) => ({ ...prev, ...data.translations }));
      }
    } catch (e) {
      console.warn('Translate API call warning:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  const filteredCountries = useMemo(() => {
    const q = countrySearchQuery.trim().toLowerCase();
    if (!q) return availableCountries;
    return availableCountries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.localName && c.localName.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [availableCountries, countrySearchQuery]);

  // -------------------------------------------------------------
  // STEP 2: Barrierefreiheit (Eingabe- und Sehhilfen)
  // -------------------------------------------------------------
  const [voiceOver, setVoiceOver] = useState(false);
  const [screenZoom, setScreenZoom] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [switchControl, setSwitchControl] = useState(false);
  const [liveCaptions, setLiveCaptions] = useState(false);
  const [flashAlerts, setFlashAlerts] = useState(false);

  // -------------------------------------------------------------
  // STEP 3: Netzwerkverbindung (Internet & Infrastruktur)
  // -------------------------------------------------------------
  const [detectedWifiName, setDetectedWifiName] = useState<string>('Home_WLAN_5GHz');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Home_WLAN_5GHz');
  const [networkPassword, setNetworkPassword] = useState<string>('••••••••');
  const [networkStatus, setNetworkStatus] = useState<'connected' | 'connecting' | 'idle'>('connected');
  const [connectionType, setConnectionType] = useState<'wifi' | 'ethernet'>('wifi');

  useEffect(() => {
    // Attempt to probe network info if available in browser
    try {
      const nav = navigator as any;
      const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
      if (conn && conn.effectiveType) {
        setDetectedWifiName(`WLAN_${conn.effectiveType.toUpperCase()}_HighSpeed`);
        setSelectedNetwork(`WLAN_${conn.effectiveType.toUpperCase()}_HighSpeed`);
      } else if (navigator.onLine) {
        setDetectedWifiName('Fritz!Box-7590-AX (Online)');
        setSelectedNetwork('Fritz!Box-7590-AX (Online)');
      }
    } catch {}
  }, []);

  const handleTestConnect = () => {
    sounds.playClick();
    setNetworkStatus('connecting');
    setTimeout(() => {
      setNetworkStatus('connected');
      sounds.playSuccess();
    }, 900);
  };

  // -------------------------------------------------------------
  // STEP 4: Datenübertragung (Migrationsassistent)
  // -------------------------------------------------------------
  type MigrationMode = 'cloud_account' | 'time_machine' | 'none';
  const [migrationMode, setMigrationMode] = useState<MigrationMode>('none');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupData, setBackupData] = useState<any | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const handleBackupFileUpload = async (file: File) => {
    try {
      setBackupError(null);
      setBackupFile(file);
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Die Datei enthält kein gültiges JSON-Format.');
      }
      setBackupData(parsed);
      sounds.playSuccess();
    } catch (err: any) {
      setBackupError('Fehler beim Lesen der Backup-Datei: ' + (err?.message || 'Ungültiges Format'));
      sounds.playError();
    }
  };

  const handleExecuteRestore = async () => {
    if (!backupData) return;
    setIsRestoringBackup(true);
    sounds.playOpen();
    try {
      const ok = await restoreFullBackup(backupData);
      if (ok) {
        setRestoreSuccess(true);
        sounds.playSyncSuccess();
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1200);
      } else {
        setBackupError('Wiederherstellung fehlgeschlagen. Bitte prüfe die Sicherungsdatei.');
        sounds.playError();
      }
    } catch (e: any) {
      setBackupError('Fehler: ' + (e?.message || 'Unbekannter Fehler'));
      sounds.playError();
    } finally {
      setIsRestoringBackup(false);
    }
  };

  // -------------------------------------------------------------
  // STEP 5: Konto & Authentifizierung
  // -------------------------------------------------------------
  const [accountMode, setAccountMode] = useState<'create' | 'existing'>('create');
  const [fullName, setFullName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [formError, setFormError] = useState('');

  // Auto-generate short account name (e.g. "Alex Thorne" -> "alex")
  const handleFullNameChange = (val: string) => {
    setFullName(val);
    const slug = val
      .toLowerCase()
      .replace(/[äÄ]/g, 'ae')
      .replace(/[öÖ]/g, 'oe')
      .replace(/[üÜ]/g, 'ue')
      .replace(/[ß]/g, 'ss')
      .replace(/[^a-z0-9]/g, '');
    setAccountName(slug);
  };

  // -------------------------------------------------------------
  // STEP 6: Sicherheit & Verschlüsselung (Optic ID)
  // -------------------------------------------------------------
  const [opticIdStatus, setOpticIdStatus] = useState<'idle' | 'scanning' | 'completed' | 'skipped'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  const handleStartOpticScan = () => {
    sounds.playClick();
    setOpticIdStatus('scanning');
    setScanProgress(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 8;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setScanProgress(100);
        setOpticIdStatus('completed');
        sounds.playSuccess();
      } else {
        setScanProgress(current);
      }
    }, 120);
  };

  // -------------------------------------------------------------
  // STEP 7: Ortung, Diagnose & Dienste
  // -------------------------------------------------------------
  const [locationServices, setLocationServices] = useState(true);
  const [cameraMicProtection, setCameraMicProtection] = useState(true);
  const [screenTimeSync, setScreenTimeSync] = useState(true);
  const [diagnosticReports, setDiagnosticReports] = useState(true);

  // -------------------------------------------------------------
  // STEP 8: Personalisierung & Finale
  // -------------------------------------------------------------
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'glassy' | 'auto'>('dark');
  const [selectedAccent, setSelectedAccent] = useState<AccentColorId>('violet-classic');
  const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperId>('obsidian-dark');
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Load cloud accounts for direct login
  useEffect(() => {
    FirebaseService.fetchUsersRegistry().then((res) => {
      if (res.success && res.users && res.users.length > 0) {
        setCloudUsers(res.users);
        if (!directLoginUserId) {
          setDirectLoginUserId(res.users[0].id);
        }
      }
    });
  }, []);

  // Step Navigation Validation
  const handleNext = () => {
    sounds.playClick();
    setFormError('');

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (migrationMode === 'cloud_account' && cloudUsers.length > 0) {
        setIsDirectLoginOpen(true);
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (!fullName.trim()) {
        setFormError('Bitte gib deinen vollständigen Namen ein.');
        sounds.playError();
        return;
      }
      if (!accountName.trim()) {
        setFormError('Bitte gib einen Kurznamen für den Benutzerordner an.');
        sounds.playError();
        return;
      }
      if (password.length > 0 && password.length < 4) {
        setFormError('Das Passwort muss mindestens 4 Zeichen lang sein.');
        sounds.playError();
        return;
      }
      if (password !== confirmPassword) {
        setFormError('Die Passwort-Bestätigung stimmt nicht überein.');
        sounds.playError();
        return;
      }
      if (!termsAccepted) {
        setFormError('Bitte akzeptiere die ObsidianOS Lizenzvereinbarung.');
        sounds.playError();
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      setCurrentStep(7);
    } else if (currentStep === 7) {
      setCurrentStep(8);
    }
  };

  const handleBack = () => {
    sounds.playClick();
    setFormError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SetupStep);
    }
  };

  const handleLaunchOS = async () => {
    setIsFinalizing(true);
    sounds.playSuccess();

    try {
      const finalWallpaper: WallpaperId =
        selectedWallpaper || (themeMode === 'light' ? 'obsidian-light' : 'obsidian-dark');
      const finalPhotoId =
        selectedWallpaper.startsWith('photo-')
          ? selectedWallpaper
          : themeMode === 'light'
          ? 'photo-obsidian-light'
          : 'photo-obsidian-dark';

      await completeSetup(
        {
          displayName: fullName.trim() || 'Obsidian Benutzer',
          username: accountName.trim().toLowerCase() || 'user',
          pin: password,
          avatar: selectedAvatar,
          role: 'Administrator',
          bio: passwordHint ? `Hinweis: ${passwordHint}` : 'ObsidianOS Hauptbenutzer',
        },
        {
          themeMode: themeMode,
          accentColor: selectedAccent,
          wallpaper: finalWallpaper,
          desktopWallpaperMode: 'photo',
          desktopPhotoId: finalPhotoId,
          lockscreenMode: 'fixed',
          lockscreenFixedPhotoId: finalPhotoId,
          soundEffects: true,
        }
      );
      if (onComplete) onComplete();
    } catch (e) {
      setIsFinalizing(false);
    }
  };

  const handleExecuteDirectLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDirectLoginError('');
    setIsDirectLoggingIn(true);

    try {
      const targetId = directLoginUserId || (cloudUsers[0] ? cloudUsers[0].id : '');
      const success = await loginExistingAccount(targetId, directLoginPin);
      if (success) {
        sounds.playSuccess();
        if (onComplete) onComplete();
      } else {
        setDirectLoginError('Ungültige PIN oder Benutzer nicht gefunden.');
        sounds.playError();
      }
    } catch (err: any) {
      setDirectLoginError('Anmeldung fehlgeschlagen: ' + (err?.message || 'Fehler'));
      sounds.playError();
    } finally {
      setIsDirectLoggingIn(false);
    }
  };

  const stepTitles: Record<SetupStep, { title: string; subtitle: string }> = {
    1: { title: t('step1Title', 'Land, Region & Tastatur'), subtitle: t('step1Subtitle', 'System-Lokalisierung und Eingabemethoden') },
    2: { title: t('step2Title', 'Barrierefreiheit'), subtitle: t('step2Subtitle', 'Eingabe- und Sehhilfen konfigurieren') },
    3: { title: t('step3Title', 'Netzwerkverbindung'), subtitle: t('step3Subtitle', 'Internet & Cloud-Infrastruktur verbinden') },
    4: { title: t('step4Title', 'Datenübertragung'), subtitle: t('step4Subtitle', 'Migrationsassistent für Backups & Accounts') },
    5: { title: t('step5Title', 'Konto & Authentifizierung'), subtitle: t('step5Subtitle', 'Computer-Account und Lizenzbedingungen') },
    6: { title: t('step6Title', 'Sicherheit & Verschlüsselung'), subtitle: t('step6Subtitle', 'Optic ID Augenscan für biometrischen Login') },
    7: { title: t('step7Title', 'Ortung, Diagnose & Dienste'), subtitle: t('step7Subtitle', 'Hintergrunddienste & Datenschutz') },
    8: { title: t('step8Title', 'Personalisierung & Finale'), subtitle: t('step8Subtitle', 'UI-Erscheinungsbild und Systemstart') },
  };

  // Theme mode detection for dynamic transitions
  const isLightTheme = themeMode === 'light';
  const isGlassyTheme = themeMode === 'glassy';

  // Wallpaper dynamically adapts based on theme mode and wallpaper selection
  const assistantBgUrl = useMemo(() => {
    if (selectedWallpaper === 'photo-user-colorful' || selectedWallpaper === 'user-colorful') {
      return OBSIDIAN_DEFAULT_WALLPAPERS.userColorful;
    }
    if (selectedWallpaper === 'photo-user-dark-purple' || selectedWallpaper === 'user-dark-purple') {
      return OBSIDIAN_DEFAULT_WALLPAPERS.userDarkPurple;
    }
    if (themeMode === 'light') {
      return OBSIDIAN_DEFAULT_WALLPAPERS.light;
    }
    return OBSIDIAN_DEFAULT_WALLPAPERS.dark;
  }, [themeMode, selectedWallpaper]);

  const noiseSvgData =
    "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E";

  // Dynamic card container classes based on selected theme with enhanced light mode contrast
  const cardContainerClass = isLightTheme
    ? 'bg-white/95 border border-black/15 shadow-[0_30px_100px_rgba(0,0,0,0.18)] text-zinc-950 backdrop-blur-2xl'
    : isGlassyTheme
    ? 'bg-white/10 border border-white/20 shadow-[0_30px_100px_rgba(0,0,0,0.55)] text-white backdrop-blur-3xl'
    : 'bg-[#141520]/80 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.85)] text-zinc-100 backdrop-blur-3xl';

  return (
    <AnimatePresence mode="wait">
      {showWelcomeIntro ? (
        <CrystalWelcomeScreen
          key="setup-crystal-intro"
          onStart={() => setShowWelcomeIntro(false)}
          accentColor={accentConfig.primary}
        />
      ) : (
        <motion.div
          key="setup-assistant-main-view"
          initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)', transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 select-none overflow-hidden font-sans"
        >
          {/* Background: Obsidian wallpaper that adapts to Hell / Dunkel / Glassy */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.img
                key={assistantBgUrl}
                src={assistantBgUrl}
                alt="Obsidian Background"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: isLightTheme ? 0.85 : 0.72, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className="absolute inset-0 w-full h-full object-cover filter blur-[22px] scale-105"
              />
            </AnimatePresence>
            {/* Soft Noise Overlay Texture */}
            <div
              className="absolute inset-0 mix-blend-overlay opacity-25 pointer-events-none"
              style={{ backgroundImage: `url("${noiseSvgData}")` }}
            />
            {/* Vignette Depth Gradient */}
            <div
              className={`absolute inset-0 transition-colors duration-700 ${
                isLightTheme
                  ? 'bg-gradient-to-b from-white/20 via-black/10 to-black/35'
                  : 'bg-gradient-to-b from-black/25 via-black/45 to-black/80'
              }`}
            />
          </div>

          {/* Top Floating Actions: Direct Login Button */}
          <div className="absolute top-5 right-6 z-20 flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setIsDirectLoginOpen(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold backdrop-blur-xl shadow-lg transition-all ${
                isLightTheme
                  ? 'bg-black/5 hover:bg-black/10 border border-black/15 text-zinc-900'
                  : 'bg-white/10 hover:bg-white/20 border border-white/15 text-zinc-200'
              }`}
            >
              <LogIn className="w-3.5 h-3.5 text-purple-500" />
              <span>{t('btnExistingAccount', 'Bestehenden Account anmelden')}</span>
            </button>
          </div>

          {/* Setup Card Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`relative w-full max-w-[840px] h-[590px] rounded-[38px] sm:rounded-[44px] flex flex-col overflow-hidden transition-all duration-500 ${cardContainerClass}`}
          >
            {/* Top Header */}
            <div className="px-7 pt-5 pb-1 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] shadow-sm"
                  style={{ backgroundColor: accentConfig.primary }}
                >
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className={`text-xs font-bold tracking-wide uppercase ${isLightTheme ? 'text-zinc-800' : 'text-zinc-300'}`}>
                  {t('assistantTitle', 'ObsidianOS Assistent')}
                </span>
              </div>

              {/* API Translation indicator pill */}
              {isTranslating ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Übersetze Assistent...</span>
                </div>
              ) : selectedCountry.lang !== 'de' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                  <Globe className="w-3 h-3" />
                  <span>{selectedCountry.flag} {selectedCountry.name} ({selectedCountry.lang.toUpperCase()})</span>
                </div>
              ) : null}
            </div>

            {/* Stage Content Area (Fixed layout, absolute NO scrollbar) */}
            <div className="flex-1 px-8 py-2 flex flex-col justify-between overflow-hidden">
              {/* Header Title & Subtitle */}
              <div className="text-center space-y-1 mb-2 shrink-0">
                <h2 className={`text-xl font-bold tracking-tight ${isLightTheme ? 'text-zinc-950' : 'text-white'}`}>
                  {stepTitles[currentStep].title}
                </h2>
                <p className={`text-xs ${isLightTheme ? 'text-zinc-700 font-medium' : 'text-zinc-400'}`}>
                  {stepTitles[currentStep].subtitle}
                </p>
              </div>

              {/* Step 1: Land, Region & Tastatur */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Country List with API & Search */}
                    <div className="space-y-1.5 flex flex-col h-[280px]">
                      <div className="flex items-center justify-between">
                        <label className={`text-[11px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          {t('chooseCountry', 'Heimatland wählen')}
                        </label>
                        <span className={`text-[10px] font-mono ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                          {filteredCountries.length} verfügbar
                        </span>
                      </div>

                      {/* Search Bar for countries */}
                      <div className="relative mb-1">
                        <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLightTheme ? 'text-zinc-500' : 'text-zinc-400'}`} />
                        <input
                          type="text"
                          value={countrySearchQuery}
                          onChange={(e) => setCountrySearchQuery(e.target.value)}
                          placeholder={t('searchCountry', 'Land suchen...')}
                          className={`w-full pl-8 pr-3 py-1.5 rounded-full text-xs transition-all ${
                            isLightTheme
                              ? 'bg-black/[0.04] border border-black/15 text-zinc-950 placeholder-zinc-500 focus:bg-white focus:border-purple-600'
                              : 'bg-black/40 border border-white/10 text-white placeholder-zinc-500 focus:border-purple-500'
                          } focus:outline-none`}
                        />
                      </div>

                      <div className="space-y-1 overflow-y-auto flex-1 pr-1">
                        {filteredCountries.map((c) => {
                          const isSelected = selectedCountry.id === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCountry(c)}
                              className={`w-full px-3.5 py-2 rounded-full text-xs flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white font-semibold shadow-md'
                                  : isLightTheme
                                  ? 'bg-black/[0.04] border border-black/10 text-zinc-900 hover:bg-black/[0.08]'
                                  : 'bg-white/[0.03] border border-white/5 text-zinc-300 hover:bg-white/[0.07]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base">{c.flag}</span>
                                <span className="truncate">{c.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Predefined regional settings & Languages */}
                    <div className={`space-y-2.5 border rounded-3xl p-4 flex flex-col justify-between ${
                      isLightTheme
                        ? 'bg-black/[0.02] border-black/10 text-zinc-900'
                        : 'bg-white/[0.02] border-white/10 text-white'
                    }`}>
                      <div className="space-y-2">
                        <span className={`text-[11px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-800 font-bold' : 'text-zinc-400'}`}>
                          {t('regionalSettings', 'Automatische Regionaleinstellungen')}
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`p-2.5 rounded-2xl border ${
                            isLightTheme ? 'bg-white border-black/10 text-zinc-950 shadow-sm' : 'bg-black/30 border-white/5 text-white'
                          }`}>
                            <span className={`text-[10px] block ${isLightTheme ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>
                              {t('currency', 'Währung')}
                            </span>
                            <span className="font-bold">{selectedCountry.currency}</span>
                          </div>
                          <div className={`p-2.5 rounded-2xl border ${
                            isLightTheme ? 'bg-white border-black/10 text-zinc-950 shadow-sm' : 'bg-black/30 border-white/5 text-white'
                          }`}>
                            <span className={`text-[10px] block ${isLightTheme ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>
                              {t('units', 'Maßeinheiten')}
                            </span>
                            <span className="font-bold">
                              {selectedCountry.units === 'metric' ? 'Metrisch (km, °C)' : 'Imperial (mi, °F)'}
                            </span>
                          </div>
                          <div className={`p-2.5 rounded-2xl border ${
                            isLightTheme ? 'bg-white border-black/10 text-zinc-950 shadow-sm' : 'bg-black/30 border-white/5 text-white'
                          }`}>
                            <span className={`text-[10px] block ${isLightTheme ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>
                              {t('dateFormat', 'Datumsformat')}
                            </span>
                            <span className="font-bold">{selectedCountry.dateFormat}</span>
                          </div>
                          <div className={`p-2.5 rounded-2xl border ${
                            isLightTheme ? 'bg-white border-black/10 text-zinc-950 shadow-sm' : 'bg-black/30 border-white/5 text-white'
                          }`}>
                            <span className={`text-[10px] block ${isLightTheme ? 'text-zinc-600 font-medium' : 'text-zinc-400'}`}>
                              {t('keyboardLayout', 'Tastaturlayout')}
                            </span>
                            <span className={`font-bold ${isLightTheme ? 'text-purple-700' : 'text-purple-300'}`}>
                              {keyboardLayout === 'de' ? 'QWERTZ (DE)' : keyboardLayout === 'ch' ? 'QWERTZ (CH)' : 'QWERTY (US)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* API Translation status chip */}
                      <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-[11px] ${
                        isLightTheme ? 'bg-purple-50 border-purple-200 text-purple-950' : 'bg-purple-950/30 border-purple-500/20 text-purple-200'
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-500" />
                          <span className="font-medium">Sprache: {selectedCountry.lang.toUpperCase()}</span>
                        </div>
                        {isTranslating ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-purple-600">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Übersetze via API...
                          </span>
                        ) : selectedCountry.lang !== 'de' ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            ✓ Übersetzt via API
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">Deutsch (Original)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Step 2: Barrierefreiheit (Eingabe- und Sehhilfen) */}
          {currentStep === 2 && (
            <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                {/* Sehschärfe */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">Sehschärfe</span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>VoiceOver Screenreader</span>
                        <input
                          type="checkbox"
                          checked={voiceOver}
                          onChange={(e) => setVoiceOver(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>Bildschirmlupe / Zoom</span>
                        <input
                          type="checkbox"
                          checked={screenZoom}
                          onChange={(e) => setScreenZoom(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>Vergrößerter Text</span>
                        <input
                          type="checkbox"
                          checked={largeText}
                          onChange={(e) => setLargeText(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 block">Sofort anpassbar</span>
                </div>

                {/* Motorik & Sprache */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sliders className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Motorik & Sprache</span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>Schaltersteuerung</span>
                        <input
                          type="checkbox"
                          checked={switchControl}
                          onChange={(e) => setSwitchControl(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span className="flex items-center gap-1.5">
                          <Mic className="w-3.5 h-3.5 text-purple-400" />
                          <span>Diktierfunktion</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={dictationEnabled}
                          onChange={(e) => setDictationEnabled(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                      <div className="p-2 rounded-xl bg-black/30 border border-white/5 text-[11px] text-zinc-400 leading-snug">
                        Diktieren von Texten & Sprachsteuerung ohne Tastatur.
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 block">Optimierte Eingabehilfen</span>
                </div>

                {/* Gehör */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Gehör</span>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>Live-Untertitel</span>
                        <input
                          type="checkbox"
                          checked={liveCaptions}
                          onChange={(e) => setLiveCaptions(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
                        <span>Blitzlicht bei Signalton</span>
                        <input
                          type="checkbox"
                          checked={flashAlerts}
                          onChange={(e) => setFlashAlerts(e.target.checked)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-2 block">Visuelle Signale</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Möchtest du diese Optionen jetzt überspringen und Standardwerte beibehalten?</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setCurrentStep(3);
                  }}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
                >
                  Jetzt überspringen
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Netzwerkverbindung (Internet & Infrastruktur) */}
          {currentStep === 3 && (
            <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                {/* Available Networks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      WLAN-Netzwerke in Reichweite
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Aktiv
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {[
                      { name: detectedWifiName, type: 'wifi', signal: 'Ausgezeichnet', secure: true },
                      { name: 'Obsidian_Mesh_5G', type: 'wifi', signal: 'Sehr gut', secure: true },
                      { name: 'Eduroam_Campus_Air', type: 'wifi', signal: 'Gut', secure: true },
                      { name: 'Ethernet / Kabelgebunden (10 Gbps)', type: 'ethernet', signal: 'Kabel', secure: false },
                    ].map((net) => {
                      const isSelected = selectedNetwork === net.name;
                      return (
                        <button
                          key={net.name}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedNetwork(net.name);
                            if (net.type === 'ethernet') setConnectionType('ethernet');
                            else setConnectionType('wifi');
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-purple-600/30 border border-purple-500/60 text-white font-semibold'
                              : 'bg-white/[0.03] border border-white/5 text-zinc-300 hover:bg-white/[0.07]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {net.type === 'wifi' ? (
                              <Wifi className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            ) : (
                              <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            )}
                            <span className="truncate">{net.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {net.secure && <Lock className="w-3 h-3 text-zinc-500" />}
                            {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Network Credentials & Status */}
                <div className="space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                      Authentifizierung für {selectedNetwork}
                    </span>
                    <div>
                      <label className="text-[11px] text-zinc-400 block mb-1">
                        WLAN-Passwort (WPA3 / Pre-Shared Key)
                      </label>
                      <input
                        type="password"
                        value={networkPassword}
                        onChange={(e) => setNetworkPassword(e.target.value)}
                        placeholder="Netzwerkschlüssel eingeben"
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Online via {selectedNetwork}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400/80">Latenz: 14ms</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestConnect}
                    className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2"
                  >
                    {networkStatus === 'connecting' ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verbindung wird geprüft...</span>
                      </>
                    ) : (
                      <>
                        <Radio className="w-3.5 h-3.5 text-purple-400" />
                        <span>Verbindung neu testen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Datenübertragung (Migrationsassistent) */}
          {currentStep === 4 && (
            <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
              <div className="grid grid-cols-3 gap-3">
                {/* Option 1: ObsidianOS Account */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMigrationMode('cloud_account');
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    migrationMode === 'cloud_account'
                      ? 'bg-purple-600/25 border-purple-500/70 text-white shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">ObsidianOS Account</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Lade Einstellungen, Desktop-Symbole und Cloud-Dateien von einem bestehenden Profil.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-purple-300">
                    <span>Cloud-Sync bereit</span>
                    {migrationMode === 'cloud_account' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                  </div>
                </button>

                {/* Option 2: Time Machine / Backup */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMigrationMode('time_machine');
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    migrationMode === 'time_machine'
                      ? 'bg-purple-600/25 border-purple-500/70 text-white shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-300">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Time-Machine-Backup</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Stelle Systemabbild von einem virtuellen Snapshot oder externem Datenträger wieder her.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-blue-300">
                    <span>Snapshot-Import</span>
                    {migrationMode === 'time_machine' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>

                {/* Option 3: Not now / Fresh */}
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setMigrationMode('none');
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    migrationMode === 'none'
                      ? 'bg-purple-600/25 border-purple-500/70 text-white shadow-md'
                      : 'bg-white/[0.03] border-white/10 text-zinc-300 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">Jetzt nicht übertragen</h3>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Konfiguriere diesen Computer als vollkommen frisches, sauberes ObsidianOS System.
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-emerald-300">
                    <span>Empfohlen (Neu)</span>
                    {migrationMode === 'none' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                </button>
              </div>

              {migrationMode === 'cloud_account' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between">
                  <span>Es wurden {cloudUsers.length} synchronisierte Profile im Netzwerk gefunden.</span>
                  <button
                    type="button"
                    onClick={() => setIsDirectLoginOpen(true)}
                    className="px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold text-xs shadow-sm hover:bg-purple-500"
                  >
                    Profil auswählen
                  </button>
                </div>
              )}

              {migrationMode === 'time_machine' && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleBackupFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isDraggingFile
                      ? 'bg-blue-600/30 border-blue-400 scale-[1.01]'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.obsidianbackup,.obsidianvault"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleBackupFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  {backupError && (
                    <div className="mb-2 p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{backupError}</span>
                    </div>
                  )}

                  {restoreSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>System erfolgreich wiederhergestellt! Startet...</span>
                      </div>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    </div>
                  ) : backupData ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0">
                          <FileArchive className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {backupFile?.name || 'Sicherungsdatei geladen'}
                          </p>
                          <p className="text-[10px] text-zinc-400 font-mono">
                            {backupData.version ? `Version: ${backupData.version} • ` : ''}
                            {backupData.timestamp
                              ? new Date(backupData.timestamp).toLocaleDateString()
                              : 'Gültiges Backup'}{' '}
                            ({Math.round((backupFile?.size || 1024) / 1024)} KB)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setBackupData(null);
                            setBackupFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 text-xs"
                        >
                          Andere Datei
                        </button>
                        <button
                          type="button"
                          disabled={isRestoringBackup}
                          onClick={handleExecuteRestore}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {isRestoringBackup ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Wiederherstellen...</span>
                            </>
                          ) : (
                            <>
                              <HardDrive className="w-3.5 h-3.5" />
                              <span>Jetzt wiederherstellen</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-zinc-200">
                            Time-Machine-Sicherungsdatei (.json oder .obsidianbackup)
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            Hierhin ziehen oder per Klick aus dem Dateisystem auswählen
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          fileInputRef.current?.click();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white font-medium text-xs shadow transition-all flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Datei auswählen</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Konto & Authentifizierung */}
          {currentStep === 5 && (
            <div className="flex-1 flex flex-col justify-center gap-2.5 overflow-hidden">
              {formError && (
                <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Left: Name, Username & Avatar */}
                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Vollständiger Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => handleFullNameChange(e.target.value)}
                      placeholder="z. B. Alex Thorne"
                      className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                      Account-Name (Kurzname für den /Users/ Ordner)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="z. B. alex"
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                      Pfad: ~/Users/{accountName || 'username'}
                    </span>
                  </div>

                  {/* Avatar Picker Quick Preview */}
                  <div>
                    <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                      Profilbild auswählen
                    </label>
                    <div className="flex gap-2">
                      {AVATAR_PRESETS.slice(0, 5).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedAvatar(preset.url);
                          }}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                            selectedAvatar === preset.url
                              ? 'border-purple-500 ring-2 ring-purple-500/40 scale-105'
                              : 'border-white/10 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Password, Hint & Terms */}
                <div className="space-y-2.5 bg-white/[0.02] border border-white/10 rounded-2xl p-3.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-zinc-300">Passwort</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[10px] text-purple-400 hover:text-purple-300"
                        >
                          {showPassword ? 'Verbergen' : 'Anzeigen'}
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mindestens 4 Zeichen"
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Passwort wiederholen
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Passwort bestätigen"
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-300 block mb-1">
                        Passwort-Hinweis (Optional)
                      </label>
                      <input
                        type="text"
                        value={passwordHint}
                        onChange={(e) => setPasswordHint(e.target.value)}
                        placeholder="z. B. Name meines Haustiers"
                        className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Terms Checkbox & Modal Trigger */}
                  <div className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-[10px] text-zinc-400 leading-snug">
                        Ich akzeptiere die{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            sounds.playClick();
                            setIsLicenseModalOpen(true);
                          }}
                          className="text-purple-300 font-semibold underline hover:text-purple-200"
                        >
                          ObsidianOS Lizenzvereinbarung (EULA)
                        </button>{' '}
                        und die Datenschutz- und Cloud-Bedingungen.
                      </span>
                    </label>

                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setIsLicenseModalOpen(true);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 text-[10px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3 h-3 text-purple-400" />
                        <span>Lizenzvereinbarung ansehen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Sicherheit & Verschlüsselung (Optic ID) */}
          {currentStep === 6 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 overflow-hidden">
              <OpticIDScanner
                accentColor={accentConfig.primary}
                isScanning={opticIdStatus === 'scanning'}
                status={opticIdStatus}
                onStartScan={() => {
                  setOpticIdStatus('scanning');
                }}
                onScanComplete={() => {
                  setOpticIdStatus('completed');
                }}
              />

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-3 pt-1">
                {opticIdStatus !== 'completed' ? (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setOpticIdStatus('skipped');
                      setCurrentStep(7);
                    }}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-zinc-300 transition-colors"
                  >
                    Später in Systemeinstellungen einrichten
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setCurrentStep(7);
                    }}
                    className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md transition-all flex items-center gap-2"
                  >
                    <span>Weiter zur Konfiguration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Ortung, Diagnose & Dienste */}
          {currentStep === 7 && (
            <div className="flex-1 flex flex-col justify-center gap-2.5 overflow-hidden">
              <div className="grid grid-cols-2 gap-3">
                {/* Ortungsdienste */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ortungsdienste</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Erlaube Standortzugriff für Wetterberichte, genaue Zeitzone und lokale Karten.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationServices(!locationServices)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      locationServices ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        locationServices ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Kamera & Mikrofon Schutz */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kamera & Mikrofon</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Explizite Freigabe erforderlich, bevor Web-Apps oder Spiele Sensoren nutzen dürfen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraMicProtection(!cameraMicProtection)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      cameraMicProtection ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        cameraMicProtection ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Bildschirmzeit (Screen Time) */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Bildschirmzeit (Screen Time)</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Nutzungsverfolgung und Auswertungen synchronisieren für digitale Balance.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreenTimeSync(!screenTimeSync)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      screenTimeSync ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        screenTimeSync ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Diagnoseberichte */}
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Diagnose & Telemetrie</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      Anonyme Leistungsdaten teilen, um Systemabstürze automatisch zu beheben.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDiagnosticReports(!diagnosticReports)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                      diagnosticReports ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        diagnosticReports ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Personalisierung & Finale */}
          {currentStep === 8 && (
            <div className="flex-1 flex flex-col justify-center gap-3 overflow-hidden">
              {/* Theme Mode Selector (Hell, Dunkel, glassy oder Automatisch) */}
              <div className="space-y-1.5">
                <label className={`text-[11px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Erscheinungsbild wählen
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { id: 'light', name: 'Hell', desc: 'Klares Lichtdesign' },
                    { id: 'dark', name: 'Dunkel', desc: 'Obsidian Noir' },
                    { id: 'glassy', name: 'Glassy', desc: 'VisionOS Frosted' },
                    { id: 'auto', name: 'Automatisch', desc: 'Tageszeitbasiert' },
                  ].map((t) => {
                    const isSelected = themeMode === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          const nextMode = t.id as any;
                          setThemeMode(nextMode);
                          if (nextMode === 'light') {
                            setSelectedWallpaper('obsidian-light');
                          } else {
                            setSelectedWallpaper('obsidian-dark');
                          }
                        }}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-purple-600/30 border-purple-500 text-white shadow-md font-semibold'
                            : isLightTheme
                            ? 'bg-black/[0.04] border-black/10 text-zinc-700 hover:text-zinc-950 hover:bg-black/[0.07]'
                            : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isLightTheme ? (isSelected ? 'text-white' : 'text-zinc-900') : 'text-white'}`}>{t.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                        </div>
                        <span className={`text-[10px] block leading-tight ${isLightTheme ? (isSelected ? 'text-purple-100' : 'text-zinc-500') : 'text-zinc-400'}`}>{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-1.5">
                <label className={`text-[11px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  System-Akzentfarbe
                </label>
                <div className="flex items-center gap-2.5">
                  {[
                    { id: 'violet-classic', name: 'Obsidian Violett', color: '#a855f7' },
                    { id: 'electric-blue', name: 'Azurblau', color: '#3b82f6' },
                    { id: 'emerald-matrix', name: 'Matrix Smaragd', color: '#10b981' },
                    { id: 'rose-quartz', name: 'Roségold', color: '#f43f5e' },
                    { id: 'sunset-amber', name: 'Bernstein', color: '#f59e0b' },
                  ].map((acc) => {
                    const isSelected = selectedAccent === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedAccent(acc.id as AccentColorId);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                          isSelected
                            ? isLightTheme
                              ? 'bg-black/10 border-black/30 text-zinc-950 font-semibold'
                              : 'bg-white/15 border-white/40 text-white font-semibold'
                            : isLightTheme
                            ? 'bg-black/[0.03] border-black/10 text-zinc-600 hover:text-zinc-900'
                            : 'bg-black/30 border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                        <span>{acc.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Wallpaper Selection (including uploaded pictures) */}
              <div className="space-y-1.5">
                <label className={`text-[11px] font-semibold uppercase tracking-wider block ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Hintergrundbild
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      id: 'obsidian-dark',
                      name: 'Obsidian Dunkel',
                      thumb: OBSIDIAN_DEFAULT_WALLPAPERS.dark,
                    },
                    {
                      id: 'obsidian-light',
                      name: 'Obsidian Hell',
                      thumb: OBSIDIAN_DEFAULT_WALLPAPERS.light,
                    },
                    {
                      id: 'photo-user-colorful',
                      name: 'Korn & Farben (Upload)',
                      thumb: OBSIDIAN_DEFAULT_WALLPAPERS.userColorful,
                    },
                    {
                      id: 'photo-user-dark-purple',
                      name: 'Dunkles Violett (Upload)',
                      thumb: OBSIDIAN_DEFAULT_WALLPAPERS.userDarkPurple,
                    },
                  ].map((wp) => {
                    const isSelected = selectedWallpaper === wp.id;
                    return (
                      <button
                        key={wp.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setSelectedWallpaper(wp.id as any);
                        }}
                        className={`group relative h-16 rounded-xl overflow-hidden border text-left transition-all ${
                          isSelected
                            ? 'ring-2 ring-purple-500 border-white'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        <img
                          src={wp.thumb}
                          alt={wp.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                          <span className="text-[10px] font-semibold text-white truncate drop-shadow">
                            {wp.name}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 p-0.5 rounded-full bg-purple-600 text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ready Summary Card */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between transition-colors ${
                isLightTheme
                  ? 'bg-black/[0.03] border-black/10'
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isLightTheme ? 'text-zinc-900' : 'text-white'}`}>Alles bereit für den Start!</h4>
                    <p className={`text-[11px] ${isLightTheme ? 'text-zinc-600' : 'text-zinc-400'}`}>
                      Klicke unten rechts auf „ObsidianOS starten“, um deinen konfigurierten Desktop zu laden.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Controls Bar */}
        <div className={`px-8 py-4 border-t flex items-center justify-between shrink-0 transition-colors ${
          isLightTheme
            ? 'border-black/10 bg-black/[0.03]'
            : isGlassyTheme
            ? 'border-white/15 bg-white/5'
            : 'border-white/10 bg-black/20'
        }`}>
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handleBack}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all ${
              isLightTheme
                ? 'text-zinc-800 hover:text-zinc-950 hover:bg-black/10 border border-black/10'
                : 'text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('btnBack', 'Zurück')}</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {([1, 2, 3, 4, 5, 6, 7, 8] as SetupStep[]).map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep === stepNum ? 'w-5 bg-purple-400' : 'w-1.5 bg-white/20'
                }`}
                style={currentStep === stepNum ? { backgroundColor: accentConfig.primary } : undefined}
              />
            ))}
          </div>

          {currentStep < 8 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-7 py-2.5 rounded-full text-xs font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: accentConfig.primary,
                boxShadow: `0 8px 20px ${accentConfig.glow}`,
              }}
            >
              <span>{t('btnContinue', 'Fortfahren')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isFinalizing}
              onClick={handleLaunchOS}
              className="flex items-center gap-2 px-8 py-3 rounded-full text-xs font-bold text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
              style={{
                backgroundColor: ACCENT_COLORS[selectedAccent]?.primary || '#9333ea',
                boxShadow: `0 8px 25px ${ACCENT_COLORS[selectedAccent]?.glow || 'rgba(147,51,234,0.6)'}`,
              }}
            >
              {isFinalizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t('settingUpDesktop', 'Richte Desktop ein...')}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t('btnStartOS', 'ObsidianOS starten')}</span>
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Direct Login Modal Overlay for Existing Cloud Accounts */}
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
              className="w-full max-w-md p-6 rounded-3xl bg-[#181924] border border-white/20 shadow-2xl text-zinc-100 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Bestehendes Konto anmelden</h3>
                    <p className="text-[11px] text-zinc-400">Lade deine Cloud-Daten und Einstellungen.</p>
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
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{directLoginError}</span>
                </div>
              )}

              <form onSubmit={handleExecuteDirectLogin} className="space-y-4">
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

      {/* License Agreement (EULA) Modal */}
      <LicenseAgreementModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setIsLicenseModalOpen(false);
          sounds.playSuccess();
        }}
        accentColor={accentConfig.primary}
      />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
