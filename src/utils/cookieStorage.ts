/**
 * Cookie and Storage Manager for ObsidianOS
 * Handles persistent session authentication, setup completion state,
 * and user preferences across browser reloads and devices.
 */

const SETUP_COOKIE_KEY = 'obsidian_setup_completed';
const SESSION_USER_COOKIE_KEY = 'obsidian_session_user_id';
const COOKIE_MAX_AGE_DAYS = 365;

export const CookieStorage = {
  // Read cookie by key
  getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const nameEQ = encodeURIComponent(name) + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  },

  // Write cookie with SameSite and Max-Age
  setCookie(name: string, value: string, days = COOKIE_MAX_AGE_DAYS) {
    if (typeof document === 'undefined') return;
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/; SameSite=Lax`;
  },

  // Remove cookie
  deleteCookie(name: string) {
    if (typeof document === 'undefined') return;
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=-99999999; path=/; SameSite=Lax`;
  },

  // Check if system setup was already completed
  isSetupCompleted(): boolean {
    try {
      const fromCookie = this.getCookie(SETUP_COOKIE_KEY);
      if (fromCookie === 'true') return true;

      const fromLocal = localStorage.getItem(SETUP_COOKIE_KEY);
      if (fromLocal === 'true') {
        // Repair cookie if present in localStorage
        this.setCookie(SETUP_COOKIE_KEY, 'true');
        return true;
      }
    } catch {}
    return false;
  },

  // Mark setup as completed in both cookies and localStorage
  markSetupCompleted(userId?: string) {
    try {
      this.setCookie(SETUP_COOKIE_KEY, 'true');
      localStorage.setItem(SETUP_COOKIE_KEY, 'true');
      if (userId) {
        this.setSessionUser(userId);
      }
    } catch {}
  },

  // Reset setup state (e.g. for testing or factory reset)
  resetSetupState() {
    try {
      this.deleteCookie(SETUP_COOKIE_KEY);
      this.deleteCookie(SESSION_USER_COOKIE_KEY);
      localStorage.removeItem(SETUP_COOKIE_KEY);
      localStorage.removeItem(SESSION_USER_COOKIE_KEY);
    } catch {}
  },

  // Store active session user
  setSessionUser(userId: string) {
    try {
      this.setCookie(SESSION_USER_COOKIE_KEY, userId);
      localStorage.setItem(SESSION_USER_COOKIE_KEY, userId);
      localStorage.setItem('obsidian_current_user_id', userId);
    } catch {}
  },

  // Get active session user
  getSessionUser(): string | null {
    try {
      const cookieUser = this.getCookie(SESSION_USER_COOKIE_KEY);
      if (cookieUser) return cookieUser;

      const localUser = localStorage.getItem('obsidian_current_user_id');
      if (localUser) {
        this.setCookie(SESSION_USER_COOKIE_KEY, localUser);
        return localUser;
      }
    } catch {}
    return null;
  },

  // Clear session
  clearSessionUser() {
    try {
      this.deleteCookie(SESSION_USER_COOKIE_KEY);
      localStorage.removeItem(SESSION_USER_COOKIE_KEY);
    } catch {}
  },
};
