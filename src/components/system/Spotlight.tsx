import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { SpotlightItem, AppId } from '../../types';
import { APPS_REGISTRY, ACCENT_COLORS } from '../../config/themeConfig';
import {
  Search,
  Folder,
  Settings,
  Calculator,
  Globe,
  Terminal,
  Lock,
  RefreshCw,
  Sliders,
  Palette,
  Users,
  Shield,
  FileText,
  Sparkles,
  Command,
  ArrowRight,
  Grid3X3,
  Gamepad2,
  Youtube,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';

export const Spotlight: React.FC = () => {
  const {
    isSpotlightOpen,
    closeSpotlight,
    openApp,
    files,
    lockScreen,
    triggerSync,
    updateSettings,
    accentConfig,
  } = useOS();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSpotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSpotlightOpen]);

  // Compute math evaluation if query resembles calculation
  const mathResult = useMemo(() => {
    if (!query.trim() || !/^[0-9+\-*/().,% sqrtpisincotale^ ]+$/.test(query.trim())) {
      return null;
    }
    try {
      let sanitized = query
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/pi/g, 'Math.PI')
        .replace(/\^/g, '**');
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return Math.round(res * 1000000) / 1000000;
      }
    } catch {}
    return null;
  }, [query]);

  // Build searchable items list
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: SpotlightItem[] = [];

    // 1. Math Calculation Result
    if (mathResult !== null) {
      items.push({
        id: 'math-calc',
        title: `= ${mathResult}`,
        subtitle: `Ergebnis für "${query}" in die Zwischenablage kopieren`,
        category: 'Rechner',
        icon: 'Calculator',
        action: () => {
          navigator.clipboard?.writeText(String(mathResult));
          closeSpotlight();
        },
      });
    }

    // 2. Apps
    APPS_REGISTRY.forEach((app) => {
      if (!q || app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q)) {
        items.push({
          id: `app-${app.id}`,
          title: app.name,
          subtitle: app.description,
          category: 'App',
          icon: app.iconName,
          action: () => {
            openApp(app.id);
            closeSpotlight();
          },
        });
      }
    });

    // 3. Virtual Files
    files.forEach((file) => {
      if (q && (file.name.toLowerCase().includes(q) || file.content.toLowerCase().includes(q))) {
        items.push({
          id: `file-${file.id}`,
          title: file.name,
          subtitle: file.type === 'folder' ? 'Ordner im Dateisystem' : `Datei (${file.size} Bytes)`,
          category: 'Datei',
          icon: file.type === 'folder' ? 'Folder' : 'FileText',
          action: () => {
            openApp('files');
            closeSpotlight();
          },
        });
      }
    });

    // 4. System Settings Items
    const settingsItems: SpotlightItem[] = [
      {
        id: 'set-wallpapers',
        title: 'Hintergrundbilder & Wallpapers',
        subtitle: 'Minimalistische Dark Wallpapers anpassen',
        category: 'Einstellung',
        icon: 'Palette',
        action: () => {
          openApp('settings');
          closeSpotlight();
        },
      },
      {
        id: 'set-accents',
        title: 'Akzentfarben (Violett-Palette)',
        subtitle: 'Amethyst, Lavendel und Obsidian-Violett Farbtöne wählen',
        category: 'Einstellung',
        icon: 'Sparkles',
        action: () => {
          openApp('settings');
          closeSpotlight();
        },
      },
      {
        id: 'set-profiles',
        title: 'Benutzerprofile verwalten',
        subtitle: 'Profile anlegen, wechseln oder Berechtigungen anpassen',
        category: 'Einstellung',
        icon: 'Users',
        action: () => {
          openApp('settings');
          closeSpotlight();
        },
      },
      {
        id: 'set-cloud',
        title: 'Verschlüsselte Cloud-Synchronisation',
        subtitle: 'AES-256-GCM Zero-Knowledge Einstellungen & Backup',
        category: 'Einstellung',
        icon: 'Shield',
        action: () => {
          openApp('settings');
          closeSpotlight();
        },
      },
    ];

    settingsItems.forEach((si) => {
      if (!q || si.title.toLowerCase().includes(q) || si.subtitle.toLowerCase().includes(q)) {
        items.push(si);
      }
    });

    // 5. System Actions
    const actions: SpotlightItem[] = [
      {
        id: 'act-sync',
        title: 'Cloud jetzt synchronisieren',
        subtitle: 'Verschlüsseltes Backup sofort an Cloud-Server senden',
        category: 'Aktion',
        icon: 'RefreshCw',
        action: () => {
          triggerSync();
          closeSpotlight();
        },
      },
      {
        id: 'act-lock',
        title: 'Bildschirm sperren',
        subtitle: 'Sitzung beenden und Lockscreen aktivieren',
        category: 'Aktion',
        icon: 'Lock',
        action: () => {
          lockScreen();
          closeSpotlight();
        },
      },
    ];

    actions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q)) {
        items.push(act);
      }
    });

    return items;
  }, [query, mathResult, files, openApp, closeSpotlight, lockScreen, triggerSync]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      sounds.playClick();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      sounds.playClick();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSpotlight();
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Settings':
        return <Settings className="w-4 h-4 text-purple-400" />;
      case 'Folder':
        return <Folder className="w-4 h-4 text-purple-400" />;
      case 'Calculator':
        return <Calculator className="w-4 h-4 text-purple-400" />;
      case 'Globe':
        return <Globe className="w-4 h-4 text-purple-400" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4 text-purple-400" />;
      case 'Palette':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Users':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'Shield':
        return <Shield className="w-4 h-4 text-purple-400" />;
      case 'Lock':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'RefreshCw':
        return <RefreshCw className="w-4 h-4 text-emerald-400" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-4 h-4 text-purple-400" />;
      case 'Grid3X3':
        return <Grid3X3 className="w-4 h-4 text-purple-400" />;
      case 'Youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'Crown':
        return <Crown className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (!isSpotlightOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="spotlight-backdrop"
        onClick={closeSpotlight}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-24 select-none"
      >
        <motion.div
          id="spotlight-modal"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="w-full max-w-2xl bg-[#12121a]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px ${accentConfig.glow}`,
          }}
        >
          {/* Search Input Bar */}
          <div className="h-14 px-4 flex items-center gap-3 border-b border-[#27272a]/80 bg-[#161622]">
            <Search className="w-5 h-5 text-purple-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Spotlight Suche: Apps, Dateien, Einstellungen oder Rechenaufgabe..."
              className="w-full bg-transparent text-sm font-medium text-white placeholder-zinc-500 focus:outline-none"
            />
            <kbd className="px-2 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700 text-[10px] font-mono text-zinc-400">
              ESC
            </kbd>
          </div>

          {/* Search Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {results.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 text-xs">
                Keine Ergebnisse für "{query}" gefunden
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#222232] border border-purple-500/40 shadow-sm'
                        : 'hover:bg-[#181824] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1a1a26] border border-[#2e2e3e] flex items-center justify-center">
                        {getIcon(item.icon)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-2">
                          {item.title}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-normal">
                            {item.category}
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-400 line-clamp-1">{item.subtitle}</p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] text-purple-300 font-mono flex items-center gap-1">
                        Öffnen <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="h-8 bg-[#0e0e14] border-t border-[#27272a]/60 px-4 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
            <span>↑↓ Navigation</span>
            <span>↵ Auswählen</span>
            <span>Obsidian Core Index</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
