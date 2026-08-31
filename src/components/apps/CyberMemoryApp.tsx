import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Shield,
  Key,
  Cpu,
  Database,
  Bug,
  Lock,
  Wifi,
  Code,
  Sparkles,
  Terminal,
  Zap,
  Flame,
  RotateCcw,
  Trophy,
  Clock,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';

interface Card {
  id: number;
  iconId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ICONS_POOL = [
  { id: 'terminal', icon: Terminal, color: '#38bdf8' },
  { id: 'shield', icon: Shield, color: '#10b981' },
  { id: 'key', icon: Key, color: '#eab308' },
  { id: 'cpu', icon: Cpu, color: '#a855f7' },
  { id: 'database', icon: Database, color: '#ec4899' },
  { id: 'bug', icon: Bug, color: '#f43f5e' },
  { id: 'lock', icon: Lock, color: '#fb923c' },
  { id: 'wifi', icon: Wifi, color: '#06b6d4' },
  { id: 'code', icon: Code, color: '#84cc16' },
  { id: 'sparkles', icon: Sparkles, color: '#c084fc' },
  { id: 'zap', icon: Zap, color: '#fbbf24' },
  { id: 'flame', icon: Flame, color: '#ef4444' },
];

export const CyberMemoryApp: React.FC = () => {
  const { sounds, currentUser, accentConfig } = useOS();

  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [combo, setCombo] = useState(1);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('obsidian_memory_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const pairCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12;

  const loadLeaderboard = useCallback(async () => {
    const res = await FirebaseService.getGameLeaderboard('cyber_memory', 8);
    if (res.success && res.scores) {
      setLeaderboard(res.scores);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Init new deck
  const initDeck = useCallback(() => {
    const selectedIcons = ICONS_POOL.slice(0, pairCount);
    const deck: Card[] = [];

    selectedIcons.forEach((item, idx) => {
      deck.push({ id: idx * 2, iconId: item.id, isFlipped: false, isMatched: false });
      deck.push({ id: idx * 2 + 1, iconId: item.id, isFlipped: false, isMatched: false });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setCombo(1);
    setScore(0);
    setSeconds(0);
    setIsPlaying(false);
    setIsVictory(false);
  }, [pairCount]);

  useEffect(() => {
    initDeck();
  }, [difficulty, initDeck]);

  // Timer tick
  useEffect(() => {
    if (!isPlaying || isVictory) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isVictory]);

  // Card click handler
  const handleCardClick = (index: number) => {
    if (flippedIndices.length >= 2 || cards[index].isFlipped || cards[index].isMatched) return;

    if (!isPlaying) setIsPlaying(true);
    sounds.playClick();

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      const [idx1, idx2] = newFlipped;
      const card1 = newCards[idx1];
      const card2 = newCards[idx2];

      if (card1.iconId === card2.iconId) {
        // Match!
        sounds.playSuccess();
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          const newMatches = matches + 1;
          const pointsEarned = 100 * combo;
          const newScore = score + pointsEarned;
          setMatches(newMatches);
          setCombo((prev) => prev + 1);
          setScore(newScore);
          setFlippedIndices([]);

          // Check Victory
          if (newMatches === pairCount) {
            setIsVictory(true);
            setIsPlaying(false);
            const timeBonus = Math.max(0, 300 - seconds * 3);
            const finalScore = newScore + timeBonus;
            setScore(finalScore);

            if (finalScore > highScore) {
              setHighScore(finalScore);
              try {
                localStorage.setItem('obsidian_memory_highscore', finalScore.toString());
              } catch {}
              if (currentUser) {
                FirebaseService.saveGameScore('cyber_memory', currentUser.id, currentUser.displayName, finalScore);
              }
            }
          }
        }, 400);
      } else {
        // Mismatch
        setCombo(1);
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const renderIcon = (iconId: string) => {
    const item = ICONS_POOL.find((i) => i.id === iconId);
    if (!item) return null;
    const IconComp = item.icon;
    return <IconComp className="w-6 h-6" style={{ color: item.color }} />;
  };

  return (
    <div id="cyber-memory-app" className="flex flex-col h-full w-full bg-[#08080c] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            🧠
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Matrix Hack Memory</h1>
            <p className="text-[10px] text-zinc-400">Cyber-Muster Erkennung & Firebase Rangliste</p>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="flex bg-[#161622] p-1 rounded-xl border border-white/10 text-xs">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => {
                setDifficulty(diff);
                sounds.playClick();
              }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                difficulty === diff ? 'bg-purple-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {diff === 'easy' ? '12 Karten' : diff === 'medium' ? '16 Karten' : '24 Karten'}
            </button>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-around px-4 py-2 bg-[#0e0e16] border-b border-zinc-800 text-xs font-mono shrink-0">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{seconds}s</span>
        </div>
        <div className="text-zinc-300">
          Züge: <span className="font-bold text-white">{moves}</span>
        </div>
        <div className="text-purple-300 font-bold">
          Combo: x{combo}
        </div>
        <div className="text-amber-400 font-bold">
          Punkte: {score}
        </div>
        <button
          onClick={initDeck}
          title="Neu mischen"
          className="p-1.5 rounded-lg bg-[#1f1f2e] hover:bg-purple-600 active:scale-95 text-zinc-300 hover:text-white transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center bg-[#07070b]">
        <div
          className={`grid gap-2.5 max-w-lg w-full ${
            difficulty === 'easy'
              ? 'grid-cols-4'
              : difficulty === 'medium'
              ? 'grid-cols-4'
              : 'grid-cols-6'
          }`}
        >
          {cards.map((card, idx) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              className={`h-20 sm:h-24 rounded-2xl border flex items-center justify-center cursor-pointer shadow-lg transition-all ${
                card.isFlipped || card.isMatched
                  ? 'bg-[#181826] border-purple-500/50 shadow-purple-500/10'
                  : 'bg-[#12121c] border-white/10 hover:border-zinc-500 hover:bg-[#1a1a28]'
              }`}
            >
              {card.isFlipped || card.isMatched ? (
                <motion.div
                  initial={{ scale: 0, rotateY: 90 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderIcon(card.iconId)}
                </motion.div>
              ) : (
                <div className="text-zinc-600 font-mono text-sm font-bold opacity-40">
                  ⚡
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Victory Modal */}
        {isVictory && (
          <div className="mt-4 p-4 rounded-2xl bg-[#14141e] border border-emerald-500/40 text-center animate-fadeIn shadow-2xl max-w-xs w-full">
            <span className="text-3xl mb-1 block">🏆</span>
            <h3 className="text-sm font-bold text-emerald-400">System Gehackt!</h3>
            <p className="text-xs text-zinc-300 my-1">
              Finaler Score: <span className="font-bold text-white text-sm">{score} Punkte</span> in {seconds}s
            </p>
            <button
              onClick={initDeck}
              className="mt-2 px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 mx-auto shadow-lg transition-all"
              style={{ backgroundColor: accentConfig.primary }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Erneut Spielen</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
