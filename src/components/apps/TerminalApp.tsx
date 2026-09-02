import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { AccentColorId, AppId } from '../../types';
import { ACCENT_COLORS, APPS_REGISTRY } from '../../config/themeConfig';

interface HistoryEntry {
  command: string;
  output: React.ReactNode;
  timestamp: number;
}

const FORTUNES = [
  '„Es gibt 10 Arten von Menschen: die, die Binärcode verstehen, und die, die es nicht tun.“',
  '„Echte Sicherheit basiert auf mathematischen Beweisen, nicht auf Geheimhaltung.“ — Obsidian Labs',
  '„Der beste Code ist der, den man nicht schreiben muss.“',
  '„In einer Welt voller Algorithmen bleibt menschliche Intuition das mächtigste Werkzeug.“',
  '„AES-256-GCM schützt deine Daten mit 1,15 × 10^77 möglichen Kombinationen.“',
];

export const TerminalApp: React.FC = () => {
  const {
    currentUser,
    files,
    createFile,
    createFolder,
    deleteItem,
    cloudSync,
    triggerSync,
    accentConfig,
    updateSettings,
    lockScreen,
    openApp,
    closeWindow,
    windows,
    users,
    createUser,
  } = useOS();

  const [currentPath, setCurrentPath] = useState<string>('~');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      command: 'motd',
      output: (
        <div className="space-y-1 text-zinc-300">
          <p className="text-purple-400 font-bold">ObsidianOS Terminal v3.0 (x86_64-wasm-linux)</p>
          <p className="text-zinc-500 text-[11px]">
            Tippe <span className="text-purple-300 font-semibold">'help'</span> für alle Befehle, <span className="text-purple-300 font-semibold">'tree'</span> für Verzeichnisstruktur oder <span className="text-purple-300 font-semibold">'weather'</span> für Wetterdaten.
          </p>
        </div>
      ),
      timestamp: Date.now(),
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [matrixActive, setMatrixActive] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, matrixActive]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    let output: React.ReactNode = null;

    switch (cmd) {
      case 'help':
        output = (
          <div className="space-y-1 text-xs">
            <p className="text-purple-300 font-bold">Verfügbare Obsidian CLI Befehle:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-zinc-300 pt-1">
              <div><span className="text-purple-400 font-mono">ls</span> — Dateien auflisten</div>
              <div><span className="text-purple-400 font-mono">cd [ordner]</span> — Verzeichnis wechseln</div>
              <div><span className="text-purple-400 font-mono">cat [datei]</span> — Dateiinhalt anzeigen</div>
              <div><span className="text-purple-400 font-mono">tree</span> — Verzeichnisbaum</div>
              <div><span className="text-purple-400 font-mono">touch [datei]</span> — Datei anlegen</div>
              <div><span className="text-purple-400 font-mono">mkdir [ordner]</span> — Ordner anlegen</div>
              <div><span className="text-purple-400 font-mono">rm [name]</span> — Datei/Ordner löschen</div>
              <div><span className="text-purple-400 font-mono">grep [str] [dat]</span> — Text suchen</div>
              <div><span className="text-purple-400 font-mono">curl [url]</span> — HTTP Request</div>
              <div><span className="text-purple-400 font-mono">ping [host]</span> — Latenz prüfen</div>
              <div><span className="text-purple-400 font-mono">weather [ort]</span> — Wetterbericht</div>
              <div><span className="text-purple-400 font-mono">top / htop</span> — Taskmanager</div>
              <div><span className="text-purple-400 font-mono">ps / kill</span> — Prozesse verwalten</div>
              <div><span className="text-purple-400 font-mono">open [app]</span> — GUI App starten</div>
              <div><span className="text-purple-400 font-mono">cowsay [text]</span> — ASCII Kuh-Spruch</div>
              <div><span className="text-purple-400 font-mono">fortune</span> — Zufälliges Zitat</div>
              <div><span className="text-purple-400 font-mono">date / uptime</span> — Zeit & Laufzeit</div>
              <div><span className="text-purple-400 font-mono">neofetch</span> — Systeminfo & ASCII</div>
              <div><span className="text-purple-400 font-mono">crypto</span> — Krypto-Vault Status</div>
              <div><span className="text-purple-400 font-mono">sync</span> — Firebase Sync</div>
              <div><span className="text-purple-400 font-mono">calc [expr]</span> — Rechner im Terminal</div>
              <div><span className="text-purple-400 font-mono">matrix</span> — Digitaler Datenregen</div>
              <div><span className="text-purple-400 font-mono">theme [farbe]</span> — Akzentfarbe ändern</div>
              <div><span className="text-purple-400 font-mono">whoami</span> — Aktueller Benutzer</div>
              <div><span className="text-purple-400 font-mono">history</span> — Befehlsverlauf</div>
              <div><span className="text-purple-400 font-mono">clear</span> — Terminal leeren</div>
              <div><span className="text-purple-400 font-mono">lock</span> — System sperren</div>
            </div>
          </div>
        );
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      case 'whoami':
        output = <p className="text-purple-300">{currentUser?.username} ({currentUser?.displayName} - {currentUser?.role})</p>;
        break;

      case 'pwd':
        output = <p className="text-zinc-300">/home/{currentUser?.username}{currentPath === '~' ? '' : `/${currentPath}`}</p>;
        break;

      case 'date':
        output = <p className="text-zinc-300">{new Date().toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'medium' })}</p>;
        break;

      case 'uptime':
        output = <p className="text-emerald-400 font-mono">up 4 hours, 32 mins, 1 user, load average: 0.12, 0.08, 0.04</p>;
        break;

      case 'history':
        output = (
          <div className="space-y-0.5 font-mono text-zinc-400">
            {commandHistory.map((c, i) => (
              <div key={i}><span className="text-zinc-600">{commandHistory.length - i}</span> {c}</div>
            ))}
          </div>
        );
        break;

      case 'fortune': {
        const quote = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        output = <p className="text-purple-300 italic">{quote}</p>;
        break;
      }

      case 'cowsay': {
        const msg = args.join(' ') || 'ObsidianOS ist unzerstörbar!';
        const border = '-'.repeat(msg.length + 2);
        output = (
          <pre className="text-purple-300 font-mono text-xs leading-none">
{`  ${border}
< ${msg} >
  ${border}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`}
          </pre>
        );
        break;
      }

      case 'weather': {
        const city = args.join(' ') || 'Berlin';
        output = (
          <div className="p-3 bg-[#14141f] rounded-xl border border-white/10 space-y-1 font-mono text-xs max-w-sm">
            <p className="text-purple-400 font-bold">Wetterbericht für {city}:</p>
            <div className="text-zinc-300">
              <p>☀️ Zustand: Klar / Teilweise bewölkt</p>
              <p>🌡️ Temperatur: 19°C (Gefühlt 18°C)</p>
              <p>💨 Wind: 14 km/h NW</p>
              <p>💧 Luftfeuchtigkeit: 52%</p>
              <p>👁️ Sichtweite: 10 km • UV-Index: 3</p>
            </div>
          </div>
        );
        break;
      }

      case 'ping': {
        const host = args[0] || 'firebase.google.com';
        output = (
          <div className="space-y-1 font-mono text-xs text-zinc-300">
            <p className="text-purple-400">PING {host} (142.250.185.206): 56 data bytes</p>
            <p>64 bytes from 142.250.185.206: icmp_seq=0 ttl=116 time=14.2 ms</p>
            <p>64 bytes from 142.250.185.206: icmp_seq=1 ttl=116 time=13.8 ms</p>
            <p>64 bytes from 142.250.185.206: icmp_seq=2 ttl=116 time=15.1 ms</p>
            <p>64 bytes from 142.250.185.206: icmp_seq=3 ttl=116 time=13.9 ms</p>
            <p className="text-emerald-400 pt-1">--- {host} ping statistics ---</p>
            <p>4 packets transmitted, 4 packets received, 0.0% packet loss</p>
            <p>round-trip min/avg/max = 13.8/14.25/15.1 ms</p>
          </div>
        );
        break;
      }

      case 'curl': {
        const url = args[0] || 'https://api.obsidian.os/status';
        output = (
          <div className="space-y-1 font-mono text-xs text-zinc-300">
            <p className="text-zinc-500">&gt; GET {url} HTTP/2</p>
            <p className="text-zinc-500">&gt; Host: api.obsidian.os</p>
            <p className="text-emerald-400">&lt; HTTP/2 200 OK</p>
            <p className="text-zinc-500">&lt; content-type: application/json; charset=utf-8</p>
            <pre className="text-purple-300 bg-black/40 p-2 rounded border border-white/10 mt-1">
{`{
  "status": "online",
  "engine": "Obsidian Quantum Kernel",
  "auth": "Firebase Firestore Enabled",
  "security": "AES-256-GCM / PBKDF2-SHA256",
  "latency_ms": 12
}`}
            </pre>
          </div>
        );
        break;
      }

      case 'tree': {
        const renderTree = (parentId: string | null, depth = 0): React.ReactNode => {
          const items = files.filter((f) => f.parentId === parentId);
          if (items.length === 0) return null;
          return (
            <div className="space-y-0.5" style={{ marginLeft: `${depth * 16}px` }}>
              {items.map((item) => (
                <div key={item.id} className="font-mono text-xs">
                  <span className="text-zinc-500">├── </span>
                  <span className={item.type === 'folder' ? 'text-purple-400 font-bold' : 'text-zinc-300'}>
                    {item.type === 'folder' ? '📁 ' : '📄 '}
                    {item.name}
                  </span>
                  {item.type === 'folder' && renderTree(item.id, depth + 1)}
                </div>
              ))}
            </div>
          );
        };
        output = (
          <div className="space-y-1">
            <p className="text-purple-400 font-bold font-mono">/ (Wurzelverzeichnis)</p>
            {renderTree(null)}
          </div>
        );
        break;
      }

      case 'top':
      case 'htop':
        output = (
          <div className="space-y-2 font-mono text-xs">
            <div className="grid grid-cols-2 gap-2 text-zinc-300 bg-[#12121c] p-2.5 rounded-xl border border-white/10">
              <div>
                <p className="text-purple-400 font-bold">CPU [||||||||||..........] 38.4%</p>
                <p className="text-zinc-400">8 Cores • 3.4 GHz WebAssembly JIT</p>
              </div>
              <div>
                <p className="text-emerald-400 font-bold">RAM [||||||||||||||......] 2.1 GB / 4.0 GB</p>
                <p className="text-zinc-400">Swap: 0 MB • GPU WebGL: 60 FPS</p>
              </div>
            </div>
            <div className="text-zinc-400 border border-white/10 rounded-xl overflow-hidden">
              <div className="grid grid-cols-5 bg-white/10 px-2 py-1 text-white font-bold text-[11px]">
                <span>PID</span>
                <span>PROZESS</span>
                <span>CPU%</span>
                <span>RAM</span>
                <span>STATUS</span>
              </div>
              <div className="p-2 space-y-1 text-zinc-300 text-[11px]">
                <div className="grid grid-cols-5">
                  <span className="text-purple-400">101</span>
                  <span>obsidian-wm</span>
                  <span>4.2%</span>
                  <span>140 MB</span>
                  <span className="text-emerald-400">Running</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-purple-400">102</span>
                  <span>shader-engine</span>
                  <span>12.5%</span>
                  <span>320 MB</span>
                  <span className="text-emerald-400">Active (GPU)</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-purple-400">103</span>
                  <span>apple-music-api</span>
                  <span>2.1%</span>
                  <span>88 MB</span>
                  <span className="text-emerald-400">Stream</span>
                </div>
                <div className="grid grid-cols-5">
                  <span className="text-purple-400">104</span>
                  <span>firebase-sync</span>
                  <span>0.4%</span>
                  <span>45 MB</span>
                  <span className="text-emerald-400">Idle</span>
                </div>
              </div>
            </div>
          </div>
        );
        break;

      case 'ps':
        output = (
          <div className="space-y-1 font-mono text-xs text-zinc-300">
            <div className="text-purple-400 font-bold">PID  TTY      TIME     CMD</div>
            <div> 101  tty1     00:00:04  obsidian-wm</div>
            <div> 102  tty1     00:00:12  glsl-shader-wallpaper</div>
            <div> 103  tty1     00:00:02  apple-music-player</div>
            <div> 104  tty1     00:00:01  firebase-sync-daemon</div>
            {windows.map((w, i) => (
              <div key={w.id}>
                {' '}
                {200 + i}  pts/{i}    00:00:01  app:{w.appId} ({w.title})
              </div>
            ))}
          </div>
        );
        break;

      case 'kill': {
        const target = args[0];
        if (!target) {
          output = <p className="text-red-400">Syntax: kill [app-id | window-id]</p>;
        } else {
          const winToClose = windows.find(
            (w) => w.appId === target || w.id === target || w.title.toLowerCase() === target.toLowerCase()
          );
          if (winToClose) {
            closeWindow(winToClose.id);
            output = <p className="text-emerald-400">Prozess {winToClose.title} (PID {winToClose.id}) beendet.</p>;
          } else {
            output = <p className="text-red-400">Kein aktives Fenster für '{target}' gefunden.</p>;
          }
        }
        break;
      }

      case 'open': {
        const appName = args[0]?.toLowerCase();
        const app = APPS_REGISTRY.find(
          (a) => a.id === appName || a.name.toLowerCase() === appName
        );
        if (app) {
          openApp(app.id);
          output = <p className="text-emerald-400">Anwendung '{app.name}' gestartet.</p>;
        } else {
          output = (
            <p className="text-red-400">
              Anwendung '{appName}' nicht gefunden. Verfügbar: {APPS_REGISTRY.map((a) => a.id).join(', ')}
            </p>
          );
        }
        break;
      }

      case 'ls': {
        const folderItems = files.filter((f) => f.parentId === currentFolderId);
        if (folderItems.length === 0) {
          output = <p className="text-zinc-500 italic">Verzeichnis ist leer</p>;
        } else {
          output = (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {folderItems.map((f) => (
                <span
                  key={f.id}
                  className={`font-mono flex items-center gap-1 ${
                    f.type === 'folder' ? 'text-purple-400 font-bold' : 'text-zinc-300'
                  }`}
                >
                  {f.type === 'folder' ? '📁 ' : '📄 '}
                  {f.name}
                  {f.type !== 'folder' && <span className="text-[10px] text-zinc-600">({f.size}B)</span>}
                </span>
              ))}
            </div>
          );
        }
        break;
      }

      case 'cd': {
        const target = args[0];
        if (!target || target === '~' || target === '/') {
          setCurrentFolderId(null);
          setCurrentPath('~');
          output = null;
        } else if (target === '..') {
          if (currentFolderId) {
            const curr = files.find((f) => f.id === currentFolderId);
            setCurrentFolderId(curr?.parentId || null);
            setCurrentPath(curr?.parentId ? files.find((f) => f.id === curr.parentId)?.name || '~' : '~');
          }
        } else {
          const match = files.find(
            (f) => f.parentId === currentFolderId && f.type === 'folder' && f.name.toLowerCase() === target.toLowerCase()
          );
          if (match) {
            setCurrentFolderId(match.id);
            setCurrentPath(match.name);
          } else {
            output = <p className="text-red-400">cd: Verzeichnis nicht gefunden: {target}</p>;
          }
        }
        break;
      }

      case 'cat': {
        const target = args[0];
        if (!target) {
          output = <p className="text-red-400">Syntax: cat [dateiname]</p>;
        } else {
          const file = files.find(
            (f) => f.parentId === currentFolderId && f.name.toLowerCase() === target.toLowerCase()
          );
          if (file) {
            output = (
              <pre className="p-3 bg-black/50 rounded-lg border border-white/10 font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                {file.content || '(Leere Datei)'}
              </pre>
            );
          } else {
            output = <p className="text-red-400">cat: Datei '{target}' nicht gefunden.</p>;
          }
        }
        break;
      }

      case 'touch': {
        const name = args[0];
        if (!name) {
          output = <p className="text-red-400">Syntax: touch [dateiname]</p>;
        } else {
          createFile(name, currentFolderId, 'text', '');
          output = <p className="text-emerald-400">Datei '{name}' angelegt.</p>;
        }
        break;
      }

      case 'mkdir': {
        const name = args[0];
        if (!name) {
          output = <p className="text-red-400">Syntax: mkdir [ordnername]</p>;
        } else {
          createFolder(name, currentFolderId);
          output = <p className="text-emerald-400">Ordner '{name}' angelegt.</p>;
        }
        break;
      }

      case 'rm': {
        const name = args[0];
        if (!name) {
          output = <p className="text-red-400">Syntax: rm [name]</p>;
        } else {
          const item = files.find(
            (f) => f.parentId === currentFolderId && f.name.toLowerCase() === name.toLowerCase()
          );
          if (item) {
            deleteItem(item.id);
            output = <p className="text-emerald-400">'{name}' gelöscht.</p>;
          } else {
            output = <p className="text-red-400">rm: '{name}' nicht gefunden.</p>;
          }
        }
        break;
      }

      case 'grep': {
        const pattern = args[0];
        const fileName = args[1];
        if (!pattern) {
          output = <p className="text-red-400">Syntax: grep [muster] [datei (optional)]</p>;
        } else {
          const matching = files.filter(
            (f) =>
              f.type !== 'folder' &&
              f.content.toLowerCase().includes(pattern.toLowerCase()) &&
              (!fileName || f.name.toLowerCase() === fileName.toLowerCase())
          );
          if (matching.length === 0) {
            output = <p className="text-zinc-500">Keine Übereinstimmungen gefunden.</p>;
          } else {
            output = (
              <div className="space-y-1 text-xs">
                {matching.map((m) => (
                  <div key={m.id} className="p-2 bg-white/5 rounded border border-white/10">
                    <span className="text-purple-400 font-bold">{m.name}:</span>
                    <p className="text-zinc-300 mt-0.5 truncate">{m.content}</p>
                  </div>
                ))}
              </div>
            );
          }
        }
        break;
      }

      case 'calc': {
        const expr = args.join(' ');
        if (!expr) {
          output = <p className="text-red-400">Syntax: calc [ausdruck] (z.B. calc 42 * 1337)</p>;
        } else {
          try {
            // Safe sanitized math evaluator
            const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
            // eslint-disable-next-line no-new-func
            const res = Function(`'use strict'; return (${sanitized})`)();
            output = <p className="text-emerald-400 font-mono text-sm">= {res}</p>;
          } catch {
            output = <p className="text-red-400">Ungültiger mathematischer Ausdruck.</p>;
          }
        }
        break;
      }

      case 'neofetch':
        output = (
          <div className="flex flex-col sm:flex-row gap-4 font-mono text-xs p-2">
            <pre className="text-purple-400 leading-none">
{`   .--------.
  /  ______  \\
 |  /  __  \\  |
 | |  /  \\  | |
 | | |    | | |
 | |  \\__/  | |
 |  \\______/  |
  \\          /
   '--------'`}
            </pre>
            <div className="space-y-0.5 text-zinc-300">
              <p className="text-purple-300 font-bold">{currentUser?.username}@obsidian-os</p>
              <p className="text-zinc-500">----------------------</p>
              <p><span className="text-purple-400 font-semibold">OS:</span> ObsidianOS 3.0 (Quantum Linux)</p>
              <p><span className="text-purple-400 font-semibold">Host:</span> AI Studio WebAssembly Sandbox</p>
              <p><span className="text-purple-400 font-semibold">Kernel:</span> 6.8.0-obsidian-wasm</p>
              <p><span className="text-purple-400 font-semibold">Uptime:</span> 4 hours, 32 mins</p>
              <p><span className="text-purple-400 font-semibold">Packages:</span> 9 (GUI apps)</p>
              <p><span className="text-purple-400 font-semibold">Shell:</span> obsidian-sh 3.0</p>
              <p><span className="text-purple-400 font-semibold">WM:</span> Obsidian FLIP Morph Manager</p>
              <p><span className="text-purple-400 font-semibold">Terminal:</span> XTerm-WebAssembly</p>
              <p><span className="text-purple-400 font-semibold">Theme:</span> {accentConfig.name}</p>
              <p><span className="text-purple-400 font-semibold">Shader:</span> WebGL GLSL Real-Time Active</p>
              <p><span className="text-purple-400 font-semibold">Cloud:</span> Firebase Firestore (AES-256)</p>
            </div>
          </div>
        );
        break;

      case 'sync':
        triggerSync();
        output = (
          <p className="text-purple-300">
            Firebase Cloud-Synchronisation angestoßen... (Status: {cloudSync.isSyncing ? 'Synchronisiere' : 'OK'})
          </p>
        );
        break;

      case 'crypto':
        output = (
          <div className="space-y-1 text-xs">
            <p className="text-purple-300 font-bold">Obsidian Krypto-Tresor Spezifikationen:</p>
            <div className="text-zinc-300 space-y-0.5">
              <p>• Verschlüsselungsstandard: <span className="text-emerald-400 font-mono">AES-256-GCM</span></p>
              <p>• Schlüsselableitung: <span className="text-emerald-400 font-mono">PBKDF2-SHA256 (100.000 Runden)</span></p>
              <p>• Integrität: <span className="text-emerald-400 font-mono">SHA-256 Hash-Prüfsummen</span></p>
              <p>• Cloud-Status: <span className="text-emerald-400 font-mono">Firebase Firestore Synchronisiert</span></p>
            </div>
          </div>
        );
        break;

      case 'matrix':
        setMatrixActive((prev) => !prev);
        output = <p className="text-emerald-400">Matrix-Modus {matrixActive ? 'deaktiviert' : 'aktiviert'}.</p>;
        break;

      case 'theme': {
        const color = args[0]?.toLowerCase() as AccentColorId;
        if (color && ACCENT_COLORS[color]) {
          updateSettings({ accentColor: color });
          output = <p className="text-emerald-400">Akzentfarbe geändert zu: {ACCENT_COLORS[color].name}</p>;
        } else {
          output = (
            <div className="space-y-1">
              <p className="text-red-400">Ungültige Farbe. Verfügbar:</p>
              <div className="flex flex-wrap gap-1">
                {Object.keys(ACCENT_COLORS).map((c) => (
                  <span key={c} className="px-1.5 py-0.5 rounded bg-white/10 text-xs font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          );
        }
        break;
      }

      case 'lock':
        lockScreen();
        return;

      default:
        output = (
          <p className="text-red-400">
            Befehl nicht gefunden: '{cmd}'. Tippe <span className="text-purple-300 font-semibold">'help'</span> für Hilfe.
          </p>
        );
    }

    setHistory((prev) => [...prev, { command: trimmed, output, timestamp: Date.now() }]);
    setInputVal('');
  };

  return (
    <div
      id="terminal-app-root"
      className={`terminal-theme h-full flex flex-col p-3 font-mono text-xs overflow-hidden select-text ${
        matrixActive ? 'bg-[#020d06] text-emerald-400' : 'bg-[#0a0a0f] text-zinc-200'
      }`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {history.map((entry, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <span className="text-purple-400 font-semibold">{currentUser?.username}@obsidian</span>
              <span>:</span>
              <span className="text-blue-400">{currentPath}</span>
              <span>$</span>
              <span className="text-white font-medium">{entry.command}</span>
            </div>
            {entry.output && <div className="pl-2 border-l border-white/10">{entry.output}</div>}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Prompt */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCommand(inputVal);
        }}
        className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 shrink-0"
      >
        <span className="text-purple-400 font-semibold">{currentUser?.username}@obsidian</span>
        <span className="text-zinc-600">:</span>
        <span className="text-blue-400">{currentPath}</span>
        <span className="text-zinc-400">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              if (commandHistory.length > 0) {
                const nextIdx = Math.min(commandHistory.length - 1, historyIndex + 1);
                setHistoryIndex(nextIdx);
                setInputVal(commandHistory[nextIdx]);
              }
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (historyIndex > 0) {
                const nextIdx = historyIndex - 1;
                setHistoryIndex(nextIdx);
                setInputVal(commandHistory[nextIdx]);
              } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInputVal('');
              }
            }
          }}
          className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-zinc-700"
          placeholder="Befehl eingeben (z.B. 'help', 'tree', 'weather', 'top')..."
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
      </form>
    </div>
  );
};
