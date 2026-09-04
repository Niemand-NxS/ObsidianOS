export type AppId =
  | 'settings'
  | 'files'
  | 'calculator'
  | 'browser'
  | 'terminal'
  | 'notes'
  | 'gallery'
  | 'music'
  | 'monitor'
  | 'appstore'
  | 'youtube'
  | 'retro-2048'
  | 'snake'
  | 'minesweeper'
  | 'flappy-cube'
  | 'space-invaders'
  | 'cyber-memory'
  | 'sudoku'
  | 'pomodoro'
  | 'weather'
  | 'pixel-paint'
  | 'crypto-radar'
  | 'audio-synth'
  | 'chess'
  | (string & {});

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  highThumbnailUrl?: string;
  duration?: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
  channelAvatarUrl?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  customUrl?: string;
  publishedAt: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
  viewCount?: string;
  country?: string;
}

export interface YouTubeSubscription {
  channelId: string;
  channelTitle: string;
  avatarUrl?: string;
  subscribedAt: number;
}

export interface YouTubeComment {
  id: string;
  authorDisplayName: string;
  authorProfileImageUrl: string;
  textDisplay: string;
  likeCount: number;
  publishedAt: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  videoIds: string[];
  thumbnailUrl?: string;
}

export interface MediaPlaybackState {
  id: string;
  title: string;
  artist: string;
  source: 'youtube' | 'music' | 'synth' | 'webaudio';
  coverUrl?: string;
  isPlaying: boolean;
  duration?: number;
  currentTime?: number;
  appId?: AppId;
}


export interface CustomAppItem {
  id: string;
  name: string;
  icon: string;
  category?: string;
  description?: string;
  version?: string;
  html?: string;
  code?: string;
  createdAt: number;
}

export interface AppMetadata {
  id: AppId;
  name: string;
  category: 'System' | 'Produktivität' | 'Dienstprogramme' | 'Entwicklung' | 'Medien' | 'Store' | 'Spiele';
  iconName: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  isPreinstalled: boolean;
}

export interface GameSaveRecord {
  gameId: string;
  userId: string;
  state: any;
  score?: number;
  highScore?: number;
  level?: number;
  details?: string;
  updatedAt: number;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  avatar: string; // emoji or image
  pin: string; // 4-6 digit pin or password
  role: 'Administrator' | 'Benutzer' | 'Gast';
  bio?: string;
  customAvatarUrl?: string;
  createdAt: number;
  lastLogin: number;
  encryptionSalt: string; // unique salt for PBKDF2
}

export type WallpaperId =
  | 'obsidian-deep'
  | 'violet-nebula'
  | 'cyber-grid'
  | 'matrix-dark'
  | 'emerald-synth'
  | 'ocean-abyss'
  | 'sunset-dusk'
  | 'crimson-noir'
  | 'golden-aurora'
  | 'anthracite-mesh'
  | 'minimal-glow'
  | 'shader-obsidian'
  | 'shader-cyberwaves'
  | 'shader-chroma'
  | 'shader-aurora'
  | 'shader-matrix'
  | 'shader-quantum'
  | string;

export type AccentColorId =
  | 'violet-classic'
  | 'emerald-matrix'
  | 'ocean-cyan'
  | 'sunset-amber'
  | 'crimson-ruby'
  | 'electric-blue'
  | 'rose-quartz'
  | 'golden-sun'
  | 'monochrome-slate'
  | 'purple-amethyst'
  | 'lavender-mist'
  | 'magenta-noir';

export interface AccentColorConfig {
  id: AccentColorId;
  name: string;
  primary: string; // e.g. #a855f7
  secondary: string; // e.g. #7e22ce
  glow: string; // rgba
  border: string;
  text: string;
  bgLight: string;
}

export type LockscreenWallpaperMode = 'random_photo' | 'category' | 'fixed' | 'shader' | 'custom_photo' | 'sync_desktop';
export type LockscreenCategory =
  | 'all'
  | 'mountains'
  | 'space'
  | 'cyberpunk'
  | 'architecture'
  | 'ocean_aurora'
  | 'minimal_nature'
  | 'abstract';

