import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { RotateCcw, Trophy, Award, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Board = number[][];

const BOARD_SIZE = 4;

export const Retro2048App: React.FC = () => {
  const { sounds, accentConfig, addNotification, saveGameState, loadGameState, getGameSaveInfo, effectiveTheme, effectiveGlassContrast } = useOS();

  const isLightMode = effectiveTheme === 'light' || (effectiveTheme === 'glassy' && effectiveGlassContrast === 'dark');

  const getEmptyBoard = (): Board => [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  const addRandomTile = (currentBoard: Board): Board => {
    const emptyCells: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === 0) emptyCells.push({ r, c });
      });
    });

    if (emptyCells.length === 0) return currentBoard;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  };

  const initGame = (): Board => {
    let board = getEmptyBoard();
    board = addRandomTile(board);
    board = addRandomTile(board);
    return board;
  };

  const [board, setBoard] = useState<Board>(() => {
    const savedState = loadGameState('retro-2048');
    if (savedState && Array.isArray(savedState.board)) {
      return savedState.board;
    }
    return initGame();
  });

  const [score, setScore] = useState<number>(() => {
    const savedState = loadGameState('retro-2048');
    return savedState && typeof savedState.score === 'number' ? savedState.score : 0;
  });

  const [bestScore, setBestScore] = useState<number>(() => {
    const info = getGameSaveInfo('retro-2048');
    if (info && typeof info.highScore === 'number') {
      return info.highScore;
    }
    const savedLocal = localStorage.getItem('obsidian_2048_best');
    return savedLocal ? parseInt(savedLocal, 10) : 0;
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Touch & Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Check Game Over
  const checkGameOver = (currentBoard: Board): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === 0) return false;
        if (c < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r][c + 1]) return false;
        if (r < BOARD_SIZE - 1 && currentBoard[r][c] === currentBoard[r + 1][c]) return false;
      }
    }
    return true;
  };

  // Slide & Merge 1D array
  const slide = (row: number[]): number[] => {
    let arr = row.filter((val) => val !== 0);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        arr[i + 1] = 0;
        if (arr[i] === 2048 && !hasWon) {
          setHasWon(true);
          sounds.playSuccess();
          addNotification('Glückwunsch!', 'Du hast das 2048-Feld erreicht!', 'success', '2048');
        }
      }
    }
    arr = arr.filter((val) => val !== 0);
    while (arr.length < BOARD_SIZE) {
      arr.push(0);
    }
    return arr;
  };

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver) return;

      let newBoard = board.map((row) => [...row]);
      let hasChanged = false;
      let addedScore = 0;

      const slideAndScore = (line: number[]) => {
        let arr = line.filter((val) => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            const merged = arr[i] * 2;
            arr[i] = merged;
            addedScore += merged;
            arr[i + 1] = 0;
            if (merged === 2048 && !hasWon) {
              setHasWon(true);
              sounds.playSuccess();
              addNotification('Glückwunsch!', 'Du hast das 2048-Feld erreicht!', 'success', '2048');
            }
          }
        }
        arr = arr.filter((val) => val !== 0);
        while (arr.length < BOARD_SIZE) {
          arr.push(0);
        }
        return arr;
      };

      if (direction === 'left') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const oldRow = [...newBoard[r]];
          newBoard[r] = slideAndScore(newBoard[r]);
          if (oldRow.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const oldRow = [...newBoard[r]];
          newBoard[r] = slideAndScore(newBoard[r].reverse()).reverse();
          if (oldRow.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const slided = slideAndScore(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[r][c] !== slided[r]) hasChanged = true;
            newBoard[r][c] = slided[r];
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]].reverse();
          const slided = slideAndScore(col).reverse();
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[r][c] !== slided[r]) hasChanged = true;
            newBoard[r][c] = slided[r];
          }
        }
      }

      if (hasChanged) {
        sounds.playClick();
        const boardWithTile = addRandomTile(newBoard);
        setBoard(boardWithTile);
        const newScore = score + addedScore;
        setScore(newScore);
        const newBest = Math.max(bestScore, newScore);
        if (newScore > bestScore) {
          setBestScore(newScore);
          localStorage.setItem('obsidian_2048_best', newScore.toString());
        }
        const isOver = checkGameOver(boardWithTile);
        if (isOver) {
          setGameOver(true);
          sounds.playClose();
          addNotification('Spiel vorbei', `Punktzahl: ${newScore}`, 'info', '2048');
        }

        // Save progress to persistent state
        saveGameState(
          'retro-2048',
          { board: boardWithTile, score: newScore },
          newScore,
          undefined,
          `Highscore: ${newBest} | Aktuell: ${newScore}`
        );
      }
    },
    [board, score, bestScore, gameOver, hasWon, sounds, addNotification, saveGameState]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        move('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        move('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        move('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        move('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Swipe handling for Mobile / Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartRef.current.x;
    const deltaY = endY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Minimum swipe threshold
    if (Math.max(absX, absY) < 30) return;

    if (absX > absY) {
      if (deltaX > 0) {
        move('right');
      } else {
        move('left');
      }
    } else {
      if (deltaY > 0) {
        move('down');
      } else {
        move('up');
      }
    }
  };

  // Pointer swipe handling for pointer devices / stylus
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return;
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    pointerStartRef.current = null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < 35) return;

    if (absX > absY) {
      if (deltaX > 0) move('right');
      else move('left');
    } else {
      if (deltaY > 0) move('down');
      else move('up');
    }
  };

  const handleReset = () => {
    const newBoard = initGame();
    setBoard(newBoard);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    sounds.playOpen();
    saveGameState('retro-2048', { board: newBoard, score: 0 }, 0);
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-zinc-800/80 text-zinc-100 border-zinc-700/60';
      case 4:
        return 'bg-zinc-700/80 text-zinc-50 border-zinc-600/70';
      case 8:
        return 'bg-purple-950/80 text-purple-200 border-purple-800/80 shadow-[0_0_12px_rgba(168,85,247,0.2)]';
      case 16:
        return 'bg-purple-900/90 text-purple-100 border-purple-700 shadow-[0_0_16px_rgba(168,85,247,0.3)]';
      case 32:
        return 'bg-indigo-900/90 text-indigo-100 border-indigo-600 shadow-[0_0_18px_rgba(99,102,241,0.35)]';
      case 64:
        return 'bg-blue-900/90 text-blue-100 border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.4)]';
      case 128:
        return 'bg-cyan-900/90 text-cyan-100 border-cyan-500 shadow-[0_0_22px_rgba(6,182,212,0.45)]';
      case 256:
        return 'bg-emerald-900/90 text-emerald-100 border-emerald-500 shadow-[0_0_24px_rgba(16,185,129,0.5)]';
      case 512:
        return 'bg-amber-900/90 text-amber-100 border-amber-500 shadow-[0_0_26px_rgba(245,158,11,0.5)]';
      case 1024:
        return 'bg-orange-800/90 text-orange-100 border-orange-500 shadow-[0_0_28px_rgba(249,115,22,0.6)] font-bold';
      case 2048:
        return 'bg-gradient-to-tr from-yellow-600 via-amber-500 to-yellow-300 text-black border-yellow-200 shadow-[0_0_32px_rgba(234,179,8,0.8)] font-black animate-pulse';
      default:
        return 'bg-rose-900/90 text-white border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.7)]';
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full select-none p-4 sm:p-5 items-center justify-between font-sans transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0e] text-[#f4f4f5]'
      }`}
    >
      {/* Top Header & Scores */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            2048{' '}
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30 font-mono">
              Retro
            </span>
          </h1>
          <p className={`text-[11px] ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            Wische auf dem Feld oder nutze WASD / Pfeile
          </p>
        </div>

        <div className="flex gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-center transition-colors ${
              isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14141d] border-[#27272a]'
            }`}
          >
            <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              Punkte
            </span>
            <span className="text-xs font-mono font-bold text-purple-400">{score}</span>
          </div>
          <div
            className={`px-3 py-1.5 rounded-xl border text-center transition-colors ${
              isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14141d] border-[#27272a]'
            }`}
          >
            <span className={`text-[9px] uppercase tracking-wider font-bold block ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              Rekord
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* 2048 Game Board with Touch & Swipe gesture isolation */}
      <div
        className={`relative p-3 rounded-2xl border shadow-2xl w-full max-w-sm aspect-square flex flex-col justify-between touch-none select-none transition-colors ${
          isLightMode ? 'bg-slate-200/80 border-slate-300' : 'bg-[#121218] border-[#27272a]'
        }`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <motion.div
                key={`${r}-${c}`}
                layout
                initial={cell > 0 ? { scale: 0.6, opacity: 0 } : false}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                className={`rounded-xl border flex items-center justify-center font-bold font-mono transition-all shadow-sm ${
                  cell > 0
                    ? getTileColor(cell)
                    : isLightMode
                    ? 'bg-slate-300/60 border-slate-300/70 text-transparent'
                    : 'bg-[#181824]/60 border-zinc-800/40 text-transparent'
                }`}
              >
                {cell > 0 && (
                  <motion.span
                    key={`${cell}-${r}-${c}`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className={`${cell >= 1024 ? 'text-xs sm:text-sm' : cell >= 100 ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'}`}
                  >
                    {cell}
                  </motion.span>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* Game Over / Won Overlay */}
        {(gameOver || hasWon) && (
          <div className="absolute inset-0 rounded-2xl bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
            <h2 className="text-xl font-bold text-white">
              {hasWon ? '2048 Erreicht!' : 'Keine Züge mehr'}
            </h2>
            <p className="text-xs text-zinc-400">Erreichte Punkte: {score}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundColor: accentConfig.primary }}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Erneut spielen
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm flex items-center justify-between pt-2">
        <button
          onClick={handleReset}
          className={`px-3.5 py-1.5 rounded-xl border text-xs flex items-center gap-2 transition-all active:scale-95 ${
            isLightMode
              ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
              : 'bg-[#181824] hover:bg-[#222232] border-[#27272a] text-zinc-300 hover:text-white'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Neues Spiel
        </button>

        {/* Directional buttons for touch tap fallback */}
        <div className="flex gap-1.5">
          {(['up', 'left', 'down', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => move(dir)}
              className={`w-8 h-8 rounded-xl border text-xs font-bold flex items-center justify-center active:scale-90 transition-all ${
                isLightMode
                  ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                  : 'bg-[#14141d] hover:bg-[#20202e] border-[#27272a] text-zinc-300'
              }`}
            >
              {dir === 'up' ? '↑' : dir === 'left' ? '←' : dir === 'down' ? '↓' : '→'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
