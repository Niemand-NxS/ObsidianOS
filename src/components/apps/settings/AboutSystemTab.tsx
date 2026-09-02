import React, { useState, useEffect } from 'react';
import { useOS } from '../../../context/OSContext';
import { Cpu, Sparkles, Terminal, Activity, Layers, Heart, Globe, ShieldCheck } from 'lucide-react';

export const AboutSystemTab: React.FC = () => {
  const { accentConfig, systemBootTime, openSetupAssistant, sounds } = useOS();
  const [uptimeSeconds, setUptimeSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - systemBootTime) / 1000))
  );

  useEffect(() => {
    // Measure accurate system uptime since OS boot
    const updateUptime = () => {
      setUptimeSeconds(Math.max(0, Math.floor((Date.now() - systemBootTime) / 1000)));
    };
    updateUptime();
    const timer = setInterval(updateUptime, 1000);
    return () => clearInterval(timer);
  }, [systemBootTime]);

  const formatUptime = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Info & Systemarchitektur</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Versionsinformationen, Systemlaufzeit, Render-Pipeline und Entwickler-Details.
        </p>
      </div>

      {/* 1. System Header Card */}
      <div className="p-5 rounded-xl bg-gradient-to-br from-purple-900/30 via-black/40 to-cyan-900/20 border border-white/[0.1] relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/20"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">ObsidianOS</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 border border-white/20 text-purple-300">
                v3.4 Production
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Next-Generation Web Desktop Environment & Cloud Workspace
            </p>
          </div>
        </div>
      </div>

      {/* 2. System Status & Engine Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Uptime Timer */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              System-Laufzeit (Uptime)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xl font-mono font-bold text-white tracking-wider block pt-1">
            {formatUptime(uptimeSeconds)}
          </span>
          <span className="text-[10px] text-zinc-500 block">Sitzung aktiv ohne Unterbrechung</span>
        </div>

        {/* Engine Pipeline */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              Render-Engine Pipeline
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">Hardwarebeschleunigt</span>
          </div>
          <span className="text-sm font-semibold text-white block pt-1">
            WebGL 2.0 + WebAudio Synthesis
          </span>
          <span className="text-[10px] text-zinc-500 block">60 FPS Spring Physics & Glassmorphism</span>
        </div>
      </div>

      {/* 3. Tech Stack & Environment Specs */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2.5">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Technologie-Stack & Frameworks
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {[
            { label: 'Kern-Framework', value: 'React 18 (Concurrent)' },
            { label: 'Animation Engine', value: 'Motion (Framer)' },
            { label: 'Styling Engine', value: 'Tailwind CSS v4' },
            { label: 'Persistenz', value: 'Firebase Firestore + Local' },
            { label: 'Sound Pipeline', value: 'Synthesized Web Audio' },
            { label: 'Container Host', value: 'Google Cloud Run' },
          ].map((item, idx) => (
            <div key={idx} className="p-2 rounded bg-black/20 border border-white/[0.04]">
              <span className="text-[10px] text-zinc-500 block">{item.label}</span>
              <span className="font-mono text-zinc-200 text-[11px] font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Setup Assistant Re-run */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-purple-200">ObsidianOS Setup-Assistent</h4>
          <p className="text-[11px] text-purple-300/70">
            Starte den 8-stufigen Ersteinrichtungs-Assistenten erneut zur Rekonfiguration.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            openSetupAssistant();
          }}
          className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Assistent öffnen</span>
        </button>
      </div>

      {/* 5. Developer Credits */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Credits & Mitwirkende</span>
        </div>
        <p className="text-zinc-400 text-[11px] leading-relaxed">
          Entwickelt als zukunftsweisendes Web-Betriebssystem mit Fokus auf Ästhetik, Produktivität und nahtlose Cloud-Synchronisation.
        </p>
        <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/[0.04]">
          <span>© 2026 ObsidianOS Ecosystem</span>
          <span className="font-mono">Build 2026.08-STABLE</span>
        </div>
      </div>
    </div>
  );
};
