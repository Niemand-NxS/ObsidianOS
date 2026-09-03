import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../../services/soundService';
import { OBSIDIAN_DEFAULT_WALLPAPERS } from '../../config/defaultWallpapers';

interface CrystalWelcomeScreenProps {
  onStart: () => void;
  onClose?: () => void;
  accentColor?: string;
  isStandalone?: boolean;
}

interface WelcomeLanguage {
  greeting: string;
  subtext: string;
  prompt: string;
  langCode: string;
}

const WELCOME_LANGUAGES: WelcomeLanguage[] = [
  {
    greeting: 'Hello',
    subtext: 'Welcome to ObsidianOS',
    prompt: 'Press Space or click to continue',
    langCode: 'en',
  },
  {
    greeting: 'Hallo',
    subtext: 'Willkommen bei ObsidianOS',
    prompt: 'Zum Fortfahren Leertaste drücken oder klicken',
    langCode: 'de',
  },
  {
    greeting: 'Bonjour',
    subtext: 'Bienvenue sur ObsidianOS',
    prompt: 'Appuyez sur Espace ou cliquez pour continuer',
    langCode: 'fr',
  },
  {
    greeting: 'Hola',
    subtext: 'Bienvenido a ObsidianOS',
    prompt: 'Pulsa Espacio o haz clic para continuar',
    langCode: 'es',
  },
  {
    greeting: 'Ciao',
    subtext: 'Benvenuto in ObsidianOS',
    prompt: 'Premi Spazio o fai clic per continuare',
    langCode: 'it',
  },
  {
    greeting: 'こんにちは',
    subtext: 'ObsidianOS へようこそ',
    prompt: 'スペースキーまたはクリックして続行',
    langCode: 'ja',
  },
  {
    greeting: '你好',
    subtext: '欢迎使用 ObsidianOS',
    prompt: '按空格键或点击以继续',
    langCode: 'zh',
  },
  {
    greeting: 'Olá',
    subtext: 'Bem-vindo ao ObsidianOS',
    prompt: 'Pressione Espaço ou clique para continuar',
    langCode: 'pt',
  },
  {
    greeting: 'Hej',
    subtext: 'Välkommen till ObsidianOS',
    prompt: 'Tryck på Blanksteg eller klicka för att fortsätta',
    langCode: 'sv',
  },
];

export const CrystalWelcomeScreen: React.FC<CrystalWelcomeScreenProps> = ({
  onStart,
  onClose,
}) => {
  const [langIndex, setLangIndex] = useState(0);
  const [isTriggering, setIsTriggering] = useState(false);

  // Play startup sound on mount
  useEffect(() => {
    sounds.playStartup();
  }, []);

  // Cycle languages every 5.5 seconds (stays longer on screen)
  useEffect(() => {
    const timer = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % WELCOME_LANGUAGES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleTrigger = useCallback(() => {
    if (isTriggering) return;
    setIsTriggering(true);
    sounds.playUnlock();
    setTimeout(() => {
      onStart();
    }, 700);
  }, [isTriggering, onStart]);

  // Keyboard shortcut (Enter, Space to start)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTrigger();
      } else if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTrigger, onClose]);

  const currentLang = WELCOME_LANGUAGES[langIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isTriggering ? 0 : 1, scale: isTriggering ? 1.04 : 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      onClick={handleTrigger}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-12 px-6 cursor-pointer select-none overflow-hidden text-white"
    >
      {/* Background: User's Dark Wallpaper with subtle soft shading */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <img
          src={OBSIDIAN_DEFAULT_WALLPAPERS.dark}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* Invisible spacer to balance layout */}
      <div className="relative z-10 w-full h-8" />

      {/* Center: Greeting & Welcome to ObsidianOS in matching font size */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLang.langCode}
            initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(10px)', y: -10 }}
            transition={{ duration: 1.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center justify-center space-y-3"
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
              {currentLang.greeting}
            </h1>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
              {currentLang.subtext}
            </h2>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Small localized prompt only */}
      <div className="relative z-10 flex flex-col items-center justify-center pb-4 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentLang.langCode}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.85, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
            className="text-xs sm:text-sm text-zinc-200/80 font-light tracking-wider drop-shadow-md"
          >
            {currentLang.prompt}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

