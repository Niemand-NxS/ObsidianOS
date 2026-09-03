import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppId,
  UserProfile,
  PersonalizationSettings,
  WindowState,
  SnapTarget,
  FileItem,
  CloudSyncState,
  SystemNotification,
  AccentColorConfig,
  MediaPlaybackState,
} from '../types';
import { ACCENT_COLORS, APPS_REGISTRY } from '../config/themeConfig';
import { INITIAL_FILES } from '../services/fileSystemService';
import { CryptoService } from '../services/cryptoService';
import { FirebaseService } from '../services/firebaseService';
import { CookieStorage } from '../utils/cookieStorage';
import { sounds } from '../services/soundService';

const DEFAULT_USERS: UserProfile[] = [];

const DEFAULT_SETTINGS: PersonalizationSettings = {
  themeMode: 'dark',
  glassOpacity: 65,
  glassContrast: 'auto',
  iconStyle: 'auto',
  iconGlassOpacity: 55,
  iconGlassBlur: 20,
  iconRadius: 'rounded-2xl',
  iconGlow: true,
  wallpaper: 'obsidian-dark',
  accentColor: 'violet-classic',
  desktopWallpaperMode: 'photo',
  desktopPhotoId: 'photo-obsidian-dark',
  desktopBlur: 0,
  desktopDimming: 0,
  desktopShowGlanceWidget: true,
  desktopGlancePosition: {
    x: 28,
    y: typeof window !== 'undefined' ? Math.max(100, window.innerHeight - 220) : 560,
  },
  desktopGlanceStyle: 'glass-compact',
  desktopWidgetType: 'clock',
  desktopQuickNoteText: 'ObsidianOS Schreibtisch: Klicke hier für schnelle Notizen.',
  desktopIconSize: 'medium',
  desktopGridSpacing: 'comfortable',
  desktopShowIconLabels: true,
  desktopIconClickMode: 'double',
  desktopPinnedAppIds: ['files', 'browser', 'notes', 'gallery', 'music', 'settings'],
  lockscreenMode: 'fixed',
  lockscreenFixedPhotoId: 'photo-obsidian-dark',
  lockscreenShaderId: 'shader-obsidian',
  lockscreenCategory: 'all',
  lockscreenBlur: 0,
  lockscreenDimming: 35,
  lockscreenShowClock: true,
  lockscreenShowPhotoInfo: true,
  clockFont: 'sans-ultralight',
  clockSize: 'normal',
  clockShowSeconds: false,
  clockShowDate: true,
  clockTimeAnimation: 'fade',
  unlockAnimation: 'zoom-burst',
  dockPosition: 'bottom',
  dockSize: 'medium',
  dockMagnification: true,
  dockAutoHide: false,
  glassBlur: 24,
  glassBlurEnabled: true,
  windowButtonsPosition: 'right',
  animationsEnabled: true,
  soundEffects: true,
  soundVolume: 75,
  typingSounds: true,
  notificationSounds: true,
  clockFormat24h: true,
  fontSize: 'medium',
  windowGlow: 80,
  windowRadius: 16,
  brightness: 100,
  nightShift: false,
  desktopGridSnap: true,
  showIconLabels: true,
  lockDesktopIcons: false,
  uiScale: 'default',
  contrastMode: 'normal',
  autoLockMinutes: 15,
  gpuAcceleration: true,
};

const DEFAULT_CLOUD_SYNC: CloudSyncState = {
  isConfigured: true,
  autoSync: true,
  syncIntervalMinutes: 5,
  isSyncing: false,
  lastSyncedAt: Date.now() - 1000 * 60 * 12,
  encryptionAlgorithm: 'AES-256-GCM',
  keyDerivation: 'PBKDF2-SHA256 (100,000 Iterationen)',
  serverEndpoint: '/api/sync',
  lastError: null,
  remoteVersion: 1,
  localVersion: 1,
  pendingChangesCount: 0,
  totalSyncedBytes: 8420,
  syncHistory: [
    {
      timestamp: Date.now() - 1000 * 60 * 12,
      status: 'success',
      action: 'push',
      size: 8420,
      message: 'Firebase Firestore & Krypto-Tresor synchronisiert',
    },
  ],
};

interface OSContextType {
  // System State & Time
  systemBootTime: number;
  effectiveTheme: 'dark' | 'light' | 'glassy';
  effectiveGlassContrast: 'dark' | 'light';
  isLight: boolean;
  isDark: boolean;
  isGlassy: boolean;

  // Auth & Multi-User
  users: UserProfile[];
  currentUser: UserProfile | null;
  isLocked: boolean;
  isSetupCompleted: boolean;
  login: (userId: string, pin: string) => boolean;
  logout: () => void;
  lockScreen: () => void;
  createUser: (user: Omit<UserProfile, 'id' | 'createdAt' | 'lastLogin' | 'encryptionSalt'>) => UserProfile;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  deleteUser: (userId: string) => void;
  deleteAccount: (userId?: string) => Promise<boolean>;
  switchUser: (userId: string) => void;
  completeSetup: (
    userData: {
      displayName: string;
      username: string;
      pin: string;
      avatar: string;
      role: 'Administrator' | 'Benutzer';
      bio?: string;
    },
    initialSettings?: Partial<PersonalizationSettings>
  ) => Promise<UserProfile>;
  loginExistingAccount: (userId: string, pin: string) => Promise<boolean>;
  openSetupAssistant: () => void;
  resetSetupState: () => void;
  isStartupAnimationActive: boolean;
  playStartupAnimation: () => void;
  closeStartupAnimation: () => void;

  // Settings & Theme
  settings: PersonalizationSettings;
  accentConfig: AccentColorConfig;
  updateSettings: (updates: Partial<PersonalizationSettings>) => void;

