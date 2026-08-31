import { YouTubeVideo, YouTubeComment, YouTubePlaylist, YouTubeChannel, YouTubeSubscription } from '../types';

export const YOUTUBE_CATEGORIES = [
  { id: '0', label: 'Alle', icon: 'Sparkles' },
  { id: '10', label: 'Musik', icon: 'Music' },
  { id: '20', label: 'Gaming', icon: 'Gamepad2' },
  { id: '28', label: 'Tech & Wissenschaft', icon: 'Cpu' },
  { id: '25', label: 'Nachrichten', icon: 'Newspaper' },
  { id: '27', label: 'Bildung & Lernen', icon: 'GraduationCap' },
  { id: '17', label: 'Sport', icon: 'Trophy' },
  { id: '24', label: 'Unterhaltung', icon: 'Tv' },
];

export const YOUTUBE_QUICK_FILTERS = [
  'ObsidianOS',
  'Lo-Fi Beats to Relax/Study',
  'Cyberpunk 2077 OST',
  'TypeScript React Tutorial',
  '4K HDR Nature Drone',
  'Synthwave 80s Chill',
  'Tech News Deutsch',
  'Gaming Highlights',
];

// ISO 8601 Duration Parser (e.g. PT4M13S -> "4:13", PT1H2M30S -> "1:02:30")
export function parseYouTubeDuration(duration?: string): string {
  if (!duration) return '';
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (hours > 0) {
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }
  return `${minutes}:${formattedSeconds}`;
}

// Generate consistent high-contrast avatar for channel based on title
export function getChannelFallbackAvatar(title: string, id?: string): string {
  const seed = (title || id || 'Channel').trim();
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1e1e24,27272a,3f3f46`;
}

// Format views count into readable German string
export function formatViewsCount(count?: string | number): string {
  if (!count) return '0 Aufrufe';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(num)) return '0 Aufrufe';

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace('.', ',')} Mrd. Aufrufe`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')} Mio. Aufrufe`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')} Tsd. Aufrufe`;
  }
  return `${num} Aufrufe`;
}

// Format subscribers count
export function formatSubscribersCount(count?: string | number): string {
  if (!count) return '0 Abonnenten';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(num)) return '0 Abonnenten';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2).replace('.', ',')} Mio. Abonnenten`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')} Tsd. Abonnenten`;
  }
  return `${num} Abonnenten`;
}

// Format like counts
export function formatLikesCount(count?: string | number): string {
  if (!count) return '0';
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  if (isNaN(num)) return '0';

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace('.', ',')} Mio.`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace('.', ',')} Tsd.`;
  }
  return `${num}`;
}

// Format time elapsed since publish date
export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return 'Gerade eben';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `vor ${diffInMinutes} Min.`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `vor ${diffInHours} Std.`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `vor ${diffInDays} ${diffInDays === 1 ? 'Tag' : 'Tagen'}`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 5) return `vor ${diffInWeeks} ${diffInWeeks === 1 ? 'Woche' : 'Wochen'}`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `vor ${diffInMonths} ${diffInMonths === 1 ? 'Monat' : 'Monaten'}`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `vor ${diffInYears} ${diffInYears === 1 ? 'Jahr' : 'Jahren'}`;
}

// Extract Video ID from URL, iframe embed code or raw ID
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Standard watch URL: youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/i);
  if (watchMatch && watchMatch[1]) {
    return watchMatch[1];
  }

  return null;
}

export interface YouTubeApiHealth {
  status: 'valid' | 'invalid' | 'quota_exceeded' | 'fallback' | 'untested';
  message?: string;
  hasCustomKey: boolean;
  maskedKey?: string;
  lastChecked?: number;
}

