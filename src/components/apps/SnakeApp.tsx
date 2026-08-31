import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Zap,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
} from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 22;
const CELL_SIZE = 16; // 352 x 352 px

export const SnakeApp: React.FC = () => {
  const { sounds, currentUser, accentConfig, saveGameState, getGameSaveInfo } = useOS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [snake, setSnake] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [specialFood, setSpecialFood] = useState<Point | null>(null);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const savedInfo = getGameSaveInfo('snake');
    if (savedInfo && typeof savedInfo.highScore === 'number') {
      return savedInfo.highScore;
    }
    try {
      const saved = localStorage.getItem('obsidian_snake_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [speedLevel, setSpeedLevel] = useState<'easy' | 'normal' | 'cyber'>('normal');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');

  const speedMs = speedLevel === 'easy' ? 140 : speedLevel === 'normal' ? 100 : 65;

  // Generate random food
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    while (true) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!currentSnake.some((segment) => segment.x === x && segment.y === y)) {
        return { x, y };
      }
    }
  }, []);

  // Fetch leaderboard from Firebase
  const loadLeaderboard = useCallback(async () => {
    const res = await FirebaseService.getGameLeaderboard('snake', 8);
    if (res.success && res.scores) {
      setLeaderboard(res.scores);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Start / Reset Game
  const resetGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setSnake(initialSnake);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setIsGameOver(false);
    setFood(generateFood(initialSnake));
    setSpecialFood(null);
    setIsPlaying(true);
    sounds.playClick();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code) && direction !== 'DOWN') {
        e.preventDefault();
        setNextDirection('UP');
      } else if (['ArrowDown', 'KeyS'].includes(e.code) && direction !== 'UP') {
        e.preventDefault();
        setNextDirection('DOWN');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code) && direction !== 'RIGHT') {
        e.preventDefault();
        setNextDirection('LEFT');
      } else if (['ArrowRight', 'KeyD'].includes(e.code) && direction !== 'LEFT') {
        e.preventDefault();
        setNextDirection('RIGHT');
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (isGameOver) resetGame();
        else setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, isGameOver]);

  // Main game tick
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      setSnake((prevSnake) => {
        const head = { ...prevSnake[0] };
        const currentDir = nextDirection;
        setDirection(currentDir);

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Wall collision
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setIsGameOver(true);
          setIsPlaying(false);
          sounds.playError();
          return prevSnake;
        }

        // Self collision
        if (prevSnake.some((seg) => seg.x === head.x && seg.y === head.y)) {
          setIsGameOver(true);
          setIsPlaying(false);
          sounds.playError();
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check normal food
        if (head.x === food.x && head.y === food.y) {
          sounds.playSuccess();
          const newScore = score + (speedLevel === 'cyber' ? 20 : 10);
          setScore(newScore);

          if (newScore > highScore) {
            setHighScore(newScore);
            try {
              localStorage.setItem('obsidian_snake_highscore', newScore.toString());
            } catch {}
            saveGameState('snake', { highScore: newScore, lastScore: newScore }, newScore, undefined, `Snake Rekord: ${newScore}`);
            // Sync to Firebase
            if (currentUser) {
              FirebaseService.saveGameScore('snake', currentUser.id, currentUser.displayName, newScore);
            }
          }

          setFood(generateFood(newSnake));

          // Spawn special bonus food randomly
          if (Math.random() < 0.25 && !specialFood) {
            setSpecialFood(generateFood(newSnake));
          }
        } else if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
          // Special food eaten
          sounds.playSuccess();
          const bonusScore = score + 50;
          setScore(bonusScore);
          setSpecialFood(null);
          if (bonusScore > highScore) {
            setHighScore(bonusScore);
            try {
              localStorage.setItem('obsidian_snake_highscore', bonusScore.toString());
            } catch {}
            saveGameState('snake', { highScore: bonusScore, lastScore: bonusScore }, bonusScore, undefined, `Snake Rekord: ${bonusScore}`);
            if (currentUser) {
              FirebaseService.saveGameScore('snake', currentUser.id, currentUser.displayName, bonusScore);
            }
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speedMs);

    return () => clearInterval(interval);
  }, [isPlaying, isGameOver, nextDirection, food, specialFood, score, highScore, speedMs, speedLevel, generateFood, currentUser, sounds, saveGameState]);

  // Render on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background with cyber grid
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw Food (Pulsing Neon Ruby / Emerald)
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ec4899';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Special Food if active
    if (specialFood) {
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#eab308';
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(
        specialFood.x * CELL_SIZE + CELL_SIZE / 2,
        specialFood.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Draw Snake Segments
    snake.forEach((segment, index) => {
      ctx.shadowBlur = index === 0 ? 14 : 6;
      ctx.shadowColor = index === 0 ? accentConfig.primary : '#8b5cf6';
      ctx.fillStyle = index === 0 ? '#a855f7' : index % 2 === 0 ? '#7c3aed' : '#6d28d9';

      const x = segment.x * CELL_SIZE + 1;
      const y = segment.y * CELL_SIZE + 1;
      const size = CELL_SIZE - 2;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, index === 0 ? 5 : 3);
      ctx.fill();

      // Eyes on head
      if (index === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        const eyeOffset = 3;
        const eyeSize = 3;

        if (direction === 'RIGHT' || direction === 'LEFT') {
          const eyeX = direction === 'RIGHT' ? x + size - eyeOffset - eyeSize : x + eyeOffset;
          ctx.fillRect(eyeX, y + 3, eyeSize, eyeSize);
          ctx.fillRect(eyeX, y + size - 6, eyeSize, eyeSize);
        } else {
          const eyeY = direction === 'DOWN' ? y + size - eyeOffset - eyeSize : y + eyeOffset;
          ctx.fillRect(x + 3, eyeY, eyeSize, eyeSize);
          ctx.fillRect(x + size - 6, eyeY, eyeSize, eyeSize);
        }
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, specialFood, direction, accentConfig]);

  return (
    <div id="snake-app" className="flex flex-col h-full w-full bg-[#08080c] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            🐍
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Neon Cyber Snake</h1>
            <p className="text-[10px] text-zinc-400">Retro Matrix Arcade & Firebase Sync</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#181824] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'game' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Spiel
          </button>
          <button
            onClick={() => {
              setActiveTab('leaderboard');
              loadLeaderboard();
            }}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg font-medium transition-all ${
              activeTab === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Highscores</span>
          </button>
        </div>
      </div>

      {activeTab === 'game' ? (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 p-4 overflow-y-auto">
          {/* Game Canvas Area */}
          <div className="relative p-2 rounded-2xl bg-[#12121a] border border-purple-500/20 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={GRID_SIZE * CELL_SIZE}
              height={GRID_SIZE * CELL_SIZE}
              className="rounded-xl border border-zinc-800 bg-[#0b0b12] shadow-inner cursor-pointer"
              onClick={() => {
                if (!isPlaying && !isGameOver) setIsPlaying(true);
              }}
            />

            {/* Overlay for start / game over */}
            {(!isPlaying || isGameOver) && (
              <div className="absolute inset-2 rounded-xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                {isGameOver ? (
                  <>
                    <span className="text-3xl mb-1">💥</span>
                    <h2 className="text-lg font-bold text-rose-400 mb-1">Game Over!</h2>
                    <p className="text-xs text-zinc-300 mb-3">
                      Erreichte Punkte: <span className="font-bold text-white text-sm">{score}</span>
                    </p>
                    <button
                      onClick={resetGame}
                      className="px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Erneut spielen</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-1">🐍</span>
                    <h2 className="text-base font-bold text-white mb-1">Cyber Snake Bereit</h2>
                    <p className="text-xs text-zinc-400 mb-4 max-w-[200px]">
                      Nutze Pfeiltasten oder WASD zur Steuerung
                    </p>
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Spiel Starten</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls & Stats Sidebar */}
          <div className="flex flex-col gap-3.5 w-full max-w-[260px]">
            {/* Score cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#14141e] border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Punkte</span>
                <span className="text-xl font-black text-white font-mono">{score}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141e] border border-purple-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">Highscore</span>
                <span className="text-xl font-black text-amber-400 font-mono">{highScore}</span>
              </div>
            </div>

            {/* Difficulty selector */}
            <div className="p-3 rounded-xl bg-[#14141e] border border-white/10">
              <span className="text-[11px] font-semibold text-zinc-300 block mb-2">Geschwindigkeit:</span>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'normal', 'cyber'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setSpeedLevel(lvl);
                      sounds.playClick();
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                      speedLevel === lvl
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-[#0d0d14] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lvl === 'easy' ? 'Leicht' : lvl === 'normal' ? 'Normal' : 'Cyber'}
                  </button>
                ))}
              </div>
            </div>

            {/* On-screen D-Pad for touch/mouse */}
            <div className="p-3 rounded-xl bg-[#14141e] border border-white/10 flex flex-col items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase">Touch-Steuerung</span>
              <button
                onClick={() => direction !== 'DOWN' && setNextDirection('UP')}
                className="w-10 h-10 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => direction !== 'RIGHT' && setNextDirection('LEFT')}
                  className="w-10 h-10 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => direction !== 'UP' && setNextDirection('DOWN')}
                  className="w-10 h-10 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => direction !== 'LEFT' && setNextDirection('RIGHT')}
                  className="w-10 h-10 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard View */
        <div className="flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Globale Firebase Bestenliste</span>
            </h2>
            <p className="text-[11px] text-zinc-400">Automatisch synchronisiert via Firestore</p>
          </div>

          <div className="space-y-2">
            {leaderboard.length > 0 ? (
              leaderboard.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#14141e] border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-500 text-black'
                          : idx === 1
                          ? 'bg-zinc-300 text-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white">{item.userName || 'Unbekannt'}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">{item.score} Pkt.</span>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-xs text-zinc-500">
                Noch keine Einträge. Spiele eine Runde, um deinen Highscore in Firebase zu verewigen!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
