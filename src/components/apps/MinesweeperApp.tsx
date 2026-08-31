import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Bomb,
  Flag,
  RotateCcw,
  Trophy,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type Difficulty = 'beginner' | 'intermediate' | 'expert';

const DIFFICULTY_CONFIG = {
  beginner: { rows: 9, cols: 9, mines: 10, name: 'Anfänger (9x9)' },
  intermediate: { rows: 16, cols: 16, mines: 40, name: 'Fortgeschritten (16x16)' },
  expert: { rows: 16, cols: 30, mines: 99, name: 'Cyber-Experte (30x16)' },
};

export const MinesweeperApp: React.FC = () => {
  const { sounds, currentUser, accentConfig } = useOS();

  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [flagMode, setFlagMode] = useState(false); // for touch / easy toggle
  const [flagsRemaining, setFlagsRemaining] = useState(10);
  const [seconds, setSeconds] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem(`obsidian_minesweeper_best_${difficulty}`);
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  const { rows, cols, mines } = DIFFICULTY_CONFIG[difficulty];

  // Initialize fresh empty board
  const initBoard = useCallback(() => {
    const newBoard: CellState[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: CellState[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameStatus('idle');
    setFlagsRemaining(mines);
    setSeconds(0);
  }, [rows, cols, mines]);

  useEffect(() => {
    initBoard();
    try {
      const saved = localStorage.getItem(`obsidian_minesweeper_best_${difficulty}`);
      setBestTime(saved ? parseInt(saved, 10) : null);
    } catch {
      setBestTime(null);
    }
  }, [difficulty, initBoard]);

  // Timer tick
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  // First click mine generation (safe first click)
  const populateMines = (startRow: number, startCol: number, currentBoard: CellState[][]) => {
    let placed = 0;
    const b = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);

      // Don't place mine on clicked cell or immediate neighbors
      if (Math.abs(r - startRow) <= 1 && Math.abs(c - startCol) <= 1) continue;
      if (b[r][c].isMine) continue;

      b[r][c].isMine = true;
      placed++;
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (b[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && b[nr][nc].isMine) {
              count++;
            }
          }
        }
        b[r][c].neighborMines = count;
      }
    }
    return b;
  };

  // Reveal cell with recursive flood fill
  const revealCell = (r: number, c: number, overrideFlag = false) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return;

    // Handle flag mode
    if ((flagMode || overrideFlag) && gameStatus === 'playing') {
      toggleFlag(r, c);
      return;
    }

    let currentBoard = board;

    // First click setup
    if (gameStatus === 'idle') {
      currentBoard = populateMines(r, c, board);
      setGameStatus('playing');
    }

    if (currentBoard[r][c].isFlagged || currentBoard[r][c].isRevealed) return;

    sounds.playClick();
    const newBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })));

    // Stepped on mine!
    if (newBoard[r][c].isMine) {
      // Reveal all mines
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (newBoard[row][col].isMine) {
            newBoard[row][col].isRevealed = true;
          }
        }
      }
      setBoard(newBoard);
      setGameStatus('lost');
      sounds.playError();
      return;
    }

    // Flood fill
    const stack: [number, number][] = [[r, c]];
    newBoard[r][c].isRevealed = true;

    while (stack.length > 0) {
      const [currR, currC] = stack.pop()!;
      if (newBoard[currR][currC].neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currR + dr;
            const nc = currC + dc;
            if (
              nr >= 0 &&
              nr < rows &&
              nc >= 0 &&
              nc < cols &&
              !newBoard[nr][nc].isRevealed &&
              !newBoard[nr][nc].isFlagged &&
              !newBoard[nr][nc].isMine
            ) {
              newBoard[nr][nc].isRevealed = true;
              if (newBoard[nr][nc].neighborMines === 0) {
                stack.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    // Check Win Condition
    let unrevealedSafeCells = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (!newBoard[row][col].isMine && !newBoard[row][col].isRevealed) {
          unrevealedSafeCells++;
        }
      }
    }

    setBoard(newBoard);

    if (unrevealedSafeCells === 0) {
      setGameStatus('won');
      sounds.playSuccess();
      const finalTime = seconds;
      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        try {
          localStorage.setItem(`obsidian_minesweeper_best_${difficulty}`, finalTime.toString());
        } catch {}
        if (currentUser) {
          // Score is calculated inversely as 10000 / time for leaderboard sorting
          const scorePoints = Math.max(10, Math.floor(50000 / (finalTime + 5)));
          FirebaseService.saveGameScore(`minesweeper_${difficulty}`, currentUser.id, currentUser.displayName, scorePoints);
        }
      }
    }
  };

  // Toggle Flag
  const toggleFlag = (r: number, c: number) => {
    if (gameStatus !== 'playing' && gameStatus !== 'idle') return;
    if (board[r][c].isRevealed) return;

    sounds.playClick();
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const currentlyFlagged = newBoard[r][c].isFlagged;

    if (!currentlyFlagged && flagsRemaining <= 0) return;

    newBoard[r][c].isFlagged = !currentlyFlagged;
    setFlagsRemaining((prev) => (currentlyFlagged ? prev + 1 : prev - 1));
    setBoard(newBoard);
  };

  const getNumberColor = (count: number) => {
    switch (count) {
      case 1:
        return 'text-blue-400 font-bold';
      case 2:
        return 'text-emerald-400 font-bold';
      case 3:
        return 'text-rose-400 font-bold';
      case 4:
        return 'text-purple-400 font-bold';
      case 5:
        return 'text-amber-400 font-bold';
      case 6:
        return 'text-cyan-400 font-bold';
      case 7:
        return 'text-pink-400 font-bold';
      case 8:
        return 'text-white font-black';
      default:
        return 'text-zinc-500';
    }
  };

  return (
    <div id="minesweeper-app" className="flex flex-col h-full w-full bg-[#09090e] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#11111a] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            💣
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Matrix Minensucher</h1>
            <p className="text-[10px] text-zinc-400">Taktisches Minenräum-System</p>
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="flex bg-[#161622] p-1 rounded-xl border border-white/10 text-xs">
          {(['beginner', 'intermediate', 'expert'] as const).map((diff) => (
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
              {diff === 'beginner' ? 'Leicht' : diff === 'intermediate' ? 'Mittel' : 'Schwer'}
            </button>
          ))}
        </div>
      </div>

      {/* Status Bar: Mines Counter, Face Emoji, Timer & Flag Mode */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-[#0e0e16] border-b border-zinc-800 shrink-0">
        {/* Mine Counter */}
        <div className="flex items-center gap-2 bg-[#161622] px-3.5 py-1.5 rounded-xl border border-white/5 font-mono text-sm font-black text-rose-400 shadow-inner">
          <Bomb className="w-3.5 h-3.5" />
          <span>{String(flagsRemaining).padStart(3, '0')}</span>
        </div>

        {/* Smiley Reset Button */}
        <button
          onClick={initBoard}
          className="w-10 h-10 rounded-2xl bg-[#1c1c2b] hover:bg-[#28283d] active:scale-95 border border-white/10 flex items-center justify-center text-xl shadow-lg transition-all"
        >
          {gameStatus === 'won' ? '😎' : gameStatus === 'lost' ? '😵' : gameStatus === 'playing' ? '🧐' : '🙂'}
        </button>

        {/* Live Timer */}
        <div className="flex items-center gap-2 bg-[#161622] px-3.5 py-1.5 rounded-xl border border-white/5 font-mono text-sm font-black text-amber-400 shadow-inner">
          <Clock className="w-3.5 h-3.5" />
          <span>{String(Math.min(999, seconds)).padStart(3, '0')}s</span>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center bg-[#07070b]">
        <div
          className="inline-grid gap-1 p-3 rounded-2xl bg-[#12121c] border border-purple-500/20 shadow-2xl"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => (
              <button
                key={`${rIdx}-${cIdx}`}
                onClick={() => revealCell(rIdx, cIdx)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(rIdx, cIdx);
                }}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all ${
                  cell.isRevealed
                    ? cell.isMine
                      ? 'bg-rose-600/90 text-white shadow-lg animate-pulse'
                      : 'bg-[#181826] border border-white/5 shadow-inner'
                    : 'bg-[#222233] hover:bg-[#2c2c42] active:bg-[#1a1a28] border border-white/10 shadow-md'
                }`}
              >
                {cell.isRevealed ? (
                  cell.isMine ? (
                    '💣'
                  ) : cell.neighborMines > 0 ? (
                    <span className={getNumberColor(cell.neighborMines)}>{cell.neighborMines}</span>
                  ) : null
                ) : cell.isFlagged ? (
                  <Flag className="w-3.5 h-3.5 text-rose-400 fill-rose-400 drop-shadow" />
                ) : null}
              </button>
            ))
          )}
        </div>

        {/* Mobile / Toggle Flag Mode Toolbar */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => {
              setFlagMode((prev) => !prev);
              sounds.playClick();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              flagMode
                ? 'bg-rose-600/30 border-rose-500 text-rose-300 shadow-lg'
                : 'bg-[#14141e] border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Flagge setzen: {flagMode ? 'AKTIV' : 'Inaktiv'}</span>
          </button>

          {bestTime !== null && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20">
              <Trophy className="w-3.5 h-3.5" />
              <span>Rekord: {bestTime}s</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