// Convert raw API item to normalized YouTubeVideo
function mapRawItemToVideo(item: any): YouTubeVideo {
  const snippet = item.snippet || {};
  const contentDetails = item.contentDetails || {};
  const statistics = item.statistics || {};

  const videoId = item.id?.videoId || item.id || '';
  const thumbs = snippet.thumbnails || {};
  const thumbnailUrl =
    thumbs.maxres?.url ||
    thumbs.standard?.url ||
    thumbs.high?.url ||
    thumbs.medium?.url ||
    thumbs.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const channelTitle = snippet.channelTitle || 'Unbekannter Kanal';
  const channelId = snippet.channelId || '';
  const channelAvatarUrl =
    item.channelAvatarUrl ||
    snippet.channelAvatarUrl ||
    getChannelFallbackAvatar(channelTitle, channelId);

  return {
    id: videoId,
    title: snippet.title || 'Ohne Titel',
    description: snippet.description || '',
    channelId,
    channelTitle,
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    thumbnailUrl,
    highThumbnailUrl: thumbs.maxres?.url || thumbs.high?.url || thumbnailUrl,
    duration: parseYouTubeDuration(contentDetails.duration),
    viewCount: statistics.viewCount || undefined,
    likeCount: statistics.likeCount || undefined,
    commentCount: statistics.commentCount || undefined,
    channelAvatarUrl,
  };
}

// API Health state store
let currentApiHealth: YouTubeApiHealth = {
  status: 'untested',
  hasCustomKey: false,
};

const healthListeners = new Set<(health: YouTubeApiHealth) => void>();

function notifyHealthChange(health: YouTubeApiHealth) {
  currentApiHealth = { ...health, lastChecked: Date.now() };
  healthListeners.forEach((fn) => {
    try {
      fn(currentApiHealth);
    } catch {}
  });
  // Also dispatch browser custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('obsidian-yt-health', { detail: currentApiHealth })
    );
  }
}

export class YouTubeService {
  // ==========================================
  // API Key Management & Diagnostics
  // ==========================================
  static getCustomApiKey(): string {
    if (typeof localStorage === 'undefined') return '';
    return (
      localStorage.getItem('obsidian_youtube_api_key') ||
      localStorage.getItem('obsidian_yt_custom_key') ||
      ''
    ).trim();
  }

  static getMaskedApiKey(): string {
    const key = this.getCustomApiKey();
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  static setCustomApiKey(key: string): void {
    const trimmed = (key || '').trim();
    if (trimmed) {
      localStorage.setItem('obsidian_youtube_api_key', trimmed);
      localStorage.setItem('obsidian_yt_custom_key', trimmed);
    } else {
      this.removeCustomApiKey();
      return;
    }
    notifyHealthChange({
      status: 'untested',
      hasCustomKey: true,
      maskedKey: this.getMaskedApiKey(),
      message: 'Benutzerdefinierter API-Schlüssel gespeichert',
    });
  }

  static removeCustomApiKey(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('obsidian_youtube_api_key');
      localStorage.removeItem('obsidian_yt_custom_key');
    }
    notifyHealthChange({
      status: 'fallback',
      hasCustomKey: false,
      maskedKey: '',
      message: 'Auf Standard- und Notfall-Katalog zurückgesetzt',
    });
  }

  static getApiHealth(): YouTubeApiHealth {
    const customKey = this.getCustomApiKey();
    return {
      ...currentApiHealth,
      hasCustomKey: Boolean(customKey),
      maskedKey: this.getMaskedApiKey(),
    };
  }

  static onHealthChange(fn: (health: YouTubeApiHealth) => void): () => void {
    healthListeners.add(fn);
    fn(this.getApiHealth());
    return () => healthListeners.delete(fn);
  }

