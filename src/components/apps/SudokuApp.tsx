import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { FirebaseService } from '../../services/firebaseService';
import {
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Lightbulb,
  Eraser,
  PenTool,
  Undo2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';

interface Cell {
  row: number;
  col: number;
  value: number;
  solution: number;
  isGiven: boolean;
  notes: number[];
  isError: boolean;
}

// Sudoku Generator & Mathematical Solver with 100% Guaranteed Unique Solvability
function getBoxIndex(r: number, c: number): number {
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

function isValidPlacement(board: number[][], r: number, c: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[r][i] === num && i !== c) return false;
    if (board[i][c] === num && i !== r) return false;
  }
  const startRow = Math.floor(r / 3) * 3;
  const startCol = Math.floor(c / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currR = startRow + i;
      const currC = startCol + j;
      if (board[currR][currC] === num && (currR !== r || currC !== c)) {
        return false;
      }
    }
  }
  return true;
}

// Backtracking solver to fill an empty board with a random valid complete board
function solveSudokuRandomized(board: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
        for (const num of nums) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num;
            if (solveSudokuRandomized(board)) return true;
            board[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

// Fast solver with MRV (Minimum Remaining Values) heuristic that counts number of solutions up to limit
function countSolutions(board: number[][], limit = 2): number {
  let count = 0;

  function backtrack(b: number[][]): boolean {
    let minPossibilities = 10;
    let bestR = -1;
    let bestC = -1;
    let bestCandidates: number[] = [];

    // Find the cell with fewest remaining legal numbers (MRV)
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (b[r][c] === 0) {
          const candidates: number[] = [];
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(b, r, c, num)) {
              candidates.push(num);
            }
          }
          if (candidates.length === 0) {
            return false; // Impossible branch
          }
          if (candidates.length < minPossibilities) {
            minPossibilities = candidates.length;
            bestR = r;
            bestC = c;
            bestCandidates = candidates;
            if (minPossibilities === 1) break;
          }
        }
      }
      if (minPossibilities === 1) break;
    }

    // No empty cells left: found a full valid solution!
    if (bestR === -1) {
      count++;
      return count >= limit;
    }

    for (const num of bestCandidates) {
      b[bestR][bestC] = num;
      if (backtrack(b)) return true;
      b[bestR][bestC] = 0;
    }

    return false;
  }

  const copy = board.map((row) => [...row]);
  backtrack(copy);
  return count;
}

function generateCompleteBoard(): number[][] {
  const board: number[][] = Array.from({ length: 9 }, () => Array(9).fill(0));
  solveSudokuRandomized(board);
  return board;
}

// Generate a puzzle that is MATHEMATICALLY GUARANTEED to have exactly 1 unique solution
function generatePuzzle(diff: Difficulty): { puzzle: number[][]; solution: number[][] } {
  let attempts = 0;
  while (attempts < 5) {
    attempts++;
    const solution = generateCompleteBoard();
    const puzzle = solution.map((row) => [...row]);

    // Target clues count depending on difficulty
    let targetClues = 38; // easy
    if (diff === 'medium') targetClues = 32;
    if (diff === 'hard') targetClues = 27;
    if (diff === 'expert') targetClues = 24;

    const targetToRemove = 81 - targetClues;
    let removed = 0;

    // Create all 81 coordinates in random order
    const positions: [number, number][] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push([r, c]);
      }
    }
    positions.sort(() => Math.random() - 0.5);

    // Iteratively remove clues and verify unique solvability
    for (const [r, c] of positions) {
      if (removed >= targetToRemove) break;

      const tempVal = puzzle[r][c];
      puzzle[r][c] = 0;

      // Mathematically verify that removing this clue leaves EXACTLY 1 unique solution
      const numSolutions = countSolutions(puzzle, 2);
      if (numSolutions === 1) {
        removed++;
      } else {
        // If removing caused multiple solutions or unsolvable state, restore the cell
        puzzle[r][c] = tempVal;
      }
    }

    // Final verification check: must have exactly 1 unique solution
    if (countSolutions(puzzle, 2) === 1) {
      return { puzzle, solution };
    }
  }

  // Safe fallback if loop hits attempt limit
  const fallbackSolution = generateCompleteBoard();
  const fallbackPuzzle = fallbackSolution.map((row) => [...row]);
  const positions: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      positions.push([r, c]);
    }
  }
  positions.sort(() => Math.random() - 0.5);
  for (const [r, c] of positions.slice(0, 36)) {
    const backup = fallbackPuzzle[r][c];
    fallbackPuzzle[r][c] = 0;
    if (countSolutions(fallbackPuzzle, 2) !== 1) {
      fallbackPuzzle[r][c] = backup;
    }
  }

  return { puzzle: fallbackPuzzle, solution: fallbackSolution };
}

