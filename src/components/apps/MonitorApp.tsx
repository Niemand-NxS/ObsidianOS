import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Database,
  Shield,
  Layers,
  RefreshCw,
} from 'lucide-react';

export const MonitorApp: React.FC = () => {
  const { windows, files, users, cloudSync, accentConfig } = useOS();

  const [cpuUsage, setCpuUsage] = useState(14);
  const [ramUsage, setRamUsage] = useState(38);
  const [networkPing, setNetworkPing] = useState(24);
  const [history, setHistory] = useState<number[]>([12, 15, 14, 18, 22, 19, 14, 16, 15, 14]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newCpu = Math.floor(10 + Math.random() * 18);
      const newRam = Math.floor(36 + Math.random() * 6);
      const newPing = Math.floor(20 + Math.random() * 12);

      setCpuUsage(newCpu);
      setRamUsage(newRam);
      setNetworkPing(newPing);
      setHistory((prev) => [...prev.slice(1), newCpu]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const totalFilesSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div id="monitor-app-root" className="h-full flex flex-col bg-[#0b0b10] text-zinc-200 select-none overflow-y-auto p-4 gap-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" style={{ color: accentConfig.primary }} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            System & Firebase Aktivitätsmonitor
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Status: Optimal</span>
        </div>
      </div>

      {/* Metrics 3-Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* CPU Card */}
        <div className="bg-[#12121b] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-400" /> CPU Auslastung</span>
            <span className="font-mono text-white font-bold">{cpuUsage}%</span>
          </div>
          <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${cpuUsage}%`, backgroundColor: accentConfig.primary }}
            />
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-[#12121b] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-blue-400" /> RAM Speicher</span>
            <span className="font-mono text-white font-bold">{ramUsage}% (1.8 GB / 8 GB)</span>
          </div>
          <div className="mt-3 w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${ramUsage}%` }} />
          </div>
        </div>

        {/* Storage / Firebase Cloud */}
        <div className="bg-[#12121b] border border-white/10 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-400" /> Firebase Firestore</span>
            <span className="font-mono text-emerald-400 text-xs font-semibold">Verbunden</span>
          </div>
          <div className="mt-2 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Dateisystem: {files.length} Elemente</span>
            <span>{Math.round(totalFilesSize / 1024 * 10) / 10} KB</span>
          </div>
        </div>
      </div>

      {/* Active Tasks & Windows List */}
      <div className="bg-[#12121b] border border-white/10 rounded-xl p-3.5 flex flex-col flex-1">
        <span className="text-xs font-semibold text-zinc-300 mb-2.5">
          Aktive Prozesse & Fenster ({windows.filter((w) => w.isOpen).length})
        </span>
        <div className="overflow-y-auto space-y-1.5">
          {windows.map((win) => (
            <div
              key={win.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{win.title}</span>
                <span className="text-[10px] text-zinc-500 font-mono">PID: {win.id.slice(-6)}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                <span>{win.isMinimized ? 'Minimiert' : win.isMaximized ? 'Vollbild' : 'Aktiv'}</span>
                <span className="font-mono text-emerald-400">z-Index: {win.zIndex}</span>
              </div>
            </div>
          ))}
          {windows.length === 0 && (
            <div className="text-center py-6 text-xs text-zinc-500">
              Keine aktiven Anwendungsfenster geöffnet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