  static async testApiKey(keyToTest?: string): Promise<{ valid: boolean; message: string; diagnostics?: any }> {
    const key = keyToTest !== undefined ? keyToTest.trim() : this.getCustomApiKey();
    try {
      const res = await fetch('/api/youtube/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });
      const data = await res.json();
      if (data.valid) {
        notifyHealthChange({
          status: 'valid',
          hasCustomKey: Boolean(key),
          maskedKey: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '',
          message: 'API-Key ist gültig und einsatzbereit.',
        });
        return { valid: true, message: 'API-Key erfolgreich verifiziert!' };
      } else {
        const isQuota = data.diagnostics?.isQuotaExceeded;
        const isInvalid = data.diagnostics?.isInvalidKey;
        const newStatus = isQuota ? 'quota_exceeded' : isInvalid ? 'invalid' : 'fallback';
        const msg = data.error || data.message || 'API-Key konnte nicht verifiziert werden.';
        notifyHealthChange({
          status: newStatus,
          hasCustomKey: Boolean(key),
          maskedKey: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '',
          message: msg,
        });
        return { valid: false, message: msg, diagnostics: data.diagnostics };
      }
    } catch (err: any) {
      notifyHealthChange({
        status: 'fallback',
        hasCustomKey: Boolean(key),
        maskedKey: key ? `${key.slice(0, 6)}...${key.slice(-4)}` : '',
        message: 'Verbindungsfehler zum API-Proxy',
      });
      return { valid: false, message: err?.message || 'Netzwerkfehler' };
    }
  }

  // Internal helper to attach custom key header
  private static getHeaders(): HeadersInit {
    const customKey = this.getCustomApiKey();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (customKey) {
      headers['x-youtube-api-key'] = customKey;
    }
    return headers;
  }

  // Fetch Trending Videos
  static async getTrending(categoryId = '0', maxResults = 24): Promise<YouTubeVideo[]> {
    try {
      const url = `/api/youtube/trending?videoCategoryId=${encodeURIComponent(categoryId)}&maxResults=${maxResults}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const diag = errData.diagnostics;
        if (diag?.isInvalidKey) {
          notifyHealthChange({
            status: 'invalid',
            hasCustomKey: Boolean(this.getCustomApiKey()),
            maskedKey: this.getMaskedApiKey(),
            message: diag.message || 'API-Key ist ungültig.',
          });
        } else if (diag?.isQuotaExceeded) {
          notifyHealthChange({
            status: 'quota_exceeded',
            hasCustomKey: Boolean(this.getCustomApiKey()),
            maskedKey: this.getMaskedApiKey(),
            message: 'YouTube API-Quota erreicht.',
          });
        }
        throw new Error(`HTTP ${res.status}: ${errData.error || res.statusText}`);
      }
      const data = await res.json();
      if (currentApiHealth.status !== 'valid' && this.getCustomApiKey()) {
        notifyHealthChange({
          status: 'valid',
          hasCustomKey: true,
          maskedKey: this.getMaskedApiKey(),
          message: 'API-Key aktiv',
        });
      }
      return (data.items || []).map(mapRawItemToVideo);
    } catch (err) {
      console.warn('YouTube getTrending fallback:', err);
      return this.getCuratedFallbackVideos();
    }
  }

  // Search Videos
  static async search(query: string, order = 'relevance', maxResults = 24): Promise<YouTubeVideo[]> {
    const trimmedQuery = (query || '').trim();
    if (!trimmedQuery) return [];

    // Direct ID/URL check: if user entered a video ID or URL, return instant direct item
    const extractedId = extractYouTubeVideoId(trimmedQuery);
    if (extractedId) {
      const directDetails = await this.getVideoDetails(extractedId);
      if (directDetails) return [directDetails];
      return [
        {
          id: extractedId,
          title: `Video (${extractedId})`,
          description: `Direktes YouTube Video: https://www.youtube.com/watch?v=${extractedId}`,
          channelId: 'youtube',
          channelTitle: 'YouTube',
          channelAvatarUrl: getChannelFallbackAvatar('YouTube'),
          publishedAt: new Date().toISOString(),
          thumbnailUrl: `https://i.ytimg.com/vi/${extractedId}/hqdefault.jpg`,
          duration: 'Video',
          viewCount: '1',
          likeCount: '1',
        },
      ];
    }

