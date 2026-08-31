import React, { useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { WALLPAPERS, ACCENT_COLORS } from '../../config/themeConfig';
import { FirebaseService } from '../../services/firebaseService';
import { WallpaperId, AccentColorId } from '../../types';
import {
  ShoppingBag,
  Download,
  Check,
  Search,
  Star,
  Sparkles,
  Palette,
  Layers,
  Monitor,
  Tag,
  Zap,
  CheckCircle2,
  Trash2,
  Copy,
  Upload,
  FileCode,
  Play,
  Gamepad2,
  Timer,
  CloudSun,
  Paintbrush,
  TrendingUp,
  Music2,
  ExternalLink,
  Code,
  FileText,
  HelpCircle,
  FolderOpen,
  Bomb,
  Rocket,
  Brain,
  Crosshair,
  Grid3X3,
  AlertTriangle,
  Cloud,
  Globe,
  Share2,
  Youtube,
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface StoreAppItem {
  id: string;
  name: string;
  category: 'Spiele' | 'Produktivität' | 'Dienstprogramme' | 'Kreativität';
  rating: number;
  reviewsCount: number;
  size: string;
  iconName: string;
  description: string;
  features: string[];
  version: string;
  code?: string;
  author?: string;
}

const STORE_APPS_CATALOG: StoreAppItem[] = [
  {
    id: 'sudoku',
    name: 'Cyber Sudoku Master',
    category: 'Spiele',
    rating: 4.9,
    reviewsCount: 520,
    size: '2.4 MB',
    iconName: 'Grid3X3',
    description: 'Taktisches Zahlenrätsel mit 4 Schwierigkeitsgraden, Notizmodus, Hinweisen und Firebase-Rangliste.',
    features: ['4 Stufen (Leicht bis Meister)', 'Pencil Notizen & Smart Hints', 'Globale Highscore-Synchronisation'],
    version: '2.0.0',
  },
  {
    id: 'retro-2048',
    name: '2048 Retro',
    category: 'Spiele',
    rating: 4.8,
    reviewsCount: 380,
    size: '1.8 MB',
    iconName: 'Gamepad2',
    description: 'Klassisches Zahlenpuzzle-Spiel mit sanften Animationen, Sounds und Highscore-Tabelle.',
    features: ['Raster 4x4 und 5x5', 'Highscore-Speicherung', 'Haptische UI-Soundeffekte'],
    version: '1.2.0',
  },
  {
    id: 'snake',
    name: 'Neon Cyber Snake',
    category: 'Spiele',
    rating: 4.9,
    reviewsCount: 495,
    size: '2.0 MB',
    iconName: 'Zap',
    description: 'Retro Cyberpunk Snake mit Power-Ups, Geschwindigkeitsstufen und Firebase-Bestenliste.',
    features: ['3 Geschwindigkeitsstufen', 'Bonus-Kristalle & Multiplikatoren', 'Touch & Tastatur-Steuerung'],
    version: '2.0.1',
  },
  {
    id: 'minesweeper',
    name: 'Matrix Minensucher',
    category: 'Spiele',
    rating: 4.9,
    reviewsCount: 420,
    size: '1.7 MB',
    iconName: 'Bomb',
    description: 'Taktischer Minesweeper mit 3 Schwierigkeitsgraden, Flaggenmodus und Timer-Highscores.',
    features: ['9x9, 16x16 und 30x16 Raster', 'Sicherer Erstklick', 'Rechtsklick & Touch-Flaggen'],
    version: '1.5.0',
  },
  {
    id: 'flappy-cube',
    name: 'Flappy Obsidian',
    category: 'Spiele',
    rating: 4.8,
    reviewsCount: 340,
    size: '2.2 MB',
    iconName: 'Rocket',
    description: 'Arkadespiel mit Neon-Laser-Hindernissen, Jump-Physik und Online-Rangliste.',
    features: ['60fps Physik-Engine', 'Partikel-Schweif & Sounds', 'Cloud-Leaderboard'],
    version: '2.1.0',
  },
  {
    id: 'space-invaders',
    name: 'Obsidian Galaxy Raider',
    category: 'Spiele',
    rating: 4.9,
    reviewsCount: 560,
    size: '2.8 MB',
    iconName: 'Crosshair',
    description: 'Retro Arcade Shoot \'em Up mit Alien-Wellen, Schutzschilden und Bonus-UFOs.',
    features: ['Wellen-Progression & Schilde', 'Bonus-UFO Mutterschiffe', 'Sound & Partikeleffekte'],
    version: '2.3.0',
  },
  {
    id: 'cyber-memory',
    name: 'Matrix Hack Memory',
    category: 'Spiele',
    rating: 4.9,
    reviewsCount: 310,
    size: '1.9 MB',
    iconName: 'Brain',
    description: 'Gedächtnistraining mit Cyberpunk-Symbolen, Combo-Multiplikatoren und Zeitwertung.',
    features: ['12, 16 und 24 Karten Raster', 'Combo-Multiplikator', 'Globale Highscores'],
    version: '1.4.0',
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Fokus',
    category: 'Produktivität',
    rating: 4.9,
    reviewsCount: 620,
    size: '1.6 MB',
    iconName: 'Timer',
    description: 'Fokustimer basierend auf der Pomodoro-Technik mit Intervallen und Statistik.',
    features: ['25m / 5m Intervalle', 'Akustisches Signal bei Zyklusende', 'Tägliche Fokus-Statistik'],
    version: '2.1.0',
  },
  {
    id: 'weather',
    name: 'Wetterradar & Vorhersage',
    category: 'Dienstprogramme',
    rating: 4.7,
    reviewsCount: 290,
    size: '2.1 MB',
    iconName: 'CloudSun',
    description: 'Globale Wetterstation mit 7-Tage-Vorhersage, UV-Index, Luftdruck und Regenradar.',
    features: ['Echtzeit-Temperaturverlauf', 'Windstärke & Niederschlagswahrscheinlichkeit', 'Standorterkennung'],
    version: '1.8.0',
  },
  {
    id: 'pixel-paint',
    name: 'Pixel Paint Studio',
    category: 'Kreativität',
    rating: 4.8,
    reviewsCount: 219,
    size: '3.8 MB',
    iconName: 'Paintbrush',
    description: 'Minimalistisches Vektor- & Pixel-Zeichenprogramm mit Ebenen und PNG/SVG Export.',
    features: ['Freihandstift & Pinselwerkzeuge', 'RGB & Hex Farbpaletten', 'Ebenen-Unterstützung'],
    version: '1.4.2',
  },
  {
    id: 'crypto-radar',
    name: 'Krypto & Forex Radar',
    category: 'Dienstprogramme',
    rating: 4.9,
    reviewsCount: 512,
    size: '2.5 MB',
    iconName: 'TrendingUp',
    description: 'Echtzeit-Kurstracker für Bitcoin, Ethereum, Solana und globale Devisenmärkte.',
    features: ['24h Candlestick Charts', 'Preisalarme & Benachrichtigungen', 'Offline-Cache Modus'],
    version: '3.0.1',
  },
  {
    id: 'audio-synth',
    name: 'Obsidian Synthesizer',
    category: 'Kreativität',
    rating: 4.9,
    reviewsCount: 445,
    size: '4.1 MB',
    iconName: 'Music2',
    description: 'Polyphoner Synthesizer mit Sinus-, Dreieck- & Sägezahn-Wellenformen.',
    features: ['Virtuelle 25-Tasten Klaviatur', 'Reverb & Low-Pass Filter', 'Preset-Bibliothek'],
    version: '2.3.0',
  },
  {
    id: 'chess',
    name: 'Obsidian Schach',
    category: 'Spiele',
    rating: 5.0,
    reviewsCount: 680,
    size: '3.6 MB',
    iconName: 'Crown',
    description: 'Klassisches Schachspiel mit intelligenter Minimax-KI, 2-Spieler-Modus, Zughistorie und Bewertungsleiste.',
    features: ['KI-Gegner mit 3 Elo-Stufen', 'Pass & Play 2-Spieler Modus', 'Echtzeit-Stellungsanalyse & Themes'],
    version: '1.0.0',
  },
];

const PROMPT_PRESETS = [
  {
    title: 'Arcade Mini-Spiel (Flappy Cube)',
    appType: 'ein Arcade-Spiel "Flappy Cube" mit Canvas, Highscore-Zähler, Jump-Physik und Kollisionsabfrage',
  },
  {
    title: 'Passwort-Generator & Tresor',
    appType: 'ein Sicherheits-Tool zur Generierung kryptografisch sicherer Passwörter mit Entropie-Balken, Kopiermodus und Notizspeicher',
  },
  {
    title: 'Habit & Daily Routine Tracker',
    appType: 'einen interaktiven Gewohnheiten-Tracker mit Tages-Checklisten, Streak-Counter und Wochenstatistik',
  },
  {
    title: 'Einheiten- & Währungsumrechner',
    appType: 'einen All-in-One Konverter für Währungen, Längen, Gewichte, Geschwindigkeiten und Datenmengen mit Sofortberechnung',
  },
];

export const AppStoreApp: React.FC = () => {
  const {
    settings,
    updateSettings,
    accentConfig,
    addNotification,
    sounds,
    installedAppIds,
    installApp,
    uninstallApp,
    customApps,
    addCustomApp,
    removeCustomApp,
    openApp,
    currentUser,
  } = useOS();

  const [activeTab, setActiveTab] = useState<'apps' | 'ai-generator' | 'my-apps' | 'wallpapers'>('apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [downloadingItems, setDownloadingItems] = useState<Record<string, number>>({});
  const [storeCatalog, setStoreCatalog] = useState<StoreAppItem[]>(STORE_APPS_CATALOG);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [publishToCloud, setPublishToCloud] = useState(true);

  // AI Prompt generator states
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [customIdea, setCustomIdea] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Subscribe to real Firestore app store catalog
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const initCatalog = async () => {
      setIsCloudSyncing(true);
      const res = await FirebaseService.fetchStoreCatalog();
      const fetched = res?.success && Array.isArray(res.apps) ? res.apps : [];
      if (fetched.length > 0) {
        // Merge with built-in apps avoiding duplicate IDs
        const existingIds = new Set(fetched.map((a: any) => a.id));
        const merged = [
          ...fetched,
          ...STORE_APPS_CATALOG.filter((a) => !existingIds.has(a.id)),
        ];
        setStoreCatalog(merged as StoreAppItem[]);
      }
      setIsCloudSyncing(false);

      unsubscribe = FirebaseService.subscribeToStoreCatalog((liveApps) => {
        if (liveApps && liveApps.length > 0) {
          const liveIds = new Set(liveApps.map((a: any) => a.id));
          const merged = [
            ...liveApps,
            ...STORE_APPS_CATALOG.filter((a) => !liveIds.has(a.id)),
          ];
          setStoreCatalog(merged as StoreAppItem[]);
        }
      });
    };

    initCatalog();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Render icon helper
  const renderAppIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Bomb':
        return <Bomb className={className} />;
      case 'Rocket':
        return <Rocket className={className} />;
      case 'Crosshair':
        return <Crosshair className={className} />;
      case 'Brain':
        return <Brain className={className} />;
      case 'Timer':
        return <Timer className={className} />;
      case 'CloudSun':
        return <CloudSun className={className} />;
      case 'Paintbrush':
        return <Paintbrush className={className} />;
      case 'TrendingUp':
        return <TrendingUp className={className} />;
      case 'Music2':
        return <Music2 className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Grid3X3':
        return <Grid3X3 className={className} />;
      case 'FileText':
        return <FileText className={className} />;
      case 'Globe':
        return <Globe className={className} />;
      case 'Youtube':
        return <Youtube className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      default:
        return <ShoppingBag className={className} />;
    }
  };

  // Handle Download/Install of an App with progress
  const handleDownloadApp = (app: StoreAppItem) => {
    sounds.playClick();
    setDownloadingItems((prev) => ({ ...prev, [app.id]: 10 }));

    const step1 = setTimeout(() => {
      setDownloadingItems((prev) => ({ ...prev, [app.id]: 50 }));
    }, 350);

    const step2 = setTimeout(() => {
      setDownloadingItems((prev) => ({ ...prev, [app.id]: 90 }));
    }, 700);

    const step3 = setTimeout(() => {
      setDownloadingItems((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });

      // If it has custom code, install as custom app if not present
      if (app.code) {
        if (!customApps.some((ca) => ca.id === app.id)) {
          addCustomApp({
            id: app.id,
            name: app.name,
            icon: app.iconName || 'Sparkles',
            code: app.code,
          });
        }
      }
      installApp(app.id);
      addNotification('App installiert', `"${app.name}" wurde auf deinem Desktop platziert.`, 'success', 'App Store');
    }, 1100);
  };

  const handleUninstall = (appId: string) => {
    uninstallApp(appId);
    if (customApps.some((ca) => ca.id === appId)) {
      removeCustomApp(appId);
    }
  };

  // Generate Prompt string for external AI
  const currentAppIdea = customIdea.trim() || PROMPT_PRESETS[selectedPresetIndex].appType;
  const promptTemplate = `Erstelle eine vollständige, sofort lauffähige Web-App für das Desktop-Betriebssystem "ObsidianOS".

Aufgabe: Entwickle ${currentAppIdea}.

WICHTIGE ANFORDERUNGEN:
1. Das Ergebnis MUSS ein einzelnes, gültiges JSON-Objekt sein (keine zusätzlichen Erklärungen vor oder nach dem JSON).
2. Das JSON muss exakt dieser Struktur folgen:
{
  "name": "Prägnanter Name der App",
  "icon": "Sparkles", // Wähle eins aus: Gamepad2, Timer, CloudSun, Paintbrush, TrendingUp, Music2, Sparkles, Terminal, FileText, Globe, Calculator
  "category": "Spiele", // Oder: Produktivität, Dienstprogramme, Kreativität
  "description": "Kurze 1-Satz Beschreibung der Funktion",
  "version": "1.0.0",
  "html": "<!DOCTYPE html>\\n<html>\\n<head>\\n<meta charset='utf-8'>\\n<script src='https://cdn.tailwindcss.com'></script>\\n<style>body { background-color: #0d0d12; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 16px; min-height: 100vh; }</style>\\n</head>\\n<body>\\n<!-- Vollständige funktionierende HTML/JS/CSS App mit Tailwind-Styling und dunklem Anthrazit-Design -->\\n<script>\\n// Sämtliche Interaktionen und Logik hier direkt implementieren\\n</script>\\n</body>\\n</html>"
}

Erstelle nun das vollständige JSON:`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate);
    setCopiedPrompt(true);
    sounds.playSuccess();
    addNotification('Prompt kopiert', 'Füge den Prompt in eine beliebige KI (ChatGPT, Claude, Gemini etc.) ein.', 'success', 'KI Generator');
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Handle uploaded JSON file or text input
  const handleProcessJSON = async (rawText: string) => {
    setJsonError('');
    try {
      let clean = rawText.trim();
      if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```/, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(clean);

      if (!parsed.name || (!parsed.html && !parsed.code)) {
        throw new Error('Das JSON muss mindestens "name" und "html" enthalten.');
      }

      const appId = `custom-${Date.now()}`;
      const appCode = parsed.html || parsed.code || '';
      const iconName = parsed.icon || 'Sparkles';

      addCustomApp({
        id: appId,
        name: parsed.name,
        icon: iconName,
        code: appCode,
      });

      // If user selected publish to cloud, save to Firestore App Store
      if (publishToCloud) {
        await FirebaseService.uploadAppToStore({
          id: appId,
          name: parsed.name,
          category: parsed.category || 'Kreativität',
          rating: 5.0,
          size: `${Math.max(1, Math.round(appCode.length / 1024))} KB`,
          iconName: iconName,
          description: parsed.description || 'Benutzerdefinierte KI-Anwendung',
          features: ['In Firestore Cloud gespeichert', 'Echtzeit-Synchronisation'],
          version: parsed.version || '1.0.0',
          code: appCode,
          author: currentUser?.displayName || 'Obsidian User',
        });
      }

      setJsonInput('');
      sounds.playSuccess();
      addNotification('App installiert & synchronisiert', `"${parsed.name}" wurde auf dem Desktop und in Firestore hinterlegt!`, 'success', 'App Store');
      setActiveTab('my-apps');
    } catch (err: any) {
      setJsonError(err.message || 'Ungültiges JSON-Format. Bitte überprüfe die Datei.');
      sounds.playClick();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessJSON(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Generate a ready-to-test Demo App
  const handleTestDemoApp = () => {
    const sampleApp = {
      name: 'Flappy Cube Arcade',
      icon: 'Gamepad2',
      category: 'Spiele',
      description: 'Retro-Arkadespiel mit Score-Zähler und Physik.',
      version: '1.0.0',
      html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0b0b10; color: #fff; font-family: sans-serif; overflow: hidden; }
  </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4 select-none">
  <div class="text-center mb-3">
    <h1 class="text-xl font-bold text-purple-400">Flappy Cube</h1>
    <p class="text-xs text-zinc-400">Klicke oder tippe Leertaste zum Springen</p>
  </div>
  <canvas id="game" width="320" height="400" class="rounded-2xl border border-zinc-800 bg-[#12121c] shadow-2xl"></canvas>
  <div class="mt-3 flex items-center gap-4 text-xs font-mono text-zinc-400">
    <div>Punkte: <span id="score" class="text-white font-bold text-sm">0</span></div>
    <div>Best: <span id="best" class="text-emerald-400 font-bold text-sm">0</span></div>
  </div>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    let birdY = 200, birdV = 0, pipes = [], score = 0, best = 0, gameOver = false, frames = 0;
    
    function reset() {
      birdY = 200; birdV = 0; pipes = []; score = 0; gameOver = false; frames = 0;
      document.getElementById('score').innerText = score;
    }
    
    function jump() {
      if (gameOver) { reset(); return; }
      birdV = -6;
    }
    
    window.addEventListener('keydown', e => { if (e.code === 'Space') jump(); });
    canvas.addEventListener('pointerdown', jump);
    
    function loop() {
      frames++;
      birdV += 0.35;
      birdY += birdV;
      
      if (frames % 90 === 0 && !gameOver) {
        const gap = 110;
        const topH = Math.floor(Math.random() * (canvas.height - gap - 80)) + 30;
        pipes.push({ x: canvas.width, top: topH, bottom: topH + gap, passed: false });
      }
      
      ctx.fillStyle = '#12121c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Bird
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.roundRect(50, birdY, 22, 22, 6);
      ctx.fill();
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 10;
      
      // Update pipes
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#22c55e';
      for (let i = pipes.length - 1; i >= 0; i--) {
        const p = pipes[i];
        if (!gameOver) p.x -= 2;
        
        ctx.fillRect(p.x, 0, 42, p.top);
        ctx.fillRect(p.x, p.bottom, 42, canvas.height - p.bottom);
        
        if (!p.passed && p.x < 50) {
          p.passed = true;
          score++;
          document.getElementById('score').innerText = score;
          if (score > best) { best = score; document.getElementById('best').innerText = best; }
        }
        
        // Collision
        if (
          50 + 22 > p.x && 50 < p.x + 42 &&
          (birdY < p.top || birdY + 22 > p.bottom)
        ) {
          gameOver = true;
        }
        
        if (p.x < -50) pipes.splice(i, 1);
      }
      
      if (birdY > canvas.height - 22 || birdY < 0) gameOver = true;
      
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 10);
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#a1a1aa';
        ctx.fillText('Klicke zum Neustarten', canvas.width/2, canvas.height/2 + 15);
      }
      
      requestAnimationFrame(loop);
    }
    loop();
  </script>
</body>
</html>`,
    };

    handleProcessJSON(JSON.stringify(sampleApp));
  };

  const filteredApps = storeCatalog.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Alle' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="app-store-window" className="flex flex-col h-full w-full bg-[#0a0a0f] text-[#f4f4f5] select-none font-sans overflow-hidden">
      {/* Top Store Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-[#12121a] border-b border-[#27272a]/70 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">Obsidian App Store</h1>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Cloud className="w-3 h-3" />
                <span>Firestore Cloud Sync</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Entdecken, Herunterladen & KI-Apps in Firestore speichern</p>
          </div>
        </div>

        {/* Store Tabs */}
        <div className="flex bg-[#181824] p-1 rounded-2xl border border-[#27272a] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'apps' ? 'bg-[#252538] text-white shadow font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Apps entdecken
          </button>
          <button
            onClick={() => setActiveTab('ai-generator')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'ai-generator'
                ? 'bg-purple-600/90 text-white shadow font-semibold'
                : 'text-zinc-400 hover:text-purple-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            <span>KI-Prompt & Import</span>
          </button>
          <button
            onClick={() => setActiveTab('my-apps')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'my-apps' ? 'bg-[#252538] text-white shadow font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>Meine Apps</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-mono">
              {installedAppIds.length + customApps.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wallpapers')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === 'wallpapers' ? 'bg-[#252538] text-white shadow font-semibold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Wallpapers & Themes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#0c0c12]">
        {/* TAB 1: APPS ENTDECKEN */}
        {activeTab === 'apps' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Apps durchsuchen..."
                  className="w-full bg-[#14141e] border border-[#27272a] focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {['Alle', 'Spiele', 'Produktivität', 'Dienstprogramme', 'Kreativität'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-[#14141e] text-zinc-400 hover:text-white border border-[#27272a]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const isInstalled = installedAppIds.includes(app.id);
                const progress = downloadingItems[app.id];
                const isDownloading = typeof progress === 'number';

                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-[#14141e]/90 border border-[#27272a] hover:border-zinc-700 transition-all flex flex-col justify-between shadow-lg group relative overflow-hidden"
                  >
                    <div>
                      {/* App Header: Icon, Name & Rating */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div
                          className="w-13 h-13 rounded-2xl bg-[#1c1c28] border border-white/10 flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform"
                          style={{
                            boxShadow: `0 8px 20px rgba(0,0,0,0.5)`,
                            color: accentConfig.text,
                          }}
                        >
                          {renderAppIcon(app.iconName, 'w-6 h-6')}
                        </div>

                        <div className="overflow-hidden flex-1">
                          <h3 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                            {app.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-zinc-400">{app.category}</span>
                            <span className="text-zinc-600">•</span>
                            <div className="flex items-center gap-1 text-[11px] text-amber-400">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{app.rating}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                        {app.description}
                      </p>

                      {/* Features */}
                      <div className="space-y-1 mb-4">
                        {app.features.slice(0, 2).map((feat, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                            <Check className="w-3 h-3 text-purple-400 shrink-0" />
                            <span className="truncate">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer: Size & Install Button */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 mt-auto">
                      <span className="text-[11px] text-zinc-500 font-mono">{app.size}</span>

                      <div className="flex items-center gap-2">
                        {isInstalled ? (
                          <>
                            <button
                              onClick={() => openApp(app.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#252538] hover:bg-[#32324a] text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                            >
                              <Play className="w-3 h-3 fill-white" />
                              <span>Öffnen</span>
                            </button>
                            <button
                              onClick={() => handleUninstall(app.id)}
                              title="Deinstallieren"
                              className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : isDownloading ? (
                          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-purple-600/30 text-purple-300 text-xs font-semibold">
                            <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            <span>{progress}%</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleDownloadApp(app)}
                            className="px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 hover:brightness-110 shadow-lg active:scale-95"
                            style={{ backgroundColor: accentConfig.primary }}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Laden</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: KI-PROMPT GENERATOR & APP-IMPORT */}
        {activeTab === 'ai-generator' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/40 via-[#151522] to-indigo-950/40 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">KI App-Generator & Firestore Cloud Import</h2>
                  <p className="text-xs text-zinc-400">
                    Kopiere den Prompt für ChatGPT, Claude oder Gemini und lade die generierte JSON-Datei direkt in ObsidianOS hoch.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 1: Preset & Prompt Kopieren */}
            <div className="p-6 rounded-2xl bg-[#14141e] border border-[#27272a] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h3 className="text-sm font-bold text-white">Prompt-Vorlage auswählen & kopieren</h3>
                </div>

                <button
                  onClick={handleCopyPrompt}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 hover:brightness-110"
                  style={{ backgroundColor: accentConfig.primary }}
                >
                  {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPrompt ? 'Prompt kopiert!' : 'Prompt in Zwischenablage kopieren'}</span>
                </button>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedPresetIndex(idx);
                      setCustomIdea('');
                      sounds.playClick();
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all ${
                      selectedPresetIndex === idx && !customIdea
                        ? 'border-purple-500 bg-purple-500/10 text-white font-semibold'
                        : 'border-[#27272a] bg-[#101017] text-zinc-400 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    <span className="block font-bold text-white mb-0.5">{preset.title}</span>
                    <span className="text-[11px] text-zinc-400 line-clamp-1">{preset.appType}</span>
                  </button>
                ))}
              </div>

              {/* Custom app idea input */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Oder eigene App-Idee eingeben:
                </label>
                <input
                  type="text"
                  value={customIdea}
                  onChange={(e) => setCustomIdea(e.target.value)}
                  placeholder="z.B. ein interaktives Memory-Kartenspiel mit Timer und Bestenliste..."
                  className="w-full bg-[#0a0a0f] border border-[#27272a] focus:border-purple-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              {/* Prompt Preview Container */}
              <div className="relative rounded-2xl bg-[#09090d] border border-[#27272a] p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                {promptTemplate}
              </div>
            </div>

            {/* Step 2: Hochladen & Ausführen */}
            <div className="p-6 rounded-2xl bg-[#14141e] border border-[#27272a] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-400 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h3 className="text-sm font-bold text-white">Generierte JSON-Datei hochladen & in Firestore speichern</h3>
                </div>

                <button
                  onClick={handleTestDemoApp}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Demo-App testen</span>
                </button>
              </div>

              {/* Publish to Cloud Firestore Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#0d0d14] border border-[#27272a] cursor-pointer">
                <input
                  type="checkbox"
                  checked={publishToCloud}
                  onChange={(e) => setPublishToCloud(e.target.checked)}
                  className="accent-purple-500 w-4 h-4 rounded"
                />
                <div>
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                    <span>In Cloud-AppStore (Firestore) veröffentlichen</span>
                  </span>
                  <p className="text-[10px] text-zinc-400">
                    Die App wird dauerhaft in der Firestore-Datenbank gespeichert und steht im Store zum Download bereit.
                  </p>
                </div>
              </label>

              {/* File upload drag zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-[#3f3f46] hover:border-purple-500 bg-[#0d0d14] cursor-pointer transition-colors text-center group">
                  <Upload className="w-8 h-8 text-zinc-500 group-hover:text-purple-400 transition-colors mb-2" />
                  <span className="text-xs font-bold text-white">JSON-Datei hier hochladen</span>
                  <span className="text-[11px] text-zinc-500 mt-1">.json oder .obsidian-app Datei auswählen</span>
                  <input
                    type="file"
                    accept=".json,.obsidian-app,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Paste JSON code box */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Oder füge das von der KI generierte JSON hier direkt ein..."
                    rows={4}
                    className="w-full flex-1 bg-[#0d0d14] border border-[#27272a] focus:border-purple-500 rounded-2xl p-3 text-xs font-mono text-white placeholder-zinc-600 outline-none resize-none"
                  />
                  <button
                    onClick={() => handleProcessJSON(jsonInput)}
                    disabled={!jsonInput.trim()}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      jsonInput.trim()
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span>App aus JSON installieren & auf Desktop platzieren</span>
                  </button>
                </div>
              </div>

              {jsonError && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{jsonError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MEINE APPS */}
        {activeTab === 'my-apps' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Meine installierten Anwendungen</h2>
              <p className="text-xs text-zinc-400">
                Verwalte deine aus dem Store geladenen und eigens über KI importierten Desktop-Apps (synchronisiert mit Firestore).
              </p>
            </div>

            {/* Custom AI Apps List */}
            {customApps.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Benutzerdefinierte KI-Apps ({customApps.length})</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl bg-[#14141e] border border-purple-500/30 flex items-center justify-between shadow-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-purple-600/20 text-purple-300 flex items-center justify-center text-lg border border-purple-500/40">
                          {renderAppIcon(app.icon, 'w-5 h-5')}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{app.name}</h4>
                          <span className="text-[10px] text-emerald-400 font-mono">In Firestore & Desktop</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openApp(app.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Öffnen</span>
                        </button>
                        <button
                          onClick={() => removeCustomApp(app.id)}
                          title="Löschen"
                          className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Store Installed Apps List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Store-Apps ({installedAppIds.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {storeCatalog.filter((a) => installedAppIds.includes(a.id)).map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl bg-[#14141e] border border-[#27272a] flex items-center justify-between shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl bg-[#1c1c28] border border-white/10 flex items-center justify-center shadow"
                        style={{ color: accentConfig.text }}
                      >
                        {renderAppIcon(app.iconName, 'w-5 h-5')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{app.name}</h4>
                        <span className="text-[10px] text-zinc-400">{app.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openApp(app.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#252538] hover:bg-[#32324a] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Öffnen</span>
                      </button>
                      <button
                        onClick={() => handleUninstall(app.id)}
                        title="Deinstallieren"
                        className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WALLPAPERS & THEMES */}
        {activeTab === 'wallpapers' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Minimalistische Dark Wallpapers</h2>
              <p className="text-xs text-zinc-400">Wähle dein bevorzugtes Hintergrunddesign.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {WALLPAPERS.map((wp) => {
                const isSelected = settings.wallpaper === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      updateSettings({ wallpaper: wp.id as WallpaperId });
                      sounds.playClick();
                    }}
                    className={`group cursor-pointer rounded-2xl border overflow-hidden transition-all ${
                      isSelected
                        ? 'border-purple-400 ring-2 ring-purple-500/40 scale-[1.02]'
                        : 'border-[#27272a] hover:border-zinc-500'
                    }`}
                  >
                    <div
                      className="h-28 flex items-center justify-center p-3 relative"
                      style={{ background: wp.previewGradient }}
                    >
                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-[#14141e] flex items-center justify-between text-xs">
                      <span className="font-semibold text-white truncate">{wp.name}</span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">{wp.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

