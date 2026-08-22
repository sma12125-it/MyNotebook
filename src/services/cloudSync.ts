import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  onAuthStateChanged,
  User,
  handleFirestoreError,
  OperationType,
} from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { StorageService } from './storage';
import { AppState } from '../types';

export interface SecurityConfig {
  isLockEnabled: boolean;
  lockType: 'pin' | 'pattern' | 'biometric';
  pinCode: string;
  patternCode: string;
  isBiometricEnabled: boolean;
  autoLockMinutes: number;
}

const DEFAULT_SECURITY: SecurityConfig = {
  isLockEnabled: false,
  lockType: 'biometric',
  pinCode: '1234',
  patternCode: '',
  isBiometricEnabled: true,
  autoLockMinutes: 5,
};

const SECURITY_KEY = 'mylifeos_security_config_v2';
const PENDING_SYNC_KEY = 'mylifeos_pending_cloud_sync_v2';

export type SyncStatusType = 'synced' | 'syncing' | 'offline' | 'pending' | 'error';

export class CloudSyncService {
  private static currentUser: User | null = null;
  private static unsubscribeSnapshot: (() => void) | null = null;
  private static isSyncing = false;
  private static syncTimeout: NodeJS.Timeout | null = null;
  private static syncListeners: Array<(status: SyncStatusType, user: User | null) => void> = [];
  private static onStateChangeCallback: ((state: AppState) => void) | null = null;
  private static isInitialized = false;

