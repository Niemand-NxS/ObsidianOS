import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Music,
  Search,
  ExternalLink,
  Sparkles,
  Lock,
  Radio,
  Disc3,
  Loader2,
  ListMusic,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AppleMusicTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string;
  artworkUrl100: string;
  primaryGenreName: string;
  releaseDate?: string;
  trackViewUrl?: string;
  trackTimeMillis?: number;
}

const CURATED_SEARCHES = [
  'Cyberpunk Synthwave',
  'Lo-Fi Dark Ambient',
  'The Weeknd',
  'Daft Punk',
  'Hans Zimmer',
  'Night Drive Techno',
  'Billie Eilish',
  'Interstellar',
];

export const MusicApp: React.FC = () => {
  const { accentConfig, addNotification, setNowPlaying } = useOS();
  const [searchQuery, setSearchQuery] = useState('Cyberpunk Synthwave');
  const [tracks, setTracks] = useState<AppleMusicTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Fetch tracks from Apple Music / iTunes Search API
  const searchAppleMusic = async (term: string) => {
    if (!term.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          term
        )}&media=music&entity=song&limit=25`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setTracks(data.results);
        setCurrentTrackIndex(0);
        setCurrentTime(0);
      } else {
        addNotification('Keine Treffer', `Keine Musiktitel für "${term}" gefunden.`, 'warning', 'Apple Music');
      }
    } catch (err) {
      console.warn('Apple Music API fetch error:', err);
      addNotification('API-Fehler', 'Apple Music API konnte nicht geladen werden.', 'error', 'Apple Music');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchAppleMusic('Cyberpunk Synthwave');
  }, []);

  const currentTrack = tracks[currentTrackIndex];

  // High-res album artwork helper
  const getHighResArtwork = (url?: string) => {
    if (!url) return '';
    return url.replace('100x100bb.jpg', '600x600bb.jpg');
  };

  // Audio setup and Visualizer
  const setupAudioContext = () => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (e) {
      console.warn('AudioContext setup note:', e);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.previewUrl) {
      if (!currentTrack?.previewUrl) {
        addNotification('Keine Vorschau', 'Für diesen Titel ist keine Audio-Vorschau verfügbar.', 'warning', 'Apple Music');
      }
      return;
    }

    setupAudioContext();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('Playback error:', e);
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    const nextIdx = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handlePrev = () => {
    if (tracks.length === 0) return;
    const prevIdx = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevIdx);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Auto-play when track index changes if currently playing
  useEffect(() => {
    if (audioRef.current && currentTrack?.previewUrl) {
      audioRef.current.src = currentTrack.previewUrl;
      audioRef.current.load();
      if (isPlaying) {
        setupAudioContext();
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    }
  }, [currentTrackIndex, tracks]);

  // Sync with global OS media state
  useEffect(() => {
    if (currentTrack) {
      setNowPlaying({
        id: String(currentTrack.trackId),
        title: currentTrack.trackName,
        artist: currentTrack.artistName,
        source: 'music',
        coverUrl: currentTrack.artworkUrl100,
        isPlaying: isPlaying,
        appId: 'music',
      });
    }
  }, [isPlaying, currentTrackIndex, tracks, setNowPlaying]);

  // Listen to remote media commands from TopBar / ControlCenter
  useEffect(() => {
    const handleCommand = (e: Event) => {
      const custom = e as CustomEvent<{ action: string; id?: string; source?: string }>;
      if (!custom.detail?.source || custom.detail.source === 'music') {
        if (custom.detail.action === 'pause' && audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else if (custom.detail.action === 'play' && audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        } else if (custom.detail.action === 'stop' && audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      }
    };
    window.addEventListener('os-media-command', handleCommand);
    return () => {
      window.removeEventListener('os-media-command', handleCommand);
    };
  }, []);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Visualizer render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const bufferLength = analyserRef.current ? analyserRef.current.frequencyBinCount : 24;
      const dataArray = new Uint8Array(bufferLength);

      if (analyserRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Subtle resting wave
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = isPlaying ? Math.floor(Math.random() * 80 + 30) : 10;
        }
      }

      const barCount = 20;
      const barWidth = (width / barCount) - 3;
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i] || 10;
        const barHeight = Math.max(3, (val / 255) * height * 0.9);
        const x = i * (barWidth + 3);
        const y = height - barHeight;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, accentConfig.primary);
        gradient.addColorStop(1, accentConfig.text);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, accentConfig]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0b10] text-zinc-100 select-none overflow-hidden relative">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            setDuration(audioRef.current.duration || 30);
          }
        }}
        onEnded={handleNext}
        onError={() => setIsPlaying(false)}
      />

      {/* Official Apple Music Paywall & Status Banner */}
      <div
        className="px-3.5 py-2 bg-gradient-to-r from-[#170e28] via-[#12121c] to-[#1f0a21] border-b border-purple-500/20 flex items-center justify-between gap-2 shrink-0"
        style={{ borderColor: accentConfig.border }}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-5 h-5 rounded-md bg-[#fa243c] flex items-center justify-center shrink-0 shadow-md">
            <Music className="w-3 h-3 text-white fill-white" />
          </div>
          <div className="text-xs truncate">
            <span className="font-semibold text-white">Apple Music Vorschau</span>
            <span className="text-zinc-400 text-[11px] ml-1.5 hidden sm:inline">
              (30 Sek. Hi-Res Preview aktiv • Für unbegrenzte Vollversionen wird ein Abo benötigt)
            </span>
          </div>
        </div>

        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#fa243c] hover:bg-[#e01e34] text-white transition-all shrink-0 shadow-sm flex items-center gap-1"
        >
          <Lock className="w-3 h-3" />
          <span>Abonnieren</span>
        </button>
      </div>

      {/* Search Bar & Curated Genre Chips */}
      <div className="p-3 bg-[#111118]/90 border-b border-white/[0.08] shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            searchAppleMusic(searchQuery);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Titel, Künstler oder Album in Apple Music suchen..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#191924] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-xs font-medium text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: accentConfig.primary }}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Suchen</span>
          </button>
        </form>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
          <span className="text-zinc-500 font-medium whitespace-nowrap text-[10px] uppercase tracking-wider">
            Trends:
          </span>
          {CURATED_SEARCHES.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setSearchQuery(chip);
                searchAppleMusic(chip);
              }}
              className="px-2.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white whitespace-nowrap transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Split Player & Tracklist */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
        {/* Left: Player Stage */}
        <div className="md:col-span-5 p-4 flex flex-col items-center justify-center border-r border-white/[0.08] bg-[#0d0d14] relative">
          {currentTrack ? (
            <div className="flex flex-col items-center text-center w-full max-w-[280px]">
              {/* Artwork Box */}
              <div className="relative group w-48 h-48 sm:w-52 sm:h-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-3 bg-[#191924]">
                <img
                  src={getHighResArtwork(currentTrack.artworkUrl100)}
                  alt={currentTrack.trackName}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    isPlaying ? 'scale-105' : 'scale-100'
                  }`}
                  referrerPolicy="no-referrer"
                />
                {/* Vinyl disc spin overlay */}
                <div
                  className={`absolute inset-0 bg-black/30 backdrop-blur-[2px] flex items-center justify-center transition-opacity ${
                    isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                  }`}
                >
                  <button
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-white/90 text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                </div>

                {/* Apple Music Badge */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-mono text-zinc-300">
                  Preview (30s)
                </div>
              </div>

              {/* Title & Artist */}
              <div className="w-full">
                <h3 className="font-semibold text-sm text-white truncate drop-shadow-sm">
                  {currentTrack.trackName}
                </h3>
                <p className="text-xs text-zinc-400 truncate mt-0.5">
                  {currentTrack.artistName}
                </p>
                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                  {currentTrack.collectionName} • {currentTrack.primaryGenreName}
                </p>
              </div>

              {/* Visualizer Canvas */}
              <div className="w-full h-10 mt-3 flex items-center justify-center">
                <canvas ref={canvasRef} width={220} height={40} className="w-full h-10 opacity-85" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-zinc-500 text-xs">
              <Disc3 className="w-12 h-12 animate-spin-slow opacity-30 mb-2" />
              <span>Suche nach Musiktiteln...</span>
            </div>
          )}
        </div>

        {/* Right: Tracklist Results */}
        <div className="md:col-span-7 flex flex-col overflow-hidden bg-[#09090d]">
          <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs text-zinc-400">
            <span className="font-medium flex items-center gap-1.5">
              <ListMusic className="w-3.5 h-3.5" />
              <span>Suchergebnisse ({tracks.length})</span>
            </span>
            {currentTrack?.trackViewUrl && (
              <a
                href={currentTrack.trackViewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] hover:text-white flex items-center gap-1 text-purple-400 transition-colors"
                style={{ color: accentConfig.text }}
              >
                <span>In Apple Music öffnen</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {tracks.map((track, idx) => {
              const isCurrent = idx === currentTrackIndex;
              return (
                <div
                  key={track.trackId}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                  className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-[#1c1a2e] border border-purple-500/40 text-white'
                      : 'hover:bg-white/[0.04] text-zinc-300 border border-transparent'
                  }`}
                  style={{
                    borderColor: isCurrent ? accentConfig.border : undefined,
                  }}
                >
                  {/* Track Number / Play state */}
                  <div className="w-6 text-center text-xs font-mono text-zinc-500 shrink-0">
                    {isCurrent && isPlaying ? (
                      <span className="flex space-x-0.5 justify-center items-end h-3">
                        <span className="w-0.5 h-3 bg-purple-400 animate-pulse" />
                        <span className="w-0.5 h-2 bg-purple-400 animate-pulse delay-75" />
                        <span className="w-0.5 h-3.5 bg-purple-400 animate-pulse delay-150" />
                      </span>
                    ) : (
                      idx + 1
                    )}
                  </div>

                  {/* Thumbnail */}
                  <img
                    src={track.artworkUrl100}
                    alt={track.trackName}
                    className="w-9 h-9 rounded-lg object-cover bg-zinc-800 shrink-0 shadow"
                    referrerPolicy="no-referrer"
                  />

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isCurrent ? 'text-purple-300' : 'text-zinc-200'}`}>
                      {track.trackName}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {track.artistName} • {track.collectionName}
                    </p>
                  </div>

                  {/* Duration / Preview badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-mono">
                      0:30
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Audio Controls Bar */}
      <div className="px-4 py-2.5 bg-[#12121a]/95 backdrop-blur-xl border-t border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
        {/* Playback Controls & Progress */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Vorheriger Titel"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Nächster Titel"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Scrubber */}
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 30}
            step="0.1"
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setCurrentTime(val);
              if (audioRef.current) {
                audioRef.current.currentTime = val;
              }
            }}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-[10px] font-mono text-zinc-400 w-7">
            {formatTime(duration || 30)}
          </span>
        </div>

        {/* Volume Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>

      {/* Subscription Paywall Modal */}
      <AnimatePresence>
        {showSubscriptionModal && (
          <div
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowSubscriptionModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#161622] border border-white/20 p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#fa243c] flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
                <Music className="w-8 h-8 text-white fill-white" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Apple Music Abonnieren</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Erhalte Zugriff auf über 100 Millionen Songs in voller Länge, verlustfreies Hi-Res Audio und Spatial Audio mit Dolby Atmos.
                </p>
              </div>

              <div className="space-y-2 text-left text-xs bg-white/5 p-3 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Unbegrenzte Wiedergabe in voller Länge</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Lossless Audio & Spatial Audio</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Offline-Downloads auf allen Geräten</span>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <a
                  href="https://music.apple.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-xl bg-[#fa243c] hover:bg-[#e01e34] text-white text-xs font-semibold shadow-lg block transition-colors"
                >
                  Jetzt ab 10,99 €/Monat testen
                </a>
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-medium transition-colors"
                >
                  Mit 30-Sekunden-Vorschau fortfahren
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
