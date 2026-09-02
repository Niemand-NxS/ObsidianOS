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
import { motion, AnimatePresence } from 'motion/react';

export const MonitorApp: React.FC = () => {
  const { windows, files, users, cloudSync, accentConfig, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

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
    <div
      id="monitor-app-root"
      className={`h-full flex flex-col select-none overflow-y-auto p-4 gap-4 transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0b0b10] text-zinc-200'
      }`}
    >
      {/* Top Header */}
      <div
        className={`flex items-center justify-between border-b pb-3 transition-colors ${
          isLightMode ? 'border-slate-200' : 'border-[#27272a]/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-500" style={{ color: accentConfig.primary }} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
            System & Firebase Aktivitätsmonitor
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Status: Optimal</span>
        </div>
      </div>

      {/* Metrics 3-Grid */}
      <motion.div layout className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* CPU Card */}
        <motion.div
          layout
          className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
            isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121b] border-white/10'
          }`}
        >
          <div className={`flex items-center justify-between text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-purple-500" /> CPU Auslastung</span>
            <span className={`font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{cpuUsage}%</span>
          </div>
          <div className={`mt-3 w-full h-2 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${cpuUsage}%`, backgroundColor: accentConfig.primary }}
            />
          </div>
        </motion.div>

        {/* RAM Card */}
        <motion.div
          layout
          className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
            isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121b] border-white/10'
          }`}
        >
          <div className={`flex items-center justify-between text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-blue-500" /> RAM Speicher</span>
            <span className={`font-mono font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{ramUsage}% (1.8 GB / 8 GB)</span>
          </div>
          <div className={`mt-3 w-full h-2 rounded-full overflow-hidden ${isLightMode ? 'bg-slate-200' : 'bg-white/10'}`}>
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${ramUsage}%` }} />
          </div>
        </motion.div>

        {/* Storage / Firebase Cloud */}
        <motion.div
          layout
          className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
            isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121b] border-white/10'
          }`}
        >
          <div className={`flex items-center justify-between text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
            <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-emerald-500" /> Firebase Firestore</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs font-semibold">Verbunden</span>
          </div>
          <div className={`mt-2 text-[11px] flex items-center justify-between ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            <span>Dateisystem: {files.length} Elemente</span>
            <span className="font-mono">{Math.round(totalFilesSize / 1024 * 10) / 10} KB</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Active Tasks & Windows List */}
      <motion.div
        layout
        className={`border rounded-xl p-3.5 flex flex-col flex-1 transition-colors ${
          isLightMode ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#12121b] border-white/10'
        }`}
      >
        <span className={`text-xs font-semibold mb-2.5 ${isLightMode ? 'text-slate-700' : 'text-zinc-300'}`}>
          Aktive Prozesse & Fenster ({windows.filter((w) => w.isOpen).length})
        </span>
        <div className="overflow-y-auto space-y-1.5">
          {windows.map((win) => (
            <motion.div
              layout
              layoutId={`process-${win.id}`}
              key={win.id}
              className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                isLightMode ? 'bg-slate-50 hover:bg-slate-100 text-slate-800' : 'bg-white/[0.03] hover:bg-white/[0.06] text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{win.title}</span>
                <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>PID: {win.id.slice(-6)}</span>
              </div>
              <div className={`flex items-center gap-3 text-[11px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                <span>{win.isMinimized ? 'Minimiert' : win.isMaximized ? 'Vollbild' : 'Aktiv'}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">z-Index: {win.zIndex}</span>
              </div>
            </motion.div>
          ))}
          {windows.length === 0 && (
            <div className={`text-center py-6 text-xs ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
              Keine aktiven Anwendungsfenster geöffnet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
