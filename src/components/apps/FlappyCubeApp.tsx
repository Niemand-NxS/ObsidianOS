import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import { Trophy, RotateCcw, Play, Zap, Sparkles, Volume2 } from 'lucide-react';

export const FlappyCubeApp: React.FC = () => {
  const { sounds, currentUser, accentConfig } = useOS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('obsidian_flappy_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Physics & Game state refs for smooth 60fps loop
  const gameStateRef = useRef({
    birdY: 200,
    birdV: 0,
    pipes: [] as { x: number; top: number; bottom: number; passed: boolean }[],
    score: 0,
    frames: 0,
    gameOver: false,
    particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
  });

  const loadLeaderboard = useCallback(async () => {
    const res = await FirebaseService.getGameLeaderboard('flappy', 8);
    if (res.success && res.scores) {
      setLeaderboard(res.scores);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const jump = useCallback(() => {
    if (gameStateRef.current.gameOver) {
      // Restart
      gameStateRef.current.birdY = 200;
      gameStateRef.current.birdV = -6;
      gameStateRef.current.pipes = [];
      gameStateRef.current.score = 0;
      gameStateRef.current.frames = 0;
      gameStateRef.current.gameOver = false;
      setIsGameOver(false);
      setScore(0);
      sounds.playClick();
      return;
    }

    gameStateRef.current.birdV = -6.2;
    sounds.playClick();

    // Spawn jump particles
    for (let i = 0; i < 6; i++) {
      gameStateRef.current.particles.push({
        x: 65,
        y: gameStateRef.current.birdY + 12,
        vx: (Math.random() - 0.5) * 4 - 2,
        vy: (Math.random() - 0.5) * 4 + 2,
        life: 1,
        color: '#a855f7',
      });
    }
  }, [sounds]);

  // Handle keyboard & touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !isGameOver) {
          setIsPlaying(true);
        }
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isGameOver, jump]);

  // Main Canvas Loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const state = gameStateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Update if playing and not game over
      if (isPlaying && !state.gameOver) {
        state.frames++;
        state.birdV += 0.36; // Gravity
        state.birdY += state.birdV;

        // Spawn Pipes
        if (state.frames % 85 === 0) {
          const gap = 115;
          const topH = Math.floor(Math.random() * (height - gap - 80)) + 35;
          state.pipes.push({
            x: width,
            top: topH,
            bottom: topH + gap,
            passed: false,
          });
        }

        // Move pipes
        for (let i = state.pipes.length - 1; i >= 0; i--) {
          const p = state.pipes[i];
          p.x -= 2.6;

          // Score check
          if (!p.passed && p.x + 46 < 55) {
            p.passed = true;
            state.score++;
            setScore(state.score);
            sounds.playSuccess();

            if (state.score > highScore) {
              setHighScore(state.score);
              try {
                localStorage.setItem('obsidian_flappy_highscore', state.score.toString());
              } catch {}
              if (currentUser) {
                FirebaseService.saveGameScore('flappy', currentUser.id, currentUser.displayName, state.score);
              }
            }
          }

          // Collision Check
          const birdBox = { x: 55, y: state.birdY, size: 22 };
          if (
            birdBox.x + birdBox.size > p.x &&
            birdBox.x < p.x + 46 &&
            (birdBox.y < p.top || birdBox.y + birdBox.size > p.bottom)
          ) {
            state.gameOver = true;
            setIsGameOver(true);
            sounds.playError();
          }

          if (p.x < -60) {
            state.pipes.splice(i, 1);
          }
        }

        // Boundary collision
        if (state.birdY > height - 24 || state.birdY < 0) {
          state.gameOver = true;
          setIsGameOver(true);
          sounds.playError();
        }
      }

      // 1. Draw Background
      ctx.fillStyle = '#0a0a10';
      ctx.fillRect(0, 0, width, height);

      // Subtle cyber grid in background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 2. Draw Pipes (Glowing Cyber Pillars)
      for (const p of state.pipes) {
        // Top pipe
        const gradTop = ctx.createLinearGradient(p.x, 0, p.x + 46, 0);
        gradTop.addColorStop(0, '#10b981');
        gradTop.addColorStop(1, '#059669');
        ctx.fillStyle = gradTop;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#10b981';
        ctx.beginPath();
        ctx.roundRect(p.x, 0, 46, p.top, [0, 0, 8, 8]);
        ctx.fill();

        // Bottom pipe
        const gradBottom = ctx.createLinearGradient(p.x, p.bottom, p.x + 46, p.bottom);
        gradBottom.addColorStop(0, '#10b981');
        gradBottom.addColorStop(1, '#059669');
        ctx.fillStyle = gradBottom;
        ctx.beginPath();
        ctx.roundRect(p.x, p.bottom, 46, height - p.bottom, [8, 8, 0, 0]);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Draw Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const pt = state.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.05;
        if (pt.life <= 0) {
          state.particles.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(168, 85, 247, ${pt.life})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3 * pt.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Draw Player Cube
      ctx.save();
      ctx.translate(55 + 11, state.birdY + 11);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (state.birdV * 4 * Math.PI) / 180));
      ctx.rotate(angle);

      ctx.shadowBlur = 16;
      ctx.shadowColor = accentConfig.primary;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.roundRect(-11, -11, 22, 22, 6);
      ctx.fill();

      // Inner obsidian core
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.roundRect(-7, -7, 14, 14, 4);
      ctx.fill();

      // Glowing Eye
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, -4, 4, 4);
      ctx.restore();

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, highScore, currentUser, sounds, accentConfig]);

  return (
    <div id="flappy-cube-app" className="flex flex-col h-full w-full bg-[#08080c] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            🚀
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Flappy Obsidian</h1>
            <p className="text-[10px] text-zinc-400">Cyberpunk Arcade & Cloud Leaderboard</p>
          </div>
        </div>

        {/* Tab Switch */}
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
          {/* Game Canvas */}
          <div
            onClick={() => {
              if (!isPlaying) setIsPlaying(true);
              jump();
            }}
            className="relative p-2 rounded-2xl bg-[#12121a] border border-purple-500/20 shadow-2xl cursor-pointer"
          >
            <canvas
              ref={canvasRef}
              width={340}
              height={420}
              className="rounded-xl border border-zinc-800 bg-[#0a0a10] shadow-inner"
            />

            {/* Overlays */}
            {(!isPlaying || isGameOver) && (
              <div className="absolute inset-2 rounded-xl bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                {isGameOver ? (
                  <>
                    <span className="text-3xl mb-1">💥</span>
                    <h2 className="text-lg font-bold text-rose-400 mb-1">Absturz!</h2>
                    <p className="text-xs text-zinc-300 mb-4">
                      Erreichte Tore: <span className="font-bold text-white text-base">{score}</span>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        jump();
                      }}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Erneut Versuchen</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-1">👾</span>
                    <h2 className="text-base font-bold text-white mb-1">Flappy Obsidian</h2>
                    <p className="text-xs text-zinc-400 mb-4 max-w-[200px]">
                      Klicke oder drücke Leertaste zum Springen
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlaying(true);
                        jump();
                      }}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Starten</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats Box */}
          <div className="flex flex-col gap-3 w-full max-w-[220px]">
            <div className="p-4 rounded-xl bg-[#14141e] border border-white/10 text-center">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">Punkte</span>
              <span className="text-2xl font-black text-white font-mono">{score}</span>
            </div>

            <div className="p-4 rounded-xl bg-[#14141e] border border-purple-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-purple-400 block">Highscore</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{highScore}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#14141e] border border-white/10 text-center text-xs text-zinc-400">
              💡 Tipp: Fliege durch die Tore, ohne die Laser-Säulen zu berühren!
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard View */
        <div className="flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Flappy Obsidian Bestenliste</span>
            </h2>
            <p className="text-[11px] text-zinc-400">Cloud synchronisiert mit Firestore</p>
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
                  <span className="text-xs font-mono font-bold text-purple-300">{item.score} Tore</span>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-xs text-zinc-500">
                Noch keine Einträge. Fliege durch Tore und trage dich ein!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
