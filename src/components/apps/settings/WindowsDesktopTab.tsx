import React from 'react';
import { useOS } from '../../../context/OSContext';
import { Layout, Maximize2, Sparkles, Clock, Move, Layers } from 'lucide-react';

export const WindowsDesktopTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds } = useOS();

  const shadowOptions = [
    { id: 'none', label: 'Keine', desc: 'Flacher Look ohne Schlagschatten' },
    { id: 'subtle', label: 'Dezent', desc: 'Leichter, unaufdringlicher Schatten' },
    { id: 'medium', label: 'Mittel', desc: 'Ausgewogener Tiefeneffekt' },
    { id: 'deep', label: 'Tief', desc: 'Prägnanter macOS-artiger Kontrastschatten' },
    { id: 'glow', label: 'Neon-Glow', desc: 'Dynamische farbige Licht-Aura' },
  ];

  const dockPositions = [
    { id: 'bottom', label: 'Unten' },
    { id: 'top', label: 'Oben' },
    { id: 'left', label: 'Links' },
    { id: 'right', label: 'Rechts' },
  ];

  const dockAlignments = [
    { id: 'left', label: 'Links / Oben' },
    { id: 'center', label: 'Zentriert' },
    { id: 'right', label: 'Rechts / Unten' },
  ];

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Fenster & Desktop-Verhalten</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Passe das Anheftungsverhalten, die Dock-Positionierung und die System-Uhr an.
        </p>
      </div>

      {/* 1. Window Snap Layouts & Animations */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Fensterverhalten & Ergonomie
        </label>

        {/* Snap Layouts */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Snap-Layouts & Kachel-Vorschau</span>
            <span className="text-[11px] text-zinc-400">
              Fenster automatisch an den Bildschirmrändern anheften (Hälfte, Viertel, Vollbild).
            </span>
          </div>
          <button
            onClick={() => {
              updateSettings({ windowSnapLayouts: !(settings.windowSnapLayouts !== false) });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.windowSnapLayouts !== false ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.windowSnapLayouts !== false ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.windowSnapLayouts !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Window Animations */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Flüssige Fenster-Animationen</span>
            <span className="text-[11px] text-zinc-400">
              Spring-Physik beim Minimieren, Wiederherstellen und Schließen.
            </span>
          </div>
          <button
            onClick={() => {
              updateSettings({ animationsEnabled: !settings.animationsEnabled });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.animationsEnabled ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.animationsEnabled ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.animationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Window Shadow Intensity */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Fenster-Schatten Intensität
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {shadowOptions.map((opt) => {
            const isSelected = (settings.windowShadowIntensity || 'glow') === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  updateSettings({ windowShadowIntensity: opt.id as any });
                  sounds.playClick();
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] border-white/30 ring-1'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <span className={`text-xs font-medium block ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {opt.label}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Taskleiste / Dock Konfiguration */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Taskleiste & Dock-Position
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Dock Position */}
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-300 block">Bildschirmposition</span>
            <div className="grid grid-cols-4 gap-1.5">
              {dockPositions.map((pos) => {
                const isSelected = (settings.dockPosition || 'bottom') === pos.id;
                return (
                  <button
                    key={pos.id}
                    onClick={() => {
                      updateSettings({ dockPosition: pos.id as any });
                      sounds.playClick();
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white/[0.12] border-white/30 text-white'
                        : 'bg-black/20 border-white/[0.05] text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dock Alignment */}
          <div className="space-y-1.5">
            <span className="text-xs text-zinc-300 block">Icon-Ausrichtung</span>
            <div className="grid grid-cols-3 gap-1.5">
              {dockAlignments.map((al) => {
                const isSelected = (settings.dockAlignment || 'center') === al.id;
                return (
                  <button
                    key={al.id}
                    onClick={() => {
                      updateSettings({ dockAlignment: al.id as any });
                      sounds.playClick();
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-white/[0.12] border-white/30 text-white'
                        : 'bg-black/20 border-white/[0.05] text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {al.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Auto-Hide Dock */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Dock automatisch ausblenden (Auto-Hide)</span>
            <span className="text-[11px] text-zinc-400">
              Gleitet erst hervor, wenn der Mauszeiger an den Rand bewegt wird.
            </span>
          </div>
          <button
            onClick={() => {
              updateSettings({ dockAutoHide: !settings.dockAutoHide });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.dockAutoHide ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.dockAutoHide ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.dockAutoHide ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 4. System-Uhr & Format */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          System-Uhr & Zeitformat
        </label>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">24-Stunden Format</span>
            <span className="text-[11px] text-zinc-400">14:30 statt 02:30 PM anzeigen</span>
          </div>
          <button
            onClick={() => {
              updateSettings({ clockFormat24h: !settings.clockFormat24h });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.clockFormat24h ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.clockFormat24h ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.clockFormat24h ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Sekunden anzeigen</span>
            <span className="text-[11px] text-zinc-400">Live-Sekundentaktung in Menüleiste</span>
          </div>
          <button
            onClick={() => {
              updateSettings({ clockShowSeconds: !settings.clockShowSeconds });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.clockShowSeconds ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.clockShowSeconds ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.clockShowSeconds ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
