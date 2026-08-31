import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { YouTubeVideo, YouTubeComment, YouTubePlaylist, YouTubeChannel, YouTubeSubscription } from '../../types';
import {
  YouTubeService,
  YOUTUBE_CATEGORIES,
  YOUTUBE_QUICK_FILTERS,
  formatViewsCount,
  formatSubscribersCount,
  formatLikesCount,
  formatTimeAgo,
  extractYouTubeVideoId,
  getChannelFallbackAvatar,
} from '../../services/youtubeService';
import {
  Search,
  Flame,
  Clock,
  ThumbsUp,
  Bookmark,
  ListPlus,
  Play,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  Tv,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Menu,
  MessageSquare,
  Send,
  X,
  Users,
  Info,
  Video,
  Globe,
  Calendar,
  Eye,
  CheckCircle2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type YouTubeTab = 'home' | 'history' | 'watch-later' | 'liked' | 'playlists' | 'subscriptions' | 'channel';

export const YouTubeApp: React.FC = () => {
  const { sounds, addNotification, setNowPlaying, openApp } = useOS();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Navigation & Layout State
  const [activeTab, setActiveTab] = useState<YouTubeTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('0');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [showUrlDialog, setShowUrlDialog] = useState(false);

  // Video Data State
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Active Player State
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);
  const [comments, setComments] = useState<YouTubeComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState<boolean>(false);
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Channel Page State
  const [activeChannel, setActiveChannel] = useState<YouTubeChannel | null>(null);
  const [channelVideos, setChannelVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingChannel, setIsLoadingChannel] = useState<boolean>(false);
  const [channelActiveTab, setChannelActiveTab] = useState<'videos' | 'about'>('videos');

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscription[]>(() => YouTubeService.getSubscriptions());

  // User Library State
  const [history, setHistory] = useState<YouTubeVideo[]>(() => YouTubeService.getHistory());
  const [likedVideos, setLikedVideos] = useState<YouTubeVideo[]>(() => YouTubeService.getLikedVideos());
  const [watchLater, setWatchLater] = useState<YouTubeVideo[]>(() => YouTubeService.getWatchLater());
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>(() => YouTubeService.getPlaylists());

  // Playlist Modals
  const [playlistTargetVideo, setPlaylistTargetVideo] = useState<YouTubeVideo | null>(null);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState<string>('');

  // Sync active video with global OS Now Playing player
  useEffect(() => {
    if (activeVideo) {
      setNowPlaying({
        id: activeVideo.id,
        title: activeVideo.title,
        artist: activeVideo.channelTitle,
        source: 'youtube',
        coverUrl: activeVideo.thumbnailUrl,
        isPlaying: true,
        appId: 'youtube',
      });
    } else {
      setNowPlaying(null);
    }
  }, [activeVideo, setNowPlaying]);

  // Handle remote media commands from TopBar and Control Center
  useEffect(() => {
    const handleRemoteCommand = (e: Event) => {
      const custom = e as CustomEvent<{ action: string; id?: string; source?: string }>;
      if (!custom.detail?.source || custom.detail.source === 'youtube') {
        if (custom.detail.action === 'pause') {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: '' }),
            '*'
          );
        } else if (custom.detail.action === 'play') {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: '' }),
            '*'
          );
        } else if (custom.detail.action === 'stop') {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: 'command', func: 'stopVideo', args: '' }),
            '*'
          );
          setActiveVideo(null);
        }
      }
    };

    window.addEventListener('os-media-command', handleRemoteCommand);
    return () => {
      window.removeEventListener('os-media-command', handleRemoteCommand);
    };
  }, []);

  // Load Trending or initial videos
  const loadTrending = useCallback(async (catId = '0') => {
    setIsLoading(true);
    try {
      const results = await YouTubeService.getTrending(catId, 36);
      setVideos(results);
    } catch (err) {
      console.error('Error loading trending:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTrending(selectedCategory);
  }, [loadTrending, selectedCategory]);

  // Execute Search
  const handleSearch = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim();
    if (!q) {
      setCurrentQuery('');
      loadTrending(selectedCategory);
      return;
    }

    setIsSearching(true);
    setCurrentQuery(q);
    setActiveTab('home');
    setActiveVideo(null);
    setActiveChannel(null);
    sounds.playClick();

    try {
      const results = await YouTubeService.search(q, 'relevance', 36);
      setVideos(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Open Channel Page Handler
  const handleOpenChannel = useCallback(
    async (channelId: string, fallbackTitle?: string, fallbackAvatar?: string) => {
      if (!channelId) return;
      sounds.playOpen();
      setIsLoadingChannel(true);
      setActiveVideo(null);
      setActiveTab('channel');
      setChannelActiveTab('videos');

      try {
        const [channelData, chVids] = await Promise.all([
          YouTubeService.getChannel(channelId, fallbackTitle, fallbackAvatar),
          YouTubeService.getChannelVideos(channelId, 36),
        ]);
        setActiveChannel(channelData);
        setChannelVideos(chVids);
      } catch (err) {
        console.error('Error opening channel:', err);
      } finally {
        setIsLoadingChannel(false);
      }
    },
    [sounds]
  );

  // Play Video Handler
  const handleSelectVideo = useCallback(
    async (video: YouTubeVideo) => {
      setActiveVideo(video);
      setIsDescriptionExpanded(false);
      sounds.playOpen();

      // Add to history
      YouTubeService.addToHistory(video);
      setHistory(YouTubeService.getHistory());

      // Load comments
      setIsLoadingComments(true);
      try {
        const videoComments = await YouTubeService.getComments(video.id, 24);
        setComments(videoComments);
      } catch (e) {
        console.error('Failed to load comments:', e);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [sounds]
  );

  // Direct URL / ID Loader
  const handleLoadDirectUrl = () => {
    const vId = extractYouTubeVideoId(urlInput);
    if (!vId) {
      sounds.playError();
      addNotification('Ungültiger Link', 'Bitte gib eine gültige YouTube URL oder Video-ID ein.', 'error', 'YouTube');
      return;
    }

    sounds.playSuccess();
    setShowUrlDialog(false);
    setUrlInput('');

    YouTubeService.getVideoDetails(vId).then((details) => {
      if (details) {
        handleSelectVideo(details);
      } else {
        const fallback: YouTubeVideo = {
          id: vId,
          title: `YouTube Video (${vId})`,
          description: 'Direkt über Link geladenes Video.',
          channelId: '',
          channelTitle: 'YouTube',
          channelAvatarUrl: getChannelFallbackAvatar('YouTube'),
          publishedAt: new Date().toISOString(),
          thumbnailUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
        };
        handleSelectVideo(fallback);
      }
    });
  };

  // Toggle Subscription
  const handleToggleSubscription = (channel: { id: string; title: string; avatarUrl?: string }) => {
    const isNowSubbed = YouTubeService.toggleSubscription(channel);
    setSubscriptions(YouTubeService.getSubscriptions());
    sounds.playSuccess();
    addNotification(
      isNowSubbed ? 'Kanal abonniert' : 'Abonnement beendet',
      channel.title,
      'info',
      'YouTube'
    );
  };

  // Toggle Like
  const handleToggleLike = (video: YouTubeVideo) => {
    const isNowLiked = YouTubeService.toggleLike(video);
    setLikedVideos(YouTubeService.getLikedVideos());
    sounds.playToggle();
    addNotification(
      isNowLiked ? 'Zu Favoriten hinzugefügt' : 'Aus Favoriten entfernt',
      video.title,
      'info',
      'YouTube'
    );
  };

  // Toggle Watch Later
  const handleToggleWatchLater = (video: YouTubeVideo) => {
    const isSaved = YouTubeService.toggleWatchLater(video);
    setWatchLater(YouTubeService.getWatchLater());
    sounds.playToggle();
    addNotification(
      isSaved ? 'Für später gespeichert' : 'Aus "Später ansehen" entfernt',
      video.title,
      'info',
      'YouTube'
    );
  };

  // Add Comment locally
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment: YouTubeComment = {
      id: `local-comment-${Date.now()}`,
      authorDisplayName: 'ObsidianOS Benutzer',
      authorProfileImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80',
      textDisplay: newCommentText.trim(),
      likeCount: 0,
      publishedAt: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);
    setNewCommentText('');
    sounds.playClick();
    addNotification('Kommentar veröffentlicht', 'Dein Kommentar wurde hinzugefügt.', 'info', 'YouTube');
  };

  // Create Playlist
  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    const pl = YouTubeService.createPlaylist(newPlaylistTitle.trim());
    setPlaylists(YouTubeService.getPlaylists());
    setNewPlaylistTitle('');
    sounds.playSuccess();
    addNotification('Playlist erstellt', `"${pl.title}" wurde erstellt.`, 'info', 'YouTube');
  };

  // Add Video to Playlist
  const handleAddVideoToPlaylist = (playlistId: string) => {
    if (!playlistTargetVideo) return;
    YouTubeService.addVideoToPlaylist(playlistId, playlistTargetVideo.id);
    setPlaylists(YouTubeService.getPlaylists());
    setPlaylistTargetVideo(null);
    sounds.playSuccess();
    addNotification('Zur Playlist hinzugefügt', playlistTargetVideo.title, 'info', 'YouTube');
  };

  // Copy share URL
  const handleShare = (url: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      sounds.playClick();
      addNotification('Link kopiert', `${label} wurde in die Zwischenablage kopiert.`, 'info', 'YouTube');
    }
  };

  // Active Video Related Videos
  const relatedVideos = videos.filter((v) => v.id !== activeVideo?.id);

  return (
    <div className="w-full h-full flex flex-col bg-[#0f0f0f] text-[#f1f1f1] select-none overflow-hidden font-sans">
      {/* Top YouTube Header */}
      <header className="h-14 px-3 sm:px-4 bg-[#0f0f0f] flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Menu toggle + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {activeVideo || activeTab === 'channel' ? (
            <button
              onClick={() => {
                if (activeVideo) {
                  setActiveVideo(null);
                } else if (activeTab === 'channel') {
                  setActiveTab('home');
                  setActiveChannel(null);
                }
                sounds.playClick();
              }}
              className="p-2 rounded-full bg-white/[0.08] hover:bg-white/[0.16] text-white transition-colors"
              title="Zurück zur Übersicht"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setIsSidebarCollapsed((prev) => !prev);
                sounds.playClick();
              }}
              className="p-2 rounded-full bg-transparent hover:bg-white/[0.1] text-white transition-colors"
              title="Navigation umschalten"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={() => {
              setActiveVideo(null);
              setActiveChannel(null);
              setActiveTab('home');
              setCurrentQuery('');
              setSearchQuery('');
              loadTrending(selectedCategory);
              sounds.playClick();
            }}
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <div className="w-7 h-5 rounded-md bg-[#ff0000] flex items-center justify-center group-hover:scale-105 transition-transform shadow-md">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1">
              YouTube
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.12] text-zinc-300 font-semibold uppercase tracking-wider">
                4K
              </span>
            </span>
          </div>
        </div>

        {/* Center: Search Bar (Contrast-driven pill shape) */}
        <div className="flex-1 max-w-xl mx-2 sm:mx-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center w-full"
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen"
                className="w-full h-10 pl-10 pr-10 rounded-l-full bg-[#121212] focus:bg-[#000] text-sm text-white placeholder-[#888] focus:outline-none focus:ring-1 focus:ring-blue-500/60 transition-all"
              />
              <Search className="w-4 h-4 text-[#888] absolute left-3.5 pointer-events-none" />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (currentQuery) {
                      setCurrentQuery('');
                      loadTrending(selectedCategory);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-white/[0.1] text-zinc-400 hover:text-white absolute right-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="h-10 px-5 rounded-r-full bg-[#222222] hover:bg-[#2a2a2a] text-zinc-200 hover:text-white flex items-center justify-center transition-colors shrink-0"
              title="Suchen"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: Direct Link & Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowUrlDialog(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.16] text-white transition-colors"
            title="Video per Link oder ID öffnen"
          >
            <Plus className="w-4 h-4 text-red-500" />
            <span className="hidden sm:inline">URL / ID</span>
          </button>
        </div>
      </header>

      {/* Main App Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive YouTube Sidebar */}
        <aside
          className={`bg-[#0f0f0f] flex flex-col py-2 shrink-0 overflow-y-auto transition-all duration-200 ${
            isSidebarCollapsed ? 'w-16 px-1 items-center' : 'w-56 px-3'
          }`}
        >
          {/* Main Navigation Items */}
          <div className="space-y-1 w-full">
            <button
              onClick={() => {
                setActiveTab('home');
                setActiveVideo(null);
                setActiveChannel(null);
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'home'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Home"
            >
              <Flame className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5 text-red-500'} />
              <span className="truncate">Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('subscriptions');
                setActiveVideo(null);
                setActiveChannel(null);
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'subscriptions'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Abonnements"
            >
              <Users className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5 text-blue-400'} />
              <span className="truncate">Abos</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                setActiveVideo(null);
                setActiveChannel(null);
                setHistory(YouTubeService.getHistory());
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'history'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Verlauf"
            >
              <Clock className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5'} />
              <span className="truncate">Verlauf</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('watch-later');
                setActiveVideo(null);
                setActiveChannel(null);
                setWatchLater(YouTubeService.getWatchLater());
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'watch-later'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Später ansehen"
            >
              <Bookmark className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5'} />
              <span className="truncate">Später</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('liked');
                setActiveVideo(null);
                setActiveChannel(null);
                setLikedVideos(YouTubeService.getLikedVideos());
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'liked'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Favoriten"
            >
              <ThumbsUp className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5'} />
              <span className="truncate">Favoriten</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('playlists');
                setActiveVideo(null);
                setActiveChannel(null);
                setPlaylists(YouTubeService.getPlaylists());
                sounds.playClick();
              }}
              className={`w-full flex ${
                isSidebarCollapsed
                  ? 'flex-col justify-center items-center py-3 px-1 rounded-xl text-[10px]'
                  : 'flex-row items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium'
              } transition-colors ${
                activeTab === 'playlists'
                  ? 'bg-white/[0.14] text-white font-semibold'
                  : 'text-zinc-300 hover:bg-white/[0.08] hover:text-white'
              }`}
              title="Playlists"
            >
              <Layers className={isSidebarCollapsed ? 'w-5 h-5 mb-1' : 'w-5 h-5'} />
              <span className="truncate">Playlists</span>
            </button>
          </div>

          {/* Subscribed Channels List in Sidebar */}
          {!isSidebarCollapsed && subscriptions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1 w-full">
              <div className="px-3 pb-1.5 text-xs font-semibold text-zinc-400 flex items-center justify-between">
                <span>Abonnements</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.08] text-zinc-400">
                  {subscriptions.length}
                </span>
              </div>

              {subscriptions.map((sub) => (
                <button
                  key={sub.channelId}
                  onClick={() => handleOpenChannel(sub.channelId, sub.channelTitle, sub.avatarUrl)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors ${
                    activeTab === 'channel' && activeChannel?.id === sub.channelId
                      ? 'bg-white/[0.14] text-white font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.08]'
                  }`}
                  title={sub.channelTitle}
                >
                  <img
                    src={sub.avatarUrl || getChannelFallbackAvatar(sub.channelTitle, sub.channelId)}
                    alt={sub.channelTitle}
                    className="w-5 h-5 rounded-full object-cover shrink-0 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <span className="truncate font-medium">{sub.channelTitle}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Playlists in Full Sidebar */}
          {!isSidebarCollapsed && (
            <div className="mt-4 pt-3 border-t border-white/[0.06] space-y-1 w-full">
              <div className="px-3 pb-1.5 text-xs font-semibold text-zinc-400 flex items-center justify-between">
                <span>Playlists</span>
                <button
                  onClick={() => {
                    setActiveTab('playlists');
                    sounds.playClick();
                  }}
                  className="p-1 rounded-full hover:bg-white/[0.1] text-zinc-400 hover:text-white"
                  title="Neue Playlist"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {playlists.slice(0, 6).map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => {
                    setActiveTab('playlists');
                    sounds.playClick();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] truncate flex items-center gap-2.5 transition-colors"
                >
                  <ListPlus className="w-3.5 h-3.5 shrink-0 text-red-500" />
                  <span className="truncate">{pl.title}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-[#0f0f0f] overflow-y-auto flex flex-col">
          {/* Active Video Player View (YouTube Watch Layout) */}
          {activeVideo ? (
            <div className="flex-1 p-3 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto">
              {/* Primary Video Column */}
              <div className={`flex-1 flex flex-col gap-4 min-w-0 ${isTheaterMode ? 'w-full' : ''}`}>
                {/* 16:9 Fluid Video Player (Clean borderless) */}
                <div className="relative w-full aspect-video min-h-[240px] sm:min-h-[360px] md:min-h-[440px] rounded-2xl overflow-hidden bg-black shadow-2xl">
                  <iframe
                    id="youtube-player-frame"
                    ref={iframeRef}
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                  />
                </div>

                {/* Secondary Utility Actions (Pure Contrast) */}
                <div className="flex items-center justify-between text-xs text-zinc-400 px-1 -mt-1">
                  <button
                    onClick={() => {
                      if (iframeRef.current) {
                        iframeRef.current.src = iframeRef.current.src;
                        sounds.playClick();
                        addNotification('Player neu geladen', 'Video-Stream wurde zurückgesetzt.', 'info', 'YouTube');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
                    title="Player neu initialisieren"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Player neu laden</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        openApp('browser', { initialUrl: `https://www.youtube.com/watch?v=${activeVideo.id}` });
                        sounds.playOpen();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors"
                      title="Im Obsidian Browser öffnen"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Im Obsidian Browser</span>
                    </button>
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideo.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-colors font-medium"
                    >
                      <span>Auf YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Video Info Section */}
                <div className="space-y-3">
                  <h1 className="text-base sm:text-xl font-bold text-white leading-snug">
                    {activeVideo.title}
                  </h1>

                  {/* Channel Bar & Action Buttons (Pure Contrast Pills) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    {/* Clickable Channel Info -> Leads to Channel Page */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          handleOpenChannel(
                            activeVideo.channelId,
                            activeVideo.channelTitle,
                            activeVideo.channelAvatarUrl
                          )
                        }
                        className="flex items-center gap-3 text-left group/ch focus:outline-none"
                        title="Kanal ansehen"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-red-500 shrink-0 overflow-hidden shadow group-hover/ch:ring-2 group-hover/ch:ring-red-500 transition-all">
                          <img
                            src={
                              activeVideo.channelAvatarUrl ||
                              getChannelFallbackAvatar(activeVideo.channelTitle, activeVideo.channelId)
                            }
                            alt={activeVideo.channelTitle}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white group-hover/ch:text-red-400 transition-colors flex items-center gap-1.5">
                            <span>{activeVideo.channelTitle}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                          </div>
                          <div className="text-[11px] text-zinc-400">Kanal ansehen</div>
                        </div>
                      </button>

                      {/* Subscribe Button */}
                      <button
                        onClick={() =>
                          handleToggleSubscription({
                            id: activeVideo.channelId,
                            title: activeVideo.channelTitle,
                            avatarUrl: activeVideo.channelAvatarUrl,
                          })
                        }
                        className={`ml-2 px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                          YouTubeService.isSubscribed(activeVideo.channelId)
                            ? 'bg-white/[0.1] text-zinc-200 hover:bg-white/[0.18]'
                            : 'bg-white text-black hover:bg-zinc-200 shadow'
                        }`}
                      >
                        {YouTubeService.isSubscribed(activeVideo.channelId) ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Abonniert</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Abonnieren</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Action Pills */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleToggleLike(activeVideo)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                          YouTubeService.isLiked(activeVideo.id)
                            ? 'bg-red-600 text-white'
                            : 'bg-white/[0.08] text-zinc-200 hover:bg-white/[0.14]'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{formatLikesCount(activeVideo.likeCount || '1')}</span>
                      </button>

                      <button
                        onClick={() => handleToggleWatchLater(activeVideo)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                          YouTubeService.isWatchLater(activeVideo.id)
                            ? 'bg-red-600 text-white'
                            : 'bg-white/[0.08] text-zinc-200 hover:bg-white/[0.14]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Später</span>
                      </button>

                      <button
                        onClick={() => setPlaylistTargetVideo(activeVideo)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/[0.08] text-zinc-200 hover:bg-white/[0.14] transition-colors"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
                        <span>Speichern</span>
                      </button>

                      <button
                        onClick={() => handleShare(`https://www.youtube.com/watch?v=${activeVideo.id}`, 'Video-Link')}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/[0.08] text-zinc-200 hover:bg-white/[0.14] transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Teilen</span>
                      </button>

                      <button
                        onClick={() => setIsTheaterMode((prev) => !prev)}
                        className="p-2 rounded-full bg-white/[0.08] text-zinc-300 hover:bg-white/[0.14] hover:text-white transition-colors"
                        title={isTheaterMode ? 'Standardansicht' : 'Kinomodus'}
                      >
                        {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Description Box (YouTube style contrast card) */}
                  <div className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.08] text-xs text-zinc-200 space-y-2 transition-colors">
                    <div className="flex items-center gap-4 text-white font-bold">
                      <span>{formatViewsCount(activeVideo.viewCount)}</span>
                      <span>{formatTimeAgo(activeVideo.publishedAt)}</span>
                    </div>

                    <p
                      className={`whitespace-pre-line leading-relaxed text-zinc-300 ${
                        !isDescriptionExpanded ? 'line-clamp-3' : ''
                      }`}
                    >
                      {activeVideo.description || 'Keine Beschreibung verfügbar.'}
                    </p>

                    {activeVideo.description && activeVideo.description.length > 150 && (
                      <button
                        onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                        className="text-xs font-bold text-white hover:underline flex items-center gap-1 mt-1"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            <span>Weniger anzeigen</span>
                            <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Mehr anzeigen</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-red-500" />
                        <span>Kommentare ({comments.length})</span>
                      </h3>
                    </div>

                    {/* Add Comment Input */}
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Öffentlichen Kommentar schreiben..."
                        className="flex-1 h-10 px-4 rounded-xl bg-white/[0.06] text-xs text-white placeholder-zinc-500 focus:outline-none focus:bg-white/[0.1] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!newCommentText.trim()}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Senden</span>
                      </button>
                    </form>

                    {/* Comments List */}
                    {isLoadingComments ? (
                      <div className="py-6 text-center text-xs text-zinc-500">Kommentare werden geladen...</div>
                    ) : comments.length === 0 ? (
                      <div className="py-6 text-center text-xs text-zinc-500">Noch keine Kommentare vorhanden.</div>
                    ) : (
                      <div className="space-y-2.5">
                        {comments.map((c) => (
                          <div key={c.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.04]">
                            <img
                              src={c.authorProfileImageUrl}
                              alt={c.authorDisplayName}
                              className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-zinc-200 truncate">{c.authorDisplayName}</span>
                                <span className="text-[10px] text-zinc-500">{formatTimeAgo(c.publishedAt)}</span>
                              </div>
                              <div
                                className="text-xs text-zinc-300 leading-relaxed break-words"
                                dangerouslySetInnerHTML={{ __html: c.textDisplay }}
                              />
                              {c.likeCount > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 pt-0.5">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{c.likeCount}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar: Up Next / Recommended List */}
              <div className={`lg:w-80 xl:w-96 flex flex-col gap-3 shrink-0 ${isTheaterMode ? 'lg:w-full' : ''}`}>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nächste Videos</h3>
                <div className="flex flex-col gap-2">
                  {relatedVideos.slice(0, 14).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVideo(v)}
                      className="group flex gap-2.5 p-2 rounded-2xl hover:bg-white/[0.08] cursor-pointer transition-colors"
                    >
                      <div className="relative w-36 aspect-video rounded-xl overflow-hidden bg-zinc-900 shrink-0 shadow">
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                        {v.duration && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-bold text-white">
                            {v.duration}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="text-xs font-semibold text-zinc-100 line-clamp-2 leading-tight group-hover:text-white transition-colors">
                          {v.title}
                        </h4>
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenChannel(v.channelId, v.channelTitle, v.channelAvatarUrl);
                          }}
                          className="text-[11px] text-zinc-400 hover:text-white truncate mt-1 flex items-center gap-1"
                        >
                          {v.channelTitle}
                        </p>
                        <p className="text-[10px] text-zinc-500">{formatViewsCount(v.viewCount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'channel' ? (
            /* Dedicated Channel Page View */
            <div className="flex-1 flex flex-col overflow-y-auto">
              {isLoadingChannel && !activeChannel ? (
                <div className="p-8 space-y-6 animate-pulse">
                  <div className="w-full h-40 sm:h-52 bg-white/[0.05] rounded-3xl" />
                  <div className="flex gap-6 items-center">
                    <div className="w-24 h-24 rounded-full bg-white/[0.08]" />
                    <div className="space-y-3 flex-1">
                      <div className="h-6 w-1/3 bg-white/[0.08] rounded" />
                      <div className="h-4 w-1/4 bg-white/[0.05] rounded" />
                    </div>
                  </div>
                </div>
              ) : activeChannel ? (
                <div className="space-y-6 pb-12">
                  {/* Channel Banner */}
                  <div className="relative w-full h-36 sm:h-52 md:h-64 bg-gradient-to-r from-zinc-900 via-[#1e1e24] to-zinc-900 overflow-hidden shadow-inner">
                    {activeChannel.bannerUrl ? (
                      <img
                        src={activeChannel.bannerUrl}
                        alt="Channel Banner"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20">
                        <Flame className="w-32 h-32 text-red-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-black/20" />
                  </div>

                  {/* Channel Header Information */}
                  <div className="px-4 sm:px-8 max-w-7xl mx-auto -mt-12 relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      {/* Avatar + Main Details */}
                      <div className="flex items-center sm:items-start gap-4 sm:gap-6">
                        <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#181818] overflow-hidden shadow-2xl shrink-0 ring-4 ring-[#0f0f0f]">
                          <img
                            src={
                              activeChannel.avatarUrl ||
                              getChannelFallbackAvatar(activeChannel.title, activeChannel.id)
                            }
                            alt={activeChannel.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="space-y-1">
                          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                            <span>{activeChannel.title}</span>
                            <CheckCircle2 className="w-5 h-5 text-zinc-300 shrink-0" />
                          </h1>
                          <p className="text-xs sm:text-sm text-zinc-400 font-medium">{activeChannel.customUrl}</p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-400 pt-0.5">
                            <span className="font-semibold text-zinc-200">
                              {formatSubscribersCount(activeChannel.subscriberCount)}
                            </span>
                            <span>•</span>
                            <span>
                              {activeChannel.videoCount
                                ? `${activeChannel.videoCount} Videos`
                                : `${channelVideos.length} Videos`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Channel Action Buttons */}
                      <div className="flex items-center gap-2.5 self-start sm:self-center">
                        <button
                          onClick={() =>
                            handleToggleSubscription({
                              id: activeChannel.id,
                              title: activeChannel.title,
                              avatarUrl: activeChannel.avatarUrl,
                            })
                          }
                          className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                            YouTubeService.isSubscribed(activeChannel.id)
                              ? 'bg-white/[0.12] text-white hover:bg-white/[0.2]'
                              : 'bg-white text-black hover:bg-zinc-200 shadow-lg'
                          }`}
                        >
                          {YouTubeService.isSubscribed(activeChannel.id) ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              <span>Abonniert</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              <span>Abonnieren</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleShare(`https://www.youtube.com/channel/${activeChannel.id}`, 'Kanal-Link')
                          }
                          className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/[0.08] hover:bg-white/[0.16] text-white transition-colors flex items-center gap-1.5"
                          title="Kanal teilen"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Teilen</span>
                        </button>
                      </div>
                    </div>

                    {/* Channel Tabs */}
                    <div className="flex items-center gap-2 border-b border-white/[0.08] pt-2">
                      <button
                        onClick={() => setChannelActiveTab('videos')}
                        className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative ${
                          channelActiveTab === 'videos' ? 'text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-4 h-4" />
                        <span>Videos</span>
                        {channelActiveTab === 'videos' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                        )}
                      </button>

                      <button
                        onClick={() => setChannelActiveTab('about')}
                        className={`px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors relative ${
                          channelActiveTab === 'about' ? 'text-white' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                        <span>Über den Kanal</span>
                        {channelActiveTab === 'about' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                        )}
                      </button>
                    </div>

                    {/* Tab Contents */}
                    {channelActiveTab === 'videos' ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-white">Neueste Uploads</h3>
                          <span className="text-xs text-zinc-500">{channelVideos.length} Videos</span>
                        </div>

                        {channelVideos.length === 0 ? (
                          <div className="py-16 text-center space-y-3">
                            <Tv className="w-12 h-12 text-zinc-600 mx-auto" />
                            <h3 className="text-sm font-semibold text-zinc-300">Keine Videos verfügbar</h3>
                            <p className="text-xs text-zinc-500">Dieser Kanal hat derzeit keine öffentlichen Uploads.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                            {channelVideos.map((video) => (
                              <VideoCard
                                key={video.id}
                                video={{
                                  ...video,
                                  channelAvatarUrl: video.channelAvatarUrl || activeChannel.avatarUrl,
                                }}
                                onSelect={() => handleSelectVideo(video)}
                                onOpenChannel={() => {}}
                                onLike={() => handleToggleLike(video)}
                                onWatchLater={() => handleToggleWatchLater(video)}
                                onPlaylist={() => setPlaylistTargetVideo(video)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* About Channel Tab */
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                        {/* Description */}
                        <div className="lg:col-span-2 space-y-4 p-6 rounded-3xl bg-white/[0.04]">
                          <h3 className="text-base font-bold text-white">Beschreibung</h3>
                          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                            {activeChannel.description || 'Keine Beschreibung verfügbar.'}
                          </p>
                        </div>

                        {/* Details & Statistics */}
                        <div className="space-y-4 p-6 rounded-3xl bg-white/[0.04] h-fit">
                          <h3 className="text-base font-bold text-white">Kanal-Details</h3>
                          <div className="space-y-3 text-xs text-zinc-300">
                            <div className="flex items-center gap-3 py-1 border-b border-white/[0.04]">
                              <Globe className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div>
                                <div className="text-[10px] text-zinc-500 uppercase">Standort</div>
                                <div className="font-semibold">{activeChannel.country || 'Deutschland (DE)'}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 py-1 border-b border-white/[0.04]">
                              <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div>
                                <div className="text-[10px] text-zinc-500 uppercase">Beigetreten</div>
                                <div className="font-semibold">
                                  {activeChannel.publishedAt ? formatTimeAgo(activeChannel.publishedAt) : 'Vor 4 Jahren'}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 py-1 border-b border-white/[0.04]">
                              <Eye className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div>
                                <div className="text-[10px] text-zinc-500 uppercase">Gesamte Aufrufe</div>
                                <div className="font-semibold">{formatViewsCount(activeChannel.viewCount || '15400000')}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 py-1">
                              <Users className="w-4 h-4 text-zinc-400 shrink-0" />
                              <div>
                                <div className="text-[10px] text-zinc-500 uppercase">Kanal-ID</div>
                                <div className="font-mono text-[10px] text-zinc-400 truncate max-w-[200px]">
                                  {activeChannel.id}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            /* Main Feed / Tab Views */
            <div className="flex-1 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-y-auto">
              {/* Category Chips Bar (YouTube Website Style) */}
              {activeTab === 'home' && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {YOUTUBE_CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.id && !currentQuery;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setCurrentQuery('');
                            setSearchQuery('');
                            loadTrending(cat.id);
                            sounds.playClick();
                          }}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                            isActive
                              ? 'bg-white text-black shadow'
                              : 'bg-white/[0.08] text-white hover:bg-white/[0.16]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Topics */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-red-500" />
                      <span>Themen:</span>
                    </span>
                    {YOUTUBE_QUICK_FILTERS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setSearchQuery(tag);
                          handleSearch(tag);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-white/[0.05] hover:bg-white/[0.12] text-zinc-300 hover:text-white transition-colors shrink-0 font-medium"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Feed Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {activeTab === 'home' && (currentQuery ? `Ergebnisse für "${currentQuery}"` : 'Trends')}
                    {activeTab === 'subscriptions' && 'Deine Abonnements'}
                    {activeTab === 'history' && 'Wiedergabeverlauf'}
                    {activeTab === 'watch-later' && 'Später ansehen'}
                    {activeTab === 'liked' && 'Favoriten'}
                    {activeTab === 'playlists' && 'Playlists'}
                  </h2>
                </div>

                {activeTab === 'history' && history.length > 0 && (
                  <button
                    onClick={() => {
                      YouTubeService.clearHistory();
                      setHistory([]);
                      sounds.playClose();
                      addNotification('Verlauf gelöscht', 'Dein Verlauf wurde geleert.', 'info', 'YouTube');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Verlauf leeren</span>
                  </button>
                )}

                {activeTab === 'playlists' && (
                  <button
                    onClick={() => {
                      const title = prompt('Titel der neuen Playlist:');
                      if (title && title.trim()) {
                        const pl = YouTubeService.createPlaylist(title.trim());
                        setPlaylists(YouTubeService.getPlaylists());
                        sounds.playSuccess();
                        addNotification('Playlist erstellt', `"${pl.title}" wurde angelegt.`, 'info', 'YouTube');
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Neue Playlist</span>
                  </button>
                )}
              </div>

              {/* YouTube Fluid Video Grid */}
              {isLoading || isSearching ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="animate-pulse space-y-2.5">
                      <div className="w-full aspect-video bg-white/[0.08] rounded-2xl" />
                      <div className="flex gap-3 pt-1">
                        <div className="w-9 h-9 rounded-full bg-white/[0.08] shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 bg-white/[0.08] rounded w-4/5" />
                          <div className="h-2.5 bg-white/[0.05] rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeTab === 'home' ? (
                videos.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Tv className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Keine Videos gefunden</h3>
                    <p className="text-xs text-zinc-500">Probiere einen anderen Suchbegriff oder eine andere Kategorie.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                    {videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSelect={() => handleSelectVideo(video)}
                        onOpenChannel={() =>
                          handleOpenChannel(video.channelId, video.channelTitle, video.channelAvatarUrl)
                        }
                        onLike={() => handleToggleLike(video)}
                        onWatchLater={() => handleToggleWatchLater(video)}
                        onPlaylist={() => setPlaylistTargetVideo(video)}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'subscriptions' ? (
                subscriptions.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Users className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Keine Abonnements vorhanden</h3>
                    <p className="text-xs text-zinc-500">
                      Abonniere Kanäle bei Videos, um ihre neuesten Inhalte hier sofort zu sehen.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.channelId}
                        onClick={() => handleOpenChannel(sub.channelId, sub.channelTitle, sub.avatarUrl)}
                        className="p-5 rounded-3xl bg-white/[0.05] hover:bg-white/[0.1] transition-all cursor-pointer flex flex-col items-center text-center gap-3 group shadow"
                      >
                        <img
                          src={sub.avatarUrl || getChannelFallbackAvatar(sub.channelTitle, sub.channelId)}
                          alt={sub.channelTitle}
                          className="w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform shadow-md ring-2 ring-transparent group-hover:ring-red-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-0.5 w-full">
                          <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                            {sub.channelTitle}
                          </h4>
                          <span className="text-[11px] text-zinc-400">Abonniert</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSubscription({
                              id: sub.channelId,
                              title: sub.channelTitle,
                              avatarUrl: sub.avatarUrl,
                            });
                          }}
                          className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.1] hover:bg-red-600 text-zinc-200 hover:text-white transition-colors"
                        >
                          Abbestellen
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : activeTab === 'history' ? (
                history.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Clock className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Verlauf ist leer</h3>
                    <p className="text-xs text-zinc-500">Abgespielte Videos werden automatisch hier aufgelistet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                    {history.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSelect={() => handleSelectVideo(video)}
                        onOpenChannel={() =>
                          handleOpenChannel(video.channelId, video.channelTitle, video.channelAvatarUrl)
                        }
                        onLike={() => handleToggleLike(video)}
                        onWatchLater={() => handleToggleWatchLater(video)}
                        onPlaylist={() => setPlaylistTargetVideo(video)}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'watch-later' ? (
                watchLater.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Keine Videos gespeichert</h3>
                    <p className="text-xs text-zinc-500">Klicke auf das Lesezeichen-Icon bei einem Video, um es hier zu sichern.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                    {watchLater.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSelect={() => handleSelectVideo(video)}
                        onOpenChannel={() =>
                          handleOpenChannel(video.channelId, video.channelTitle, video.channelAvatarUrl)
                        }
                        onLike={() => handleToggleLike(video)}
                        onWatchLater={() => handleToggleWatchLater(video)}
                        onPlaylist={() => setPlaylistTargetVideo(video)}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'liked' ? (
                likedVideos.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ThumbsUp className="w-12 h-12 text-zinc-600 mx-auto" />
                    <h3 className="text-sm font-semibold text-zinc-300">Keine Favoriten vorhanden</h3>
                    <p className="text-xs text-zinc-500">Markiere Videos mit "Gefällt mir", um sie schnell wiederzufinden.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-6">
                    {likedVideos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onSelect={() => handleSelectVideo(video)}
                        onOpenChannel={() =>
                          handleOpenChannel(video.channelId, video.channelTitle, video.channelAvatarUrl)
                        }
                        onLike={() => handleToggleLike(video)}
                        onWatchLater={() => handleToggleWatchLater(video)}
                        onPlaylist={() => setPlaylistTargetVideo(video)}
                      />
                    ))}
                  </div>
                )
              ) : activeTab === 'playlists' ? (
                <div className="space-y-6">
                  {/* Playlists Overview */}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        className="p-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] transition-all flex flex-col justify-between gap-3 group shadow"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                              {pl.title}
                            </h4>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.1] text-zinc-300 font-semibold">
                              {pl.videoIds.length} Videos
                            </span>
                          </div>
                          {pl.description && <p className="text-xs text-zinc-400">{pl.description}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => {
                              if (pl.videoIds.length > 0) {
                                const target = pl.videoIds[0];
                                YouTubeService.getVideoDetails(target).then((d) => {
                                  if (d) handleSelectVideo(d);
                                });
                              } else {
                                addNotification('Playlist ist leer', 'Füge zuerst Videos hinzu.', 'info', 'YouTube');
                              }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Abspielen</span>
                          </button>

                          <button
                            onClick={() => {
                              YouTubeService.deletePlaylist(pl.id);
                              setPlaylists(YouTubeService.getPlaylists());
                              sounds.playClose();
                              addNotification('Playlist gelöscht', `"${pl.title}" entfernt.`, 'info', 'YouTube');
                            }}
                            className="p-1.5 rounded-full bg-white/[0.08] hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Playlist löschen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {/* URL / ID Direct Input Modal */}
      <AnimatePresence>
        {showUrlDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#212121] p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0 shadow">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Video per Link oder ID öffnen</h4>
                  <p className="text-xs text-zinc-400">Füge eine YouTube-URL oder Video-Kennung ein.</p>
                </div>
              </div>

              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="z. B. https://youtube.com/watch?v=dQw4w9WgXcQ"
                className="w-full h-11 px-4 rounded-xl bg-[#121212] text-sm text-white placeholder-zinc-500 focus:outline-none focus:bg-[#080808] transition-colors"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlDialog(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/[0.1] hover:bg-white/[0.16] text-zinc-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleLoadDirectUrl}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-colors"
                >
                  Abspielen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add To Playlist Modal */}
      <AnimatePresence>
        {playlistTargetVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-[#212121] p-6 shadow-2xl space-y-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0 shadow">
                  <ListPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Zur Playlist hinzufügen</h4>
                  <p className="text-xs text-zinc-400 truncate max-w-xs">{playlistTargetVideo.title}</p>
                </div>
              </div>

              {/* Existing Playlists */}
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {playlists.map((pl) => {
                  const isIncluded = pl.videoIds.includes(playlistTargetVideo.id);
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleAddVideoToPlaylist(pl.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs transition-colors ${
                        isIncluded
                          ? 'bg-red-600 text-white font-semibold'
                          : 'bg-white/[0.06] text-zinc-200 hover:bg-white/[0.12]'
                      }`}
                    >
                      <span className="font-medium">{pl.title}</span>
                      {isIncluded ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-zinc-400" />}
                    </button>
                  );
                })}
              </div>

              {/* Create New Playlist On The Fly */}
              <form onSubmit={handleCreatePlaylist} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="Neue Playlist erstellen..."
                  className="flex-1 h-10 px-3.5 rounded-xl bg-[#121212] text-xs text-white placeholder-zinc-500 focus:outline-none focus:bg-[#080808]"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistTitle.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.12] hover:bg-white/[0.2] disabled:opacity-40 text-white"
                >
                  Erstellen
                </button>
              </form>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setPlaylistTargetVideo(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white/[0.08] hover:bg-white/[0.14] text-zinc-300 transition-colors"
                >
                  Schließen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable YouTube Video Card Component (Clean borderless, pure contrast)
interface VideoCardProps {
  video: YouTubeVideo;
  onSelect: () => void;
  onOpenChannel?: () => void;
  onLike: () => void;
  onWatchLater: () => void;
  onPlaylist: () => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelect,
  onOpenChannel,
  onLike,
  onWatchLater,
  onPlaylist,
}) => {
  const isSaved = YouTubeService.isWatchLater(video.id);

  return (
    <div
      onClick={onSelect}
      className="group flex flex-col gap-2.5 rounded-2xl p-2 bg-transparent hover:bg-white/[0.06] transition-all duration-200 cursor-pointer"
    >
      {/* Thumbnail with duration badge & overlay buttons */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-md">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Video Duration Badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/90 text-[10px] font-bold text-white tracking-wide">
            {video.duration}
          </span>
        )}

        {/* Floating Quick Action Overlay on hover */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWatchLater();
            }}
            className={`p-2 rounded-lg backdrop-blur-md shadow-lg transition-colors ${
              isSaved
                ? 'bg-red-600 text-white'
                : 'bg-black/80 hover:bg-black text-white'
            }`}
            title="Später ansehen"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlaylist();
            }}
            className="p-2 rounded-lg bg-black/80 hover:bg-black backdrop-blur-md text-white shadow-lg transition-colors"
            title="Zur Playlist hinzufügen"
          >
            <ListPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Details with Clickable Channel Avatar & Name */}
      <div className="flex items-start gap-3 px-0.5">
        <div
          onClick={(e) => {
            if (onOpenChannel) {
              e.stopPropagation();
              onOpenChannel();
            }
          }}
          className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-red-500 shrink-0 overflow-hidden shadow hover:ring-2 hover:ring-red-500 transition-all cursor-pointer"
          title={`Kanal ${video.channelTitle} öffnen`}
        >
          <img
            src={video.channelAvatarUrl || getChannelFallbackAvatar(video.channelTitle, video.channelId)}
            alt={video.channelTitle}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 line-clamp-2 leading-snug group-hover:text-white transition-colors">
            {video.title}
          </h3>
          <p
            onClick={(e) => {
              if (onOpenChannel) {
                e.stopPropagation();
                onOpenChannel();
              }
            }}
            className="text-xs text-zinc-400 truncate mt-1 hover:text-white transition-colors cursor-pointer"
            title={`Kanal ${video.channelTitle} öffnen`}
          >
            {video.channelTitle}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
            <span>{formatViewsCount(video.viewCount)}</span>
            <span>•</span>
            <span>{formatTimeAgo(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
