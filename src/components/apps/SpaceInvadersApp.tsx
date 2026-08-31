import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import { Trophy, RotateCcw, Play, Heart, Zap, ArrowLeft, ArrowRight, Crosshair } from 'lucide-react';

interface Invader {
  x: number;
  y: number;
  type: 1 | 2 | 3;
  alive: boolean;
}

interface Bullet {
  x: number;
  y: number;
  isEnemy: boolean;
}

interface ShieldBlock {
  x: number;
  y: number;
  hp: number;
}

export const SpaceInvadersApp: React.FC = () => {
  const { sounds, currentUser, accentConfig, saveGameState, getGameSaveInfo } = useOS();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [highScore, setHighScore] = useState<number>(() => {
    const savedInfo = getGameSaveInfo('space-invaders');
    if (savedInfo && typeof savedInfo.highScore === 'number') {
      return savedInfo.highScore;
    }
    try {
      const saved = localStorage.getItem('obsidian_space_invaders_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Game Engine State in ref for 60fps smooth loop
  const stateRef = useRef({
    playerX: 180,
    bullets: [] as Bullet[],
    invaders: [] as Invader[],
    invaderDir: 1,
    invaderStepDown: false,
    invaderSpeed: 1.2,
    shields: [] as ShieldBlock[],
    ufo: null as { x: number; y: number; speed: number } | null,
    keys: { left: false, right: false, shoot: false },
    lastShotTime: 0,
    frames: 0,
    score: 0,
    lives: 3,
    wave: 1,
  });

  const loadLeaderboard = useCallback(async () => {
    const res = await FirebaseService.getGameLeaderboard('space_invaders', 8);
    if (res.success && res.scores) {
      setLeaderboard(res.scores);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Init Invaders and Shields
  const initGame = useCallback((nextWave = 1, currentScore = 0) => {
    const invaders: Invader[] = [];
    const rows = 4;
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        invaders.push({
          x: 35 + c * 38,
          y: 40 + r * 28,
          type: (r === 0 ? 3 : r <= 2 ? 2 : 1) as 1 | 2 | 3,
          alive: true,
        });
      }
    }

    // Create 3 shields
    const shields: ShieldBlock[] = [];
    [60, 175, 290].forEach((baseX) => {
      for (let sx = 0; sx < 4; sx++) {
        for (let sy = 0; sy < 3; sy++) {
          shields.push({
            x: baseX + sx * 8,
            y: 340 + sy * 8,
            hp: 3,
          });
        }
      }
    });

    stateRef.current = {
      playerX: 180,
      bullets: [],
      invaders,
      invaderDir: 1,
      invaderStepDown: false,
      invaderSpeed: 0.9 + nextWave * 0.3,
      shields,
      ufo: null,
      keys: { left: false, right: false, shoot: false },
      lastShotTime: 0,
      frames: 0,
      score: currentScore,
      lives: 3,
      wave: nextWave,
    };

    setScore(currentScore);
    setLives(3);
    setWave(nextWave);
    setIsGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        stateRef.current.keys.left = true;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        stateRef.current.keys.right = true;
      } else if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        e.preventDefault();
        stateRef.current.keys.shoot = true;
        if (!isPlaying && !isGameOver) {
          initGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        stateRef.current.keys.left = false;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        stateRef.current.keys.right = false;
      } else if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        stateRef.current.keys.shoot = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying, isGameOver, initGame]);

  // Touch controls
  const handleTouchShoot = () => {
    const now = Date.now();
    if (now - stateRef.current.lastShotTime > 250) {
      stateRef.current.bullets.push({
        x: stateRef.current.playerX + 13,
        y: 380,
        isEnemy: false,
      });
      stateRef.current.lastShotTime = now;
      sounds.playClick();
    }
  };

  // Main Game Loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const state = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      if (isPlaying && !isGameOver && !isVictory) {
        state.frames++;

        // Player movement
        if (state.keys.left && state.playerX > 10) state.playerX -= 4.5;
        if (state.keys.right && state.playerX < width - 40) state.playerX += 4.5;

        // Player shooting
        if (state.keys.shoot) {
          const now = Date.now();
          if (now - state.lastShotTime > 280) {
            state.bullets.push({
              x: state.playerX + 14,
              y: 380,
              isEnemy: false,
            });
            state.lastShotTime = now;
            sounds.playClick();
          }
        }

        // Spawn UFO occasionally
        if (state.frames % 700 === 0 && !state.ufo) {
          state.ufo = { x: -30, y: 15, speed: 2.2 };
        }

        if (state.ufo) {
          state.ufo.x += state.ufo.speed;
          if (state.ufo.x > width + 30) state.ufo = null;
        }

        // Move Invaders
        let hitEdge = false;
        const aliveInvaders = state.invaders.filter((inv) => inv.alive);

        if (aliveInvaders.length === 0) {
          // Wave complete!
          setIsVictory(true);
          sounds.playSuccess();
          setTimeout(() => {
            initGame(state.wave + 1, state.score + 500);
          }, 1500);
          return;
        }

        // Speed up as fewer invaders remain
        const dynamicSpeed = state.invaderSpeed * (1 + (32 - aliveInvaders.length) / 32);

        aliveInvaders.forEach((inv) => {
          inv.x += state.invaderDir * dynamicSpeed;
          if (inv.x > width - 35 || inv.x < 10) {
            hitEdge = true;
          }

          // Enemy shoot chance
          if (Math.random() < 0.003 && state.bullets.filter((b) => b.isEnemy).length < 5) {
            state.bullets.push({
              x: inv.x + 12,
              y: inv.y + 16,
              isEnemy: true,
            });
          }

          // Invader reaches shields/player
          if (inv.y > 340) {
            setIsGameOver(true);
            sounds.playError();
          }
        });

        if (hitEdge) {
          state.invaderDir *= -1;
          aliveInvaders.forEach((inv) => {
            inv.y += 14;
          });
        }

        // Update Bullets
        for (let i = state.bullets.length - 1; i >= 0; i--) {
          const b = state.bullets[i];
          if (b.isEnemy) {
            b.y += 3.8;
            // Hit Player
            if (
              b.y >= 385 &&
              b.y <= 405 &&
              b.x >= state.playerX - 2 &&
              b.x <= state.playerX + 30
            ) {
              state.bullets.splice(i, 1);
              state.lives -= 1;
              setLives(state.lives);
              sounds.playError();

              if (state.lives <= 0) {
                setIsGameOver(true);
                // Check highscore
                if (state.score > highScore) {
                  setHighScore(state.score);
                  try {
                    localStorage.setItem('obsidian_space_invaders_highscore', state.score.toString());
                  } catch {}
                  saveGameState('space-invaders', { highScore: state.score, wave: stateRef.current.wave || 1 }, state.score, undefined, `Welle ${stateRef.current.wave || 1} - Score: ${state.score}`);
                  if (currentUser) {
                    FirebaseService.saveGameScore('space_invaders', currentUser.id, currentUser.displayName, state.score);
                  }
                } else {
                  saveGameState('space-invaders', { lastScore: state.score }, state.score, undefined, `Score: ${state.score}`);
                }
              }
              continue;
            }
          } else {
            b.y -= 7.0;

            // Hit UFO
            if (state.ufo && b.y <= 30 && b.x >= state.ufo.x && b.x <= state.ufo.x + 36) {
              state.bullets.splice(i, 1);
              state.ufo = null;
              state.score += 300;
              setScore(state.score);
              sounds.playSuccess();
              continue;
            }

            // Hit Invaders
            let bulletRemoved = false;
            for (const inv of state.invaders) {
              if (inv.alive && b.x >= inv.x && b.x <= inv.x + 24 && b.y >= inv.y && b.y <= inv.y + 20) {
                inv.alive = false;
                state.bullets.splice(i, 1);
                bulletRemoved = true;
                const points = inv.type === 3 ? 40 : inv.type === 2 ? 20 : 10;
                state.score += points;
                setScore(state.score);
                sounds.playClick();
                break;
              }
            }
            if (bulletRemoved) continue;
          }

          // Hit Shields
          for (let sIdx = state.shields.length - 1; sIdx >= 0; sIdx--) {
            const sh = state.shields[sIdx];
            if (sh.hp > 0 && b.x >= sh.x && b.x <= sh.x + 8 && b.y >= sh.y && b.y <= sh.y + 8) {
              sh.hp -= 1;
              state.bullets.splice(i, 1);
              break;
            }
          }

          if (b.y < -10 || b.y > height + 10) {
            state.bullets.splice(i, 1);
          }
        }
      }

      // 1. Draw Canvas Background
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, width, height);

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 25; i++) {
        const sx = ((i * 73) % width);
        const sy = ((i * 127 + state.frames * 0.2) % height);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // 2. Draw UFO
      if (state.ufo) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f43f5e';
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.ellipse(state.ufo.x + 18, state.ufo.y + 8, 16, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. Draw Invaders
      state.invaders.forEach((inv) => {
        if (!inv.alive) return;
        ctx.shadowBlur = 6;
        if (inv.type === 3) {
          ctx.shadowColor = '#ec4899';
          ctx.fillStyle = '#f472b6';
        } else if (inv.type === 2) {
          ctx.shadowColor = '#a855f7';
          ctx.fillStyle = '#c084fc';
        } else {
          ctx.shadowColor = '#3b82f6';
          ctx.fillStyle = '#60a5fa';
        }

        // Alien shape
        ctx.beginPath();
        ctx.roundRect(inv.x, inv.y, 22, 16, 4);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(inv.x + 4, inv.y + 4, 3, 3);
        ctx.fillRect(inv.x + 15, inv.y + 4, 3, 3);
      });
      ctx.shadowBlur = 0;

      // 4. Draw Shields
      state.shields.forEach((sh) => {
        if (sh.hp <= 0) return;
        ctx.fillStyle = sh.hp === 3 ? '#22c55e' : sh.hp === 2 ? '#eab308' : '#ef4444';
        ctx.fillRect(sh.x, sh.y, 7, 7);
      });

      // 5. Draw Bullets
      state.bullets.forEach((b) => {
        if (b.isEnemy) {
          ctx.fillStyle = '#f43f5e';
          ctx.shadowColor = '#f43f5e';
          ctx.shadowBlur = 6;
          ctx.fillRect(b.x, b.y, 2.5, 8);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.fillRect(b.x, b.y, 3, 10);
        }
        ctx.shadowBlur = 0;
      });

      // 6. Draw Player Spaceship
      ctx.shadowBlur = 12;
      ctx.shadowColor = accentConfig.primary;
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      // Spaceship triangle + base
      ctx.moveTo(state.playerX + 14, 382);
      ctx.lineTo(state.playerX + 28, 404);
      ctx.lineTo(state.playerX, 404);
      ctx.closePath();
      ctx.fill();

      // Cannons
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(state.playerX + 4, 396, 3, 8);
      ctx.fillRect(state.playerX + 21, 396, 3, 8);
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isGameOver, isVictory, highScore, currentUser, sounds, accentConfig, initGame]);

  return (
    <div id="space-invaders-app" className="flex flex-col h-full w-full bg-[#08080c] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            🛸
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Obsidian Galaxy Raider</h1>
            <p className="text-[10px] text-zinc-400">Retro Arcade Shoot &apos;em Up</p>
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
          {/* Game Canvas Container */}
          <div className="relative p-2 rounded-2xl bg-[#12121a] border border-purple-500/20 shadow-2xl">
            <canvas
              ref={canvasRef}
              width={380}
              height={420}
              className="rounded-xl border border-zinc-800 bg-[#06060c] shadow-inner"
            />

            {/* Overlays */}
            {(!isPlaying || isGameOver || isVictory) && (
              <div className="absolute inset-2 rounded-xl bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                {isGameOver ? (
                  <>
                    <span className="text-3xl mb-1">💥</span>
                    <h2 className="text-lg font-bold text-rose-400 mb-1">Verteidigung Durchbrochen!</h2>
                    <p className="text-xs text-zinc-300 mb-4">
                      Erreichte Punktzahl: <span className="font-bold text-white text-base">{score}</span> (Welle {wave})
                    </p>
                    <button
                      onClick={() => initGame(1, 0)}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Erneut Verteidigen</span>
                    </button>
                  </>
                ) : isVictory ? (
                  <>
                    <span className="text-3xl mb-1">🎉</span>
                    <h2 className="text-lg font-bold text-emerald-400 mb-1">Welle {wave} Abgewehrt!</h2>
                    <p className="text-xs text-zinc-300">Bereite dich auf die nächste Flotte vor...</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl mb-1">👾</span>
                    <h2 className="text-base font-bold text-white mb-1">Obsidian Galaxy Raider</h2>
                    <p className="text-xs text-zinc-400 mb-4 max-w-[220px]">
                      Bewege dich mit A/D oder Pfeiltasten, schieße mit Leertaste!
                    </p>
                    <button
                      onClick={() => initGame(1, 0)}
                      className="px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-lg transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: accentConfig.primary }}
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Mission Starten</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Stats & Control Panel */}
          <div className="flex flex-col gap-3 w-full max-w-[240px]">
            {/* Lives & Wave */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#14141e] border border-white/10">
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`w-4 h-4 ${i < lives ? 'text-rose-500 fill-rose-500' : 'text-zinc-700'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-purple-300">Welle {wave}</span>
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[#14141e] border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">Punkte</span>
                <span className="text-lg font-black text-white font-mono">{score}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#14141e] border border-purple-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">Highscore</span>
                <span className="text-lg font-black text-amber-400 font-mono">{highScore}</span>
              </div>
            </div>

            {/* Mobile / Onscreen Controls */}
            <div className="p-3 rounded-xl bg-[#14141e] border border-white/10 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onPointerDown={() => (stateRef.current.keys.left = true)}
                  onPointerUp={() => (stateRef.current.keys.left = false)}
                  className="w-11 h-11 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onPointerDown={() => (stateRef.current.keys.right = true)}
                  onPointerUp={() => (stateRef.current.keys.right = false)}
                  className="w-11 h-11 rounded-xl bg-[#20202e] hover:bg-purple-600 active:scale-90 text-white flex items-center justify-center shadow"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={handleTouchShoot}
                className="flex-1 h-11 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white flex items-center justify-center gap-1 text-xs font-bold shadow-lg"
              >
                <Crosshair className="w-4 h-4" />
                <span>Feuer!</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard View */
        <div className="flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Galaxy Raider Bestenliste</span>
            </h2>
            <p className="text-[11px] text-zinc-400">Synchronisiert via Firebase</p>
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
                    <span className="text-xs font-bold text-white">{item.userName || 'Commander'}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">{item.score} Pkt.</span>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-xs text-zinc-500">
                Noch keine Einträge. Besiege Alien-Wellen und sichere dir Rang 1!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
