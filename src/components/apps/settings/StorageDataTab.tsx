import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../../context/OSContext';
import { HardDrive, Download, Upload, Trash2, RefreshCw, AlertTriangle, Check, FileText, Database, Layers } from 'lucide-react';

export const StorageDataTab: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUser,
    files,
    users,
    sounds,
    addNotification,
    resetSetupState,
  } = useOS();

  const [storageStats, setStorageStats] = useState<{
    usedKb: number;
    maxKb: number;
    itemsCount: number;
    details: Array<{ key: string; label: string; sizeKb: number }>;
  }>({ usedKb: 0, maxKb: 5120, itemsCount: 0, details: [] });

  const [showFactoryConfirm, setShowFactoryConfirm] = useState(false);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const fileImportRef = useRef<HTMLInputElement | null>(null);

  const calculateStorage = () => {
    try {
      let totalLength = 0;
      const detailsList: Array<{ key: string; label: string; sizeKb: number }> = [];

      const friendlyLabels: Record<string, string> = {
        obsidian_files: 'Dateien & Dokumente',
        obsidian_settings: 'System-Einstellungen',
        obsidian_users: 'Benutzer-Profile',
        obsidian_notes: 'Notizen & Dokumente',
        obsidian_game_saves: 'Spielstände & Highscores',
        obsidian_custom_apps: 'Installierte KI-Apps',
        obsidian_recent_apps: 'App-Verlauf',
        obsidian_icon_positions: 'Desktop-Icon Positionen',
        obsidian_cloud_sync: 'Cloud-Sync Metadaten',
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          const len = key.length + val.length;
          totalLength += len;
          const sizeKb = Math.round((len * 2) / 1024 * 10) / 10;
          detailsList.push({
            key,
            label: friendlyLabels[key] || key,
            sizeKb: Math.max(0.1, sizeKb),
          });
        }
      }

      const usedKb = Math.round((totalLength * 2) / 1024 * 10) / 10;
      detailsList.sort((a, b) => b.sizeKb - a.sizeKb);

      setStorageStats({
        usedKb,
        maxKb: 5120, // 5MB standard LocalStorage quota
        itemsCount: localStorage.length,
        details: detailsList,
      });
    } catch {}
  };

  useEffect(() => {
    calculateStorage();
  }, [files, settings, users]);

  // Export full system state as .json
  const handleExportJson = () => {
    try {
      const exportObject: Record<string, any> = {
        version: 'ObsidianOS-v3.4',
        exportedAt: new Date().toISOString(),
        user: currentUser?.username,
        data: {},
      };

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('obsidian_')) {
          try {
            exportObject.data[key] = JSON.parse(localStorage.getItem(key)!);
          } catch {
            exportObject.data[key] = localStorage.getItem(key);
          }
        }
      }

      const blob = new Blob([JSON.stringify(exportObject, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `obsidian-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      sounds.playSuccess();
      addNotification('Backup exportiert', 'Systemzustand erfolgreich als JSON heruntergeladen.', 'success');
    } catch {
      addNotification('Export fehlgeschlagen', 'Fehler beim Erstellen der JSON-Datei.', 'error');
    }
  };

  // Import JSON configuration
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && (json.data || json.version)) {
          setImportPreview(json);
        } else {
          addNotification('Ungültiges Backup', 'Die Datei enthält keine gültigen ObsidianOS-Daten.', 'error');
        }
      } catch {
        addNotification('Fehler beim Lesen', 'JSON-Format ist beschädigt.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const applyImport = () => {
    if (!importPreview?.data) return;
    try {
      Object.entries(importPreview.data).forEach(([key, val]) => {
        if (typeof val === 'object') {
          localStorage.setItem(key, JSON.stringify(val));
        } else {
          localStorage.setItem(key, String(val));
        }
      });
      sounds.playSuccess();
      addNotification('Import erfolgreich', 'Systemdaten wiederhergestellt. Lade neu...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch {
      addNotification('Importfehler', 'Konnte Daten nicht in Speicher schreiben.', 'error');
    }
  };

  // Clear single app data
  const handleClearKey = (key: string, label: string) => {
    try {
      localStorage.removeItem(key);
      calculateStorage();
      sounds.playClose();
      addNotification('Daten gelöscht', `Speicher für "${label}" wurde bereinigt.`, 'info');
    } catch {}
  };

  // Factory Reset
  const handleFactoryReset = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('obsidian_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      resetSetupState();
      sounds.playClose();
      window.location.reload();
    } catch {}
  };

  const percentUsed = Math.min(100, Math.round((storageStats.usedKb / storageStats.maxKb) * 100));

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Speicher & Datensicherung</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Übersicht über den lokalen Speicherverbrauch, Backups und System-Wiederherstellung.
        </p>
      </div>

      {/* 1. Storage Bar Visualizer */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-zinc-200">LocalStorage & IndexedDB Belegung</span>
          </div>
          <span className="font-mono text-zinc-400">
            {storageStats.usedKb} KB / {storageStats.maxKb} KB ({percentUsed}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${Math.max(2, percentUsed)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
          <span>{storageStats.itemsCount} Datenpakete im Cache</span>
          <span>5.0 MB Kontingent verfügbar</span>
        </div>
      </div>

      {/* 2. Format / Clear Individual Apps */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          App-Daten & Speicher verwalten
        </label>

        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {storageStats.details.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs hover:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Database className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="text-zinc-200 font-medium truncate">{item.label}</span>
                <span className="text-[10px] text-zinc-500 font-mono">({item.sizeKb} KB)</span>
              </div>
              <button
                onClick={() => handleClearKey(item.key, item.label)}
                className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                title="Diesen Datenspeicher leeren"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Backup & Export / Import */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Backup & System-Export
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Systemzustand als .json exportieren</span>
          </button>

          <input
            type="file"
            ref={fileImportRef}
            onChange={handleFileSelect}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            onClick={() => fileImportRef.current?.click()}
            className="flex items-center justify-center gap-2 p-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-white transition-all shadow-sm"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            <span>JSON-Konfiguration importieren</span>
          </button>
        </div>

        {/* Import Preview Modal / Banner */}
        {importPreview && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-purple-300">
              <span>Backup bereit zum Wiederherstellen:</span>
              <span>{importPreview.version || 'Gültige Konfiguration'}</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Enthält {Object.keys(importPreview.data || {}).length} Systemmodule. Möchtest du diese Daten jetzt einspielen?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setImportPreview(null)}
                className="px-3 py-1 rounded bg-black/40 text-zinc-400 hover:text-white"
              >
                Abbrechen
              </button>
              <button
                onClick={applyImport}
                className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-sm"
              >
                Import anwenden & Neustarten
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Factory Reset */}
      <div className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-400 block">Kompletter Werks-Reset</span>
            <span className="text-[11px] text-zinc-400">
              Löscht alle lokalen Daten, Spielstände, Dateien und Einstellungen unwiderruflich.
            </span>
          </div>
          <button
            onClick={() => setShowFactoryConfirm(true)}
            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-xs font-medium text-red-300 transition-colors"
          >
            Zurücksetzen...
          </button>
        </div>

        {showFactoryConfirm && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-xs space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Bist du absolut sicher?</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              Alle nicht in der Cloud synchronisierten Dokumente gehen verloren. Der Einrichtungsassistent startet erneut.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setShowFactoryConfirm(false)}
                className="px-3 py-1 rounded bg-black/50 text-zinc-300 hover:text-white"
              >
                Abbrechen
              </button>
              <button
                onClick={handleFactoryReset}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold shadow-sm"
              >
                Ja, alles löschen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