export type ClockFont =
  | 'sans-ultralight'
  | 'mono-cyber'
  | 'serif-luxury'
  | 'digital-led'
  | 'rounded-futuristic'
  | 'condensed-bold';

export type ClockSize = 'compact' | 'normal' | 'huge';

export type ClockTimeAnimation =
  | 'fade'
  | 'slide-up'
  | 'flip'
  | 'scale-pop'
  | 'blur-shift';

export type UnlockAnimation =
  | 'zoom-burst'
  | 'curtain-up'
  | 'portal-expand'
  | 'lens-blur'
  | 'warp-speed'
  | 'smooth-fade';

export type DesktopIconSize = 'small' | 'medium' | 'large';
export type DesktopGridSpacing = 'compact' | 'comfortable' | 'spacious';

export interface LockscreenPhoto {
  id: string;
  title: string;
  category: LockscreenCategory;
  url: string;
  thumbUrl: string;
  location: string;
  photographer: string;
}

export interface PersonalizationSettings {
  // Theme & Appearance
  themeMode?: 'dark' | 'light' | 'glassy' | 'auto';
  glassOpacity?: number; // in %, e.g. 10 to 95
  glassContrast?: 'auto' | 'dark' | 'light'; // Text & symbols contrast mode on glassy surfaces
  glassAutoContrast?: boolean;
  iconStyle?: 'glassy' | 'dark' | 'light' | 'colored' | 'auto';
  iconGlassOpacity?: number; // in %, e.g. 10 to 100
  iconGlassBlur?: number; // in px, e.g. 0 to 32
  iconRadius?: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
  iconGlow?: boolean;
  wallpaper: WallpaperId;
  wallpaperFit?: 'cover' | 'contain' | 'center';
  customGradient?: string;
  accentColor: AccentColorId;
  customAccentHex?: string;
  desktopWallpaperMode?: 'shader' | 'photo' | 'sync_lockscreen' | 'gradient';
  desktopShaderId?: WallpaperId;
  desktopPhotoId?: string;
  desktopCustomPhotoUrl?: string;
  customWallpapers?: Array<{ id: string; name: string; url: string; createdAt: number }>;
  desktopBlur?: number; // in px, e.g. 0 to 40
  desktopDimming?: number; // in %, e.g. 0 to 80
  desktopShowGlanceWidget?: boolean;
  desktopGlancePosition?: { x: number; y: number };
  desktopGlanceStyle?: 'glass-compact' | 'glass-expanded' | 'minimal-pill';
  desktopWidgetType?: 'clock' | 'weather' | 'system' | 'notes' | 'player' | 'crypto' | 'battery' | 'pomodoro' | 'quote';
  desktopQuickNoteText?: string;
  desktopIconSize?: DesktopIconSize;
  desktopGridSpacing?: DesktopGridSpacing;
  desktopShowIconLabels?: boolean;
  desktopIconClickMode?: 'double' | 'single';
  desktopPinnedAppIds?: string[]; // IDs of apps explicitly pinned to the home screen
  lockscreenMode?: LockscreenWallpaperMode;
  lockscreenShaderId?: WallpaperId;
  lockscreenCategory?: LockscreenCategory;
  lockscreenFixedPhotoId?: string;
  lockscreenCustomPhotoUrl?: string;
  lockscreenBlur?: number; // in px, e.g. 0 to 40
  lockscreenDimming?: number; // in %, e.g. 10 to 80
  lockscreenShowClock?: boolean;
  lockscreenShowPhotoInfo?: boolean;
  clockFont?: ClockFont;
  clockSize?: ClockSize;
  clockShowSeconds?: boolean;
  clockShowDate?: boolean;
  clockTimeAnimation?: ClockTimeAnimation;
  unlockAnimation?: UnlockAnimation;
  dockPosition: 'bottom' | 'top' | 'left' | 'right';
  dockAlignment?: 'center' | 'left' | 'right';
  dockSize: 'small' | 'medium' | 'large';
  dockMagnification: boolean;
  dockAutoHide: boolean;
  glassBlur: number; // in px, e.g. 0 to 40
  glassBlurEnabled?: boolean;
  windowButtonsPosition?: 'left' | 'right';
  animationsEnabled: boolean;
  windowSnapLayouts?: boolean;
  windowShadowIntensity?: 'none' | 'subtle' | 'medium' | 'deep' | 'glow';
  soundEffects: boolean;
  soundVolume: number; // 0 to 100
  soundMuted?: boolean;
  clickSounds?: boolean;
  errorSounds?: boolean;
  startupSound?: boolean;
  typingSounds: boolean;
  notificationSounds: boolean;
  clockFormat24h: boolean;
  fontSize: 'small' | 'medium' | 'large';
  windowGlow: number; // 0 to 100
  windowRadius: number; // in px, e.g. 16
  brightness: number; // 50 to 120
  nightShift: boolean;
  desktopGridSnap: boolean;
  showIconLabels: boolean;
  lockDesktopIcons: boolean;
  uiScale: 'default' | 'compact' | 'large';
  uiScalePercent?: number; // 80, 90, 100, 110, 120
  contrastMode: 'normal' | 'high' | 'oled';
  autoLockMinutes: number;
  inactivityTimeoutMinutes?: number;
  gpuAcceleration: boolean;
  simulatedNetworkOffline?: boolean;
  autostartApps?: string[];
  customAppIcons?: Record<string, string>;
  systemLanguage?: 'de' | 'en' | 'fr' | 'es' | 'it' | 'ja' | 'zh';
}