  // Windows & Snapping
  windows: WindowState[];
  activeWindowId: string | null;
  openApp: (appId: AppId, customData?: Record<string, any>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => void;
  snapWindow: (id: string, snapType: SnapTarget) => void;
  unsnapWindow: (id: string, newX?: number, newY?: number) => void;
  snapPreview: { x: number; y: number; width: number; height: number; snapType: SnapTarget } | null;
  setSnapPreview: (preview: { x: number; y: number; width: number; height: number; snapType: SnapTarget } | null) => void;
  isDraggingAnyWindow: boolean;
  setIsDraggingAnyWindow: (isDragging: boolean) => void;

  // Virtual Filesystem
  files: FileItem[];
  createFile: (name: string, parentId: string | null, type: FileItem['type'], content?: string) => FileItem;
  createFolder: (name: string, parentId: string | null) => FileItem;
  updateFile: (id: string, content: string, name?: string) => void;
  deleteItem: (id: string) => void;
  uploadHostFile: (file: File, parentId: string | null) => Promise<void>;
  downloadFile: (id: string) => void;

  // Game Save States & Progress
  gameSaves: Record<string, any>;
  saveGameState: (gameId: string, state: any, score?: number, level?: number, details?: string) => Promise<void>;
  loadGameState: (gameId: string) => any;
  getGameSaveInfo: (gameId: string) => { state: any; score?: number; highScore?: number; level?: number; details?: string; updatedAt: number } | null;

  // Cloud & Firebase Sync
  cloudSync: CloudSyncState;
  triggerSync: () => Promise<boolean>;
  pullCloudSync: (passphrase?: string) => Promise<boolean>;
  exportEncryptedVault: () => Promise<void>;
  importEncryptedVault: (file: File, passphrase: string) => Promise<boolean>;

  // Desktop icon positions & pinned apps
  iconPositions: Record<string, { x: number; y: number }>;
  updateIconPosition: (id: string, x: number, y: number) => void;
  desktopPinnedAppIds: string[];
  addAppToDesktop: (appId: string) => void;
  removeAppFromDesktop: (appId: string) => void;
  toggleAppOnDesktop: (appId: string) => void;
  isAppOnDesktop: (appId: string) => boolean;
  restoreFullBackup: (backupObject: any) => Promise<boolean>;

  // Recent apps (5 most recent in Dock)
  recentApps: AppId[];

  // App Store & Custom Apps
  installedAppIds: string[];
  installApp: (appId: string) => void;
  uninstallApp: (appId: string) => void;
  customApps: Array<{ id: string; name: string; icon: string; code: string }>;
  addCustomApp: (app: { id?: string; name: string; icon: string; code: string }) => void;
  removeCustomApp: (id: string) => void;

  // Spotlight & HUD
  isSpotlightOpen: boolean;
  openSpotlight: () => void;
  closeSpotlight: () => void;

  // Control Center & Notifications
  isControlCenterOpen: boolean;
  toggleControlCenter: () => void;
  closeControlCenter: () => void;
  notifications: SystemNotification[];
  addNotification: (title: string, message: string, type?: SystemNotification['type'], source?: string) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Global Media Player (YouTube, Music, WebAudio)
  nowPlaying: MediaPlaybackState | null;
  setNowPlaying: (media: MediaPlaybackState | null) => void;
  toggleGlobalMedia: () => void;
  pauseGlobalMedia: () => void;
  stopGlobalMedia: () => void;

  // Sound Engine
  sounds: typeof sounds;
}

const OSContext = createContext<OSContextType | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage or defaults with automatic avatar upgrade
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_users');
      if (saved) {
        const parsed: UserProfile[] = JSON.parse(saved);
        return parsed.map((u) => {
          // If avatar is an old emoji or missing, upgrade to crisp photo avatar
          if (!u.avatar || (!u.avatar.startsWith('http') && !u.avatar.startsWith('data:'))) {
            const match = DEFAULT_USERS.find((du) => du.id === u.id || du.username === u.username);
            return {
              ...u,
              avatar: match ? match.avatar : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
            };
          }
          return u;
        });
      }
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const sessionUserId = CookieStorage.getSessionUser();
      if (sessionUserId) {
        const found = users.find((u) => u.id === sessionUserId);
        if (found) return found;
      }
      const savedId = localStorage.getItem('obsidian_current_user_id');
      if (savedId) {
        const found = users.find((u) => u.id === savedId);
        if (found) return found;
      }
    } catch {}
    return DEFAULT_USERS[0];
  });

  // Setup Assistant status (Cookie + LocalStorage check)
  const [isSetupCompleted, setIsSetupCompleted] = useState<boolean>(() => {
    return CookieStorage.isSetupCompleted();
  });

  // Start on LockScreen when setup was already completed
  const [isLocked, setIsLocked] = useState<boolean>(true);

  // System Boot Time for accurate OS runtime / uptime
  const [systemBootTime] = useState<number>(() => {
    try {
      const saved = sessionStorage.getItem('obsidian_boot_time');
      if (saved) return Number(saved);
      const now = Date.now();
      sessionStorage.setItem('obsidian_boot_time', String(now));
      return now;
    } catch {
      return Date.now();
    }
  });

  const [settings, setSettings] = useState<PersonalizationSettings>(() => {
    try {
      const saved = localStorage.getItem('obsidian_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [highestZ, setHighestZ] = useState<number>(10);

  const [files, setFiles] = useState<FileItem[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_files');
      return saved ? JSON.parse(saved) : INITIAL_FILES;
    } catch {
      return INITIAL_FILES;
    }
  });

  const [iconPositions, setIconPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const saved = localStorage.getItem('obsidian_icon_positions');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [cloudSync, setCloudSync] = useState<CloudSyncState>(() => {
    try {
      const saved = localStorage.getItem('obsidian_cloud_sync');
      return saved ? { ...DEFAULT_CLOUD_SYNC, ...JSON.parse(saved) } : DEFAULT_CLOUD_SYNC;
    } catch {
      return DEFAULT_CLOUD_SYNC;
    }
  });

  const [gameSaves, setGameSaves] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('obsidian_game_saves');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [snapPreview, setSnapPreview] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    snapType: SnapTarget;
  } | null>(null);
  const [isDraggingAnyWindow, setIsDraggingAnyWindow] = useState(false);

  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [installedAppIds, setInstalledAppIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_installed_apps');
      return saved ? JSON.parse(saved) : ['retro-2048', 'pomodoro', 'weather'];
    } catch {
      return ['retro-2048', 'pomodoro', 'weather'];
    }
  });

  const [customApps, setCustomApps] = useState<Array<{ id: string; name: string; icon: string; code: string }>>(() => {
    try {
      const saved = localStorage.getItem('obsidian_custom_apps');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentApps, setRecentApps] = useState<AppId[]>(() => {
    try {
      const saved = localStorage.getItem('obsidian_recent_apps');
      return saved ? JSON.parse(saved) : ['files', 'notes', 'gallery', 'music', 'terminal'];
    } catch {
      return ['files', 'notes', 'gallery', 'music', 'terminal'];
    }
  });
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: 'notif-1',
      title: 'ObsidianOS Bereit',
      message: 'Firebase Firestore & Krypto-Vault aktiviert.',
      timestamp: Date.now() - 60000,
      type: 'info',
      source: 'System',
      read: false,
    },
  ]);

  // Initial Firebase Auth & Firestore real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    FirebaseService.ensureAuth().then((u) => {
      if (u && currentUser) {
        // Initial load
        FirebaseService.loadSystemState(currentUser.id).then((res) => {
          if (res.success && res.data) {
            if (res.data.files && Array.isArray(res.data.files)) {
              setFiles(res.data.files);
            }
            if (res.data.settings) {
              setSettings((prev) => ({ ...prev, ...res.data.settings }));
            }
            if (res.data.iconPositions) {
              setIconPositions(res.data.iconPositions);
            }
            if (res.data.installedAppIds && Array.isArray(res.data.installedAppIds)) {
              setInstalledAppIds(res.data.installedAppIds);
            }
            if (res.data.customApps && Array.isArray(res.data.customApps)) {
              setCustomApps(res.data.customApps);
            }
            if (res.data.recentApps && Array.isArray(res.data.recentApps)) {
              setRecentApps(res.data.recentApps);
            }
          }
        });

        // Realtime Firestore subscription
        unsubscribe = FirebaseService.subscribeToUserData(currentUser.id, (remoteData) => {
          if (remoteData) {
            if (remoteData.files && Array.isArray(remoteData.files)) {
              setFiles(remoteData.files);
            }
            if (remoteData.settings) {
              setSettings((prev) => ({ ...prev, ...remoteData.settings }));
            }
            if (remoteData.iconPositions) {
              setIconPositions(remoteData.iconPositions);
            }
            if (remoteData.installedAppIds && Array.isArray(remoteData.installedAppIds)) {
              setInstalledAppIds(remoteData.installedAppIds);
            }
            if (remoteData.customApps && Array.isArray(remoteData.customApps)) {
              setCustomApps(remoteData.customApps);
            }
            if (remoteData.recentApps && Array.isArray(remoteData.recentApps)) {
              setRecentApps(remoteData.recentApps);
            }
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUser]);

  // Fetch remote user registry from Firestore on mount
  useEffect(() => {
    FirebaseService.fetchUsersRegistry().then((res) => {
      if (res.success && res.users && res.users.length > 0) {
        setUsers((prev) => {
          const merged = [...prev];
          for (const ru of res.users!) {
            if (!merged.some((u) => u.id === ru.id || u.username === ru.username)) {
              merged.push(ru);
            }
          }
          return merged;
        });
      }
    });
  }, []);

  // Persist state to local & Firestore (Debounced Auto-Sync)
  useEffect(() => {
    try {
      localStorage.setItem('obsidian_users', JSON.stringify(users));
      FirebaseService.saveUsersRegistry(users);
    } catch {}
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('obsidian_current_user_id', currentUser.id);
        CookieStorage.setSessionUser(currentUser.id);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_settings', JSON.stringify(settings));
      sounds.setEnabled(settings.soundEffects);
    } catch {}
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_files', JSON.stringify(files));
    } catch {}
  }, [files]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_icon_positions', JSON.stringify(iconPositions));
    } catch {}
  }, [iconPositions]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_cloud_sync', JSON.stringify(cloudSync));
    } catch {}
  }, [cloudSync]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_recent_apps', JSON.stringify(recentApps));
    } catch {}
  }, [recentApps]);

  // Sound settings synchronization
  useEffect(() => {
    sounds.setEnabled(settings.soundEffects !== false);
    sounds.setVolume(settings.soundVolume ?? 75);
    sounds.setMuted(settings.soundMuted ?? false);
    sounds.clickEnabled = settings.clickSounds !== false;
    sounds.errorEnabled = settings.errorSounds !== false;
    sounds.startupEnabled = settings.startupSound !== false;
    sounds.notificationEnabled = settings.notificationSounds !== false;
  }, [
    settings.soundEffects,
    settings.soundVolume,
    settings.soundMuted,
    settings.clickSounds,
    settings.errorSounds,
    settings.startupSound,
    settings.notificationSounds,
  ]);

  // Inactivity Auto-Lock timer
  useEffect(() => {
    if (isLocked || !isSetupCompleted || !currentUser || !settings.autoLockMinutes || settings.autoLockMinutes <= 0) {
      return;
    }

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
        sounds.playLock();
      }, settings.autoLockMinutes * 60 * 1000);
    };

    resetTimer();
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [isLocked, isSetupCompleted, currentUser, settings.autoLockMinutes]);

  // Autostart apps on login / boot
  useEffect(() => {
    if (!isLocked && isSetupCompleted && currentUser && settings.autostartApps && settings.autostartApps.length > 0) {
      const timer = setTimeout(() => {
        settings.autostartApps?.forEach((appId) => {
          openApp(appId as AppId);
        });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLocked, isSetupCompleted, currentUser]);

  // Auto-sync debounce to Firebase Firestore
  useEffect(() => {
    if (!currentUser) return;
    const timer = setTimeout(() => {
      FirebaseService.saveSystemState(currentUser.id, {
        settings,
        files,
        iconPositions,
        recentApps,
        installedAppIds,
        customApps,
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentUser, settings, files, iconPositions, recentApps, installedAppIds, customApps]);

  const updateRecentApps = useCallback((appId: AppId) => {
    setRecentApps((prev) => {
      const filtered = prev.filter((id) => id !== appId);
      const next = [appId, ...filtered].slice(0, 5);
      if (currentUser) {
        FirebaseService.saveSystemState(currentUser.id, { recentApps: next });
      }
      return next;
    });
  }, [currentUser]);

  const updateIconPosition = useCallback((id: string, x: number, y: number) => {
    setIconPositions((prev) => {
      const next = { ...prev, [id]: { x, y } };
      // Save to Firebase in background
      if (currentUser) {
        FirebaseService.saveSystemState(currentUser.id, { iconPositions: next });
      }
      return next;
    });
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('obsidian_cloud_sync', JSON.stringify(cloudSync));
    } catch {}
  }, [cloudSync]);

  const accentConfig = useMemo(() => {
    return ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS['violet-classic'];
  }, [settings.accentColor]);

  const effectiveTheme = useMemo<'dark' | 'light' | 'glassy'>(() => {
    const mode = settings.themeMode || 'dark';
    if (mode === 'glassy') return 'glassy';
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    if (mode === 'auto') {
      const hour = new Date().getHours();
      return hour >= 7 && hour < 19 ? 'light' : 'dark';
    }
    return 'dark';
  }, [settings.themeMode]);

  const isLight = effectiveTheme === 'light';
  const isDark = effectiveTheme === 'dark';
  const isGlassy = effectiveTheme === 'glassy';

  const effectiveGlassContrast = useMemo<'dark' | 'light'>(() => {
    if (settings.glassContrast === 'dark') return 'dark';
    if (settings.glassContrast === 'light') return 'light';

    // Auto calculation:
    if (isLight) return 'dark';
    if (isDark) return 'light';

    // In Glassy Mode: inspect active wallpaper
    const isPhoto = settings.desktopWallpaperMode === 'photo' || settings.desktopWallpaperMode === 'random_photo';
    const photoId = settings.desktopPhotoId || '';
    const brightPhotos = [
      'photo-dolomites',
      'photo-pacific-fog',
      'photo-sahara',
      'photo-alps',
      'photo-snow',
      'photo-white-sand',
    ];
    if (isPhoto && brightPhotos.some((bp) => photoId.includes(bp))) {
      return 'dark';
    }
    if (settings.wallpaper === 'mesh-aurora' || settings.wallpaper === 'gradient-sunset') {
      return 'dark';
    }
    return 'light';
  }, [
    settings.glassContrast,
    isLight,
    isDark,
    settings.desktopWallpaperMode,
    settings.desktopPhotoId,
    settings.wallpaper,
  ]);

  // Global Keyboard shortcuts (Spotlight Cmd+Space / Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + Space or Ctrl + Space for Spotlight
      if ((e.metaKey || e.ctrlKey) && e.code === 'Space') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
        sounds.playClick();
      }
      // Escape closes overlays
      if (e.key === 'Escape') {
        if (isSpotlightOpen) setIsSpotlightOpen(false);
        if (isControlCenterOpen) setIsControlCenterOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpotlightOpen, isControlCenterOpen]);

  // Notification helper
  const addNotification = useCallback(
    (title: string, message: string, type: SystemNotification['type'] = 'info', source = 'System') => {
      const newNotif: SystemNotification = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        title,
        message,
        timestamp: Date.now(),
        type,
        source,
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
    },
    []
  );

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Game Saves Management
  const saveGameState = useCallback(
    async (gameId: string, state: any, score?: number, level?: number, details?: string) => {
      const now = Date.now();
      setGameSaves((prev) => {
        const prevSave = prev[gameId] || {};
        const highScore = Math.max(score || 0, prevSave.highScore || 0, prevSave.score || 0);
        const updated = {
          ...prev,
          [gameId]: {
            state,
            score: score !== undefined ? score : prevSave.score,
            highScore,
            level: level !== undefined ? level : prevSave.level,
            details: details || prevSave.details || '',
            updatedAt: now,
          },
        };
        try {
          localStorage.setItem('obsidian_game_saves', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Save to Firebase for current active user
      if (currentUser) {
        await FirebaseService.saveUserGameState(currentUser.id, gameId, state, score, level, details);
      }
    },
    [currentUser]
  );

  const loadGameState = useCallback(
    (gameId: string) => {
      return gameSaves[gameId]?.state ?? null;
    },
    [gameSaves]
  );

  const getGameSaveInfo = useCallback(
    (gameId: string) => {
      return gameSaves[gameId] ?? null;
    },
    [gameSaves]
  );

  // Auth Methods
  const login = useCallback(
    (usernameOrId: string, pin: string): boolean => {
      const targetQuery = usernameOrId.trim().toLowerCase();
      const user = users.find(
        (u) => u.id === usernameOrId || u.username.toLowerCase() === targetQuery
      );
      if (!user) return false;

      if (user.role === 'Gast' || user.pin === pin || (!user.pin && !pin)) {
        setCurrentUser(user);
        setIsLocked(false);
        setIsSetupCompleted(true);
        CookieStorage.setSessionUser(user.id);
        CookieStorage.markSetupCompleted(user.id);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, lastLogin: Date.now() } : u))
        );

        // Load user data from Firestore
        FirebaseService.loadSystemState(user.id).then((res) => {
          if (res.success && res.data) {
            if (res.data.files && Array.isArray(res.data.files)) setFiles(res.data.files);
            if (res.data.settings) setSettings((prev) => ({ ...prev, ...res.data.settings }));
            if (res.data.iconPositions) setIconPositions(res.data.iconPositions);
            if (res.data.installedAppIds) setInstalledAppIds(res.data.installedAppIds);
            if (res.data.customApps) setCustomApps(res.data.customApps);
            if (res.data.recentApps) setRecentApps(res.data.recentApps);
            if (res.data.gameSaves) setGameSaves((prev) => ({ ...prev, ...res.data!.gameSaves }));
          }
        });

        sounds.playOpen();
        addNotification('Angemeldet', `Willkommen zurück, ${user.displayName}!`, 'success', 'Sicherheit');
        return true;
      }
      return false;
    },
    [users, sounds, addNotification]
  );

  const logout = useCallback(() => {
    // Clear session user from cookies and local storage
    CookieStorage.clearSessionUser();
    localStorage.removeItem('obsidian_current_user_id');
    setWindows([]);
    setActiveWindowId(null);
    setIsLocked(true);
    sounds.playClose();
    addNotification('Abgemeldet', 'Du hast dich erfolgreich abgemeldet.', 'info', 'Sicherheit');
  }, [sounds, addNotification]);

  const lockScreen = useCallback(() => {
    setIsLocked(true);
    sounds.playClose();
  }, []);

  const createUser = useCallback(
    (userData: Omit<UserProfile, 'id' | 'createdAt' | 'lastLogin' | 'encryptionSalt'>): UserProfile => {
      const newUser: UserProfile = {
        ...userData,
        id: 'user-' + Date.now(),
        createdAt: Date.now(),
        lastLogin: Date.now(),
        encryptionSalt: CryptoService.generateSalt(),
      };
      setUsers((prev) => [...prev, newUser]);
      addNotification('Neuer Benutzer', `Profil "${newUser.displayName}" erfolgreich erstellt.`, 'success', 'Profile');
      return newUser;
    },
    [addNotification]
  );

  const updateUser = useCallback(
    (userId: string, updates: Partial<UserProfile>) => {
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === userId) {
            const updated = { ...u, ...updates };
            if (currentUser?.id === userId) {
              setCurrentUser(updated);
            }
            return updated;
          }
          return u;
        })
      );
      addNotification('Profil aktualisiert', 'Änderungen wurden gespeichert.', 'info', 'Profile');
    },
    [currentUser, addNotification]
  );

  const deleteAccount = useCallback(
    async (userId?: string): Promise<boolean> => {
      const targetId = userId || currentUser?.id;
      if (!targetId) return false;

      const targetUser = users.find((u) => u.id === targetId);
      const remaining = users.filter((u) => u.id !== targetId);

      // Clean up Firestore data
      try {
        await FirebaseService.deleteUserData(targetId);
        await FirebaseService.saveUsersRegistry(remaining);
      } catch (err) {
        console.error('Error deleting user data from cloud:', err);
      }

      sounds.playClose();

      if (remaining.length > 0) {
        setUsers(remaining);
        if (currentUser?.id === targetId) {
          // If the deleted account was currently logged in, switch session to the first remaining user
          CookieStorage.clearSessionUser();
          localStorage.removeItem('obsidian_current_user_id');
          setWindows([]);
          setActiveWindowId(null);
          setCurrentUser(remaining[0]);
          CookieStorage.setSessionUser(remaining[0].id);
          setIsLocked(true);
        }
        addNotification(
          'Account gelöscht',
          `Das Benutzerkonto "${targetUser?.displayName || targetId}" wurde unwiderruflich gelöscht.`,
          'info',
          'Sicherheit'
        );
      } else {
        // Last account was deleted: perform full clean reset to the setup assistant
        setUsers([]);
        setCurrentUser(null);
        CookieStorage.resetSetupState();
        localStorage.removeItem('obsidian_current_user_id');
        localStorage.removeItem('obsidian_setup_completed');
        setWindows([]);
        setActiveWindowId(null);
        setFiles(INITIAL_FILES);
        setIsLocked(false);
        setIsSetupCompleted(false);
        addNotification(
          'Account gelöscht',
          'Dein Account wurde gelöscht. Das System wurde zurückgesetzt.',
          'info',
          'Sicherheit'
        );
      }
      return true;
    },
    [currentUser, users, sounds, addNotification]
  );

  const deleteUser = useCallback(
    (userId: string) => {
      deleteAccount(userId);
    },
    [deleteAccount]
  );

  const switchUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCurrentUser(user);
        CookieStorage.setSessionUser(user.id);
        sounds.playOpen();
        addNotification('Profil gewechselt', `Angemeldet als ${user.displayName}.`, 'info', 'Benutzer');
      }
    },
    [users, sounds, addNotification]
  );

  const completeSetup = useCallback(
    async (
      userData: {
        displayName: string;
        username: string;
        pin: string;
        avatar: string;
        role: 'Administrator' | 'Benutzer';
        bio?: string;
      },
      initialSettings?: Partial<PersonalizationSettings>
    ): Promise<UserProfile> => {
      const cleanUsername = userData.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'user';
      const newUser: UserProfile = {
        id: 'user-' + cleanUsername + '-' + Date.now().toString(36),
        displayName: userData.displayName.trim() || 'Benutzer',
        username: cleanUsername,
        pin: userData.pin,
        avatar: userData.avatar,
        role: userData.role || 'Administrator',
        bio: userData.bio || 'ObsidianOS Benutzer',
        createdAt: Date.now(),
        lastLogin: Date.now(),
        encryptionSalt: CryptoService.generateSalt(),
      };

      // Initialize fresh user database with the newly configured user
      const updatedUsers = [newUser];
      setUsers(updatedUsers);
      setCurrentUser(newUser);

      let mergedSettings = settings;
      if (initialSettings) {
        mergedSettings = { ...settings, ...initialSettings };
        setSettings(mergedSettings);
      }

      // Persist in Browser Cookies and LocalStorage
      CookieStorage.markSetupCompleted(newUser.id);
      setIsSetupCompleted(true);
      setIsLocked(false);

      // Persist to Firebase Firestore
      try {
        await FirebaseService.saveUsersRegistry(updatedUsers);
        await FirebaseService.saveSystemState(newUser.id, {
          settings: mergedSettings,
          files,
          iconPositions,
          recentApps,
          installedAppIds,
        });
      } catch (err) {}

      sounds.playOpen();
      addNotification('Willkommen bei ObsidianOS', `Setup erfolgreich abgeschlossen für ${newUser.displayName}.`, 'success', 'System');
      return newUser;
    },
    [users, settings, files, iconPositions, recentApps, installedAppIds, sounds, addNotification]
  );

  const loginExistingAccount = useCallback(
    async (userId: string, pin: string): Promise<boolean> => {
      let targetUser = users.find((u) => u.id === userId || u.username === userId);

      // Check cloud registry if not present locally
      if (!targetUser) {
        const cloudRes = await FirebaseService.fetchUsersRegistry();
        if (cloudRes.success && cloudRes.users) {
          targetUser = cloudRes.users.find((u) => u.id === userId || u.username === userId);
          if (targetUser) {
            setUsers((prev) => [targetUser!, ...prev.filter((u) => u.id !== targetUser!.id)]);
          }
        }
      }

      if (!targetUser) return false;

      // Verify PIN (empty pin allowed if user has no PIN or matches)
      if (targetUser.pin && targetUser.pin !== pin) {
        return false;
      }

      setCurrentUser(targetUser);
      CookieStorage.markSetupCompleted(targetUser.id);
      setIsSetupCompleted(true);
      setIsLocked(false);

      // Pull down system state from cloud
      try {
        const cloudState = await FirebaseService.loadSystemState(targetUser.id);
        if (cloudState.success && cloudState.data) {
          if (cloudState.data.settings) setSettings((prev) => ({ ...prev, ...cloudState.data.settings }));
          if (cloudState.data.files) setFiles(cloudState.data.files);
          if (cloudState.data.iconPositions) setIconPositions(cloudState.data.iconPositions);
          if (cloudState.data.installedAppIds) setInstalledAppIds(cloudState.data.installedAppIds);
          if (cloudState.data.customApps) setCustomApps(cloudState.data.customApps);
          if (cloudState.data.recentApps) setRecentApps(cloudState.data.recentApps);
        }
      } catch (err) {}

      sounds.playOpen();
      addNotification('Angemeldet', `Cloud-Profil "${targetUser.displayName}" synchronisiert.`, 'success', 'Sicherheit');
      return true;
    },
    [users, sounds, addNotification]
  );

  const [isStartupAnimationActive, setIsStartupAnimationActive] = useState<boolean>(false);

  const playStartupAnimation = useCallback(() => {
    setIsStartupAnimationActive(true);
  }, []);

  const closeStartupAnimation = useCallback(() => {
    setIsStartupAnimationActive(false);
  }, []);

  const openSetupAssistant = useCallback(() => {
    setIsSetupCompleted(false);
  }, []);

  const resetSetupState = useCallback(() => {
    CookieStorage.resetSetupState();
    setIsSetupCompleted(false);
    setIsLocked(true);
    addNotification('Setup zurückgesetzt', 'Der Setup-Assistent wird neu gestartet.', 'info', 'System');
  }, [addNotification]);

  const updateSettings = useCallback((updates: Partial<PersonalizationSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      if (updates.themeMode && !updates.wallpaper) {
        if (
          prev.wallpaper === 'obsidian-dark' ||
          prev.wallpaper === 'obsidian-light' ||
          prev.wallpaper === 'obsidian-deep' ||
          prev.wallpaper === 'obsidian-default' ||
          prev.wallpaper === 'photo-obsidian-dark' ||
          prev.wallpaper === 'photo-obsidian-light'
        ) {
          if (updates.themeMode === 'light') {
            next.wallpaper = 'obsidian-light';
            next.desktopPhotoId = 'photo-obsidian-light';
          } else if (updates.themeMode === 'dark' || updates.themeMode === 'glassy') {
            next.wallpaper = 'obsidian-dark';
            next.desktopPhotoId = 'photo-obsidian-dark';
          }
        }
      }
      return next;
    });
  }, []);

  const desktopPinnedAppIds = useMemo(() => {
    return settings.desktopPinnedAppIds && settings.desktopPinnedAppIds.length > 0
      ? settings.desktopPinnedAppIds
      : ['files', 'browser', 'notes', 'gallery', 'music', 'settings'];
  }, [settings.desktopPinnedAppIds]);

  const isAppOnDesktop = useCallback(
    (appId: string) => {
      return desktopPinnedAppIds.includes(appId);
    },
    [desktopPinnedAppIds]
  );

  const addAppToDesktop = useCallback(
    (appId: string) => {
      if (desktopPinnedAppIds.includes(appId)) return;
      const next = [...desktopPinnedAppIds, appId];
      updateSettings({ desktopPinnedAppIds: next });
      sounds.playClick();
      const meta = APPS_REGISTRY.find((a) => a.id === appId);
      addNotification(
        'App hinzugefügt',
        `"${meta?.name || appId}" befindet sich nun auf deinem Schreibtisch.`,
        'success',
        'Schreibtisch'
      );
    },
    [desktopPinnedAppIds, updateSettings, sounds, addNotification]
  );

  const removeAppFromDesktop = useCallback(
    (appId: string) => {
      const next = desktopPinnedAppIds.filter((id) => id !== appId);
      updateSettings({ desktopPinnedAppIds: next });
      sounds.playClose();
      const meta = APPS_REGISTRY.find((a) => a.id === appId);
      addNotification(
        'App entfernt',
        `"${meta?.name || appId}" wurde vom Schreibtisch entfernt (bleibt über Spotlight verfügbar).`,
        'info',
        'Schreibtisch'
      );
    },
    [desktopPinnedAppIds, updateSettings, sounds, addNotification]
  );

  const toggleAppOnDesktop = useCallback(
    (appId: string) => {
      if (isAppOnDesktop(appId)) {
        removeAppFromDesktop(appId);
      } else {
        addAppToDesktop(appId);
      }
    },
    [isAppOnDesktop, addAppToDesktop, removeAppFromDesktop]
  );

  const restoreFullBackup = useCallback(
    async (backupObject: any): Promise<boolean> => {
      if (!backupObject || (!backupObject.data && !backupObject.version)) {
        return false;
      }
      try {
        const data = backupObject.data || backupObject;
        Object.entries(data).forEach(([k, val]) => {
          if (typeof val === 'object') {
            localStorage.setItem(k, JSON.stringify(val));
          } else {
            localStorage.setItem(k, String(val));
          }
        });

        if (data.obsidian_settings) {
          setSettings((prev) => ({ ...prev, ...data.obsidian_settings }));
        }
        if (data.obsidian_files) {
          setFiles(data.obsidian_files);
        }
        if (data.obsidian_users && Array.isArray(data.obsidian_users) && data.obsidian_users.length > 0) {
          setUsers(data.obsidian_users);
          setCurrentUser(data.obsidian_users[0]);
          CookieStorage.markSetupCompleted(data.obsidian_users[0].id);
        }
        if (data.obsidian_icon_positions) {
          setIconPositions(data.obsidian_icon_positions);
        }
        if (data.obsidian_installed_apps) {
          setInstalledAppIds(data.obsidian_installed_apps);
        }
        if (data.obsidian_custom_apps) {
          setCustomApps(data.obsidian_custom_apps);
        }
        if (data.obsidian_recent_apps) {
          setRecentApps(data.obsidian_recent_apps);
        }

        setIsSetupCompleted(true);
        setIsLocked(false);
        sounds.playSuccess();
        addNotification(
          'Time Machine Backup wiederhergestellt',
          'Alle Systemdateien, Einstellungen und Profile wurden erfolgreich geladen.',
          'success',
          'System'
        );
        return true;
      } catch (err) {
        console.error('Failed to restore backup', err);
        return false;
      }
    },
    [sounds, addNotification]
  );

  // Window Management
  const focusWindow = useCallback(
    (id: string) => {
      setHighestZ((prevZ) => {
        const nextZ = prevZ + 1;
        setWindows((prevWindows) =>
          prevWindows.map((w) => {
            if (w.id === id) {
              updateRecentApps(w.appId);
              return { ...w, zIndex: nextZ, isMinimized: false };
            }
            return w;
          })
        );
        return nextZ;
      });
      setActiveWindowId(id);
    },
    [updateRecentApps]
  );

  const openApp = useCallback(
    (appId: AppId, customData?: Record<string, any>) => {
      const meta = APPS_REGISTRY.find((a) => a.id === appId);
      if (!meta) return;

      updateRecentApps(appId);

      setWindows((prevWindows) => {
        const existing = prevWindows.find((w) => w.appId === appId);
        if (existing) {
          // Bring existing to front and restore
          setHighestZ((prevZ) => {
            const nextZ = prevZ + 1;
            setTimeout(() => {
              setActiveWindowId(existing.id);
            }, 0);
            return nextZ;
          });
          sounds.playOpen();
          return prevWindows.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  isMinimized: false,
                  isOpen: true,
                  customData: customData || w.customData,
                }
              : w
          );
        }

        // Create new window centered on screen with cascade offset
        const count = prevWindows.length;
        const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

        const w = Math.min(meta.defaultWidth, screenW - 60);
        const h = Math.min(meta.defaultHeight, screenH - 120);
        const x = Math.max(30, (screenW - w) / 2 + (count % 6) * 24);
        const y = Math.max(50, (screenH - h) / 2 - 30 + (count % 6) * 24);

        const newId = `win-${appId}-${Date.now()}`;
        const newZ = highestZ + 1;
        setHighestZ(newZ);
        setActiveWindowId(newId);
        sounds.playOpen();

        const newWin: WindowState = {
          id: newId,
          appId,
          title: meta.name,
          iconName: meta.iconName,
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          zIndex: newZ,
          x,
          y,
          width: w,
          height: h,
          customData,
        };

        return [...prevWindows, newWin];
      });
    },
    [highestZ]
  );

  const closeWindow = useCallback((id: string) => {
    sounds.playClose();
    setWindows((prev) => {
      const filtered = prev.filter((w) => w.id !== id);
      if (filtered.length > 0) {
        // focus the topmost remaining window
        const sorted = [...filtered].sort((a, b) => b.zIndex - a.zIndex);
        setActiveWindowId(sorted[0].id);
      } else {
        setActiveWindowId(null);
      }
      return filtered;
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    sounds.playClick();
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((prevActive) => (prevActive === id ? null : prevActive));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    sounds.playClick();
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          if (!w.isMaximized) {
            return {
              ...w,
              isMaximized: true,
              prevBounds: { x: w.x, y: w.y, width: w.width, height: w.height },
            };
          } else {
            return {
              ...w,
              isMaximized: false,
              ...(w.prevBounds || {}),
            };
          }
        }
        return w;
      })
    );
  }, []);

  const updateWindowBounds = useCallback(
    (id: string, bounds: { x?: number; y?: number; width?: number; height?: number }) => {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                x: bounds.x !== undefined ? bounds.x : w.x,
                y: bounds.y !== undefined ? bounds.y : w.y,
                width: bounds.width !== undefined ? bounds.width : w.width,
                height: bounds.height !== undefined ? bounds.height : w.height,
                isMaximized: false,
              }
            : w
        )
      );
    },
    []
  );

  const snapWindow = useCallback(
    (id: string, snapType: SnapTarget) => {
      sounds.playClick();
      const screenW = window.innerWidth;
      const screenH = window.innerHeight;
      const topOffset = 32;
      const usableH = screenH - topOffset;
      const halfW = Math.floor(screenW / 2);
      const halfH = Math.floor(usableH / 2);

      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;

          // Save previous bounds if not already snapped or maximized
          const prevBounds = (!w.isMaximized && !w.snapState)
            ? { x: w.x, y: w.y, width: w.width, height: w.height }
            : (w.prevBounds || { x: 100, y: 80, width: 880, height: 560 });

          if (snapType === 'maximize') {
            return {
              ...w,
              x: 0,
              y: topOffset,
              width: screenW,
              height: usableH,
              isMaximized: true,
              snapState: 'maximize',
              prevBounds,
            };
          }

          if (snapType === 'left') {
            return {
              ...w,
              x: 0,
              y: topOffset,
              width: halfW,
              height: usableH,
              isMaximized: false,
              snapState: 'left',
              prevBounds,
            };
          }

          if (snapType === 'right') {
            return {
              ...w,
              x: halfW,
              y: topOffset,
              width: screenW - halfW,
              height: usableH,
              isMaximized: false,
              snapState: 'right',
              prevBounds,
            };
          }

          if (snapType === 'top-left') {
            return {
              ...w,
              x: 0,
              y: topOffset,
              width: halfW,
              height: halfH,
              isMaximized: false,
              snapState: 'top-left',
              prevBounds,
            };
          }

          if (snapType === 'top-right') {
            return {
              ...w,
              x: halfW,
              y: topOffset,
              width: screenW - halfW,
              height: halfH,
              isMaximized: false,
              snapState: 'top-right',
              prevBounds,
            };
          }

          if (snapType === 'bottom-left') {
            return {
              ...w,
              x: 0,
              y: topOffset + halfH,
              width: halfW,
              height: usableH - halfH,
              isMaximized: false,
              snapState: 'bottom-left',
              prevBounds,
            };
          }

          if (snapType === 'bottom-right') {
            return {
              ...w,
              x: halfW,
              y: topOffset + halfH,
              width: screenW - halfW,
              height: usableH - halfH,
              isMaximized: false,
              snapState: 'bottom-right',
              prevBounds,
            };
          }

          if (snapType === 'center') {
            const width = Math.min(900, screenW - 60);
            const height = Math.min(620, usableH - 60);
            return {
              ...w,
              x: Math.max(0, Math.floor((screenW - width) / 2)),
              y: Math.max(topOffset, Math.floor((usableH - height) / 2) + topOffset),
              width,
              height,
              isMaximized: false,
              snapState: 'center',
              prevBounds,
            };
          }

          return w;
        })
      );
    },
    []
  );

  const unsnapWindow = useCallback((id: string, newX?: number, newY?: number) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const targetW = w.prevBounds ? w.prevBounds.width : 860;
        const targetH = w.prevBounds ? w.prevBounds.height : 560;
        const targetX = newX !== undefined ? newX : (w.prevBounds ? w.prevBounds.x : Math.max(0, (window.innerWidth - targetW) / 2));
        const targetY = newY !== undefined ? newY : (w.prevBounds ? w.prevBounds.y : 80);

        return {
          ...w,
          x: targetX,
          y: targetY,
          width: targetW,
          height: targetH,
          isMaximized: false,
          snapState: null,
        };
      })
    );
  }, []);

  // File System methods
  const createFile = useCallback(
    (name: string, parentId: string | null, type: FileItem['type'], content = ''): FileItem => {
      const newFile: FileItem = {
        id: 'file-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name,
        parentId,
        type,
        content,
        size: content.length || 120,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCloudSynced: false,
      };
      setFiles((prev) => [...prev, newFile]);
      sounds.playClick();
      addNotification('Datei erstellt', `"${name}" wurde angelegt.`, 'success', 'Dateien');
      return newFile;
    },
    [addNotification]
  );

  const createFolder = useCallback(
    (name: string, parentId: string | null): FileItem => {
      const newFolder: FileItem = {
        id: 'folder-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        name,
        parentId,
        type: 'folder',
        content: '',
        size: 4096,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCloudSynced: false,
      };
      setFiles((prev) => [...prev, newFolder]);
      sounds.playClick();
      addNotification('Ordner erstellt', `Ordner "${name}" wurde angelegt.`, 'success', 'Dateien');
      return newFolder;
    },
    [addNotification]
  );

  const updateFile = useCallback((id: string, content: string, name?: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              content,
              name: name || f.name,
              size: content.length,
              updatedAt: Date.now(),
              isCloudSynced: false,
            }
          : f
      )
    );
  }, []);

  const deleteItem = useCallback(
    (id: string) => {
      const item = files.find((f) => f.id === id);
      if (item?.isProtected) {
        addNotification('Schutz aktiv', 'Geschützte Systemdateien können nicht gelöscht werden.', 'warning', 'Dateien');
        return;
      }

      // If folder, recursively delete child files
      const getDescendantIds = (parentId: string): string[] => {
        const children = files.filter((f) => f.parentId === parentId);
        let ids = children.map((c) => c.id);
        children.forEach((c) => {
          if (c.type === 'folder') {
            ids = [...ids, ...getDescendantIds(c.id)];
          }
        });
        return ids;
      };

      const idsToDelete = [id, ...getDescendantIds(id)];
      setFiles((prev) => prev.filter((f) => !idsToDelete.includes(f.id)));
      sounds.playClick();
      addNotification('Gelöscht', `Element "${item?.name}" wurde gelöscht.`, 'info', 'Dateien');
    },
    [files, addNotification]
  );

  const uploadHostFile = useCallback(
    async (file: File, parentId: string | null) => {
      try {
        let type: FileItem['type'] = 'text';
        let content = '';

        if (file.type.startsWith('image/')) {
          type = 'image';
          content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } else if (file.name.endsWith('.md')) {
          type = 'markdown';
          content = await file.text();
        } else if (file.name.endsWith('.json')) {
          type = 'json';
          content = await file.text();
        } else if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.sh')) {
          type = 'code';
          content = await file.text();
        } else {
          content = await file.text();
        }

        createFile(file.name, parentId, type, content);
      } catch (err: any) {
        addNotification('Upload Fehler', 'Datei konnte nicht gelesen werden.', 'error', 'Dateien');
      }
    },
    [createFile, addNotification]
  );

  const downloadFile = useCallback(
    (id: string) => {
      const item = files.find((f) => f.id === id);
      if (!item || item.type === 'folder') return;

      const blob = new Blob([item.content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addNotification('Download bereit', `"${item.name}" wurde exportiert.`, 'info', 'Dateien');
    },
    [files, addNotification]
  );

  // Encrypted Cloud Sync Engine
  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    setCloudSync((prev) => ({ ...prev, isSyncing: true, lastError: null }));

    try {
      // 1. Pack full user vault (Files, Settings, Metadata)
      const vaultState = {
        userId: currentUser.id,
        username: currentUser.username,
        files,
        settings,
        syncedAt: Date.now(),
        osVersion: '2.4.0',
      };

      // 2. Client-side Zero-Knowledge AES-GCM 256-bit Encryption
      const encryptionPassphrase = currentUser.pin || 'obsidian-master-key';
      const encryptedBundle = await CryptoService.encryptData(
        vaultState,
        encryptionPassphrase,
        currentUser.encryptionSalt
      );

      // 3. Push encrypted payload to Firebase Firestore directly & Express proxy
      await FirebaseService.saveEncryptedVault({
        userId: currentUser.id,
        encryptedPayload: encryptedBundle.ciphertext,
        iv: encryptedBundle.iv,
        salt: encryptedBundle.salt,
        checksum: encryptedBundle.checksum,
        version: (cloudSync.remoteVersion || 1) + 1,
        timestamp: Date.now(),
        clientInfo: `ObsidianOS 2.4 (${navigator.userAgent})`,
      });

      try {
        await fetch('/api/sync/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            encryptedPayload: encryptedBundle.ciphertext,
            iv: encryptedBundle.iv,
            salt: encryptedBundle.salt,
            checksum: encryptedBundle.checksum,
            clientInfo: `ObsidianOS 2.4 (${navigator.userAgent})`,
          }),
        });
      } catch {}

      // Also save unencrypted system state for rapid UI restore
      await FirebaseService.saveSystemState(currentUser.id, {
        settings,
        files,
        iconPositions,
        recentApps,
        installedAppIds,
        customApps,
      });

      const resVersion = (cloudSync.remoteVersion || 1) + 1;

      // Update local sync state
      setCloudSync((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncedAt: Date.now(),
        remoteVersion: resVersion,
        localVersion: resVersion,
        pendingChangesCount: 0,
        totalSyncedBytes: encryptedBundle.ciphertext.length,
        syncHistory: [
          {
            timestamp: Date.now(),
            status: 'success',
            action: 'push',
            size: encryptedBundle.ciphertext.length,
            message: `AES-GCM verschlüsselte Sicherung (Version ${resVersion}) übertragen`,
          },
          ...prev.syncHistory.slice(0, 9),
        ],
      }));

      // Mark all files as synced
      setFiles((prev) => prev.map((f) => ({ ...f, isCloudSynced: true })));

      sounds.playSyncSuccess();
      addNotification(
        'Cloud-Sync Erfolgreich',
        `Alle Daten wurden mit AES-256-GCM verschlüsselt gesichert (${Math.round(encryptedBundle.ciphertext.length / 1024 * 10) / 10} KB).`,
        'success',
        'Cloud-Tresor'
      );
      return true;
    } catch (err: any) {
      console.error('Sync failed:', err);
      setCloudSync((prev) => ({
        ...prev,
        isSyncing: false,
        lastError: err?.message || 'Synchronisationsfehler',
        syncHistory: [
          {
            timestamp: Date.now(),
            status: 'error',
            action: 'push',
            size: 0,
            message: `Fehler: ${err?.message || 'Verbindung fehlgeschlagen'}`,
          },
          ...prev.syncHistory.slice(0, 9),
        ],
      }));
      addNotification('Sync Fehler', 'Cloud-Synchronisation fehlgeschlagen.', 'error', 'Cloud-Tresor');
      return false;
    }
  }, [currentUser, files, settings, addNotification]);

  const pullCloudSync = useCallback(
    async (passphrase?: string): Promise<boolean> => {
      if (!currentUser) return false;

      setCloudSync((prev) => ({ ...prev, isSyncing: true, lastError: null }));

      try {
        let record: any = null;

        // Try Firebase Firestore first
        const fireRes = await FirebaseService.loadEncryptedVault(currentUser.id);
        if (fireRes.success && fireRes.record) {
          record = fireRes.record;
        } else {
          // Fallback to Express endpoint
          const response = await fetch(`/api/sync/pull/${currentUser.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.found && data.record) {
              record = data.record;
            }
          }
        }

        if (!record) {
          throw new Error('Keine Sicherungsdaten für diesen Benutzer in Firebase gefunden.');
        }

        const keyPass = passphrase || currentUser.pin || 'obsidian-master-key';

        const decrypted = await CryptoService.decryptData(
          record.encryptedPayload,
          record.iv,
          record.salt,
          keyPass,
          record.checksum
        );

        if (!decrypted.success || !decrypted.data) {
          throw new Error(decrypted.error || 'Entschlüsselung fehlgeschlagen.');
        }

        const restored = decrypted.data;
        if (restored.files && Array.isArray(restored.files)) {
          setFiles(restored.files);
        }
        if (restored.settings) {
          setSettings((prev) => ({ ...prev, ...restored.settings }));
        }

        setCloudSync((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: Date.now(),
          remoteVersion: record.version || prev.remoteVersion,
          localVersion: record.version || prev.localVersion,
          syncHistory: [
            {
              timestamp: Date.now(),
              status: 'success',
              action: 'pull',
              size: record.encryptedPayload.length,
              message: `Cloud-Tresor (Firebase) erfolgreich entschlüsselt und wiederhergestellt.`,
            },
            ...prev.syncHistory.slice(0, 9),
          ],
        }));

        sounds.playSyncSuccess();
        addNotification('Wiederherstellung Erfolgreich', 'Cloud-Daten wurden via Firebase synchronisiert.', 'success', 'Cloud-Tresor');
        return true;
      } catch (err: any) {
        setCloudSync((prev) => ({
          ...prev,
          isSyncing: false,
          lastError: err?.message || 'Fehler beim Abrufen der Cloud-Daten',
        }));
        addNotification('Wiederherstellung Fehlgeschlagen', err?.message || 'Fehler', 'error', 'Cloud-Tresor');
        return false;
      }
    },
    [currentUser, addNotification]
  );

  const exportEncryptedVault = useCallback(async () => {
    if (!currentUser) return;
    const encryptionPassphrase = currentUser.pin || 'obsidian-master-key';
    const vaultState = {
      userId: currentUser.id,
      username: currentUser.username,
      files,
      settings,
      exportedAt: Date.now(),
    };

    const encrypted = await CryptoService.encryptData(
      vaultState,
      encryptionPassphrase,
      currentUser.encryptionSalt
    );

    const exportPackage = {
      format: 'ObsidianOS-Encrypted-Vault-v2',
      algorithm: 'AES-256-GCM',
      kdf: 'PBKDF2-SHA256',
      userId: currentUser.id,
      username: currentUser.username,
      salt: encrypted.salt,
      iv: encrypted.iv,
      ciphertext: encrypted.ciphertext,
      checksum: encrypted.checksum,
      timestamp: Date.now(),
    };

    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `obsidian-vault-${currentUser.username}-${new Date().toISOString().slice(0, 10)}.obsidianvault`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addNotification('Vault Exportiert', 'Verschlüsselte Sicherungsdatei heruntergeladen.', 'success', 'Sicherheit');
  }, [currentUser, files, settings, addNotification]);

  const importEncryptedVault = useCallback(
    async (file: File, passphrase: string): Promise<boolean> => {
      try {
        const text = await file.text();
        const pkg = JSON.parse(text);

        if (!pkg.ciphertext || !pkg.iv || !pkg.salt) {
          throw new Error('Ungültiges Vault-Dateiformat.');
        }

        const decrypted = await CryptoService.decryptData(
          pkg.ciphertext,
          pkg.iv,
          pkg.salt,
          passphrase,
          pkg.checksum
        );

        if (!decrypted.success || !decrypted.data) {
          throw new Error(decrypted.error || 'Falsche Passphrase.');
        }

        const data = decrypted.data;
        if (data.files && Array.isArray(data.files)) {
          setFiles(data.files);
        }
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }

        sounds.playSyncSuccess();
        addNotification('Vault Importiert', 'Alle Dateien & Einstellungen wiederhergestellt.', 'success', 'Sicherheit');
        return true;
      } catch (err: any) {
        addNotification('Import Fehler', err?.message || 'Wiederherstellung fehlgeschlagen', 'error', 'Sicherheit');
        return false;
      }
    },
    [addNotification]
  );

  const openSpotlight = useCallback(() => {
    setIsSpotlightOpen(true);
    sounds.playClick();
  }, []);

  const closeSpotlight = useCallback(() => {
    setIsSpotlightOpen(false);
  }, []);

  const toggleControlCenter = useCallback(() => {
    setIsControlCenterOpen((prev) => !prev);
    sounds.playClick();
  }, []);

  const installApp = useCallback(
    (appId: string) => {
      setInstalledAppIds((prev) => {
        if (prev.includes(appId)) return prev;
        const next = [...prev, appId];
        try {
          localStorage.setItem('obsidian_installed_apps', JSON.stringify(next));
        } catch {}
        if (currentUser) {
          FirebaseService.saveSystemState(currentUser.id, { installedAppIds: next });
        }
        return next;
      });
      sounds.playSuccess();
      const meta = APPS_REGISTRY.find((a) => a.id === appId);
      addNotification('App installiert', `"${meta?.name || appId}" wurde erfolgreich auf dem Desktop hinzugefügt.`, 'success', 'App Store');
    },
    [currentUser, addNotification, sounds]
  );

  const uninstallApp = useCallback(
    (appId: string) => {
      setInstalledAppIds((prev) => {
        const next = prev.filter((id) => id !== appId);
        try {
          localStorage.setItem('obsidian_installed_apps', JSON.stringify(next));
        } catch {}
        if (currentUser) {
          FirebaseService.saveSystemState(currentUser.id, { installedAppIds: next });
        }
        return next;
      });
      sounds.playClose();
      const meta = APPS_REGISTRY.find((a) => a.id === appId);
      addNotification('App deinstalliert', `"${meta?.name || appId}" wurde entfernt.`, 'info', 'App Store');
    },
    [currentUser, addNotification, sounds]
  );

  const addCustomApp = useCallback(
    (app: { id?: string; name: string; icon: string; code: string }) => {
      const newApp = {
        ...app,
        id: app.id || `custom-app-${Date.now()}`,
      };
      setCustomApps((prev) => {
        const next = [...prev, newApp];
        try {
          localStorage.setItem('obsidian_custom_apps', JSON.stringify(next));
        } catch {}
        if (currentUser) {
          FirebaseService.saveSystemState(currentUser.id, { customApps: next });
        }
        return next;
      });

      // Upload directly to Firestore obsidian_app_store collection
      FirebaseService.uploadAppToStore({
        id: newApp.id,
        appId: newApp.id,
        name: newApp.name,
        iconName: newApp.icon,
        code: newApp.code,
        author: currentUser?.displayName || 'User',
      });

      sounds.playSuccess();
      addNotification('KI App gespeichert', `"${app.name}" wurde in Firestore & auf dem Desktop gesichert!`, 'success', 'AI Generator');
    },
    [currentUser, addNotification, sounds]
  );

  const removeCustomApp = useCallback(
    (id: string) => {
      setCustomApps((prev) => {
        const next = prev.filter((a) => a.id !== id);
        try {
          localStorage.setItem('obsidian_custom_apps', JSON.stringify(next));
        } catch {}
        if (currentUser) {
          FirebaseService.saveSystemState(currentUser.id, { customApps: next });
        }
        return next;
      });
      // Also delete from Firestore store
      FirebaseService.deleteAppFromStore(id);
      sounds.playClose();
      addNotification('App gelöscht', 'Benutzerdefinierte KI-App wurde aus Firestore und vom Desktop entfernt.', 'info', 'AI Generator');
    },
    [currentUser, addNotification, sounds]
  );

  const closeControlCenter = useCallback(() => {
    setIsControlCenterOpen(false);
  }, []);

  // Global Media Playback Controller (YouTube, Apple Music, Web Audio)
  const [nowPlaying, setNowPlaying] = useState<MediaPlaybackState | null>(null);

  const toggleGlobalMedia = useCallback(() => {
    if (!nowPlaying) return;
    const nextPlaying = !nowPlaying.isPlaying;
    setNowPlaying((prev) => (prev ? { ...prev, isPlaying: nextPlaying } : null));
    window.dispatchEvent(
      new CustomEvent('os-media-command', {
        detail: { action: nextPlaying ? 'play' : 'pause', id: nowPlaying.id, source: nowPlaying.source },
      })
    );
  }, [nowPlaying]);

  const pauseGlobalMedia = useCallback(() => {
    if (!nowPlaying) return;
    setNowPlaying((prev) => (prev ? { ...prev, isPlaying: false } : null));
    window.dispatchEvent(
      new CustomEvent('os-media-command', {
        detail: { action: 'pause', id: nowPlaying.id, source: nowPlaying.source },
      })
    );
  }, [nowPlaying]);

  const stopGlobalMedia = useCallback(() => {
    if (!nowPlaying) return;
    const currentSource = nowPlaying.source;
    const currentId = nowPlaying.id;
    setNowPlaying(null);
    window.dispatchEvent(
      new CustomEvent('os-media-command', {
        detail: { action: 'stop', id: currentId, source: currentSource },
      })
    );
  }, [nowPlaying]);

  // Listen for media update events from apps
  useEffect(() => {
    const handleMediaUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<MediaPlaybackState | null>;
      setNowPlaying(customEvent.detail);
    };

    window.addEventListener('os-media-update', handleMediaUpdate);
    return () => {
      window.removeEventListener('os-media-update', handleMediaUpdate);
    };
  }, []);

  const value: OSContextType = {
    systemBootTime,
    effectiveTheme,
    effectiveGlassContrast,
    isLight,
    isDark,
    isGlassy,
    users,
    currentUser,
    isLocked,
    isSetupCompleted,
    login,
    logout,
    lockScreen,
    createUser,
    updateUser,
    deleteUser,
    deleteAccount,
    switchUser,
    completeSetup,
    loginExistingAccount,
    openSetupAssistant,
    resetSetupState,
    isStartupAnimationActive,
    playStartupAnimation,
    closeStartupAnimation,

    settings,
    accentConfig,
    updateSettings,

    windows,
    activeWindowId,
    openApp,
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    focusWindow,
    updateWindowBounds,
    snapWindow,
    unsnapWindow,
    snapPreview,
    setSnapPreview,
    isDraggingAnyWindow,
    setIsDraggingAnyWindow,

    files,
    createFile,
    createFolder,
    updateFile,
    deleteItem,
    uploadHostFile,
    downloadFile,

    gameSaves,
    saveGameState,
    loadGameState,
    getGameSaveInfo,

    cloudSync,
    triggerSync,
    pullCloudSync,
    exportEncryptedVault,
    importEncryptedVault,

    iconPositions,
    updateIconPosition,
    desktopPinnedAppIds,
    addAppToDesktop,
    removeAppFromDesktop,
    toggleAppOnDesktop,
    isAppOnDesktop,
    restoreFullBackup,
    recentApps,

    installedAppIds,
    installApp,
    uninstallApp,
    customApps,
    addCustomApp,
    removeCustomApp,

    isSpotlightOpen,
    openSpotlight,
    closeSpotlight,

    isControlCenterOpen,
    toggleControlCenter,
    closeControlCenter,
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,

    nowPlaying,
    setNowPlaying,
    toggleGlobalMedia,
    pauseGlobalMedia,
    stopGlobalMedia,

    sounds,
  };

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
};

export const useOS = (): OSContextType => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within an OSProvider');
  }
  return context;
};