    try {
      const url = `/api/youtube/search?q=${encodeURIComponent(trimmedQuery)}&order=${encodeURIComponent(order)}&maxResults=${maxResults}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const diag = errData.diagnostics;
        if (diag?.isInvalidKey) {
          notifyHealthChange({
            status: 'invalid',
            hasCustomKey: Boolean(this.getCustomApiKey()),
            maskedKey: this.getMaskedApiKey(),
            message: diag.message || 'API-Key ist ungültig.',
          });
        } else if (diag?.isQuotaExceeded) {
          notifyHealthChange({
            status: 'quota_exceeded',
            hasCustomKey: Boolean(this.getCustomApiKey()),
            maskedKey: this.getMaskedApiKey(),
            message: 'YouTube API-Quota erreicht.',
          });
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = (data.items || []).map(mapRawItemToVideo);
      if (items.length > 0) return items;
    } catch (err) {
      console.warn('YouTube search fallback:', err);
    }

    // Smart Fallback Search: Search within curated videos and synthesize relevant video cards
    const qLower = trimmedQuery.toLowerCase();
    const curated = this.getCuratedFallbackVideos();
    const matched = curated.filter(
      (v) =>
        v.title.toLowerCase().includes(qLower) ||
        v.description.toLowerCase().includes(qLower) ||
        v.channelTitle.toLowerCase().includes(qLower)
    );

    if (matched.length > 0) {
      return matched;
    }

    // Synthesize realistic search cards so the user is never stuck
    const synthesis: YouTubeVideo[] = [
      {
        id: 'jfKfPfyJRdk',
        title: `${trimmedQuery} - 24/7 Lo-Fi & Focus Stream`,
        description: `Entspannende Hintergrundmusik und passende Tracks zu "${trimmedQuery}".`,
        channelId: 'UC69701z8295628',
        channelTitle: 'Lofi Girl',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
        publishedAt: new Date().toISOString(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        duration: 'LIVE',
        viewCount: '4520000',
        likeCount: '180000',
      },
      {
        id: '5qap5aO4i9A',
        title: `${trimmedQuery} - Synthwave & Cyberpunk Ambient`,
        description: `Beste Soundtracks und Ambient-Visuals zu "${trimmedQuery}".`,
        channelId: 'UC69701z8295629',
        channelTitle: 'Cyber Radio',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
        publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        duration: 'LIVE',
        viewCount: '1250000',
        likeCount: '95000',
      },
      ...curated.slice(0, 4),
    ];

    return synthesis;
  }

  // Single Video Details
  static async getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
    try {
      const url = `/api/youtube/video/${encodeURIComponent(videoId)}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return mapRawItemToVideo(data);
    } catch (err) {
      console.warn('YouTube getVideoDetails error:', err);
      // Check if ID is in curated list
      const fromCurated = this.getCuratedFallbackVideos().find((v) => v.id === videoId);
      if (fromCurated) return fromCurated;
      return null;
    }
  }

  // Video Comments
  static async getComments(videoId: string, maxResults = 25): Promise<YouTubeComment[]> {
    try {
      const url = `/api/youtube/comments/${encodeURIComponent(videoId)}?maxResults=${maxResults}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return (data.items || []).map((item: any) => {
        const topLevel = item.snippet?.topLevelComment?.snippet || {};
        return {
          id: item.id || Math.random().toString(),
          authorDisplayName: topLevel.authorDisplayName || 'YouTube User',
          authorProfileImageUrl: topLevel.authorProfileImageUrl || getChannelFallbackAvatar(topLevel.authorDisplayName || 'User'),
          textDisplay: topLevel.textDisplay || '',
          likeCount: topLevel.likeCount || 0,
          publishedAt: topLevel.publishedAt || new Date().toISOString(),
        };
      });
    } catch (err) {
      console.warn('YouTube getComments error, returning default community comments:', err);
      return [
        {
          id: 'c1',
          authorDisplayName: 'Obsidian Fan',
          authorProfileImageUrl: getChannelFallbackAvatar('Obsidian Fan'),
          textDisplay: 'Absoluter Top-Track! Läuft bei mir den ganzen Tag beim Coden auf ObsidianOS 🔥',
          likeCount: 42,
          publishedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        },
        {
          id: 'c2',
          authorDisplayName: 'Cyberpunk Producer',
          authorProfileImageUrl: getChannelFallbackAvatar('Cyberpunk Producer'),
          textDisplay: 'Die Audio-Qualität und 4K Auflösung sind einfach spitze.',
          likeCount: 19,
          publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ];
    }
  }

  // Channel Info & Details
  static async getChannel(channelId: string, fallbackTitle?: string, fallbackAvatar?: string): Promise<YouTubeChannel | null> {
    try {
      const url = `/api/youtube/channel/${encodeURIComponent(channelId)}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          return {
            id: data.id || channelId,
            title: data.title,
            description: data.description || '',
            customUrl: data.customUrl || `@${data.title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            publishedAt: data.publishedAt || '',
            avatarUrl: data.avatarUrl || fallbackAvatar || getChannelFallbackAvatar(data.title, channelId),
            bannerUrl: data.bannerUrl || undefined,
            subscriberCount: data.subscriberCount || undefined,
            videoCount: data.videoCount || undefined,
            viewCount: data.viewCount || undefined,
            country: data.country || undefined,
          };
        }
      }
    } catch (err) {
      console.warn('YouTube getChannel error:', err);
    }

    // Fallback curated channel synthesis
    const title = fallbackTitle || 'YouTube Kanal';
    return {
      id: channelId,
      title,
      description: `Willkommen auf dem offiziellen YouTube-Kanal von ${title}. Hier findest du regelmäßige Veröffentlichungen, Streams und exklusive Inhalte.`,
      customUrl: `@${title.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      publishedAt: '2020-01-01T00:00:00Z',
      avatarUrl: fallbackAvatar || getChannelFallbackAvatar(title, channelId),
      bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&q=80',
      subscriberCount: '1240000',
      videoCount: '184',
      viewCount: '45000000',
      country: 'DE',
    };
  }

  // Channel Videos
  static async getChannelVideos(channelId: string, maxResults = 30): Promise<YouTubeVideo[]> {
    try {
      const url = `/api/youtube/channel-videos/${encodeURIComponent(channelId)}?maxResults=${maxResults}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const vids = (data.items || []).map(mapRawItemToVideo);
        if (vids.length > 0) return vids;
      }
    } catch (err) {
      console.warn('YouTube getChannelVideos error:', err);
    }

    // Fallback: search videos by channel or return curated list
    const fallbacks = this.getCuratedFallbackVideos();
    const matching = fallbacks.filter((v) => v.channelId === channelId);
    return matching.length > 0 ? matching : fallbacks;
  }

  // ==========================================
  // Channel Subscriptions Engine (Local Persistence)
  // ==========================================
  static getSubscriptions(): YouTubeSubscription[] {
    try {
      const saved = localStorage.getItem('obsidian_youtube_subscriptions');
      if (saved) return JSON.parse(saved);
      // Pre-seed some default popular channels
      const initial: YouTubeSubscription[] = [
        {
          channelId: 'UC69701z8295628',
          channelTitle: 'Lofi Girl',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
          subscribedAt: Date.now() - 86400000 * 10,
        },
        {
          channelId: 'UCv69701z8295630',
          channelTitle: 'CD PROJEKT RED',
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&q=80',
          subscribedAt: Date.now() - 86400000 * 5,
        },
      ];
      localStorage.setItem('obsidian_youtube_subscriptions', JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  }

  static isSubscribed(channelId: string): boolean {
    return this.getSubscriptions().some((s) => s.channelId === channelId);
  }

  static toggleSubscription(channel: { id: string; title: string; avatarUrl?: string }): boolean {
    const list = this.getSubscriptions();
    const index = list.findIndex((s) => s.channelId === channel.id);
    let isSubbed = false;
    if (index >= 0) {
      list.splice(index, 1);
      isSubbed = false;
    } else {
      list.unshift({
        channelId: channel.id,
        channelTitle: channel.title,
        avatarUrl: channel.avatarUrl || getChannelFallbackAvatar(channel.title, channel.id),
        subscribedAt: Date.now(),
      });
      isSubbed = true;
    }
    localStorage.setItem('obsidian_youtube_subscriptions', JSON.stringify(list));
    return isSubbed;
  }

  // ==========================================
  // Local History & Playlists Engine
  // ==========================================
  static getHistory(): YouTubeVideo[] {
    try {
      const saved = localStorage.getItem('obsidian_youtube_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static addToHistory(video: YouTubeVideo): void {
    try {
      const history = this.getHistory().filter((v) => v.id !== video.id);
      history.unshift(video);
      if (history.length > 50) history.pop();
      localStorage.setItem('obsidian_youtube_history', JSON.stringify(history));
    } catch {}
  }

  static clearHistory(): void {
    localStorage.removeItem('obsidian_youtube_history');
  }

  static getLikedVideos(): YouTubeVideo[] {
    try {
      const saved = localStorage.getItem('obsidian_youtube_liked');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static toggleLike(video: YouTubeVideo): boolean {
    const list = this.getLikedVideos();
    const index = list.findIndex((v) => v.id === video.id);
    let isLiked = false;
    if (index >= 0) {
      list.splice(index, 1);
      isLiked = false;
    } else {
      list.unshift(video);
      isLiked = true;
    }
    localStorage.setItem('obsidian_youtube_liked', JSON.stringify(list));
    return isLiked;
  }

  static isLiked(videoId: string): boolean {
    return this.getLikedVideos().some((v) => v.id === videoId);
  }

  static getWatchLater(): YouTubeVideo[] {
    try {
      const saved = localStorage.getItem('obsidian_youtube_watch_later');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  static toggleWatchLater(video: YouTubeVideo): boolean {
    const list = this.getWatchLater();
    const index = list.findIndex((v) => v.id === video.id);
    let isSaved = false;
    if (index >= 0) {
      list.splice(index, 1);
      isSaved = false;
    } else {
      list.unshift(video);
      isSaved = true;
    }
    localStorage.setItem('obsidian_youtube_watch_later', JSON.stringify(list));
    return isSaved;
  }

  static isWatchLater(videoId: string): boolean {
    return this.getWatchLater().some((v) => v.id === videoId);
  }

  static getPlaylists(): YouTubePlaylist[] {
    try {
      const saved = localStorage.getItem('obsidian_youtube_playlists');
      if (saved) return JSON.parse(saved);
      // Default Playlist
      const initial: YouTubePlaylist[] = [
        {
          id: 'pl-favorites',
          title: 'Favoriten & Musik',
          description: 'Beste Tracks und Videos für die Arbeit auf ObsidianOS',
          createdAt: Date.now() - 86400000 * 3,
          videoIds: ['jfKfPfyJRdk', '5qap5aO4i9A', 'DWcJFNfaw9c'],
        },
      ];
      localStorage.setItem('obsidian_youtube_playlists', JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  }

  static savePlaylists(playlists: YouTubePlaylist[]): void {
    localStorage.setItem('obsidian_youtube_playlists', JSON.stringify(playlists));
  }

  static createPlaylist(title: string, description?: string): YouTubePlaylist {
    const playlists = this.getPlaylists();
    const newPl: YouTubePlaylist = {
      id: `pl-${Date.now()}`,
      title: title.trim() || 'Neue Playlist',
      description: description?.trim() || '',
      createdAt: Date.now(),
      videoIds: [],
    };
    playlists.unshift(newPl);
    this.savePlaylists(playlists);
    return newPl;
  }

  static deletePlaylist(playlistId: string): void {
    const playlists = this.getPlaylists().filter((p) => p.id !== playlistId);
    this.savePlaylists(playlists);
  }

  static addVideoToPlaylist(playlistId: string, videoId: string): void {
    const playlists = this.getPlaylists();
    const pl = playlists.find((p) => p.id === playlistId);
    if (pl && !pl.videoIds.includes(videoId)) {
      pl.videoIds.unshift(videoId);
      this.savePlaylists(playlists);
    }
  }

  static removeVideoFromPlaylist(playlistId: string, videoId: string): void {
    const playlists = this.getPlaylists();
    const pl = playlists.find((p) => p.id === playlistId);
    if (pl) {
      pl.videoIds = pl.videoIds.filter((id) => id !== videoId);
      this.savePlaylists(playlists);
    }
  }

  // Curated Fallback Videos for instant offline/initial rendering
  static getCuratedFallbackVideos(): YouTubeVideo[] {
    return [
      {
        id: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio 📚 - beats to relax/study to',
        description: 'Peaceful lofi hip hop radio - 24/7 chill beats to relax, study, and code to.',
        channelId: 'UC69701z8295628',
        channelTitle: 'Lofi Girl',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
        publishedAt: '2023-01-01T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        duration: 'LIVE',
        viewCount: '65400000',
        likeCount: '3420000',
      },
      {
        id: '5qap5aO4i9A',
        title: 'synthwave radio 🌌 - chill synth / cyber beats to game/chill to',
        description: 'Synthwave & cyberpunk retro electronic beats for deep focus.',
        channelId: 'UC69701z8295629',
        channelTitle: 'Lofi Girl - Synthwave',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80',
        publishedAt: '2023-05-10T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        duration: 'LIVE',
        viewCount: '18500000',
        likeCount: '1240000',
      },
      {
        id: 'DWcJFNfaw9c',
        title: 'Cyberpunk 2077 - The Rebel Path (Original Soundtrack)',
        description: 'Official Cyberpunk 2077 Soundtrack by P.T. Adamczyk & Marcin Przybyłowicz.',
        channelId: 'UCv69701z8295630',
        channelTitle: 'CD PROJEKT RED',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&q=80',
        publishedAt: '2020-12-10T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
        duration: '4:11',
        viewCount: '28900000',
        likeCount: '890000',
      },
      {
        id: 'LXb3EKWsInQ',
        title: 'COSTA RICA IN 4K 60fps HDR (ULTRA HD)',
        description: 'Breathtaking 4K 60fps HDR nature film showcasing the wildlife and landscapes of Costa Rica.',
        channelId: 'UCv69701z8295631',
        channelTitle: 'Jacob + Katie Schwarz',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&q=80',
        publishedAt: '2019-08-15T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80',
        duration: '5:14',
        viewCount: '115000000',
        likeCount: '1500000',
      },
      {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
        description: 'The official video for “Never Gonna Give You Up” by Rick Astley.',
        channelId: 'UCuAXFkgsw1L7xaCfnd5JJOw',
        channelTitle: 'Rick Astley',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80',
        publishedAt: '2009-10-25T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
        duration: '3:33',
        viewCount: '1540000000',
        likeCount: '17000000',
      },
      {
        id: '8nd_g_uD5r0',
        title: 'Top 10 VS Code Extensions & Tips for Modern Developers',
        description: 'A curated breakdown of the best developer productivity extensions and workflows.',
        channelId: 'UC8nd_g_uD5r0',
        channelTitle: 'Obsidian Developer Channel',
        channelAvatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80',
        publishedAt: '2024-01-20T00:00:00Z',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        duration: '14:22',
        viewCount: '890000',
        likeCount: '52000',
      },
    ];
  }
}
