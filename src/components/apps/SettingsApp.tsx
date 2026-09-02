import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Palette,
  Image as ImageIcon,
  Monitor,
  Layers,
  HardDrive,
  Volume2,
  Wifi,
  Shield,
  Cloud,
  Info,
} from 'lucide-react';
import { AppearanceTab } from './settings/AppearanceTab';
import { WallpaperTab } from './settings/WallpaperTab';
import { DisplayTab } from './settings/DisplayTab';
import { WindowsDesktopTab } from './settings/WindowsDesktopTab';
import { StorageDataTab } from './settings/StorageDataTab';
import { AudioTab } from './settings/AudioTab';
import { NetworkAppsTab } from './settings/NetworkAppsTab';
import { SecurityLockTab } from './settings/SecurityLockTab';
import { CloudSyncTab } from './settings/CloudSyncTab';
import { AboutSystemTab } from './settings/AboutSystemTab';

export type SettingsTab =
  | 'appearance'
  | 'wallpaper'
  | 'display'
  | 'windows'
  | 'storage'
  | 'audio'
  | 'network'
  | 'security'
  | 'cloud'
  | 'system';

interface SettingsAppProps {
  initialTab?: string;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({ initialTab }) => {
  const { accentConfig, sounds, effectiveTheme, effectiveGlassContrast, isLight } = useOS();
  const isLightMode = isLight || (effectiveTheme === 'glassy' && effectiveGlassContrast === 'dark');
  const isGlassy = effectiveTheme === 'glassy';

  // Normalize initialTab
  const getNormalizedTab = (tab?: string): SettingsTab => {
    if (!tab) return 'appearance';
    if (tab === 'personalization' || tab === 'appearance') return 'appearance';
    if (tab === 'custom_wallpapers' || tab === 'wallpaper') return 'wallpaper';
    if (tab === 'display' || tab === 'screen') return 'display';
    if (tab === 'dock_desktop' || tab === 'windows') return 'windows';
    if (tab === 'storage' || tab === 'data') return 'storage';
    if (tab === 'sound' || tab === 'audio') return 'audio';
    if (tab === 'network' || tab === 'apps') return 'network';
    if (tab === 'users' || tab === 'security' || tab === 'clock_lockscreen') return 'security';
    if (tab === 'cloud') return 'cloud';
    if (tab === 'system' || tab === 'about') return 'system';
    return 'appearance';
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getNormalizedTab(initialTab));

  useEffect(() => {
    if (initialTab) {
      setActiveTab(getNormalizedTab(initialTab));
    }
  }, [initialTab]);

  const navGroups = [
    {
      groupTitle: 'System & Darstellung',
      items: [
        { id: 'appearance', label: 'Darstellung & Themes', icon: Palette },
        { id: 'wallpaper', label: 'Hintergrund & Fotos', icon: ImageIcon },
        { id: 'display', label: 'Bildschirm & Skalierung', icon: Monitor },
      ],
    },
    {
      groupTitle: 'Fenster & Desktop',
      items: [
        { id: 'windows', label: 'Fenster & Taskleiste', icon: Layers },
        { id: 'storage', label: 'Speicher & Backups', icon: HardDrive },
      ],
    },
    {
      groupTitle: 'Konnektivität & Audio',
      items: [
        { id: 'audio', label: 'Audio & Klänge', icon: Volume2 },
        { id: 'network', label: 'Netzwerk & Apps', icon: Wifi },
      ],
    },
    {
      groupTitle: 'Sicherheit & Info',
      items: [
        { id: 'security', label: 'Sicherheit & Profile', icon: Shield },
        { id: 'cloud', label: 'Firebase Cloud Sync', icon: Cloud },
        { id: 'system', label: 'Info / Über ObsidianOS', icon: Info },
      ],
    },
  ];

  return (
    <div
      id="settings-app"
      className={`flex h-full select-none overflow-hidden font-sans transition-colors ${
        effectiveTheme === 'light'
          ? 'bg-slate-50 text-zinc-900'
          : isGlassy
          ? isLightMode
            ? 'bg-transparent text-zinc-900'
            : 'bg-transparent text-zinc-100'
          : 'bg-[#09090e] text-zinc-100'
      }`}
    >
      {/* 1. Modern Sidebar Navigation */}
      <div
        className={`w-56 sm:w-64 border-r flex flex-col justify-between p-3 shrink-0 overflow-y-auto custom-scrollbar transition-colors ${
          effectiveTheme === 'light'
            ? 'bg-slate-100/90 border-slate-200 text-zinc-900'
            : isGlassy
            ? isLightMode
              ? 'bg-white/40 border-black/10 backdrop-blur-xl text-zinc-900'
              : 'bg-white/[0.06] border-white/10 backdrop-blur-xl text-zinc-100'
            : 'bg-[#0d0d13]/95 border-white/[0.08] text-zinc-100'
        }`}
      >
        <div className="space-y-4">
          <div className="px-2 pt-1 pb-0.5">
            <h2
              className={`text-[11px] font-bold tracking-wider uppercase font-mono ${
                isLightMode ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              Systemsteuerung
            </h2>
          </div>

          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-2.5 py-0.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                    isLightMode ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  {group.groupTitle}
                </span>
              </div>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`tab-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id as SettingsTab);
                      sounds.playClick();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? isLightMode
                          ? 'bg-purple-100 text-purple-900 border border-purple-300/80 shadow-sm font-semibold'
                          : 'bg-white/[0.12] text-white border border-white/20 shadow-sm'
                        : isLightMode
                        ? 'text-zinc-600 hover:bg-black/[0.05] hover:text-zinc-900'
                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: isActive ? accentConfig.primary : undefined }}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer info badge */}
        <div
          className={`p-2.5 rounded-xl border text-[10px] flex items-center justify-between transition-colors ${
            isLightMode
              ? 'bg-slate-200/70 border-slate-300/80 text-zinc-600'
              : 'bg-black/40 border-white/[0.04] text-zinc-500'
          }`}
        >
          <span>ObsidianOS v3.4</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div
        className={`flex-1 overflow-y-auto p-6 custom-scrollbar transition-colors ${
          effectiveTheme === 'light'
            ? 'bg-white/80'
            : isGlassy
            ? isLightMode
              ? 'bg-white/20'
              : 'bg-black/10'
            : 'bg-[#09090e]/90'
        }`}
      >
        <div className="max-w-3xl mx-auto pb-8">
          {activeTab === 'appearance' && <AppearanceTab />}
          {activeTab === 'wallpaper' && <WallpaperTab />}
          {activeTab === 'display' && <DisplayTab />}
          {activeTab === 'windows' && <WindowsDesktopTab />}
          {activeTab === 'storage' && <StorageDataTab />}
          {activeTab === 'audio' && <AudioTab />}
          {activeTab === 'network' && <NetworkAppsTab />}
          {activeTab === 'security' && <SecurityLockTab />}
          {activeTab === 'cloud' && <CloudSyncTab />}
          {activeTab === 'system' && <AboutSystemTab />}
        </div>
      </div>
    </div>
  );
};
