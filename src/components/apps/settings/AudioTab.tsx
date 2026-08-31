import React from 'react';
import { useOS } from '../../../context/OSContext';
import { Volume2, VolumeX, Bell, Play, Zap, AlertCircle, Sparkles, Check } from 'lucide-react';

export const AudioTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds } = useOS();

  const isMuted = settings.soundMuted ?? false;
  const volume = settings.soundVolume ?? 75;

  const soundSchemes = [
    {
      id: 'clickSounds',
      label: 'Klick- & Interaktionstöne',
      desc: 'Haptisches Audio-Feedback bei Button- und Menüklicks',
      enabled: settings.clickSounds !== false,
      testFn: () => sounds.playClick(),
    },
    {
      id: 'errorSounds',
      label: 'Warn- & Fehlertöne',
      desc: 'Akustische Signale bei unerlaubten Aktionen oder Dialogen',
      enabled: settings.errorSounds !== false,
      testFn: () => sounds.playError(),
    },
    {
      id: 'startupSound',
      label: 'Systemstart & Login-Klang',
      desc: 'Harmonischer Begrüßungsakkord beim Hochfahren / Entsperren',
      enabled: settings.startupSound !== false,
      testFn: () => sounds.playStartup(),
    },
    {
      id: 'notificationSounds',
      label: 'Benachrichtigungstöne',
      desc: 'Kristalliner Ton bei eingehenden Toasts & Statusmeldungen',
      enabled: settings.notificationSounds !== false,
      testFn: () => sounds.playNotification(),
    },
  ];

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Audio & Systemklänge</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Verwalte die synthetische WebAudio Sound-Engine, Lautstärken und Klangeffekte.
        </p>
      </div>

      {/* 1. Master Volume & Mute */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            Gesamtlautstärke (Master Volume)
          </label>
          <button
            onClick={() => {
              const nextMute = !isMuted;
              updateSettings({ soundMuted: nextMute });
              if (!nextMute) sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-red-500/30'
                : 'bg-white/[0.06] text-zinc-300 border-white/[0.08] hover:bg-white/[0.1]'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Stummgeschaltet' : 'Aktiv'}</span>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" />
              Pegel
            </span>
            <span className="font-mono text-zinc-400">{isMuted ? '0%' : `${volume}%`}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            disabled={isMuted}
            onChange={(e) => {
              const val = Number(e.target.value);
              updateSettings({ soundVolume: val });
              sounds.setVolume(val);
            }}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500 disabled:opacity-40"
          />
        </div>
      </div>

      {/* 2. Sound Schemes & Individual Toggles */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Sound-Schema & Töne anpassen
        </label>

        <div className="space-y-2.5">
          {soundSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-white/[0.04] text-xs hover:bg-white/[0.02] transition-colors"
            >
              <div className="space-y-0.5 max-w-[65%]">
                <span className="text-zinc-200 font-medium block">{scheme.label}</span>
                <span className="text-[11px] text-zinc-400 block">{scheme.desc}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={scheme.testFn}
                  className="px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-[11px] text-zinc-200 flex items-center gap-1 transition-colors border border-white/[0.06]"
                  title="Ton abspielen"
                >
                  <Play className="w-3 h-3 text-purple-400 fill-current" />
                  <span>Test</span>
                </button>

                <button
                  onClick={() => {
                    updateSettings({ [scheme.id]: !scheme.enabled });
                    sounds.playToggle();
                  }}
                  className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                    scheme.enabled ? 'bg-purple-600' : 'bg-zinc-700'
                  }`}
                  style={{ backgroundColor: scheme.enabled ? accentConfig.primary : undefined }}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      scheme.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
