import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { WALLPAPERS } from '../../config/themeConfig';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Download,
  Upload,
  Check,
} from 'lucide-react';

interface MediaItem {
  id: string;
  title: string;
  category: string;
  gradient?: string;
  url?: string;
  wallpaperId?: string;
}

export const GalleryApp: React.FC = () => {
  const { settings, updateSettings, accentConfig, addNotification } = useOS();

  const [mediaList, setMediaList] = useState<MediaItem[]>([
    {
      id: 'media-obsidian',
      title: 'Obsidian Deep Universe',
      category: 'Hintergrundbilder',
      gradient: 'radial-gradient(circle at center, #2e1045 0%, #11071c 50%, #08080a 100%)',
      wallpaperId: 'obsidian-deep',
    },
    {
      id: 'media-emerald',
      title: 'Cyberpunk Emerald Matrix',
      category: 'Hintergrundbilder',
      gradient: 'radial-gradient(circle at 60% 40%, #064e3b 0%, #022c22 45%, #050b08 100%)',
      wallpaperId: 'emerald-synth',
    },
    {
      id: 'media-pacific',
      title: 'Deep Pacific Abyss',
      category: 'Hintergrundbilder',
      gradient: 'radial-gradient(circle at 40% 30%, #0c4a6e 0%, #082f49 50%, #030712 100%)',
      wallpaperId: 'ocean-abyss',
    },
    {
      id: 'media-sunset',
      title: 'Neo-Tokyo Sunset',
      category: 'Hintergrundbilder',
      gradient: 'linear-gradient(145deg, #451a03 0%, #1f1024 45%, #09090b 100%)',
      wallpaperId: 'sunset-dusk',
    },
    {
      id: 'media-crimson',
      title: 'Crimson Velvet Nebula',
      category: 'Hintergrundbilder',
      gradient: 'radial-gradient(ellipse at center, #450a0a 0%, #180505 55%, #080303 100%)',
      wallpaperId: 'crimson-noir',
    },
    {
      id: 'media-golden',
      title: 'Solar Eclipse Gold',
      category: 'Hintergrundbilder',
      gradient: 'radial-gradient(circle at top right, #422006 0%, #1c1305 45%, #0a0a0c 100%)',
      wallpaperId: 'golden-aurora',
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>(mediaList[0].id);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const selectedItem = mediaList.find((m) => m.id === selectedId) || mediaList[0];

  const handleSetWallpaper = (item: MediaItem) => {
    if (item.wallpaperId) {
      updateSettings({ wallpaper: item.wallpaperId as any });
      addNotification('Hintergrundbild geändert', `"${item.title}" als Wallpaper aktiv.`, 'success', 'Personalisierung');
    }
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const newMedia: MediaItem = {
        id: 'upload-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        category: 'Eigene Bilder',
        url: reader.result as string,
      };
      setMediaList([newMedia, ...mediaList]);
      setSelectedId(newMedia.id);
      addNotification('Bild importiert', `"${file.name}" zur Galerie hinzugefügt.`, 'success', 'Galerie');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div id="gallery-app-root" className="h-full flex flex-col bg-[#0b0b10] text-zinc-200 select-none overflow-hidden">
      {/* Top Header Controls */}
      <div className="h-11 border-b border-[#27272a]/60 px-4 flex items-center justify-between bg-[#13131b]/90">
        <div className="flex items-center gap-2 text-xs font-semibold">
          <ImageIcon className="w-4 h-4 text-purple-400" style={{ color: accentConfig.primary }} />
          <span>Galerie & Wallpaper ({mediaList.length})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
            title="Verkleinern"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-zinc-400 font-mono w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
            title="Vergrößern"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300"
            title="Drehen"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-5 bg-white/10 mx-1" />

          {/* Set as Wallpaper */}
          {selectedItem.wallpaperId && (
            <button
              onClick={() => handleSetWallpaper(selectedItem)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600/80 hover:bg-purple-600 text-white flex items-center gap-1.5 transition-all shadow-md"
              style={{ backgroundColor: accentConfig.primary }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Als Wallpaper</span>
            </button>
          )}

          {/* Upload custom image */}
          <label className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer flex items-center gap-1 text-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
          </label>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#07070a] overflow-hidden relative">
          <div
            className="w-full max-w-2xl aspect-video rounded-2xl shadow-2xl border border-white/10 transition-transform duration-300 overflow-hidden flex items-center justify-center relative"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              background: selectedItem.gradient || 'transparent',
            }}
          >
            {selectedItem.url ? (
              <img
                src={selectedItem.url}
                alt={selectedItem.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <span className="text-xl font-bold text-white/90 drop-shadow-md">
                  {selectedItem.title}
                </span>
                <span className="text-xs text-white/60 mt-1">{selectedItem.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Sidebar */}
        <div className="w-56 border-l border-[#27272a]/60 bg-[#101017]/80 p-3 overflow-y-auto space-y-2.5">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
            Galerie ({mediaList.length})
          </span>
          {mediaList.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`p-1.5 rounded-xl cursor-pointer border transition-all ${
                  isSelected
                    ? 'border-purple-500/60 bg-white/10 ring-1 ring-purple-500/30'
                    : 'border-white/5 hover:border-white/20 bg-black/30'
                }`}
              >
                <div
                  className="w-full h-20 rounded-lg overflow-hidden border border-white/10 flex items-center justify-center relative"
                  style={{ background: item.gradient || '#151520' }}
                >
                  {item.url && <img src={item.url} alt={item.title} className="w-full h-full object-cover" />}
                </div>
                <div className="mt-1.5 px-1 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-200 truncate">{item.title}</span>
                  {item.wallpaperId === settings.wallpaper && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Aktives Wallpaper" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
