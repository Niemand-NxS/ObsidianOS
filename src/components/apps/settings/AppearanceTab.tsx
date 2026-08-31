import React from 'react';
import { useOS } from '../../../context/OSContext';
import { ACCENT_COLORS } from '../../../config/themeConfig';
import { AccentColorId } from '../../../types';
import { Sun, Moon, Sparkles, Check, Droplets, Layout, ShieldCheck } from 'lucide-react';

export const AppearanceTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds } = useOS();

  const themeModes = [
    { id: 'dark', label: 'Dunkel (Dark)', icon: Moon, desc: 'Tiefes Obsidian-Schwarz, OLED optimiert' },
    { id: 'light', label: 'Hell (Light)', icon: Sun, desc: 'Klarer, eleganter heller Tagesmodus' },
    { id: 'glassy', label: 'Glassy (Milchglas)', icon: Droplets, desc: 'Ultra-transparenter Frostglas-Look' },
    { id: 'auto', label: 'Automatisch', icon: Sparkles, desc: 'Passt sich der System-Uhrzeit an' },
  ];

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Darstellung & Theme</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Passe das Farbschema (Dunkel, Hell, Glassy), Akzentfarben, Fenstereinstellungen und Transparenz an.
        </p>
      </div>

      {/* 1. Theme Mode Selection */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Erscheinungsbild-Modus
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {themeModes.map((m) => {
            const Icon = m.icon;
            const isSelected = (settings.themeMode || 'dark') === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  updateSettings({ themeMode: m.id as any });
                  sounds.playToggle();
                }}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] border-white/30 shadow-md ring-1'
                    : 'bg-black/30 border-white/[0.05] hover:bg-white/[0.04] text-zinc-400'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Icon className="w-4 h-4" style={{ color: isSelected ? accentConfig.text : undefined }} />
                  {isSelected && <Check className="w-3.5 h-3.5" style={{ color: accentConfig.text }} />}
                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {m.label}
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Glassy Opacity & Blur Settings */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Transparenz & Glas-Effekte</span>
            <span className="text-[11px] text-zinc-400">
              Echtzeit-Hintergrundunschärfe und Deckkraft für Fenster, Menüs und Panels.
            </span>
          </div>
          <button
            onClick={() => {
              const next = !(settings.glassBlurEnabled !== false);
              updateSettings({ glassBlurEnabled: next });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.glassBlurEnabled !== false ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{
              backgroundColor: settings.glassBlurEnabled !== false ? accentConfig.primary : undefined,
            }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.glassBlurEnabled !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Blur Slider */}
        {settings.glassBlurEnabled !== false && (
          <div className="pt-2 border-t border-white/[0.05] space-y-2">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Unschärfestärke (Blur)</span>
              <span className="font-mono text-purple-400 font-bold">{settings.glassBlur ?? 24}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="2"
              value={settings.glassBlur ?? 24}
              onChange={(e) => updateSettings({ glassBlur: Number(e.target.value) })}
              className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        )}

        {/* Glass Opacity Slider (Relevant especially for Glassy Mode) */}
        <div className="pt-2 border-t border-white/[0.05] space-y-2">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>Glassy Deckkraft (Opacity)</span>
            <span className="font-mono text-purple-400 font-bold">{settings.glassOpacity ?? 65}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="95"
            step="5"
            value={settings.glassOpacity ?? 65}
            onChange={(e) => updateSettings({ glassOpacity: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="text-[10px] text-zinc-500 block">
            Niedrigere Werte = stärkere Durchsicht auf das Hintergrundbild oder den Shader.
          </span>
        </div>
      </div>

      {/* 3. Window Controls Placement (3 Dots Right vs Left) */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Fenster-Bedienelemente Position (3 Punkte)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              id: 'right',
              title: 'Rechts (Standard)',
              desc: 'Schließen, Minimieren & Vollbild auf der rechten Seite der Titelleiste.',
            },
            {
              id: 'left',
              title: 'Links (macOS-Stil)',
              desc: 'Bedienelemente auf der linken Seite der Titelleiste.',
            },
          ].map((pos) => {
            const isSelected = (settings.windowButtonsPosition || 'right') === pos.id;
            return (
              <button
                key={pos.id}
                onClick={() => {
                  updateSettings({ windowButtonsPosition: pos.id as any });
                  sounds.playClick();
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] border-white/30 shadow-sm ring-1'
                    : 'bg-black/20 border-white/[0.05] hover:bg-white/[0.04]'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {pos.title}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </div>
                <span className="text-[10px] text-zinc-400 block">{pos.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Accent Color Picker */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          System-Akzentfarbe
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(ACCENT_COLORS).map(([colorId, colorDef]) => {
            const isSelected = settings.accentColor === colorId;
            return (
              <button
                key={colorId}
                onClick={() => {
                  updateSettings({ accentColor: colorId as AccentColorId });
                  sounds.playClick();
                }}
                className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-white/[0.1] border-white/30 shadow-sm'
                    : 'bg-black/20 border-white/[0.04] hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: colorDef.primary }}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </div>
                <span className="text-xs text-zinc-200 font-medium truncate">{colorDef.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Window Corner Radius */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex justify-between text-xs text-zinc-300">
          <div>
            <span className="font-semibold text-zinc-200 block">Fenster-Eckenradius</span>
            <span className="text-[11px] text-zinc-400">Abrundung von Fenstern und Dialogfeldern</span>
          </div>
          <span className="font-mono text-purple-400 font-bold">{settings.windowRadius ?? 16}px</span>
        </div>
        <input
          type="range"
          min="4"
          max="28"
          step="2"
          value={settings.windowRadius ?? 16}
          onChange={(e) => updateSettings({ windowRadius: Number(e.target.value) })}
          className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>
    </div>
  );
};