  // Initialize Auth, Realtime Sync, and Online/Offline Listeners
  static init(onStateChange?: (state: AppState) => void) {
    if (onStateChange) {
      this.onStateChangeCallback = onStateChange;
    }

    if (this.isInitialized) return;
    this.isInitialized = true;

    // Window Online / Offline Handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyListeners('syncing', this.currentUser);
        this.syncBidirectional();
      });

      window.addEventListener('offline', () => {
        this.notifyListeners('offline', this.currentUser);
      });
    }

    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      if (user) {
        // Switch local storage namespace to this user's isolated storage
        StorageService.setActiveUserId(user.uid);
        StorageService.registerUser({
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'کاربر',
          email: user.email || '',
        });

        this.notifyListeners(isOnline ? 'syncing' : 'offline', user);
        // Start listening to user data in Firestore (will load cloud data first without wiping)
        this.startRealtimeSync(user.uid);
      } else {
        if (this.unsubscribeSnapshot) {
          this.unsubscribeSnapshot();
          this.unsubscribeSnapshot = null;
        }
        // When logged out, reset to unauthenticated namespace
        StorageService.setActiveUserId(null);
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(StorageService.getAllState());
        }
        this.notifyListeners('offline', null);
      }
    });
  }

  // Subscribe to sync status
  static onSyncStatusChange(callback: (status: SyncStatusType, user: User | null) => void) {
    this.syncListeners.push(callback);
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    const initialStatus: SyncStatusType = this.currentUser
      ? isOnline
        ? 'synced'
        : 'offline'
      : 'offline';
    callback(initialStatus, this.currentUser);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private static notifyListeners(status: SyncStatusType, user: User | null) {
    this.syncListeners.forEach((cb) => cb(status, user));
  }

  // Get current logged in user
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Google Login
  static async loginWithGoogle(): Promise<User | null> {
    try {
      this.notifyListeners('syncing', null);
      const result = await signInWithPopup(auth, googleProvider);
      this.currentUser = result.user;
      StorageService.setActiveUserId(result.user.uid);
      StorageService.registerUser({
        id: result.user.uid,
        name: result.user.displayName || result.user.email?.split('@')[0] || 'کاربر',
        email: result.user.email || '',
      });
      // Synchronize bidirectionally upon login
      await this.syncBidirectional();
      return result.user;
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      this.notifyListeners('error', null);
      throw error;
    }
  }

  // Sign out (Strict User Separation)
  static async logout(): Promise<void> {
    try {
      if (this.unsubscribeSnapshot) {
        this.unsubscribeSnapshot();
        this.unsubscribeSnapshot = null;
      }
      await firebaseSignOut(auth);
      this.currentUser = null;
      StorageService.clearCurrentSession();
      this.notifyListeners('offline', null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Start Realtime Firestore Sync for Authenticated User
  private static startRealtimeSync(userId: string) {
    if (this.unsubscribeSnapshot) {
      this.unsubscribeSnapshot();
    }

    const dataDocRef = doc(db, 'users', userId, 'data', 'records');

    this.unsubscribeSnapshot = onSnapshot(
      dataDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          if (cloudData && cloudData.payload) {
            try {
              const parsed: AppState = JSON.parse(cloudData.payload);
              // Save locally with sync trigger suppressed to avoid echo loop
              StorageService.saveAllState(parsed, false);
              if (this.onStateChangeCallback) {
                this.onStateChangeCallback(parsed);
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('mylifeos_cloud_synced', { detail: parsed }));
              }
              this.notifyListeners('synced', this.currentUser);
              if (typeof localStorage !== 'undefined') {
                localStorage.removeItem(PENDING_SYNC_KEY);
              }
            } catch (err) {
              console.error('Error parsing cloud data:', err);
            }
          }
        } else {
          // Cloud document does not exist yet for this user: initialize cloud with local state
          this.pushLocalToCloud();
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/data/records`);
        this.notifyListeners('error', this.currentUser);
      }
    );
  }

  // Trigger Immediate / Debounced Realtime Sync to Firestore Cloud Database
  static requestRealtimeSync(debounceMs = 200) {
    if (!this.currentUser) return;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PENDING_SYNC_KEY, 'true');
      } catch (e) {}
      this.notifyListeners('pending', this.currentUser);
      return;
    }

    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.pushLocalToCloud();
    }, debounceMs);
  }

  // Bidirectional Synchronization (Used when clicking manual sync button or logging in)
  static async syncBidirectional(): Promise<AppState | null> {
    if (!this.currentUser) return null;
    const userId = this.currentUser.uid;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      this.notifyListeners('offline', this.currentUser);
      return null;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing', this.currentUser);

    const dataDocRef = doc(db, 'users', userId, 'data', 'records');

    try {
      // 1. Fetch remote cloud state first
      const docSnap = await getDoc(dataDocRef);
      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        if (cloudData && cloudData.payload) {
          const parsed: AppState = JSON.parse(cloudData.payload);
          StorageService.saveAllState(parsed, false);
          if (this.onStateChangeCallback) {
            this.onStateChangeCallback(parsed);
          }
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mylifeos_cloud_synced', { detail: parsed }));
          }
          this.notifyListeners('synced', this.currentUser);
          this.isSyncing = false;
          return parsed;
        }
      }

      // 2. If no remote data existed, push local state
      await this.pushLocalToCloud();
      return StorageService.getAllState();
    } catch (error) {
      console.error('Bidirectional sync error:', error);
      this.notifyListeners('error', this.currentUser);
      return null;
    } finally {
      this.isSyncing = false;
    }
  }

  // Push local data to Firestore Cloud Database
  static async pushLocalToCloud(): Promise<void> {
    if (!this.currentUser || this.isSyncing) return;

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!isOnline) {
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PENDING_SYNC_KEY, 'true');
      } catch (e) {}
      this.notifyListeners('pending', this.currentUser);
      return;
    }

    this.isSyncing = true;
    this.notifyListeners('syncing', this.currentUser);

    const userId = this.currentUser.uid;
    const currentLocalState = StorageService.getAllState();
    const payloadString = JSON.stringify(currentLocalState);

    const dataDocRef = doc(db, 'users', userId, 'data', 'records');
    const profileDocRef = doc(db, 'users', userId);

    try {
      await setDoc(dataDocRef, {
        userId,
        payload: payloadString,
        updatedAt: new Date().toISOString(),
        timestamp: Date.now(),
      });

      await setDoc(
        profileDocRef,
        {
          userId,
          email: this.currentUser.email || '',
          name: currentLocalState.profile?.name || currentLocalState.profile?.fullName || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(PENDING_SYNC_KEY);
      }
      this.notifyListeners('synced', this.currentUser);
    } catch (error) {
      console.warn('Sync attempt encountered an issue, will retry when online:', error);
      try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(PENDING_SYNC_KEY, 'true');
      } catch (e) {}
      this.notifyListeners('pending', this.currentUser);
    } finally {
      this.isSyncing = false;
    }
  }

  // Security Config Persistence
  static getSecurityConfig(): SecurityConfig {
    try {
      if (typeof localStorage === 'undefined') return DEFAULT_SECURITY;
      const raw = localStorage.getItem(SECURITY_KEY);
      if (!raw) return DEFAULT_SECURITY;
      return { ...DEFAULT_SECURITY, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SECURITY;
    }
  }

  static saveSecurityConfig(config: SecurityConfig): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SECURITY_KEY, JSON.stringify(config));
      }
    } catch (err) {
      console.error('Error saving security config:', err);
    }
  }
}
