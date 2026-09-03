import React from 'react';
import { useOS } from '../../../context/OSContext';
import {
  Layout,
  Maximize2,
  Sparkles,
  Clock,
  Move,
  Layers,
  Monitor,
  Plus,
  Check,
  Trash2,
  CloudSun,
  Cpu,
  StickyNote,
  Music,
  TrendingUp,
  Sliders,
  Mic,
  Eye,
  Zap,
  MousePointer,
} from 'lucide-react';
import { APPS_REGISTRY } from '../../../config/themeConfig';

export const WindowsDesktopTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    accentConfig,
    sounds,
    isAppOnDesktop,
    toggleAppOnDesktop,
  } = useOS();

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

      {/* 5. Desktop App Icons Management */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              <span>Schreibtisch-Apps verwalten (Desktop-Symbole)</span>
            </label>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Wähle, welche Anwendungen direkt auf deinem Schreibtisch angezeigt werden. Alle weiteren Apps sind jederzeit über Spotlight (⌘ + Leertaste) aufrufbar.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-lg">
            {(settings.desktopPinnedAppIds ?? ['files', 'browser', 'notes', 'gallery', 'music', 'settings']).length} aktiv
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {APPS_REGISTRY.map((app) => {
            const isPinned = isAppOnDesktop(app.id);
            return (
              <div
                key={app.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isPinned
                    ? 'bg-purple-500/10 border-purple-500/30 text-white'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isPinned ? 'bg-purple-600/30 text-purple-200' : 'bg-white/5 text-zinc-400'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-zinc-200 block truncate">
                      {app.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate">
                      {app.category}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    toggleAppOnDesktop(app.id);
                    sounds.playClick();
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
                    isPinned
                      ? 'bg-emerald-500/20 text-emerald-300 hover:bg-red-500/20 hover:text-red-300 border border-emerald-500/30 hover:border-red-500/30'
                      : 'bg-white/10 text-zinc-300 hover:bg-purple-600 hover:text-white border border-white/10'
                  }`}
                  title={isPinned ? 'Vom Schreibtisch entfernen' : 'Auf den Schreibtisch legen'}
                >
                  {isPinned ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Aktiv</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Hinzufügen</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Desktop-Widgets & Glance-Zentrale */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Desktop-Widgets & Glance-Zentrale</span>
            </label>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Aktiviere interaktive Widgets direkt auf deinem Schreibtisch für schnellen Zugriff auf Infos, Notizen und Musik.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              updateSettings({ desktopShowGlanceWidget: !(settings.desktopShowGlanceWidget !== false) });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              settings.desktopShowGlanceWidget !== false ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: settings.desktopShowGlanceWidget !== false ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.desktopShowGlanceWidget !== false ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {settings.desktopShowGlanceWidget !== false && (
          <div className="space-y-4 pt-3 border-t border-white/[0.05]">
            {/* Widget Auswahl */}
            <div>
              <span className="text-xs font-semibold text-zinc-200 block mb-2">Aktives Widget</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'clock', label: 'Uhr & Datum', desc: 'Uhrzeit, Datum & Wallpaper-Wechsler', icon: Clock },
                  { id: 'weather', label: 'Wetter-Station', desc: 'Temperatur & 3-Tage-Vorschau', icon: CloudSun },
                  { id: 'system', label: 'System-Monitor', desc: 'Live CPU, RAM & Speicher', icon: Cpu },
                  { id: 'notes', label: 'Schnellnotiz', desc: 'Direkter Desktop-Notizzettel', icon: StickyNote },
                  { id: 'player', label: 'Klanglandschaft', desc: 'Synthesizer & Lo-Fi Beats', icon: Music },
                  { id: 'crypto', label: 'Finanz-Ticker', desc: 'Bitcoin, Ethereum & Märkte', icon: TrendingUp },
                ].map((wt) => {
                  const Icon = wt.icon;
                  const isCur = (settings.desktopWidgetType || 'clock') === wt.id;
                  return (
                    <button
                      key={wt.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ desktopWidgetType: wt.id as any });
                        sounds.playClick();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCur
                          ? 'bg-purple-500/20 border-purple-500/40 text-white ring-1 ring-purple-500/30'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isCur ? 'text-purple-400' : 'text-zinc-500'}`} />
                        {isCur && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <span className="text-xs font-semibold block text-zinc-200">{wt.label}</span>
                      <span className="text-[10px] text-zinc-500 block leading-snug mt-0.5">{wt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Position Presets */}
            <div>
              <span className="text-xs font-semibold text-zinc-200 block mb-2">Standard-Positionierung</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'bottom-left',
                    label: 'Unten links',
                    badge: 'Standard',
                    getPos: () => ({
                      x: 28,
                      y: typeof window !== 'undefined' ? Math.max(100, window.innerHeight - 220) : 560,
                    }),
                  },
                  {
                    id: 'top-right',
                    label: 'Oben rechts',
                    badge: null,
                    getPos: () => ({
                      x: typeof window !== 'undefined' ? Math.max(40, window.innerWidth - 320) : 880,
                      y: 44,
                    }),
                  },
                  {
                    id: 'top-left',
                    label: 'Oben links',
                    badge: null,
                    getPos: () => ({ x: 28, y: 44 }),
                  },
                  {
                    id: 'bottom-right',
                    label: 'Unten rechts',
                    badge: null,
                    getPos: () => ({
                      x: typeof window !== 'undefined' ? Math.max(40, window.innerWidth - 320) : 880,
                      y: typeof window !== 'undefined' ? Math.max(100, window.innerHeight - 220) : 560,
                    }),
                  },
                ].map((pos) => {
                  const isCurrentBottomLeft =
                    pos.id === 'bottom-left' &&
                    (!settings.desktopGlancePosition ||
                      (settings.desktopGlancePosition.x <= 80 && settings.desktopGlancePosition.y > 300));
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => {
                        updateSettings({ desktopGlancePosition: pos.getPos() });
                        sounds.playClick();
                      }}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        isCurrentBottomLeft
                          ? 'bg-purple-500/20 border-purple-500/40 text-white'
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-semibold block">{pos.label}</span>
                      {pos.badge && (
                        <span className="text-[9px] text-purple-300 font-mono block mt-0.5">{pos.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5">
                Tipp: Du kannst das Widget auch jederzeit per Mauszeiger an beliebige Stellen ziehen.
              </p>
            </div>

            {/* Quick Note Editor if note widget is active */}
            {settings.desktopWidgetType === 'notes' && (
              <div className="pt-2 border-t border-white/[0.05]">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Inhalt der Schnellnotiz
                </label>
                <textarea
                  value={settings.desktopQuickNoteText || ''}
                  onChange={(e) => updateSettings({ desktopQuickNoteText: e.target.value })}
                  placeholder="Hier Notiz eingeben..."
                  rows={2}
                  className="w-full text-xs p-2 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. Schreibtisch-Symbole & Raster-Ergonomie */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          <span>Schreibtisch-Symbole & Raster-Ergonomie</span>
        </label>

        {/* Icon Size */}
        <div>
          <span className="text-xs font-semibold text-zinc-200 block mb-2">Symbolgröße</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'small', label: 'Kompakt' },
              { id: 'medium', label: 'Standard (Mittel)' },
              { id: 'large', label: 'Groß' },
            ].map((s) => {
              const isCur = (settings.desktopIconSize || 'medium') === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    updateSettings({ desktopIconSize: s.id as any });
                    sounds.playClick();
                  }}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    isCur
                      ? 'bg-purple-500/20 border-purple-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid Spacing */}
        <div className="pt-3 border-t border-white/[0.05]">
          <span className="text-xs font-semibold text-zinc-200 block mb-2">Raster-Abstand</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'compact', label: 'Dicht' },
              { id: 'comfortable', label: 'Komfortabel' },
              { id: 'spacious', label: 'Weitläufig' },
            ].map((sp) => {
              const isCur = (settings.desktopGridSpacing || 'comfortable') === sp.id;
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => {
                    updateSettings({ desktopGridSpacing: sp.id as any });
                    sounds.playClick();
                  }}
                  className={`p-2 rounded-xl border text-xs font-medium transition-all ${
                    isCur
                      ? 'bg-purple-500/20 border-purple-500/40 text-white'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels & Click Mode */}
        <div className="pt-3 border-t border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">App-Namen anzeigen</span>
              <span className="text-[11px] text-zinc-400">Beschriftung unter den Schreibtisch-Symbolen</span>
            </div>
            <button
              type="button"
              onClick={() => {
                updateSettings({ desktopShowIconLabels: !(settings.desktopShowIconLabels !== false) });
                sounds.playToggle();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.desktopShowIconLabels !== false ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
              style={{ backgroundColor: settings.desktopShowIconLabels !== false ? accentConfig.primary : undefined }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.desktopShowIconLabels !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Doppelklick zum Öffnen</span>
              <span className="text-[11px] text-zinc-400">Desktop-Apps erfordern Doppelklick (wie in macOS/Windows)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                updateSettings({
                  desktopIconClickMode: settings.desktopIconClickMode === 'single' ? 'double' : 'single',
                });
                sounds.playToggle();
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.desktopIconClickMode !== 'single' ? 'bg-purple-600' : 'bg-zinc-700'
              }`}
              style={{ backgroundColor: settings.desktopIconClickMode !== 'single' ? accentConfig.primary : undefined }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.desktopIconClickMode !== 'single' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 8. Schreibtisch-Atmosphäre & Hintergrundfilter */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>Hintergrund-Atmosphäre (Blur & Dimming)</span>
        </label>

        {/* Blur slider */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-300 font-medium">Hintergrund-Unschärfe (Blur)</span>
            <span className="font-mono text-purple-300">{settings.desktopBlur || 0} px</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            value={settings.desktopBlur || 0}
            onChange={(e) => updateSettings({ desktopBlur: parseInt(e.target.value, 10) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Dimming slider */}
        <div className="pt-3 border-t border-white/[0.05]">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-zinc-300 font-medium">Hintergrund-Abdunklung (Dimming)</span>
            <span className="font-mono text-purple-300">{settings.desktopDimming || 0}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={75}
            value={settings.desktopDimming || 0}
            onChange={(e) => updateSettings({ desktopDimming: parseInt(e.target.value, 10) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>
      </div>

      {/* 9. Eingabehilfen & Barrierefreiheit */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block flex items-center gap-1.5">
          <Mic className="w-3.5 h-3.5 text-purple-400" />
          <span>Eingabehilfen & Diktierfunktion</span>
        </label>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Diktierfunktion</span>
            <span className="text-[11px] text-zinc-400">Sprachbefehle und Sprache-zu-Text im System</span>
          </div>
          <button
            type="button"
            onClick={() => {
              updateSettings({ soundEffects: !settings.soundEffects });
              sounds.playToggle();
            }}
            className="w-11 h-6 rounded-full transition-colors relative p-0.5 bg-purple-600"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <div className="w-5 h-5 rounded-full bg-white transition-transform translate-x-5" />
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Reduzierte Animationen</span>
            <span className="text-[11px] text-zinc-400">Schonende Bewegungsübergänge bei visueller Sensibilität</span>
          </div>
          <button
            type="button"
            onClick={() => {
              updateSettings({ animationsEnabled: !settings.animationsEnabled });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              !settings.animationsEnabled ? 'bg-purple-600' : 'bg-zinc-700'
            }`}
            style={{ backgroundColor: !settings.animationsEnabled ? accentConfig.primary : undefined }}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !settings.animationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
