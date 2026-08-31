import React from 'react';
import { useOS } from '../../../context/OSContext';
import { Monitor, Grid, ZoomIn, Sun, Moon, Eye } from 'lucide-react';

export const DisplayTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds } = useOS();

  const scaleOptions = [
    { value: 80, label: '80% (Kompakt)', desc: 'Maximale Arbeitsfläche für große Monitore' },
    { value: 90, label: '90% (Subtil)', desc: 'Leicht verkleinerte UI-Elemente' },
    { value: 100, label: '100% (Standard)', desc: 'Optimale Balance für Full-HD & Retina' },
    { value: 110, label: '110% (Komfort)', desc: 'Leicht vergrößerte Schriften' },
    { value: 120, label: '120% (Groß)', desc: 'Maximale Lesbarkeit auf Touch/HiDPI' },
  ];

  const gridSpacings = [
    { id: 'compact', label: 'Kompakt', desc: 'Enge 90×90px Abstände für viele Icons' },
    { id: 'comfortable', label: 'Komfortabel (Standard)', desc: 'Ausgewogene 110×110px Rastermatrix' },
    { id: 'spacious', label: 'Großzügig', desc: 'Weite 135×135px Freiräume' },
  ];

  const currentScale = settings.uiScalePercent || (settings.uiScale === 'compact' ? 80 : settings.uiScale === 'large' ? 120 : 100);

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Bildschirm & Skalierung</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Passe die virtuelle UI-Skalierung, den Schreibtisch-Rasterabstand und die Farbtemperatur an.
        </p>
      </div>

      {/* 1. UI Scaling */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
            Virtuelle UI-Skalierung
          </label>
          <span className="font-mono text-xs text-purple-400 font-bold">{currentScale}%</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {scaleOptions.map((opt) => {
            const isSelected = currentScale === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  updateSettings({
                    uiScalePercent: opt.value,
                    uiScale: opt.value <= 85 ? 'compact' : opt.value >= 115 ? 'large' : 'default',
                  });
                  sounds.playToggle();
                }}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] border-white/30 ring-1'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04] text-zinc-400'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <span className={`text-xs font-semibold block ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {opt.value}%
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5 block truncate">{opt.label.split(' ')[1] || ''}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Desktop Grid Spacing */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Desktop-Rasterabstand (Grid Spacing)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {gridSpacings.map((sp) => {
            const isSelected = (settings.desktopGridSpacing || 'comfortable') === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => {
                  updateSettings({ desktopGridSpacing: sp.id as any });
                  sounds.playClick();
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] border-white/30 ring-1'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Grid className="w-4 h-4" style={{ color: isSelected ? accentConfig.text : undefined }} />
                  <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {sp.label}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 block">{sp.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Icon Size */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Icon-Größe auf dem Desktop
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'small', label: 'Klein (36px)' },
            { id: 'medium', label: 'Mittel (44px)' },
            { id: 'large', label: 'Groß (54px)' },
          ].map((sz) => {
            const isSelected = (settings.desktopIconSize || 'medium') === sz.id;
            return (
              <button
                key={sz.id}
                onClick={() => {
                  updateSettings({ desktopIconSize: sz.id as any });
                  sounds.playClick();
                }}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] border-white/30 text-white'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04] text-zinc-400'
                }`}
              >
                <span className="text-xs font-medium">{sz.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Brightness & Night Shift */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Helligkeit & Nachtmodus
        </label>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              Bildschirm-Helligkeit
            </span>
            <span className="font-mono text-zinc-400">{settings.brightness ?? 100}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="120"
            value={settings.brightness ?? 100}
            onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Moon className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Night Shift (Blaulichtfilter)</span>
              <span className="text-[11px] text-zinc-400">Schont die Augen bei Dunkelheit mit warmen Lichttönen</span>
            </div>
          </div>
          <button
            onClick={() => {
              updateSettings({ nightShift: !settings.nightShift });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.nightShift ? 'bg-amber-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.nightShift ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
