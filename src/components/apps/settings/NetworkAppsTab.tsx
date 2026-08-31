import React, { useState, useEffect } from 'react';
import { useOS } from '../../../context/OSContext';
import { APPS_REGISTRY } from '../../../config/themeConfig';
import { AppId } from '../../../types';
import { Wifi, WifiOff, Activity, Shield, Camera, Mic, MapPin, Bell, CheckCircle2, XCircle, AlertCircle, RefreshCw, Power } from 'lucide-react';

export const NetworkAppsTab: React.FC = () => {
  const { settings, updateSettings, accentConfig, sounds, addNotification } = useOS();

  const [isSimulatedOffline, setIsSimulatedOffline] = useState(
    settings.simulatedNetworkOffline ?? !navigator.onLine
  );
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Browser permissions state
  const [permissions, setPermissions] = useState<{
    camera: string;
    microphone: string;
    geolocation: string;
    notifications: string;
  }>({
    camera: 'prompt',
    microphone: 'prompt',
    geolocation: 'prompt',
    notifications: typeof Notification !== 'undefined' ? Notification.permission : 'default',
  });

  const checkPermissions = async () => {
    try {
      if (navigator.permissions) {
        try {
          const geo = await navigator.permissions.query({ name: 'geolocation' as any });
          setPermissions((prev) => ({ ...prev, geolocation: geo.state }));
        } catch {}
        try {
          const mic = await navigator.permissions.query({ name: 'microphone' as any });
          setPermissions((prev) => ({ ...prev, microphone: mic.state }));
        } catch {}
        try {
          const cam = await navigator.permissions.query({ name: 'camera' as any });
          setPermissions((prev) => ({ ...prev, camera: cam.state }));
        } catch {}
      }
      if (typeof Notification !== 'undefined') {
        setPermissions((prev) => ({ ...prev, notifications: Notification.permission }));
      }
    } catch {}
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const measurePing = async () => {
    if (isSimulatedOffline) {
      setPingMs(null);
      return;
    }
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setPingMs(duration);
    } catch {
      setPingMs(null);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    measurePing();
  }, [isSimulatedOffline]);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      try {
        const res = await Notification.requestPermission();
        setPermissions((p) => ({ ...p, notifications: res }));
        if (res === 'granted') {
          addNotification('Berechtigung erteilt', 'Browser-Benachrichtigungen sind aktiv.', 'success');
        }
      } catch {}
    }
  };

  const autostartList = settings.autostartApps || [];

  const toggleAutostart = (appId: string) => {
    const exists = autostartList.includes(appId);
    const next = exists ? autostartList.filter((id) => id !== appId) : [...autostartList, appId];
    updateSettings({ autostartApps: next });
    sounds.playToggle();
  };

  const getStatusBadge = (status: string) => {
    if (status === 'granted') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Erteilt
        </span>
      );
    }
    if (status === 'denied') {
      return (
        <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
          <XCircle className="w-3.5 h-3.5" />
          Verweigert
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        Nicht angefragt
      </span>
    );
  };

  return (
    <div className="space-y-6 text-zinc-200">
      <div>
        <h2 className="text-base font-semibold text-white tracking-tight">Netzwerk & App-Verwaltung</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          WLAN-Simulation, Latenz-Diagnose, Autostart-Programme und Browser-Berechtigungen.
        </p>
      </div>

      {/* 1. Network & WiFi Simulation */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                !isSimulatedOffline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {!isSimulatedOffline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">WLAN & Internet-Status</span>
              <span className="text-[11px] text-zinc-400">
                {!isSimulatedOffline ? 'Online (Verbunden mit ObsidianNet)' : 'Offline (Flugmodus aktiv)'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const next = !isSimulatedOffline;
              setIsSimulatedOffline(next);
              updateSettings({ simulatedNetworkOffline: next });
              sounds.playToggle();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              !isSimulatedOffline ? 'bg-emerald-600' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                !isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Latency Ping */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] text-xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-300">Server-Latenz (Ping)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-zinc-200">
              {isSimulatedOffline ? 'Offline' : pingMs !== null ? `${pingMs} ms` : 'Prüfe...'}
            </span>
            <button
              onClick={measurePing}
              disabled={isPinging || isSimulatedOffline}
              className="p-1 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
              title="Ping erneut messen"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Autostart Management */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          Autostart-Anwendungen
        </label>
        <p className="text-[11px] text-zinc-400">
          Ausgewählte Apps werden beim Login bzw. Systemstart automatisch geöffnet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
          {APPS_REGISTRY.slice(0, 12).map((app) => {
            const isAuto = autostartList.includes(app.id);
            return (
              <div
                key={app.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs"
              >
                <span className="text-zinc-200 font-medium truncate">{app.name}</span>
                <button
                  onClick={() => toggleAutostart(app.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                    isAuto
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] hover:text-zinc-300'
                  }`}
                >
                  {isAuto ? 'Autostart An' : 'Inaktiv'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Browser Permissions */}
      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
        <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
          System- & Browser-Berechtigungen
        </label>

        <div className="space-y-2">
          {/* Notifications */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-zinc-200 font-medium block">Desktop-Push-Benachrichtigungen</span>
                <span className="text-[10px] text-zinc-500">Systemhinweise außerhalb des Browser-Tabs</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(permissions.notifications)}
              {permissions.notifications !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-medium"
                >
                  Anfragen
                </button>
              )}
            </div>
          </div>

          {/* Geolocation */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-zinc-200 font-medium block">Standort (Geolocation)</span>
                <span className="text-[10px] text-zinc-500">Für Wetter- und Lokalisierungsdienste</span>
              </div>
            </div>
            <div>{getStatusBadge(permissions.geolocation)}</div>
          </div>

          {/* Microphone */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
            <div className="flex items-center gap-2.5">
              <Mic className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-zinc-200 font-medium block">Mikrofon & Audioaufnahme</span>
                <span className="text-[10px] text-zinc-500">Für Sprachsteuerung und Audio-Tools</span>
              </div>
            </div>
            <div>{getStatusBadge(permissions.microphone)}</div>
          </div>

          {/* Camera */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-zinc-200 font-medium block">Kamera & Webcam</span>
                <span className="text-[10px] text-zinc-500">Für Foto-Aufnahmen und Videochats</span>
              </div>
            </div>
            <div>{getStatusBadge(permissions.camera)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
