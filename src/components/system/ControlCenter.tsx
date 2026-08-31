import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Wifi,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Cloud,
  Shield,
  Bell,
  Sliders,
  Check,
  X,
  Sparkles,
  Bluetooth,
  Trash2,
  Play,
  Pause,
  Square,
  Music,
  Youtube,
  Radio,
  ExternalLink,
  Disc3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ControlCenter: React.FC = () => {
  const {
    isControlCenterOpen,
    closeControlCenter,
    settings,
    updateSettings,
    accentConfig,
    cloudSync,
    triggerSync,
    notifications,
    dismissNotification,
    clearAllNotifications,
    nowPlaying,
    toggleGlobalMedia,
    stopGlobalMedia,
    openApp,
    sounds,
  } = useOS();

  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'controls' | 'notifications'>('controls');

  if (!isControlCenterOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="control-center-backdrop"
        onClick={closeControlCenter}
        className="fixed inset-0 z-40 bg-transparent"
      >
        <motion.div
          id="control-center-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="absolute top-10 right-3 w-80 rounded-3xl bg-[#13131c]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 z-50 text-xs space-y-4 select-none"
          style={{
            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px ${accentConfig.glow}`,
          }}
        >
          {/* Header tabs */}
          <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-2.5">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('controls')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  activeTab === 'controls' ? 'bg-[#222230] text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Steuerung
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'notifications' ? 'bg-[#222230] text-white shadow' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Bell className="w-3 h-3" />
                <span>Mitteilungen</span>
                {notifications.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-600 text-white font-mono">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={closeControlCenter}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {activeTab === 'controls' ? (
            <div className="space-y-3">
              {/* Media Player Card (YouTube, Apple Music, WebAudio) */}
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#181528] via-[#12121d] to-[#0c0c14] border border-purple-500/25 shadow-lg relative overflow-hidden space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
                    {nowPlaying?.source === 'youtube' ? (
                      <Youtube className="w-3.5 h-3.5 text-red-500" />
                    ) : nowPlaying?.source === 'music' ? (
                      <Music className="w-3.5 h-3.5 text-pink-400" />
                    ) : (
                      <Radio className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span>
                      {nowPlaying?.source === 'youtube'
                        ? 'YouTube Player'
                        : nowPlaying?.source === 'music'
                        ? 'Apple Music'
                        : nowPlaying?.source === 'synth'
                        ? 'Synthesizer Audio'
                        : 'Medienwiedergabe'}
                    </span>
                  </div>

                  {nowPlaying?.isPlaying && (
                    <div className="flex items-center gap-0.5">
                      <span className="w-0.5 h-2.5 bg-purple-400 animate-pulse" />
                      <span className="w-0.5 h-4 bg-purple-400 animate-pulse delay-75" />
                      <span className="w-0.5 h-2 bg-purple-400 animate-pulse delay-150" />
                      <span className="w-0.5 h-3 bg-purple-400 animate-pulse delay-100" />
                    </div>
                  )}
                </div>

                {nowPlaying ? (
                  <div className="flex items-center gap-3">
                    {/* Media Artwork / Thumbnail */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black/80 shrink-0 border border-white/10 shadow">
                      {nowPlaying.coverUrl ? (
                        <img
                          src={nowPlaying.coverUrl}
                          alt={nowPlaying.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-900/40 text-purple-300">
                          <Disc3 className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
                        </div>
                      )}
                    </div>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-white truncate leading-tight">{nowPlaying.title}</h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">{nowPlaying.artist}</p>
                    </div>

                    {/* Play / Pause & Stop Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          toggleGlobalMedia();
                          sounds.playClick();
                        }}
                        className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-md shadow-purple-600/30 transition-transform active:scale-95"
                        title={nowPlaying.isPlaying ? 'Pausieren' : 'Abspielen'}
                      >
                        {nowPlaying.isPlaying ? (
                          <Pause className="w-4 h-4 fill-white" />
                        ) : (
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => {
                          stopGlobalMedia();
                          sounds.playClose();
                        }}
                        className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-red-500/20 hover:text-red-400 text-zinc-400 flex items-center justify-center transition-colors"
                        title="Stoppen"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Idle / Standby State */
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] text-zinc-400">Keine aktive Wiedergabe</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          openApp('youtube');
                          closeControlCenter();
                          sounds.playOpen();
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/30 transition-colors flex items-center gap-1"
                      >
                        <Youtube className="w-3 h-3" />
                        <span>YouTube</span>
                      </button>
                      <button
                        onClick={() => {
                          openApp('music');
                          closeControlCenter();
                          sounds.playOpen();
                        }}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 border border-pink-500/30 transition-colors flex items-center gap-1"
                      >
                        <Music className="w-3 h-3" />
                        <span>Musik</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Quick Toggles 2x2 */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Wi-Fi */}
                <button
                  onClick={() => setWifiEnabled(!wifiEnabled)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    wifiEnabled
                      ? 'bg-[#1e1a30] border-purple-500/50 text-white shadow-sm'
                      : 'bg-[#101016] border-[#27272a] text-zinc-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      wifiEnabled ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Wifi className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">WLAN</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{wifiEnabled ? 'Obsidian-5G' : 'Aus'}</p>
                  </div>
                </button>

                {/* Bluetooth */}
                <button
                  onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
                  className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    bluetoothEnabled
                      ? 'bg-[#1e1a30] border-purple-500/50 text-white shadow-sm'
                      : 'bg-[#101016] border-[#27272a] text-zinc-500'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      bluetoothEnabled ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Bluetooth className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-xs">Bluetooth</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{bluetoothEnabled ? 'Aktiv' : 'Aus'}</p>
                  </div>
                </button>
              </div>

              {/* Cloud Sync Quick Trigger Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-[#19152b] to-[#12121b] border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <div>
                    <p className="font-bold text-white text-xs">AES-256 Cloud Sync</p>
                    <p className="text-[10px] text-zinc-400">Zero-Knowledge E2E</p>
                  </div>
                </div>
                <button
                  onClick={() => triggerSync()}
                  disabled={cloudSync.isSyncing}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow"
                >
                  {cloudSync.isSyncing ? 'Sync...' : 'Sync'}
                </button>
              </div>

              {/* Sliders: Brightness & Volume */}
              <div className="p-3 rounded-2xl bg-[#111118] border border-[#27272a]/70 space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> Helligkeit
                    </span>
                    <span className="font-mono">{settings.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={120}
                    value={settings.brightness}
                    onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                    className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Lautstärke
                    </span>
                    <span className="font-mono">{settings.soundVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.soundVolume}
                    onChange={(e) => updateSettings({ soundVolume: Number(e.target.value) })}
                    className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Sound & Magnification Toggles */}
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ soundEffects: !settings.soundEffects })}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    settings.soundEffects
                      ? 'bg-[#1f1a30] border-purple-500/40 text-purple-200'
                      : 'bg-[#101016] border-[#27272a] text-zinc-500'
                  }`}
                >
                  {settings.soundEffects ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  Sound
                </button>

                <button
                  onClick={() => updateSettings({ dockMagnification: !settings.dockMagnification })}
                  className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                    settings.dockMagnification
                      ? 'bg-[#1f1a30] border-purple-500/40 text-purple-200'
                      : 'bg-[#101016] border-[#27272a] text-zinc-500'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Dock Morph
                </button>
              </div>
            </div>
          ) : (
            /* Notifications Tab */
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <div className="flex justify-between items-center pb-1">
                <span className="text-[11px] text-zinc-400">Systemprotokoll</span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[10px] text-zinc-500 hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Alle leeren
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-8">Keine neuen Mitteilungen</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-[#161622] border border-[#27272a] space-y-1 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{n.title}</span>
                      <span className="text-[9px] font-mono text-zinc-500">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-tight">{n.message}</p>
                    <button
                      onClick={() => dismissNotification(n.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-700 text-zinc-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
