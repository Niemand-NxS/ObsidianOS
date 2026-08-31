import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { RotateCcw, Trophy, Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

type Board = number[][];

const BOARD_SIZE = 4;

export const Retro2048App: React.FC = () => {
  const { sounds, accentConfig, addNotification, saveGameState, loadGameState, getGameSaveInfo } = useOS();

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
    const saved = localStorage.getItem('obsidian_2048_best');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [gameOver, setGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Sync state with cloud save on mount if available
  useEffect(() => {
    const info = getGameSaveInfo('retro-2048');
    if (info) {
      if (info.highScore && info.highScore > bestScore) {
        setBestScore(info.highScore);
      }
      if (info.state && Array.isArray(info.state.board)) {
        setBoard(info.state.board);
        if (typeof info.state.score === 'number') setScore(info.state.score);
      }
    }
  }, [getGameSaveInfo]);

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

  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (gameOver) return;

      let hasChanged = false;
      let newScore = score;
      const newBoard = board.map((row) => [...row]);

      const slide = (row: number[]) => {
        let arr = row.filter((val) => val !== 0);
        for (let i = 0; i < arr.length - 1; i++) {
          if (arr[i] === arr[i + 1]) {
            arr[i] *= 2;
            newScore += arr[i];
            arr[i + 1] = 0;
            if (arr[i] === 2048 && !hasWon) {
              setHasWon(true);
              sounds.playSuccess();
              addNotification('Glückwunsch!', 'Du hast die 2048-Kachel erreicht!', 'success', '2048');
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
          newBoard[r] = slide(newBoard[r]);
          if (oldRow.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < BOARD_SIZE; r++) {
          const oldRow = [...newBoard[r]];
          newBoard[r] = slide(newBoard[r].reverse()).reverse();
          if (oldRow.some((val, idx) => val !== newBoard[r][idx])) hasChanged = true;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const slided = slide(col);
          for (let r = 0; r < BOARD_SIZE; r++) {
            if (newBoard[r][c] !== slided[r]) hasChanged = true;
            newBoard[r][c] = slided[r];
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]].reverse();
          const slided = slide(col).reverse();
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

        // Save progress to persistent cloud / local state
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

  const handleReset = () => {
    sounds.playClick();
    const freshBoard = initGame();
    setBoard(freshBoard);
    setScore(0);
    setGameOver(false);
    setHasWon(false);
    saveGameState(
      'retro-2048',
      { board: freshBoard, score: 0 },
      0,
      undefined,
      `Highscore: ${bestScore}`
    );
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2:
        return 'bg-[#222230] text-zinc-200 border-zinc-700';
      case 4:
        return 'bg-[#28283a] text-zinc-100 border-zinc-600';
      case 8:
        return 'bg-purple-950/80 text-purple-200 border-purple-800 shadow-purple-900/30';
      case 16:
        return 'bg-purple-900 text-purple-100 border-purple-700 shadow-purple-800/40';
      case 32:
        return 'bg-indigo-900 text-indigo-100 border-indigo-700 shadow-indigo-800/40';
      case 64:
        return 'bg-blue-900 text-blue-100 border-blue-700 shadow-blue-800/40';
      case 128:
        return 'bg-teal-900 text-teal-100 border-teal-600 shadow-teal-800/50';
      case 256:
        return 'bg-emerald-900 text-emerald-100 border-emerald-600 shadow-emerald-800/50';
      case 512:
        return 'bg-amber-900 text-amber-100 border-amber-600 shadow-amber-800/60 font-bold';
      case 1024:
        return 'bg-orange-900 text-orange-100 border-orange-500 shadow-orange-800/70 font-extrabold';
      case 2048:
        return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-white shadow-purple-500/80 font-black';
      default:
        return 'bg-[#181822] text-zinc-600 border-transparent';
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0e] text-[#f4f4f5] select-none p-5 items-center justify-between font-sans">
      {/* Top Header & Scores */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            2048 <span className="text-xs px-2 py-0.5 rounded-full bg-purple-900/50 text-purple-300 border border-purple-500/30 font-mono">Retro</span>
          </h1>
          <p className="text-[11px] text-zinc-400">Nutze Pfeiltasten oder WASD</p>
        </div>

        <div className="flex gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#14141d] border border-[#27272a] text-center">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Punkte</span>
            <span className="text-xs font-mono font-bold text-purple-300">{score}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#14141d] border border-[#27272a] text-center">
            <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold block">Rekord</span>
            <span className="text-xs font-mono font-bold text-amber-300">{bestScore}</span>
          </div>
        </div>
      </div>

      {/* 2048 Game Board */}
      <div className="relative p-3 rounded-2xl bg-[#121218] border border-[#27272a] shadow-2xl w-full max-w-sm aspect-square flex flex-col justify-between">
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 h-full w-full">
          {board.map((row, r) =>
            row.map((cell, c) => (
              <motion.div
                key={`${r}-${c}`}
                layout
                className={`rounded-xl border flex items-center justify-center font-bold font-mono transition-colors shadow-sm ${
                  cell > 0 ? getTileColor(cell) : 'bg-[#181824]/60 border-zinc-800/40 text-transparent'
                }`}
              >
                {cell > 0 ? (
                  <span className={`${cell >= 1000 ? 'text-sm' : cell >= 100 ? 'text-base' : 'text-xl'}`}>
                    {cell}
                  </span>
                ) : (
                  ''
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
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2"
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
          className="px-3.5 py-1.5 rounded-xl bg-[#181824] hover:bg-[#222232] border border-[#27272a] text-xs text-zinc-300 hover:text-white flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Neues Spiel
        </button>

        <div className="flex gap-1.5">
          {(['up', 'left', 'down', 'right'] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => move(dir)}
              className="w-8 h-8 rounded-xl bg-[#14141d] hover:bg-[#20202e] border border-[#27272a] text-zinc-300 text-xs font-bold flex items-center justify-center capitalize"
            >
              {dir === 'up' ? '↑' : dir === 'left' ? '←' : dir === 'down' ? '↓' : '→'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
