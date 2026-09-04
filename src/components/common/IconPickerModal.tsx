import React, { useState, useMemo } from 'react';
import { ALL_APP_ICON_NAMES, AppIcon } from './AppIcon';
import { Search, X, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useOS } from '../../context/OSContext';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon?: string;
  title?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Alle' },
  { id: 'games', label: 'Spiele & Fun' },
  { id: 'media', label: 'Medien & Musik' },
  { id: 'tools', label: 'Werkzeuge' },
  { id: 'system', label: 'System' },
  { id: 'creative', label: 'Kreativ' },
];

const CATEGORY_MAP: Record<string, string[]> = {
  games: [
    'Gamepad2', 'Zap', 'Bomb', 'Rocket', 'Crosshair', 'Brain', 'Grid3X3', 'Crown', 'Dice5',
    'Swords', 'Trophy', 'Sparkles', 'Flame', 'Ghost', 'Skull', 'Target', 'Compass', 'Dices',
  ],
  media: [
    'Music', 'Music2', 'Image', 'Video', 'Camera', 'Film', 'Radio', 'Mic', 'Volume2',
    'Headphones', 'Disc', 'Tv', 'Youtube', 'Cast', 'Speaker',
  ],
  tools: [
    'Calculator', 'Terminal', 'Clock', 'Timer', 'Calendar', 'FileText', 'Folder', 'FolderOpen',
    'Download', 'Upload', 'Search', 'Filter', 'Sliders', 'Wrench', 'Hammer', 'Key', 'Lock',
    'Unlock', 'Share2', 'Copy', 'Trash2', 'Scissors', 'Code',
  ],
  system: [
    'Settings', 'Activity', 'Cpu', 'HardDrive', 'Wifi', 'Battery', 'Monitor', 'Smartphone',
    'Laptop', 'Server', 'Cloud', 'Shield', 'Power', 'RefreshCw', 'Maximize2', 'Layers',
  ],
  creative: [
    'Paintbrush', 'Palette', 'Eye', 'Sun', 'Moon', 'CloudSun', 'Sparkles', 'Star', 'Heart',
    'Book', 'BookOpen', 'GraduationCap', 'Feather', 'PenTool', 'Compass',
  ],
};

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
  currentIcon,
  title = 'Icon auswählen (Google Icon Library)',
}) => {
  const { sounds, accentConfig, effectiveTheme, effectiveGlassContrast } = useOS();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const isLightMode = effectiveTheme === 'light' || (effectiveTheme === 'glassy' && effectiveGlassContrast === 'dark');

  const filteredIcons = useMemo(() => {
    let list = ALL_APP_ICON_NAMES;
    if (activeCategory !== 'all' && CATEGORY_MAP[activeCategory]) {
      const allowed = new Set(CATEGORY_MAP[activeCategory]);
      list = list.filter((name) => allowed.has(name));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((name) => name.toLowerCase().includes(q));
    }
    return list;
  }, [search, activeCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
        className={`w-full max-w-xl max-h-[85vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden font-sans ${
          isLightMode ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#12121c] border-white/10 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${accentConfig.primary}25`, color: accentConfig.text }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">{title}</h2>
              <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                Wähle aus über 120 Vektor-Icons für deine App
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className={`p-1.5 rounded-xl border transition-colors ${
              isLightMode ? 'hover:bg-slate-100 border-slate-200 text-slate-500' : 'hover:bg-white/10 border-white/10 text-zinc-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className={`p-3 sm:p-4 border-b space-y-3 ${isLightMode ? 'border-slate-200 bg-slate-50/50' : 'border-white/5 bg-black/20'}`}>
          <div className="relative">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Icon suchen (z.B. Game, Cloud, Zap, Brain)..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${
                isLightMode
                  ? 'bg-white border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-900'
                  : 'bg-[#181826] border-white/10 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white'
              }`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  sounds.playClick();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'text-white shadow-sm'
                    : isLightMode
                    ? 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
                    : 'bg-white/5 border border-white/5 text-zinc-400 hover:text-white'
                }`}
                style={{
                  backgroundColor: activeCategory === cat.id ? accentConfig.primary : undefined,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Icons Grid */}
        <div className="flex-1 overflow-y-auto p-4 max-h-96">
          {filteredIcons.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              Kein Icon gefunden für &quot;{search}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {filteredIcons.map((iconName) => {
                const isSelected = currentIcon === iconName;
                return (
                  <button
                    key={iconName}
                    onClick={() => {
                      sounds.playClick();
                      onSelectIcon(iconName);
                      onClose();
                    }}
                    title={iconName}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all group relative ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500/50 shadow-lg scale-105'
                        : isLightMode
                        ? 'bg-slate-50 hover:bg-purple-50 border-slate-200 hover:border-purple-300'
                        : 'bg-[#181826]/70 hover:bg-[#202034] border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="transition-transform group-hover:scale-115">
                      <AppIcon
                        name={iconName}
                        className={`w-6 h-6 transition-colors ${
                          isSelected
                            ? 'text-purple-400'
                            : isLightMode
                            ? 'text-slate-700 group-hover:text-purple-600'
                            : 'text-zinc-300 group-hover:text-white'
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] truncate max-w-full font-medium ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                      {iconName}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 sm:p-4 border-t flex items-center justify-between text-xs ${isLightMode ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/30'}`}>
          <span className={isLightMode ? 'text-slate-500' : 'text-zinc-400'}>
            {filteredIcons.length} Icons verfügbar
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl border font-semibold ${
              isLightMode ? 'bg-white border-slate-200 hover:bg-slate-100' : 'bg-white/10 border-white/10 hover:bg-white/15'
            }`}
          >
            Schließen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
