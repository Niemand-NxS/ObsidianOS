import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { AppMetadata } from '../../types';
import {
  Play,
  Settings,
  Grid,
  Info,
  Activity,
  RotateCcw,
  Sparkles,
  X,
  ExternalLink,
  Paintbrush,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IconPickerModal } from '../common/IconPickerModal';

interface AppQuickSettingsProps {
  app: AppMetadata;
  position: { x: number; y: number };
  onClose: () => void;
  onAlignToGrid: () => void;
}

export const AppQuickSettings: React.FC<AppQuickSettingsProps> = ({
  app,
  position,
  onClose,
  onAlignToGrid,
}) => {
  const { openApp, accentConfig, addNotification, settings, updateSettings, sounds } = useOS();
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);

  // Position popover safely within screen bounds
  const popoverWidth = 240;
  const left = Math.min(window.innerWidth - popoverWidth - 20, Math.max(16, position.x + 80));
  const top = Math.min(window.innerHeight - 340, Math.max(48, position.y - 10));

  const handleLaunch = () => {
    openApp(app.id);
    onClose();
  };

  const handleResetData = () => {
    addNotification(
      `${app.name} Zurückgesetzt`,
      'Lokaler Cache und temporäre Anwendungsdaten wurden bereinigt.',
      'info',
      app.name
    );
    onClose();
  };

  const handleSelectIcon = (chosenIcon: string) => {
    const nextCustomIcons = {
      ...(settings.customAppIcons || {}),
      [app.id]: chosenIcon,
    };
    updateSettings({ customAppIcons: nextCustomIcons });
    sounds.playSuccess();
    addNotification(
      'Icon geändert',
      `Das Symbol für "${app.name}" wurde auf "${chosenIcon}" gesetzt.`,
      'success',
      app.name
    );
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 pointer-events-auto"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -6 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            left: `${left}px`,
            top: `${top}px`,
            borderColor: accentConfig.border,
            boxShadow: `0 20px 40px rgba(0,0,0,0.7), 0 0 25px ${accentConfig.glow}`,
          }}
          className="absolute w-60 rounded-2xl bg-[#14141e]/95 backdrop-blur-2xl border border-white/15 p-2 shadow-2xl text-zinc-200 select-none z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-2 pt-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-white">{app.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-400 font-mono">
                {app.category}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Action Items */}
          <div className="space-y-0.5 text-xs">
            <button
              onClick={handleLaunch}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left font-medium"
              style={{ color: accentConfig.text }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Anwendung öffnen</span>
            </button>

            <button
              onClick={() => {
                setIsIconPickerOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left text-zinc-300 hover:text-white"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Icon anpassen (120+ Icons)</span>
            </button>

            <button
              onClick={() => {
                onAlignToGrid();
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left text-zinc-300 hover:text-white"
            >
              <Grid className="w-3.5 h-3.5 text-purple-400" />
              <span>Am Raster ausrichten</span>
            </button>

            <button
              onClick={() => {
                openApp('settings');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left text-zinc-300 hover:text-white"
            >
              <Settings className="w-3.5 h-3.5 text-blue-400" />
              <span>Systemeinstellungen</span>
            </button>

            <button
              onClick={() => {
                openApp('monitor');
                onClose();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/10 transition-colors text-left text-zinc-300 hover:text-white"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ressourcen & Status</span>
            </button>

            <div className="h-[1px] bg-white/10 my-1" />

            <button
              onClick={handleResetData}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors text-left"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>App-Cache bereinigen</span>
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-2 pt-1.5 border-t border-white/10 px-2 text-[10px] text-zinc-500 truncate">
            {app.description}
          </div>
        </motion.div>
      </div>

      {/* Full Icon Picker Modal */}
      <AnimatePresence>
        {isIconPickerOpen && (
          <IconPickerModal
            isOpen={isIconPickerOpen}
            onClose={() => setIsIconPickerOpen(false)}
            onSelectIcon={handleSelectIcon}
            currentIcon={settings.customAppIcons?.[app.id] || app.iconName}
            title={`Icon für "${app.name}" wählen`}
          />
        )}
      </AnimatePresence>
    </>
  );
};
