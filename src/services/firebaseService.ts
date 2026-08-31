import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { UserProfile } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase safely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use specified custom firestore database if configured or default
export const db =
  firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfigData.firestoreDatabaseId)
    : getFirestore(app);

// Error handling conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await FirebaseService.ensureAuth();
    await getDocFromServer(doc(db, 'obsidian_users_data', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or starting up.');
    }
    return false;
  }
}

// Enable offline cache if supported
try {
  if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
        // Multiple tabs open or not supported, ignore gracefully
      }
    });
  }
} catch {
  // Persistence already enabled
}

export interface SystemSyncPayload {
  userId: string;
  profile?: UserProfile;
  files?: any[];
  settings?: any;
  users?: any[];
  iconPositions?: Record<string, { x: number; y: number }>;
  installedAppIds?: string[];
  customApps?: any[];
  gameSaves?: Record<string, { state: any; score?: number; highScore?: number; level?: number; details?: string; updatedAt: number }>;
  gameScores?: Record<string, number>;
  recentApps?: string[];
  updatedAt?: number;
  lastSync?: string;
}

// In-flight singleton promise & cooldown cache to prevent auth/too-many-requests
let authInFlightPromise: Promise<FirebaseUser | null> | null = null;
let authRateLimitUntil = 0;

// Listen to auth state to keep current user warm
if (typeof window !== 'undefined') {
  try {
    onAuthStateChanged(auth, (_user) => {
      // currentUser is automatically updated by Firebase SDK
    });
  } catch {
    // Ignore initialization errors
  }
}

// Recursive sanitizer to remove any undefined properties from objects before saving to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && data !== null) {
    if (data instanceof Date) {
      return data;
    }
    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as T;
  }
  return data;
}

