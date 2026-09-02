import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { sounds } from '../../services/soundService';

interface CrystalWelcomeScreenProps {
  onStart: () => void;
  accentColor?: string;
}

interface WelcomeLanguage {
  greeting: string;
  prompt: string;
  langCode: string;
  langName: string;
}

const WELCOME_LANGUAGES: WelcomeLanguage[] = [
  { greeting: 'Welcome to ObsidianOS', prompt: 'Click to start', langCode: 'en', langName: 'English' },
  { greeting: 'Willkommen bei ObsidianOS', prompt: 'Zum Starten drücken', langCode: 'de', langName: 'Deutsch' },
  { greeting: 'Bienvenue sur ObsidianOS', prompt: 'Cliquer pour commencer', langCode: 'fr', langName: 'Français' },
  { greeting: 'Bienvenido a ObsidianOS', prompt: 'Haz clic para comenzar', langCode: 'es', langName: 'Español' },
  { greeting: 'Benvenuto in ObsidianOS', prompt: 'Clicca per iniziare', langCode: 'it', langName: 'Italiano' },
  { greeting: 'ObsidianOS へようこそ', prompt: 'クリックして開始', langCode: 'ja', langName: '日本語' },
  { greeting: '欢迎使用 ObsidianOS', prompt: '点击以开始', langCode: 'zh', langName: '简体中文' },
  { greeting: 'Bem-vindo ao ObsidianOS', prompt: 'Clique para começar', langCode: 'pt', langName: 'Português' },
];

export const CrystalWelcomeScreen: React.FC<CrystalWelcomeScreenProps> = ({
  onStart,
  accentColor = '#a855f7',
}) => {
  const [langIndex, setLangIndex] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);

  // Cycle languages every 3.4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % WELCOME_LANGUAGES.length);
    }, 3400);
    return () => clearInterval(timer);
  }, []);

  const handleTrigger = () => {
    if (isTriggering) return;
    setIsTriggering(true);
    sounds.playOpen();
    setTimeout(() => {
      onStart();
    }, 650);
  };

  // Keyboard shortcut (Enter or Space to start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTrigger();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger]);

  const currentLang = WELCOME_LANGUAGES[langIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTriggering ? 0 : 1, scale: isTriggering ? 1.08 : 1 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleTrigger}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between py-12 px-6 cursor-pointer select-none overflow-hidden"
    >
      {/* Prismatic Shimmer Background Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-950/20 via-black/40 to-black/80 pointer-events-none" />

      {/* Top Subtle Obsidian Emblem */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 0.8 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="relative z-10 flex items-center gap-2 pt-2"
      >
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping opacity-75" />
        <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-zinc-400">
          OBSIDIAN OS • BOOT INITIALIZER
        </span>
      </motion.div>

      {/* Center Crystal Formation & Typography */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-3xl text-center">
        {/* Prismatic Geometric Crystal Shards & Halo Aura */}
        <div className="relative w-44 h-44 mb-6 flex items-center justify-center pointer-events-none">
          {/* Rotating Crystal Facets SVG Mesh */}
          <motion.svg
            viewBox="0 0 200 200"
            className="w-full h-full drop-shadow-[0_0_40px_rgba(168,85,247,0.45)]"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
          >
            <defs>
              <linearGradient id="crystalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="crystalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#9333ea" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Faceted Crystal Hexagonal Diamond Structure */}
            <polygon
              points="100,15 170,55 170,145 100,185 30,145 30,55"
              fill="url(#crystalGrad1)"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
            />
            <polygon
              points="100,15 100,185 30,145"
              fill="url(#crystalGrad2)"
              opacity="0.65"
            />
            <polygon
              points="100,15 170,55 100,100"
              fill="#e9d5ff"
              opacity="0.4"
            />
            <polygon
              points="100,100 170,145 100,185"
              fill="#7e22ce"
              opacity="0.35"
            />
            <polygon
              points="100,100 30,145 100,185"
              fill="#3b82f6"
              opacity="0.3"
            />
            {/* Center Prismatic Core */}
            <circle cx="100" cy="100" r="16" fill="#ffffff" opacity="0.8" filter="blur(3px)" />
          </motion.svg>

          {/* Sparkle Crystals Orbiting */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute top-1 right-2 text-purple-200"
          >
            <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_#c084fc]" />
          </motion.div>
          <motion.div
            animate={{ scale: [1.2, 0.9, 1.2], opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-2 left-3 text-cyan-200"
          >
            <Sparkles className="w-4 h-4 drop-shadow-[0_0_8px_#22d3ee]" />
          </motion.div>
        </div>

        {/* Animated Crystalline Typography */}
        <div className="relative h-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLang.langCode}
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.08, filter: 'blur(12px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white drop-shadow-[0_4px_30px_rgba(255,255,255,0.25)]">
                {currentLang.greeting}
              </h1>
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-purple-300/80 mt-1 block">
                {currentLang.langName}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Localized Action Prompt */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="relative z-10 flex flex-col items-center gap-2 pb-2"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLang.langCode}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.5)] transition-all group"
          >
            <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
              {currentLang.prompt}
            </span>
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
          Oder Leertaste / Eingabetaste drücken
        </span>
      </motion.div>
    </motion.div>
  );
};
