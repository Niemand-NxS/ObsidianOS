import React, { useState } from 'react';
import { useOS } from '../../context/OSContext';
import { Code, Play, Sparkles, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomAIAppProps {
  appName?: string;
  initialCode?: string;
}

export const CustomAIApp: React.FC<CustomAIAppProps> = ({ appName = 'KI App Runner', initialCode }) => {
  const { sounds, accentConfig, addNotification, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

  const defaultHtml = initialCode || `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: ${isLightMode ? '#f8fafc' : '#0a0a0f'}; color: ${isLightMode ? '#0f172a' : '#f4f4f5'}; font-family: sans-serif; }
  </style>
</head>
<body class="p-6 flex flex-col items-center justify-center min-h-screen">
  <div class="max-w-md w-full p-6 rounded-3xl ${isLightMode ? 'bg-white border-purple-300 shadow-xl' : 'bg-[#14141d] border-purple-500/30 shadow-2xl'} border text-center space-y-4">
    <div class="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto text-2xl">
      ✨
    </div>
    <h1 class="text-xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}">Obsidian AI Generator</h1>
    <p class="text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}">Diese App wurde von der KI dynamisch für ObsidianOS generiert!</p>
    <div class="p-3 rounded-xl ${isLightMode ? 'bg-slate-100 border-slate-200 text-emerald-700' : 'bg-[#0e0e14] border-zinc-800 text-emerald-400'} border text-left text-xs font-mono">
      > Status: Bereit für deine Interaktionen
    </div>
    <button onclick="alert('Funktioniert einwandfrei!')" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md">
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
    <div
      className={`flex flex-col h-full w-full select-none font-sans overflow-hidden transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0f] text-[#f4f4f5]'
      }`}
    >
      {/* Top Bar */}
      <div
        className={`flex items-center justify-between p-3 border-b transition-colors ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#121218] border-[#27272a]/60'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
            AI
          </div>
          <span className={`text-xs font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{appName}</span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex p-0.5 rounded-xl border relative transition-colors ${
              isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#181824] border-[#27272a]'
            }`}
          >
            <button
              onClick={() => setActiveTab('app')}
              className={`relative px-3 py-1 rounded-lg text-xs font-medium transition-all z-10 ${
                activeTab === 'app'
                  ? isLightMode
                    ? 'text-slate-900 font-semibold'
                    : 'text-white font-semibold'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeTab === 'app' && (
                <motion.div
                  layoutId="ai-app-active-tab"
                  className={`absolute inset-0 rounded-lg shadow-xs ${
                    isLightMode ? 'bg-white border border-slate-200/80' : 'bg-[#252538] border border-white/10'
                  }`}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Vorschau</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`relative px-3 py-1 rounded-lg text-xs font-medium transition-all z-10 ${
                activeTab === 'code'
                  ? isLightMode
                    ? 'text-slate-900 font-semibold'
                    : 'text-white font-semibold'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeTab === 'code' && (
                <motion.div
                  layoutId="ai-app-active-tab"
                  className={`absolute inset-0 rounded-lg shadow-xs ${
                    isLightMode ? 'bg-white border border-slate-200/80' : 'bg-[#252538] border border-white/10'
                  }`}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span className="relative z-10">Code bearbeiten</span>
            </button>
          </div>

          <button
            onClick={handleRun}
            className="px-3 py-1 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5 transition-all"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <Play className="w-3 h-3 fill-white" />
            <span>Ausführen</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'app' ? (
            <motion.div
              key="tab-app"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              <iframe
                key={key}
                srcDoc={code}
                title="AI App Runner Sandbox"
                sandbox="allow-scripts allow-modals"
                className={`w-full h-full border-0 ${isLightMode ? 'bg-slate-100' : 'bg-[#0a0a0f]'}`}
              />
            </motion.div>
          ) : (
            <motion.div
              key="tab-code"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={`h-full flex flex-col p-4 transition-colors ${isLightMode ? 'bg-slate-50' : 'bg-[#0d0d12]'}`}
            >
              <div className={`flex items-center justify-between mb-2 text-xs ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                <span>HTML / CSS / JavaScript Sandbox Code:</span>
                <span className="font-mono text-[11px] text-purple-600 dark:text-purple-400 font-semibold">TailwindCSS & DOM API aktiviert</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className={`flex-1 w-full border rounded-2xl p-4 font-mono text-xs resize-none focus:outline-none leading-relaxed transition-colors ${
                  isLightMode
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-400/30'
                    : 'bg-[#12121a] border-[#27272a] text-zinc-200 focus:border-purple-500'
                }`}
                spellCheck={false}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
