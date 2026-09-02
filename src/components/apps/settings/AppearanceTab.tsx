import React from 'react';
import { useOS } from '../../../context/OSContext';
import { ACCENT_COLORS } from '../../../config/themeConfig';
import { AccentColorId } from '../../../types';
import {
  Sun,
  Moon,
  Sparkles,
  Check,
  Droplets,
  Layers,
  Sparkle,
} from 'lucide-react';

export const AppearanceTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    accentConfig,
    sounds,
    effectiveTheme,
  } = useOS();

  const themeModes = [
    {
      id: 'dark',
      label: 'Dunkel (Dark)',
      icon: Moon,
      desc: 'Tiefes Obsidian-Schwarz mit maximalem Kontrast',
    },
    {
      id: 'light',
      label: 'Hell (Light)',
      icon: Sun,
      desc: 'Klares, elegantes helles Design für alle Apps',
    },
    {
      id: 'glassy',
      label: 'Glassy (Milchglas)',
      icon: Droplets,
      desc: 'Transparenter Frostglas-Look mit Tiefenunschärfe',
    },
    {
      id: 'auto',
      label: 'Automatisch',
      icon: Sparkles,
      desc: 'Wechselt tagsüber zu Hell und abends zu Dunkel',
    },
  ];

  const iconStyles = [
    { id: 'auto', title: 'Standard (Auto)', desc: 'Folgt dem aktiven Farbschema' },
    { id: 'glassy', title: 'Milchglas', desc: 'Edles Frostglas mit Durchsicht' },
    { id: 'light', title: 'Hell', desc: 'Klares weißes Icon-Design' },
    { id: 'dark', title: 'Dunkel', desc: 'Tiefschwarzes Obsidian-Icon' },
    { id: 'colored', title: 'Akzentfarbe', desc: 'In System-Akzentfarbe leuchtend' },
  ];

  const iconRadii = [
    { id: 'rounded-lg', label: 'Leicht' },
    { id: 'rounded-xl', label: 'Standard' },
    { id: 'rounded-2xl', label: 'Squircle' },
    { id: 'rounded-full', label: 'Rund' },
  ];

  return (
    <div className="space-y-6 text-zinc-200">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Darstellung & Themes</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Wähle dein bevorzugtes Farbschema, deine Akzentfarbe und passe Fenster- sowie Icon-Effekte an.
        </p>
      </div>

      {/* 1. Farbschema (Theme Mode) */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          1. Farbschema (System & alle Apps)
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
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-white/[0.14] border-white/40 shadow-md ring-1'
                    : 'bg-black/30 border-white/[0.06] hover:bg-white/[0.05] text-zinc-400'
                }`}
                style={{ ringColor: isSelected ? accentConfig.primary : 'transparent' }}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Icon className="w-4 h-4" style={{ color: isSelected ? accentConfig.text : undefined }} />
                  {isSelected && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                  {m.label}
                </span>
                <span className="text-[10px] text-zinc-400 mt-1 leading-snug">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. System-Akzentfarbe */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          2. System-Akzentfarbe
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
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-white/[0.12] border-white/40 shadow-sm'
                    : 'bg-black/25 border-white/[0.05] hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: colorDef.primary }}
                >
                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span className="text-xs text-zinc-200 font-medium truncate">{colorDef.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Glas- & Fenster-Effekte */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          3. Glas- & Fenstereffekte
        </label>

        {/* Unschärfe (Blur) Regler */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>Hintergrund-Unschärfe (Blur)</span>
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

        {/* Glas Deckkraft (Opacity) Regler */}
        <div className="space-y-2 pt-2 border-t border-white/[0.05]">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>Transparenz / Deckkraft</span>
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
        </div>

        {/* Fenster-Eckenradius */}
        <div className="space-y-2 pt-2 border-t border-white/[0.05]">
          <div className="flex justify-between text-xs text-zinc-300">
            <span>Fenster-Eckenrundung</span>
            <span className="font-mono text-purple-400 font-bold">{settings.windowRadius ?? 16}px</span>
          </div>
          <input
            type="range"
            min="6"
            max="28"
            step="2"
            value={settings.windowRadius ?? 16}
            onChange={(e) => updateSettings({ windowRadius: Number(e.target.value) })}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        {/* Fensterknöpfe Position */}
        <div className="pt-2 border-t border-white/[0.05]">
          <span className="text-xs text-zinc-300 font-medium block mb-2">Fenster-Bedienelemente Position</span>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'right', label: 'Rechts (Standard)' },
              { id: 'left', label: 'Links (macOS-Stil)' },
            ].map((pos) => {
              const isSelected = (settings.windowButtonsPosition || 'right') === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => {
                    updateSettings({ windowButtonsPosition: pos.id as any });
                    sounds.playClick();
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    isSelected
                      ? 'bg-white/[0.12] border-white/40 text-white shadow-sm'
                      : 'bg-black/20 border-white/[0.05] text-zinc-400 hover:bg-white/[0.04]'
                  }`}
                >
                  {pos.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Desktop-Icons */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            4. Desktop-Icons
          </label>
        </div>

        {/* Icon-Stil */}
        <div className="space-y-2">
          <span className="text-xs text-zinc-300 font-medium block">Icon-Look</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {iconStyles.map((style) => {
              const isSelected = (settings.iconStyle || 'auto') === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => {
                    updateSettings({ iconStyle: style.id as any });
                    sounds.playClick();
                  }}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white/[0.12] border-white/40 shadow-sm'
                      : 'bg-black/20 border-white/[0.04] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className={`text-xs font-semibold block ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                    {style.title}
                  </span>
                  <span className="text-[9px] text-zinc-400 mt-0.5 block truncate">{style.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Eckenform & Glüheffekt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.05]">
          <div className="space-y-2">
            <span className="text-xs text-zinc-300 font-medium block">Icon-Form</span>
            <div className="grid grid-cols-4 gap-1.5">
              {iconRadii.map((r) => {
                const isSelected = (settings.iconRadius || 'rounded-2xl') === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      updateSettings({ iconRadius: r.id as any });
                      sounds.playClick();
                    }}
                    className={`py-1.5 px-2 text-center text-xs rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-purple-600/30 border-purple-400/50 text-white font-medium shadow-sm'
                        : 'bg-black/20 border-white/[0.04] text-zinc-400 hover:bg-white/[0.04]'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Icon-Glüheffekt</span>
              <span className="text-[10px] text-zinc-400">Sanfter Lichtschein um Icons</span>
            </div>
            <button
              onClick={() => {
                updateSettings({ iconGlow: !(settings.iconGlow !== false) });
                sounds.playToggle();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.iconGlow !== false ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
              style={{
                backgroundColor: settings.iconGlow !== false ? accentConfig.primary : undefined,
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.iconGlow !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