export const SudokuApp: React.FC = () => {
  const { sounds, currentUser, accentConfig } = useOS();

  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [board, setBoard] = useState<Cell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [score, setScore] = useState(1000);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [history, setHistory] = useState<Cell[][][]>([]);
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard'>('game');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const gameContainerRef = useRef<HTMLDivElement>(null);

  const loadLeaderboard = useCallback(async () => {
    const res = await FirebaseService.getGameLeaderboard('sudoku', 10);
    if (res.success && res.scores) {
      setLeaderboard(res.scores);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  // Start new game
  const initGame = useCallback(
    (diff: Difficulty = difficulty) => {
      const { puzzle, solution } = generatePuzzle(diff);
      const newBoard: Cell[][] = [];

      for (let r = 0; r < 9; r++) {
        const rowCells: Cell[] = [];
        for (let c = 0; c < 9; c++) {
          const val = puzzle[r][c];
          rowCells.push({
            row: r,
            col: c,
            value: val,
            solution: solution[r][c],
            isGiven: val !== 0,
            notes: [],
            isError: false,
          });
        }
        newBoard.push(rowCells);
      }

      setBoard(newBoard);
      setSelectedCell(null);
      setMistakes(0);
      setHintsLeft(3);
      setScore(diff === 'easy' ? 800 : diff === 'medium' ? 1200 : diff === 'hard' ? 1600 : 2200);
      setSeconds(0);
      setIsPaused(false);
      setIsWon(false);
      setIsGameOver(false);
      setHistory([]);
    },
    [difficulty]
  );

  useEffect(() => {
    initGame(difficulty);
  }, [difficulty, initGame]);

  // Timer Tick
  useEffect(() => {
    if (isPaused || isWon || isGameOver || board.length === 0) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isWon, isGameOver, board]);

  // Count remaining numbers (1 to 9)
  const numberCounts = useMemo(() => {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!board.length) return counts;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c].value;
        if (val >= 1 && val <= 9 && !board[r][c].isError) {
          counts[val] = (counts[val] || 0) + 1;
        }
      }
    }
    return counts;
  }, [board]);

  const selectedValue = useMemo(() => {
    if (!selectedCell || !board.length) return null;
    const [r, c] = selectedCell;
    return board[r][c].value || null;
  }, [selectedCell, board]);

  // Check Board Completion
  const checkVictory = useCallback(
    (currentBoard: Cell[][]) => {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentBoard[r][c].value === 0 || currentBoard[r][c].isError) {
            return false;
          }
        }
      }
      return true;
    },
    []
  );

  // Apply Input Number
  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || isWon || isGameOver || isPaused) return;
      const [r, c] = selectedCell;
      const cell = board[r][c];
      if (cell.isGiven) return;

      // Save history for Undo
      setHistory((prev) => [...prev, board.map((row) => row.map((cellItem) => ({ ...cellItem, notes: [...cellItem.notes] })))]);

      const newBoard = board.map((row) => row.map((cellItem) => ({ ...cellItem, notes: [...cellItem.notes] })));

      if (isNoteMode) {
        // Toggle pencil note
        const currentNotes = newBoard[r][c].notes;
        if (currentNotes.includes(num)) {
          newBoard[r][c].notes = currentNotes.filter((n) => n !== num);
        } else {
          newBoard[r][c].notes = [...currentNotes, num].sort((a, b) => a - b);
        }
        sounds.playClick();
        setBoard(newBoard);
      } else {
        // Place number
        if (cell.value === num) {
          // Toggle off if pressing same number
          newBoard[r][c].value = 0;
          newBoard[r][c].isError = false;
        } else {
          newBoard[r][c].value = num;
          const isError = num !== cell.solution;
          newBoard[r][c].isError = isError;

          if (isError) {
            sounds.playError();
            const nextMistakes = mistakes + 1;
            setMistakes(nextMistakes);
            setScore((prev) => Math.max(0, prev - 100));

            if (nextMistakes >= 3) {
              setIsGameOver(true);
            }
          } else {
            sounds.playSuccess();
            setScore((prev) => prev + 50);

            // Clear notes of same number in peer cells
            for (let i = 0; i < 9; i++) {
              newBoard[r][i].notes = newBoard[r][i].notes.filter((n) => n !== num);
              newBoard[i][c].notes = newBoard[i][c].notes.filter((n) => n !== num);
            }
            const startRow = Math.floor(r / 3) * 3;
            const startCol = Math.floor(c / 3) * 3;
            for (let i = 0; i < 3; i++) {
              for (let j = 0; j < 3; j++) {
                newBoard[startRow + i][startCol + j].notes = newBoard[startRow + i][startCol + j].notes.filter(
                  (n) => n !== num
                );
              }
            }

            // Check Win
            if (checkVictory(newBoard)) {
              setIsWon(true);
              const timeBonus = Math.max(0, 1000 - seconds * 2);
              const finalScore = score + timeBonus + (3 - mistakes) * 200;
              setScore(finalScore);
              sounds.playSuccess();

              if (currentUser) {
                FirebaseService.saveGameScore('sudoku', currentUser.id, currentUser.displayName, finalScore);
              }
            }
          }
        }
        setBoard(newBoard);
      }
    },
    [selectedCell, isWon, isGameOver, isPaused, board, isNoteMode, sounds, mistakes, checkVictory, seconds, score, currentUser]
  );

  // Erase Cell
  const handleErase = useCallback(() => {
    if (!selectedCell || isWon || isGameOver || isPaused) return;
    const [r, c] = selectedCell;
    const cell = board[r][c];
    if (cell.isGiven) return;

    setHistory((prev) => [...prev, board.map((row) => row.map((cItem) => ({ ...cItem, notes: [...cItem.notes] })))]);

    const newBoard = board.map((row) => row.map((cItem) => ({ ...cItem, notes: [...cItem.notes] })));
    newBoard[r][c].value = 0;
    newBoard[r][c].notes = [];
    newBoard[r][c].isError = false;
    setBoard(newBoard);
    sounds.playClick();
  }, [selectedCell, isWon, isGameOver, isPaused, board, sounds]);

  // Undo Action
  const handleUndo = useCallback(() => {
    if (history.length === 0 || isWon || isGameOver || isPaused) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setBoard(previous);
    sounds.playClick();
  }, [history, isWon, isGameOver, isPaused, sounds]);

  // Use Hint
  const handleHint = useCallback(() => {
    if (hintsLeft <= 0 || isWon || isGameOver || isPaused) return;

    // Find first empty or incorrect cell
    let targetCell: [number, number] | null = selectedCell;
    if (!targetCell || board[targetCell[0]][targetCell[1]].value === board[targetCell[0]][targetCell[1]].solution) {
      targetCell = null;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c].value !== board[r][c].solution) {
            targetCell = [r, c];
            break;
          }
        }
        if (targetCell) break;
      }
    }

    if (!targetCell) return;
    const [r, c] = targetCell;

    setHistory((prev) => [...prev, board.map((row) => row.map((cItem) => ({ ...cItem, notes: [...cItem.notes] })))]);

    const newBoard = board.map((row) => row.map((cItem) => ({ ...cItem, notes: [...cItem.notes] })));
    newBoard[r][c].value = newBoard[r][c].solution;
    newBoard[r][c].isError = false;
    newBoard[r][c].notes = [];

    setBoard(newBoard);
    setHintsLeft((prev) => prev - 1);
    setScore((prev) => Math.max(0, prev - 150));
    sounds.playSuccess();
    setSelectedCell([r, c]);

    if (checkVictory(newBoard)) {
      setIsWon(true);
      if (currentUser) {
        FirebaseService.saveGameScore('sudoku', currentUser.id, currentUser.displayName, score);
      }
    }
  }, [hintsLeft, isWon, isGameOver, isPaused, selectedCell, board, checkVictory, sounds, score, currentUser]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused || isWon || isGameOver) return;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleErase();
      } else if (e.key === 'n' || e.key === 'N') {
        setIsNoteMode((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H') {
        handleHint();
      } else if (e.key === 'u' || e.key === 'U' || (e.ctrlKey && e.key === 'z')) {
        handleUndo();
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        setSelectedCell((prev) => {
          if (!prev) return [0, 0];
          let [r, c] = prev;
          if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
          if (e.key === 'ArrowDown') r = Math.min(8, r + 1);
          if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
          if (e.key === 'ArrowRight') c = Math.min(8, c + 1);
          return [r, c];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, handleErase, handleHint, handleUndo, isPaused, isWon, isGameOver]);

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div id="sudoku-app" className="flex flex-col h-full w-full bg-[#08080c] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-[#111118] border-b border-[#27272a]/70 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
            style={{ backgroundColor: accentConfig.primary }}
          >
            🧩
          </div>
          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-wider">Cyber Sudoku Master</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Garantiert eindeutig lösbar</span>
            </div>
          </div>
        </div>

        {/* Tab & Difficulty Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#161622] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('game')}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === 'game' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Rätsel
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                loadLeaderboard();
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Highscores</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'game' ? (
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 p-4 overflow-y-auto bg-[#07070b]">
          {/* Main Board Container */}
          <div className="flex flex-col items-center">
            {/* Status Bar */}
            <div className="w-full max-w-[396px] flex items-center justify-between px-3 py-2 bg-[#12121c] border border-white/10 rounded-xl mb-3 text-xs">
              {/* Difficulty Dropdown */}
              <div className="flex items-center gap-1">
                {(['easy', 'medium', 'hard', 'expert'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setDifficulty(diff);
                      initGame(diff);
                      sounds.playClick();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                      difficulty === diff
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {diff === 'easy' ? 'Leicht' : diff === 'medium' ? 'Mittel' : diff === 'hard' ? 'Schwer' : 'Meister'}
                  </button>
                ))}
              </div>

              {/* Timer & Pause */}
              <div className="flex items-center gap-2 text-zinc-300 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatTime(seconds)}</span>
                <button
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                  title={isPaused ? 'Fortsetzen' : 'Pausieren'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-white" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Mistakes Counter */}
              <div className="flex items-center gap-1 text-[11px]">
                <span className="text-zinc-400">Fehler:</span>
                <span className={`font-bold ${mistakes > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {mistakes}/3
                </span>
              </div>
            </div>

            {/* 9x9 Sudoku Board */}
            <div
              ref={gameContainerRef}
              className="relative p-2 rounded-2xl bg-[#12121d] border-2 border-purple-500/20 shadow-2xl"
            >
              <div className="grid grid-cols-9 gap-[1px] bg-zinc-800/80 p-[2px] rounded-xl border border-zinc-700">
                {board.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const isSelected = selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
                    const isHighlighted =
                      selectedCell &&
                      (selectedCell[0] === rIdx ||
                        selectedCell[1] === cIdx ||
                        getBoxIndex(selectedCell[0], selectedCell[1]) === getBoxIndex(rIdx, cIdx));
                    const isSameNumber = selectedValue && cell.value === selectedValue && cell.value !== 0;

                    // 3x3 block borders
                    const borderRight = (cIdx + 1) % 3 === 0 && cIdx !== 8 ? 'border-r-2 border-r-purple-500/40' : '';
                    const borderBottom = (rIdx + 1) % 3 === 0 && rIdx !== 8 ? 'border-b-2 border-b-purple-500/40' : '';

                    return (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => {
                          setSelectedCell([rIdx, cIdx]);
                          sounds.playClick();
                        }}
                        className={`w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center cursor-pointer transition-colors relative font-mono text-base font-bold ${borderRight} ${borderBottom} ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-inner ring-2 ring-purple-400 z-10'
                            : isSameNumber
                            ? 'bg-purple-900/50 text-purple-200 ring-1 ring-purple-500/60'
                            : isHighlighted
                            ? 'bg-[#1e1e2d] text-zinc-200'
                            : 'bg-[#151522] text-zinc-300 hover:bg-[#1c1c2a]'
                        } ${cell.isError ? '!bg-rose-950/80 !text-rose-400 animate-shake' : ''}`}
                      >
                        {cell.value !== 0 ? (
                          <span
                            className={`${
                              cell.isGiven
                                ? 'text-zinc-100 font-extrabold'
                                : cell.isError
                                ? 'text-rose-400 font-bold'
                                : 'text-purple-300 font-bold'
                            }`}
                          >
                            {cell.value}
                          </span>
                        ) : (
                          /* Pencil Notes */
                          <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 pointer-events-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                              <span
                                key={n}
                                className={`text-[8px] flex items-center justify-center font-sans ${
                                  cell.notes.includes(n) ? 'text-purple-400/90 font-bold' : 'opacity-0'
                                }`}
                              >
                                {n}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pause / GameOver / Victory Overlay */}
              <AnimatePresence>
                {(isPaused || isWon || isGameOver) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 rounded-2xl bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30"
                  >
                    {isPaused ? (
                      <>
                        <Pause className="w-12 h-12 text-purple-400 mb-2 animate-pulse" />
                        <h3 className="text-base font-bold text-white mb-1">Spiel Pausiert</h3>
                        <p className="text-xs text-zinc-400 mb-4">Nimm dir kurz Zeit zum Durchatmen.</p>
                        <button
                          onClick={() => setIsPaused(false)}
                          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                        >
                          <Play className="w-4 h-4 fill-white" />
                          <span>Fortsetzen</span>
                        </button>
                      </>
                    ) : isGameOver ? (
                      <>
                        <ShieldAlert className="w-12 h-12 text-rose-500 mb-2" />
                        <h3 className="text-base font-bold text-rose-400 mb-1">3 Fehler Erreicht!</h3>
                        <p className="text-xs text-zinc-400 mb-4">Dieses Rätsel wurde leider nicht gelöst.</p>
                        <button
                          onClick={() => initGame(difficulty)}
                          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Neues Rätsel</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
                        <h3 className="text-base font-bold text-emerald-400 mb-1">Sudoku Gelöst! 🎉</h3>
                        <p className="text-xs text-zinc-300 mb-1">
                          Zeit: <span className="font-bold text-white">{formatTime(seconds)}</span>
                        </p>
                        <p className="text-xs text-amber-300 font-bold mb-4">Score: {score} Punkte</p>
                        <button
                          onClick={() => initGame(difficulty)}
                          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Nächstes Rätsel</span>
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Action Toolbar & Numpad */}
          <div className="flex flex-col gap-3 w-full max-w-[260px]">
            {/* Game Action Buttons */}
            <div className="grid grid-cols-4 gap-2 bg-[#12121c] p-2 rounded-2xl border border-white/10">
              <button
                onClick={handleUndo}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#1a1a28] hover:bg-purple-600 active:scale-95 text-zinc-300 hover:text-white transition-all text-[10px] font-medium gap-1"
                title="Rückgängig (U)"
              >
                <Undo2 className="w-4 h-4" />
                <span>Zurück</span>
              </button>

              <button
                onClick={handleErase}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#1a1a28] hover:bg-purple-600 active:scale-95 text-zinc-300 hover:text-white transition-all text-[10px] font-medium gap-1"
                title="Löschen (Entf)"
              >
                <Eraser className="w-4 h-4" />
                <span>Löschen</span>
              </button>

              <button
                onClick={() => setIsNoteMode((prev) => !prev)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl active:scale-95 transition-all text-[10px] font-medium gap-1 ${
                  isNoteMode
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-[#1a1a28] hover:bg-purple-600/50 text-zinc-300 hover:text-white'
                }`}
                title="Notizen-Modus (N)"
              >
                <PenTool className="w-4 h-4" />
                <span>{isNoteMode ? 'Notiz: AN' : 'Notiz: AUS'}</span>
              </button>

              <button
                onClick={handleHint}
                disabled={hintsLeft <= 0}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#1a1a28] hover:bg-amber-600 disabled:opacity-40 active:scale-95 text-zinc-300 hover:text-white transition-all text-[10px] font-medium gap-1 relative"
                title="Tipp anfordern (H)"
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Tipp ({hintsLeft})</span>
              </button>
            </div>

            {/* Numbers 1-9 Pad */}
            <div className="grid grid-cols-3 gap-2 bg-[#12121c] p-3 rounded-2xl border border-white/10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                const count = numberCounts[num] || 0;
                const isComplete = count >= 9;

                return (
                  <button
                    key={num}
                    onClick={() => handleNumberInput(num)}
                    disabled={isComplete}
                    className={`h-14 rounded-xl font-mono text-lg font-bold flex flex-col items-center justify-center shadow transition-all active:scale-90 ${
                      isComplete
                        ? 'bg-[#101018] text-zinc-600 opacity-40 cursor-not-allowed border border-white/5'
                        : 'bg-[#1c1c2a] hover:bg-purple-600 text-white hover:shadow-purple-500/30 border border-white/10'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[9px] font-sans font-normal text-zinc-400">
                      {isComplete ? '✓' : `${9 - count} übrig`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Leaderboard View */
        <div className="flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto space-y-4">
          <div className="text-center">
            <h2 className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Sudoku Cyber Bestenliste</span>
            </h2>
            <p className="text-[11px] text-zinc-400">Synchronisiert via Firebase Firestore</p>
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
                    <span className="text-xs font-bold text-white">{item.userName || 'Cyber-Player'}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-300">{item.score} Pkt.</span>
                </div>
              ))
            ) : (
              <div className="text-center p-6 text-xs text-zinc-500">
                Noch keine Einträge vorhanden. Löse ein Rätsel und verewige dich auf Rang 1!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