export type SnapTarget =
  | 'maximize'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export interface WindowState {
  id: string; // unique window instance id
  appId: AppId;
  title: string;
  iconName: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  snapState?: SnapTarget | null;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  prevBounds?: { x: number; y: number; width: number; height: number };
  customData?: Record<string, any>;
}

export type FileType = 'text' | 'markdown' | 'image' | 'code' | 'json' | 'vault' | 'system' | 'folder';

export interface FileItem {
  id: string;
  name: string;
  parentId: string | null; // null for root items
  type: FileType;
  content: string; // text content, base64 for image, or JSON
  size: number; // bytes
  createdAt: number;
  updatedAt: number;
  isProtected?: boolean;
  isCloudSynced?: boolean;
}

export interface EncryptedCloudPayload {
  userId: string;
  encryptedData: string; // AES-GCM ciphertext in base64
  iv: string; // Initialization vector in base64
  salt: string; // PBKDF2 salt in base64
  checksum: string; // SHA-256 hash of plaintext
  timestamp: number;
  version: number;
}

export interface CloudSyncState {
  isConfigured: boolean;
  autoSync: boolean;
  syncIntervalMinutes: number;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  encryptionAlgorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305';
  keyDerivation: 'PBKDF2-SHA256 (100,000 Iterationen)';
  serverEndpoint: string;
  lastError: string | null;
  remoteVersion: number;
  localVersion: number;
  pendingChangesCount: number;
  totalSyncedBytes: number;
  syncHistory: Array<{
    timestamp: number;
    status: 'success' | 'error';
    action: 'push' | 'pull';
    size: number;
    message: string;
  }>;
}

export interface SpotlightItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'App' | 'Datei' | 'Einstellung' | 'Aktion' | 'Rechner' | 'Befehl';
  icon: string;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
  appId?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  source: string;
  read: boolean;
}

export interface CalculatorHistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  isLoading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  history: string[];
  historyIndex: number;
  zoomLevel?: number;
  isReaderMode?: boolean;
}

export interface StoreAppItem {
  id: string;
  name: string;
  category: 'Spiele' | 'Produktivität' | 'Dienstprogramme' | 'Kreativität' | 'Entwicklung';
  rating: number;
  reviewsCount?: number;
  size: string;
  iconName: string;
  description: string;
  features?: string[];
  version: string;
  code?: string;
  isCustom?: boolean;
  author?: string;
  createdAt?: number;
}

