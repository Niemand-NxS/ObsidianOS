import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { Code, Play, Sparkles, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

interface CustomAIAppProps {
  appName?: string;
  initialCode?: string;
}

export const CustomAIApp: React.FC<CustomAIAppProps> = ({ appName = 'KI App Runner', initialCode }) => {
  const { sounds, accentConfig, addNotification } = useOS();

  const defaultHtml = initialCode || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #0a0a0f; color: #f4f4f5; font-family: sans-serif; }
  </style>
</head>
<body class="p-6 flex flex-col items-center justify-center min-h-screen">
  <div class="max-w-md w-full p-6 rounded-3xl bg-[#14141d] border border-purple-500/30 text-center space-y-4 shadow-2xl">
    <div class="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center mx-auto text-2xl">
      ✨
    </div>
    <h1 class="text-xl font-bold text-white">Obsidian AI Generator</h1>
    <p class="text-xs text-zinc-400">Diese App wurde von der KI dynamisch für ObsidianOS generiert!</p>
    <div class="p-3 rounded-xl bg-[#0e0e14] border border-zinc-800 text-left text-xs font-mono text-emerald-400">
      > Status: Bereit für deine Interaktionen
    </div>
    <button onclick="alert('Funktioniert einwandfrei!')" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all">
      Klick mich!
    </button>
  </div>
</body>
</html>`;

  const [code, setCode] = useState(defaultHtml);
  const [activeTab, setActiveTab] = useState<'app' | 'code'>('app');
  const [key, setKey] = useState(0);

  const handleRun = () => {
    sounds.playSuccess();
    setKey((prev) => prev + 1);
    setActiveTab('app');
    addNotification('App kompiliert', 'Die KI-App wurde neu geladen.', 'success', 'AI Runner');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-[#f4f4f5] select-none font-sans overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-3 bg-[#121218] border-b border-[#27272a]/60">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
            AI
          </div>
          <span className="text-xs font-bold text-white">{appName}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[#181824] p-0.5 rounded-xl border border-[#27272a]">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'app' ? 'bg-[#252538] text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Vorschau
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'code' ? 'bg-[#252538] text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Code bearbeiten
            </button>
          </div>

          <button
            onClick={handleRun}
            className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Ausführen</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'app' ? (
          <iframe
            key={key}
            srcDoc={code}
            title="AI App Runner Sandbox"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0 bg-[#0a0a0f]"
          />
        ) : (
          <div className="h-full flex flex-col p-4 bg-[#0d0d12]">
            <div className="flex items-center justify-between mb-2 text-xs text-zinc-400">
              <span>HTML / CSS / JavaScript Sandbox Code:</span>
              <span className="font-mono text-[11px] text-purple-400">TailwindCSS & DOM API aktiviert</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 w-full bg-[#12121a] border border-[#27272a] focus:border-purple-500 rounded-2xl p-4 font-mono text-xs text-zinc-200 resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