export const FirebaseService = {
  // Robust anonymous sign-in with concurrent deduplication & rate-limit backoff
  async ensureAuth(): Promise<FirebaseUser | null> {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    // Check if in cooldown after too-many-requests
    const now = Date.now();
    if (now < authRateLimitUntil) {
      return null;
    }

    // Deduplicate concurrent in-flight requests
    if (authInFlightPromise) {
      return authInFlightPromise;
    }

    authInFlightPromise = (async () => {
      try {
        if (auth.currentUser) return auth.currentUser;
        const cred = await signInAnonymously(auth);
        return cred.user;
      } catch (err: any) {
        const errCode = err?.code || '';
        const errMsg = err?.message || String(err);

        if (errCode === 'auth/too-many-requests' || errMsg.includes('too-many-requests')) {
          // Set 60-second cooldown to protect the client and respect rate limits
          authRateLimitUntil = Date.now() + 60000;
          // Silent non-blocking fallback
          return null;
        }

        // Silent catch for network or client offline issues
        return null;
      } finally {
        authInFlightPromise = null;
      }
    })();

    return authInFlightPromise;
  },

  // Save complete system state directly to Firestore
  async saveSystemState(userId: string, data: Partial<SystemSyncPayload>) {
    const docPath = `obsidian_users_data/${userId || 'admin'}`;
    try {
      await this.ensureAuth();
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'admin');
      const rawPayload = {
        ...data,
        userId: userId || 'admin',
        updatedAt: Date.now(),
        lastSync: new Date().toISOString(),
      };
      const sanitizedPayload = sanitizeForFirestore(rawPayload);
      await setDoc(userDocRef, sanitizedPayload, { merge: true });
      return { success: true, timestamp: sanitizedPayload.updatedAt };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Load user data from Firestore
  async loadSystemState(userId: string) {
    const docPath = `obsidian_users_data/${userId || 'admin'}`;
    try {
      await this.ensureAuth();
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'admin');
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return { success: true, data: snap.data() as SystemSyncPayload };
      }
      return { success: true, data: null };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Save the central user accounts registry to Firestore
  async saveUsersRegistry(users: UserProfile[]) {
    const docPath = 'obsidian_users_data/system_registry';
    try {
      await this.ensureAuth();
      const regDocRef = doc(db, 'obsidian_users_data', 'system_registry');
      const payload = sanitizeForFirestore({
        userId: 'system_registry',
        usersList: users,
        updatedAt: Date.now(),
      });
      await setDoc(regDocRef, payload, { merge: true });
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Fetch the central user accounts registry from Firestore
  async fetchUsersRegistry(): Promise<{ success: boolean; users?: UserProfile[] }> {
    const docPath = 'obsidian_users_data/system_registry';
    try {
      await this.ensureAuth();
      const regDocRef = doc(db, 'obsidian_users_data', 'system_registry');
      const snap = await getDoc(regDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && Array.isArray(data.usersList)) {
          return { success: true, users: data.usersList };
        }
      }
      return { success: true, users: [] };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return { success: false, users: [] };
    }
  },

  // Real-time synchronization subscription
  subscribeToUserData(userId: string, onUpdate: (data: SystemSyncPayload) => void) {
    const docPath = `obsidian_users_data/${userId || 'admin'}`;
    try {
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'admin');
      return onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            onUpdate(snap.data() as SystemSyncPayload);
          }
        },
        (err) => {
          handleFirestoreError(err, OperationType.GET, docPath);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return () => {};
    }
  },

  // Encrypted Vault Backup Storage in Firestore
  async saveEncryptedVault(record: {
    userId: string;
    encryptedPayload: string;
    iv: string;
    salt: string;
    checksum: string;
    version: number;
    timestamp: number;
    clientInfo?: string;
  }) {
    const docPath = `obsidian_sync_vaults/${record.userId}`;
    try {
      await this.ensureAuth();
      const vaultDocRef = doc(db, 'obsidian_sync_vaults', record.userId);
      const sanitized = sanitizeForFirestore(record);
      await setDoc(vaultDocRef, sanitized, { merge: true });
      return { success: true, version: record.version };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Pull Encrypted Vault from Firestore
  async loadEncryptedVault(userId: string) {
    const docPath = `obsidian_sync_vaults/${userId}`;
    try {
      await this.ensureAuth();
      const vaultDocRef = doc(db, 'obsidian_sync_vaults', userId);
      const snap = await getDoc(vaultDocRef);
      if (snap.exists()) {
        return { success: true, found: true, record: snap.data() };
      }
      return { success: true, found: false, record: null };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Save Game Save State & Progress to Firestore per user
  async saveUserGameState(
    userId: string,
    gameId: string,
    state: any,
    score?: number,
    level?: number,
    details?: string
  ) {
    const docPath = `obsidian_users_data/${userId || 'guest'}`;
    try {
      await this.ensureAuth();
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'guest');
      const snap = await getDoc(userDocRef);
      const existingData = snap.exists() ? snap.data() : {};
      const currentSaves = (existingData.gameSaves as Record<string, any>) || {};

      const prevSave = currentSaves[gameId] || {};
      const newHighScore = Math.max(score || 0, prevSave.highScore || 0, prevSave.score || 0);

      currentSaves[gameId] = {
        state: sanitizeForFirestore(state),
        score: score !== undefined ? score : prevSave.score,
        highScore: newHighScore,
        level: level !== undefined ? level : prevSave.level,
        details: details || prevSave.details || '',
        updatedAt: Date.now(),
      };

      const payload = {
        userId: userId || 'guest',
        gameSaves: currentSaves,
        updatedAt: Date.now(),
      };

      await setDoc(userDocRef, sanitizeForFirestore(payload), { merge: true });

      // Also publish to global high score leaderboard if score provided
      if (score && score > 0) {
        const userName = existingData.profile?.displayName || existingData.profile?.username || 'Player';
        await this.saveGameScore(gameId, userId, userName, score, level || 1);
      }

      return { success: true, save: currentSaves[gameId] };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Load specific game save state for user
  async loadUserGameState(userId: string, gameId: string) {
    const docPath = `obsidian_users_data/${userId || 'guest'}`;
    try {
      await this.ensureAuth();
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'guest');
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.gameSaves && data.gameSaves[gameId]) {
          return { success: true, save: data.gameSaves[gameId] };
        }
      }
      return { success: true, save: null };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return { success: false, save: null, error: err?.message };
    }
  },

  // Load all game saves for user
  async loadAllUserGameSaves(userId: string) {
    const docPath = `obsidian_users_data/${userId || 'guest'}`;
    try {
      await this.ensureAuth();
      const userDocRef = doc(db, 'obsidian_users_data', userId || 'guest');
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        return { success: true, saves: (data.gameSaves as Record<string, any>) || {} };
      }
      return { success: true, saves: {} };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.GET, docPath);
      return { success: false, saves: {}, error: err?.message };
    }
  },

  // Save Game Highscore to Firestore
  async saveGameScore(gameId: string, userId: string, userName: string, score: number, level = 1) {
    const scoreId = `${gameId}_${userId}`;
    const docPath = `obsidian_game_scores/${scoreId}`;
    try {
      await this.ensureAuth();
      const scoreDocRef = doc(db, 'obsidian_game_scores', scoreId);
      const snap = await getDoc(scoreDocRef);
      const existing = snap.data();

      // Only overwrite if new score is higher or doesn't exist
      if (!existing || score > (existing.score || 0)) {
        const payload = sanitizeForFirestore({
          gameId,
          userId,
          userName: userName || 'CyberPlayer',
          score,
          level,
          timestamp: Date.now(),
        });
        await setDoc(scoreDocRef, payload, { merge: true });
      }
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Get Top Game Highscores
  async getGameLeaderboard(gameId: string, maxResults = 10) {
    const colPath = 'obsidian_game_scores';
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, colPath),
        where('gameId', '==', gameId),
        orderBy('score', 'desc'),
        limit(maxResults)
      );
      const snap = await getDocs(q);
      const scores = snap.docs.map((d) => d.data());
      return { success: true, scores };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return { success: false, scores: [] };
    }
  },

  // Fetch or Seed App Store Catalog in Firestore
  async fetchStoreCatalog(): Promise<{ success: boolean; apps: any[] }> {
    const colPath = 'obsidian_app_store';
    try {
      await this.ensureAuth();
      const colRef = collection(db, colPath);
      const snap = await getDocs(colRef);
      if (!snap.empty) {
        const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        return { success: true, apps };
      }
      return { success: true, apps: [] };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return { success: false, apps: [] };
    }
  },

  // Save or Publish Custom / Community App to Firestore obsidian_app_store
  async uploadAppToStore(app: {
    id?: string;
    appId?: string;
    name: string;
    category?: string;
    rating?: number;
    size?: string;
    iconName?: string;
    icon?: string;
    description?: string;
    features?: string[];
    version?: string;
    code?: string;
    html?: string;
    author?: string;
  }) {
    const appId = (app.appId || app.id || `custom-${Date.now()}`).toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const docPath = `obsidian_app_store/${appId}`;
    try {
      await this.ensureAuth();
      const appDocRef = doc(db, 'obsidian_app_store', appId);
      const payload = sanitizeForFirestore({
        appId,
        id: appId,
        name: app.name,
        category: app.category || 'Entwicklung',
        rating: app.rating || 5.0,
        size: app.size || '1.5 MB',
        iconName: app.iconName || app.icon || 'Sparkles',
        icon: app.iconName || app.icon || 'Sparkles',
        description: app.description || 'Benutzerdefinierte Anwendung',
        features: app.features || ['Lokale Ausführung', 'Volle Interaktivität'],
        version: app.version || '1.0.0',
        code: app.code || app.html || '',
        author: app.author || 'ObsidianUser',
        createdAt: Date.now(),
      });
      await setDoc(appDocRef, payload, { merge: true });
      return { success: true, app: payload };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
      return { success: false, error: err?.message };
    }
  },

  // Real-time Store Catalog listener
  subscribeToStoreCatalog(onUpdate: (apps: any[]) => void) {
    const colPath = 'obsidian_app_store';
    try {
      const colRef = collection(db, colPath);
      return onSnapshot(
        colRef,
        (snap) => {
          const apps = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          onUpdate(apps);
        },
        (err) => {
          handleFirestoreError(err, OperationType.LIST, colPath);
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, colPath);
      return () => {};
    }
  },

  // Delete App from Store in Firestore
  async deleteAppFromStore(appId: string) {
    const docPath = `obsidian_app_store/${appId}`;
    try {
      await this.ensureAuth();
      const appDocRef = doc(db, 'obsidian_app_store', appId);
      await deleteDoc(appDocRef);
      return { success: true };
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
      return { success: false, error: err?.message };
    }
  },
};
