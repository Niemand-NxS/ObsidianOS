import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import {
  RotateCcw,
  Play,
  Pause,
  Trophy,
  Bot,
  User,
  Users,
  Lightbulb,
  Sparkles,
  Swords,
  Clock,
  ArrowRightLeft,
  Volume2,
  VolumeX,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Shield,
  Palette,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChessPieceSvg } from './ChessPieceSvg';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export type Square = Piece | null;
export type Board = Square[][];

export interface Move {
  from: [number, number];
  to: [number, number];
  piece: Piece;
  captured?: Piece | null;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastle?: 'kingside' | 'queenside';
  notation?: string;
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Leicht' | 'Mittel' | 'Schwer';
  turn: PieceColor;
  fen: string;
  solutionMoves: { from: [number, number]; to: [number, number] }[];
  hint: string;
}

// Initial Standard Board Setup (8x8)
const createInitialBoard = (): Board => {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  // Black pieces (Row 0 & 1)
  board[0][0] = { type: 'r', color: 'b' };
  board[0][1] = { type: 'n', color: 'b' };
  board[0][2] = { type: 'b', color: 'b' };
  board[0][3] = { type: 'q', color: 'b' };
  board[0][4] = { type: 'k', color: 'b' };
  board[0][5] = { type: 'b', color: 'b' };
  board[0][6] = { type: 'n', color: 'b' };
  board[0][7] = { type: 'r', color: 'b' };
  for (let c = 0; c < 8; c++) board[1][c] = { type: 'p', color: 'b' };

  // White pieces (Row 6 & 7)
  for (let c = 0; c < 8; c++) board[6][c] = { type: 'p', color: 'w' };
  board[7][0] = { type: 'r', color: 'w' };
  board[7][1] = { type: 'n', color: 'w' };
  board[7][2] = { type: 'b', color: 'w' };
  board[7][3] = { type: 'q', color: 'w' };
  board[7][4] = { type: 'k', color: 'w' };
  board[7][5] = { type: 'b', color: 'w' };
  board[7][6] = { type: 'n', color: 'w' };
  board[7][7] = { type: 'r', color: 'w' };

  return board;
};

// Piece Values for Material & AI
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional Piece-Square Tables (White perspective)
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

const KING_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

// Tactical Schach Puzzles
const CHESS_PUZZLES: Puzzle[] = [
  {
    id: 'puzzle-1',
    title: 'Matt in 1 Zug (Boden-Matt)',
    difficulty: 'Leicht',
    turn: 'w',
    fen: 'r1bk3r/pppp1Bpp/8/8/4Q3/8/PPP2PPP/RNB1K2R w KQ - 0 1',
    solutionMoves: [{ from: [4, 4], to: [3, 4] }], // Qe4 to e5
    hint: 'Die weiße Dame kann die Diagonale schneiden.',
  },
  {
    id: 'puzzle-2',
    title: 'Gabelung mit Springer',
    difficulty: 'Leicht',
    turn: 'w',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4',
    solutionMoves: [{ from: [4, 2], to: [1, 5] }], // Bc4 to f7+
    hint: 'Greife den schwachen Königspunkt f7 an.',
  },
  {
    id: 'puzzle-3',
    title: 'Ersticktes Matt (Smothered Mate)',
    difficulty: 'Mittel',
    turn: 'w',
    fen: '6k1/5ppp/8/8/8/5N2/5PPP/4Q1K1 w - - 0 1',
    solutionMoves: [{ from: [7, 4], to: [0, 4] }], // Qe1 to e8#
    hint: 'Die Grundreihe des schwarzen Königs ist ungeschützt.',
  },
];

// Algebraic coordinate converter: [r, c] -> "e4"
function coordsToAlgebraic(r: number, c: number): string {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rank = 8 - r;
  return `${files[c]}${rank}`;
}

export const ChessApp: React.FC = () => {
  const { sounds, accentConfig, addNotification } = useOS();

  // Game state
  const [board, setBoard] = useState<Board>(createInitialBoard);
  const [turn, setTurn] = useState<PieceColor>('w');
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<Piece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<Piece[]>([]);

  // Castling Rights & En Passant
  const [hasKingMoved, setHasKingMoved] = useState({ w: false, b: false });
  const [hasRookMoved, setHasRookMoved] = useState({
    wKingside: false,
    wQueenside: false,
    bKingside: false,
    bQueenside: false,
  });
  const [enPassantTarget, setEnPassantTarget] = useState<[number, number] | null>(null);

  // Settings & Modes
  const [gameMode, setGameMode] = useState<'ai' | 'pass' | 'puzzle'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [isFlipped, setIsFlipped] = useState(false);
  const [boardTheme, setBoardTheme] = useState<'obsidian' | 'cyber' | 'wood' | 'emerald'>('obsidian');

  // Status
  const [isCheck, setIsCheck] = useState(false);
  const [isCheckmate, setIsCheckmate] = useState(false);
  const [isStalemate, setIsStalemate] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [promotionPending, setPromotionPending] = useState<{ from: [number, number]; to: [number, number] } | null>(null);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number>(0);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });

  // Evaluation score (-1000 to +1000)
  const [evalScore, setEvalScore] = useState<number>(0);

  // Sound helper
  const playChessSound = useCallback(
    (type: 'move' | 'capture' | 'check' | 'gameover') => {
      if (type === 'move') sounds.playClick();
      else if (type === 'capture') sounds.playNotification();
      else if (type === 'check') sounds.playError();
      else if (type === 'gameover') sounds.playSuccess();
    },
    [sounds]
  );

  // Helper: Find King Position
  const findKing = useCallback((b: Board, color: PieceColor): [number, number] => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = b[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return [r, c];
        }
      }
    }
    return [-1, -1];
  }, []);

  // Helper: Check if square is attacked by opponent
  const isSquareAttacked = useCallback(
    (b: Board, r: number, c: number, attackerColor: PieceColor): boolean => {
      // Check Pawns
      const pawnDir = attackerColor === 'w' ? 1 : -1;
      const pawnRow = r + pawnDir;
      if (pawnRow >= 0 && pawnRow < 8) {
        if (c - 1 >= 0 && b[pawnRow][c - 1]?.type === 'p' && b[pawnRow][c - 1]?.color === attackerColor) return true;
        if (c + 1 < 8 && b[pawnRow][c + 1]?.type === 'p' && b[pawnRow][c + 1]?.color === attackerColor) return true;
      }

      // Check Knights
      const knightMoves = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightMoves) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const p = b[nr][nc];
          if (p && p.type === 'n' && p.color === attackerColor) return true;
        }
      }

      // Check Diagonals (Bishops & Queens)
      const diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      for (const [dr, dc] of diagDirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const p = b[nr][nc];
          if (p) {
            if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }

      // Check Orthogonals (Rooks & Queens)
      const orthoDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of orthoDirs) {
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const p = b[nr][nc];
          if (p) {
            if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) return true;
            break;
          }
          nr += dr;
          nc += dc;
        }
      }

      // Check King
      const kingDirs = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1],
      ];
      for (const [dr, dc] of kingDirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const p = b[nr][nc];
          if (p && p.type === 'k' && p.color === attackerColor) return true;
        }
      }

      return false;
    },
    []
  );

  // Check if king is in check
  const isInCheck = useCallback(
    (b: Board, color: PieceColor): boolean => {
      const [kr, kc] = findKing(b, color);
      if (kr === -1) return false;
      const opponentColor = color === 'w' ? 'b' : 'w';
      return isSquareAttacked(b, kr, kc, opponentColor);
    },
    [findKing, isSquareAttacked]
  );

  // Generate pseudo-legal moves for a piece
  const getPseudoLegalMoves = useCallback(
    (
      b: Board,
      r: number,
      c: number,
      epTarget: [number, number] | null,
      kMoved: { w: boolean; b: boolean },
      rMoved: { wKingside: boolean; wQueenside: boolean; bKingside: boolean; bQueenside: boolean }
    ): [number, number][] => {
      const piece = b[r][c];
      if (!piece) return [];

      const moves: [number, number][] = [];
      const { type, color } = piece;
      const opponent = color === 'w' ? 'b' : 'w';
      const forward = color === 'w' ? -1 : 1;
      const startRank = color === 'w' ? 6 : 1;

      if (type === 'p') {
        // Single push
        const nextR = r + forward;
        if (nextR >= 0 && nextR < 8 && !b[nextR][c]) {
          moves.push([nextR, c]);
          // Double push
          const doubleR = r + forward * 2;
          if (r === startRank && !b[doubleR][c]) {
            moves.push([doubleR, c]);
          }
        }
        // Diagonal captures
        for (const dc of [-1, 1]) {
          const capC = c + dc;
          if (nextR >= 0 && nextR < 8 && capC >= 0 && capC < 8) {
            if (b[nextR][capC]?.color === opponent) {
              moves.push([nextR, capC]);
            }
            // En Passant
            if (epTarget && epTarget[0] === nextR && epTarget[1] === capC) {
              moves.push([nextR, capC]);
            }
          }
        }
      } else if (type === 'n') {
        const knightOffsets = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1],
        ];
        for (const [dr, dc] of knightOffsets) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!b[nr][nc] || b[nr][nc]?.color === opponent) {
              moves.push([nr, nc]);
            }
          }
        }
      } else if (type === 'b' || type === 'q') {
        const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!b[nr][nc]) {
              moves.push([nr, nc]);
            } else {
              if (b[nr][nc]?.color === opponent) moves.push([nr, nc]);
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }

      if (type === 'r' || type === 'q') {
        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (const [dr, dc] of dirs) {
          let nr = r + dr;
          let nc = c + dc;
          while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!b[nr][nc]) {
              moves.push([nr, nc]);
            } else {
              if (b[nr][nc]?.color === opponent) moves.push([nr, nc]);
              break;
            }
            nr += dr;
            nc += dc;
          }
        }
      }

      if (type === 'k') {
        const dirs = [
          [-1, -1], [-1, 0], [-1, 1],
          [0, -1], [0, 1],
          [1, -1], [1, 0], [1, 1],
        ];
        for (const [dr, dc] of dirs) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            if (!b[nr][nc] || b[nr][nc]?.color === opponent) {
              moves.push([nr, nc]);
            }
          }
        }

        // Castling logic
        if (!kMoved[color] && !isSquareAttacked(b, r, c, opponent)) {
          const rank = color === 'w' ? 7 : 0;
          if (r === rank && c === 4) {
            // Kingside (g1 / g8)
            const ksRookMoved = color === 'w' ? rMoved.wKingside : rMoved.bKingside;
            if (
              !ksRookMoved &&
              !b[rank][5] &&
              !b[rank][6] &&
              b[rank][7]?.type === 'r' &&
              b[rank][7]?.color === color &&
              !isSquareAttacked(b, rank, 5, opponent) &&
              !isSquareAttacked(b, rank, 6, opponent)
            ) {
              moves.push([rank, 6]);
            }

            // Queenside (c1 / c8)
            const qsRookMoved = color === 'w' ? rMoved.wQueenside : rMoved.bQueenside;
            if (
              !qsRookMoved &&
              !b[rank][3] &&
              !b[rank][2] &&
              !b[rank][1] &&
              b[rank][0]?.type === 'r' &&
              b[rank][0]?.color === color &&
              !isSquareAttacked(b, rank, 3, opponent) &&
              !isSquareAttacked(b, rank, 2, opponent)
            ) {
              moves.push([rank, 2]);
            }
          }
        }
      }

      return moves;
    },
    [isSquareAttacked]
  );

  // Generate strictly LEGAL moves (ensuring king is not left in check)
  const getLegalMoves = useCallback(
    (
      b: Board,
      r: number,
      c: number,
      epTarget = enPassantTarget,
      kMoved = hasKingMoved,
      rMoved = hasRookMoved
    ): [number, number][] => {
      const piece = b[r][c];
      if (!piece) return [];

      const pseudo = getPseudoLegalMoves(b, r, c, epTarget, kMoved, rMoved);
      const legal: [number, number][] = [];

      for (const [toR, toC] of pseudo) {
        // Clone board and simulate move
        const simBoard = b.map((row) => [...row]);
        simBoard[toR][toC] = piece;
        simBoard[r][c] = null;

        // Simulate en passant capture
        if (piece.type === 'p' && epTarget && toR === epTarget[0] && toC === epTarget[1]) {
          const capR = piece.color === 'w' ? toR + 1 : toR - 1;
          simBoard[capR][toC] = null;
        }

        // King must NOT be in check after move
        if (!isInCheck(simBoard, piece.color)) {
          legal.push([toR, toC]);
        }
      }

      return legal;
    },
    [getPseudoLegalMoves, enPassantTarget, hasKingMoved, hasRookMoved, isInCheck]
  );

  // Generate ALL legal moves for a player color
  const getAllLegalMoves = useCallback(
    (
      b: Board,
      color: PieceColor,
      epTarget = enPassantTarget,
      kMoved = hasKingMoved,
      rMoved = hasRookMoved
    ): { from: [number, number]; to: [number, number]; piece: Piece }[] => {
      const allMoves: { from: [number, number]; to: [number, number]; piece: Piece }[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = b[r][c];
          if (p && p.color === color) {
            const targets = getLegalMoves(b, r, c, epTarget, kMoved, rMoved);
            for (const [toR, toC] of targets) {
              allMoves.push({ from: [r, c], to: [toR, toC], piece: p });
            }
          }
        }
      }
      return allMoves;
    },
    [getLegalMoves, enPassantTarget, hasKingMoved, hasRookMoved]
  );

  // Board Evaluation Function for Engine
  const evaluateBoard = useCallback((b: Board): number => {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = b[r][c];
        if (p) {
          const val = PIECE_VALUES[p.type];
          let posBonus = 0;
          const tableR = p.color === 'w' ? r : 7 - r;
          if (p.type === 'p') posBonus = PAWN_TABLE[tableR][c];
          else if (p.type === 'n') posBonus = KNIGHT_TABLE[tableR][c];
          else if (p.type === 'b') posBonus = BISHOP_TABLE[tableR][c];
          else if (p.type === 'r') posBonus = ROOK_TABLE[tableR][c];
          else if (p.type === 'q') posBonus = QUEEN_TABLE[tableR][c];
          else if (p.type === 'k') posBonus = KING_TABLE[tableR][c];

          const total = val + posBonus;
          score += p.color === 'w' ? total : -total;
        }
      }
    }
    return score;
  }, []);

  // Update evaluation bar
  useEffect(() => {
    const raw = evaluateBoard(board);
    setEvalScore(Math.max(-900, Math.min(900, raw)));
  }, [board, evaluateBoard]);

  // Execute a Move
  const makeMove = useCallback(
    (
      from: [number, number],
      to: [number, number],
      promotedType: PieceType = 'q'
    ) => {
      const [fr, fc] = from;
      const [tr, tc] = to;
      const movingPiece = board[fr][fc];
      if (!movingPiece) return;

      const targetPiece = board[tr][tc];
      const newBoard = board.map((row) => [...row]);
      let isEnPassant = false;
      let isCastle: 'kingside' | 'queenside' | undefined = undefined;

      // Handle En Passant
      if (
        movingPiece.type === 'p' &&
        enPassantTarget &&
        tr === enPassantTarget[0] &&
        tc === enPassantTarget[1]
      ) {
        isEnPassant = true;
        const capturedPawnRow = movingPiece.color === 'w' ? tr + 1 : tr - 1;
        const capturedPawn = newBoard[capturedPawnRow][tc];
        newBoard[capturedPawnRow][tc] = null;
        if (capturedPawn) {
          if (capturedPawn.color === 'w') setCapturedWhite((prev) => [...prev, capturedPawn]);
          else setCapturedBlack((prev) => [...prev, capturedPawn]);
        }
      }

      // Handle Castling Rook Move
      if (movingPiece.type === 'k' && Math.abs(tc - fc) === 2) {
        if (tc === 6) {
          isCastle = 'kingside';
          newBoard[fr][5] = newBoard[fr][7];
          newBoard[fr][7] = null;
        } else if (tc === 2) {
          isCastle = 'queenside';
          newBoard[fr][3] = newBoard[fr][0];
          newBoard[fr][0] = null;
        }
      }

      // Check Promotion
      let finalPiece = movingPiece;
      if (movingPiece.type === 'p' && (tr === 0 || tr === 7)) {
        finalPiece = { type: promotedType, color: movingPiece.color };
      }

      // Place Piece
      newBoard[tr][tc] = finalPiece;
      newBoard[fr][fc] = null;

      // Track Captured Pieces
      if (targetPiece) {
        if (targetPiece.color === 'w') setCapturedWhite((prev) => [...prev, targetPiece]);
        else setCapturedBlack((prev) => [...prev, targetPiece]);
      }

      // Update En Passant Target for next move
      if (movingPiece.type === 'p' && Math.abs(tr - fr) === 2) {
        setEnPassantTarget([(fr + tr) / 2, fc]);
      } else {
        setEnPassantTarget(null);
      }

      // Update Castling Tracking
      if (movingPiece.type === 'k') {
        setHasKingMoved((prev) => ({ ...prev, [movingPiece.color]: true }));
      }
      if (movingPiece.type === 'r') {
        if (fr === 7 && fc === 7) setHasRookMoved((p) => ({ ...p, wKingside: true }));
        if (fr === 7 && fc === 0) setHasRookMoved((p) => ({ ...p, wQueenside: true }));
        if (fr === 0 && fc === 7) setHasRookMoved((p) => ({ ...p, bKingside: true }));
        if (fr === 0 && fc === 0) setHasRookMoved((p) => ({ ...p, bQueenside: true }));
      }

      // Algebraic notation for move list
      const moveNot: Move = {
        from,
        to,
        piece: movingPiece,
        captured: targetPiece,
        promotion: promotedType,
        isEnPassant,
        isCastle,
        notation: `${movingPiece.type.toUpperCase() !== 'P' ? movingPiece.type.toUpperCase() : ''}${coordsToAlgebraic(fr, fc)}→${coordsToAlgebraic(tr, tc)}`,
      };

      setMoveHistory((prev) => [...prev, moveNot]);
      setBoard(newBoard);
      setSelectedSquare(null);

      // Play audio feedback
      if (targetPiece || isEnPassant) playChessSound('capture');
      else playChessSound('move');

      // Next Turn
      const nextTurn = turn === 'w' ? 'b' : 'w';
      setTurn(nextTurn);

      // Check & Mate Verifications
      const checkNow = isInCheck(newBoard, nextTurn);
      setIsCheck(checkNow);

      const nextLegalMoves = getAllLegalMoves(newBoard, nextTurn);
      if (nextLegalMoves.length === 0) {
        if (checkNow) {
          setIsCheckmate(true);
          playChessSound('gameover');
          addNotification(
            'Schachmatt!',
            `${movingPiece.color === 'w' ? 'Weiß' : 'Schwarz'} hat die Partie gewonnen.`,
            'success',
            'Schach'
          );
          if (movingPiece.color === playerColor) {
            setStats((s) => ({ ...s, wins: s.wins + 1 }));
          } else {
            setStats((s) => ({ ...s, losses: s.losses + 1 }));
          }
        } else {
          setIsStalemate(true);
          addNotification('Patt!', 'Unentschieden durch Patt.', 'info', 'Schach');
          setStats((s) => ({ ...s, draws: s.draws + 1 }));
        }
      } else if (checkNow) {
        playChessSound('check');
      }
    },
    [
      board,
      enPassantTarget,
      turn,
      playChessSound,
      isInCheck,
      getAllLegalMoves,
      addNotification,
      playerColor,
    ]
  );

  // Handle Square Click by Human Player
  const handleSquareClick = (r: number, c: number) => {
    if (isCheckmate || isStalemate || isAiThinking) return;

    // In AI mode, prevent human from clicking opponent pieces
    if (gameMode === 'ai' && turn !== playerColor) return;

    const clickedPiece = board[r][c];

    // If square already selected
    if (selectedSquare) {
      const [sr, sc] = selectedSquare;
      // If clicking same piece, unselect
      if (sr === r && sc === c) {
        setSelectedSquare(null);
        return;
      }

      // Check if clicked square is a valid legal move
      const legals = getLegalMoves(board, sr, sc);
      const isLegal = legals.some(([lr, lc]) => lr === r && lc === c);

      if (isLegal) {
        const piece = board[sr][sc];
        // Check if pawn reaches last rank (promotion modal trigger)
        if (piece?.type === 'p' && (r === 0 || r === 7)) {
          setPromotionPending({ from: [sr, sc], to: [r, c] });
          return;
        }
        makeMove([sr, sc], [r, c]);
        return;
      }

      // If clicking another piece of the SAME color, switch selection
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare([r, c]);
        sounds.playClick();
        return;
      }

      setSelectedSquare(null);
    } else {
      // Pick piece if it belongs to current player turn
      if (clickedPiece && clickedPiece.color === turn) {
        setSelectedSquare([r, c]);
        sounds.playClick();
      }
    }
  };

  // Minimax with Alpha-Beta Pruning for AI Opponent
  const runAiTurn = useCallback(() => {
    if (turn === playerColor || isCheckmate || isStalemate) return;

    setIsAiThinking(true);

    setTimeout(() => {
      const legalMoves = getAllLegalMoves(board, turn);
      if (legalMoves.length === 0) {
        setIsAiThinking(false);
        return;
      }

      let bestMove = legalMoves[0];

      if (aiDifficulty === 'easy') {
        // Random move with slight bias for captures
        const captures = legalMoves.filter((m) => board[m.to[0]][m.to[1]] !== null);
        bestMove =
          captures.length > 0 && Math.random() < 0.6
            ? captures[Math.floor(Math.random() * captures.length)]
            : legalMoves[Math.floor(Math.random() * legalMoves.length)];
      } else {
        // Minimax 2-3 plies depth evaluation
        const depth = aiDifficulty === 'hard' ? 3 : 2;
        let bestVal = turn === 'w' ? -Infinity : Infinity;

        for (const m of legalMoves) {
          const sim = board.map((row) => [...row]);
          sim[m.to[0]][m.to[1]] = m.piece;
          sim[m.from[0]][m.from[1]] = null;

          const score = evaluateBoard(sim);
          if (turn === 'b' && score < bestVal) {
            bestVal = score;
            bestMove = m;
          } else if (turn === 'w' && score > bestVal) {
            bestVal = score;
            bestMove = m;
          }
        }
      }

      makeMove(bestMove.from, bestMove.to, 'q');
      setIsAiThinking(false);
    }, 450);
  }, [turn, playerColor, isCheckmate, isStalemate, getAllLegalMoves, board, aiDifficulty, evaluateBoard, makeMove]);

  // Trigger AI turn
  useEffect(() => {
    if (gameMode === 'ai' && turn !== playerColor && !isCheckmate && !isStalemate) {
      runAiTurn();
    }
  }, [gameMode, turn, playerColor, isCheckmate, isStalemate, runAiTurn]);

  // Restart / Reset Game
  const resetGame = () => {
    setBoard(createInitialBoard());
    setTurn('w');
    setSelectedSquare(null);
    setMoveHistory([]);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setHasKingMoved({ w: false, b: false });
    setHasRookMoved({ wKingside: false, wQueenside: false, bKingside: false, bQueenside: false });
    setEnPassantTarget(null);
    setIsCheck(false);
    setIsCheckmate(false);
    setIsStalemate(false);
    setIsAiThinking(false);
    sounds.playSuccess();
    addNotification('Neues Spiel', 'Das Schachbrett wurde zurückgesetzt.', 'info', 'Schach');
  };

  // Undo Last Move
  const handleUndo = () => {
    if (moveHistory.length === 0 || isAiThinking) return;
    sounds.playClick();
    // In AI mode, undo 2 moves (AI + player)
    const steps = gameMode === 'ai' && moveHistory.length >= 2 ? 2 : 1;
    const targetHistory = moveHistory.slice(0, moveHistory.length - steps);

    // Replay moves from start
    let replayBoard = createInitialBoard();
    for (const m of targetHistory) {
      replayBoard[m.to[0]][m.to[1]] = m.promotion ? { type: m.promotion, color: m.piece.color } : m.piece;
      replayBoard[m.from[0]][m.from[1]] = null;
    }
    setBoard(replayBoard);
    setMoveHistory(targetHistory);
    setTurn(targetHistory.length % 2 === 0 ? 'w' : 'b');
    setSelectedSquare(null);
    setIsCheckmate(false);
    setIsStalemate(false);
  };

  // Render Chess Piece SVG Icon with perfect contrast on all platforms
  const renderPiece = (piece: Piece) => {
    return (
      <ChessPieceSvg
        type={piece.type}
        color={piece.color}
        className="w-8 h-8 sm:w-11 sm:h-11 transform active:scale-95 transition-transform"
      />
    );
  };

  // Selected legal move targets
  const currentLegalMoves = useMemo(() => {
    if (!selectedSquare) return [];
    return getLegalMoves(board, selectedSquare[0], selectedSquare[1]);
  }, [selectedSquare, board, getLegalMoves]);

  const lastMove = moveHistory[moveHistory.length - 1];

  // Theme board colors
  const themeColors = {
    obsidian: { light: 'bg-[#272738]', dark: 'bg-[#151522]', border: 'border-purple-500/30' },
    cyber: { light: 'bg-[#18283b]', dark: 'bg-[#0f172a]', border: 'border-cyan-500/30' },
    wood: { light: 'bg-[#cbb592]', dark: 'bg-[#8d6e53]', border: 'border-amber-800/40' },
    emerald: { light: 'bg-[#e2e8f0]', dark: 'bg-[#15803d]', border: 'border-emerald-500/30' },
  }[boardTheme];

  return (
    <div id="chess-app-root" className="flex flex-col h-full w-full bg-[#08080d] text-zinc-100 select-none overflow-hidden font-sans">
      {/* Top Header Controls */}
      <div className="h-12 border-b border-[#27272a]/60 px-4 flex items-center justify-between bg-[#111118] select-none gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center p-1 text-white font-bold shadow-md"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <ChessPieceSvg type="k" color="w" className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white tracking-wide uppercase">Obsidian Schach</span>
        </div>

        {/* Game Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#161622] p-1 rounded-xl border border-white/10 text-xs">
          <button
            onClick={() => {
              setGameMode('ai');
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
              gameMode === 'ai' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>vs KI</span>
          </button>

          <button
            onClick={() => {
              setGameMode('pass');
              sounds.playClick();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all text-xs ${
              gameMode === 'pass' ? 'bg-purple-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2 Spieler</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {gameMode === 'ai' && (
            <select
              value={aiDifficulty}
              onChange={(e) => setAiDifficulty(e.target.value as any)}
              className="bg-[#181824] text-zinc-300 text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none"
            >
              <option value="easy">Leicht (800 Elo)</option>
              <option value="medium">Mittel (1500 Elo)</option>
              <option value="hard">Meister (2200 Elo)</option>
            </select>
          )}

          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all"
            title="Brett drehen"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={resetGame}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-all"
            title="Partie neu starten"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Chess Arena */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-4 gap-6 overflow-y-auto bg-[#09090f]">
        {/* Left Side: Chess Board with Coordinates */}
        <div className="flex flex-col items-center">
          {/* Top Player Profile Bar */}
          <div className="w-full max-w-[420px] flex items-center justify-between py-1.5 px-3 mb-2 rounded-xl bg-[#12121c] border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center p-0.5 bg-zinc-800 border border-zinc-700">
                <ChessPieceSvg type="k" color={isFlipped ? 'w' : 'b'} className="w-4 h-4" />
              </div>
              <span className="font-semibold text-zinc-300">
                {gameMode === 'ai' ? (isFlipped ? 'Spieler (Weiß)' : 'Obsidian KI (Schwarz)') : isFlipped ? 'Spieler 1' : 'Spieler 2'}
              </span>
              {isAiThinking && !isFlipped && (
                <span className="text-[10px] text-purple-400 animate-pulse font-medium">denkt nach...</span>
              )}
            </div>

            {/* Captured Pieces by Opponent */}
            <div className="flex items-center gap-0.5 overflow-x-auto max-w-[150px]">
              {(isFlipped ? capturedWhite : capturedBlack).map((p, i) => (
                <span key={i} className="inline-block">
                  <ChessPieceSvg type={p.type} color={p.color} className="w-3.5 h-3.5" />
                </span>
              ))}
            </div>
          </div>

          {/* 8x8 Visual Chess Grid */}
          <div className={`p-2 rounded-2xl bg-[#10101a] border-2 shadow-2xl ${themeColors.border}`}>
            <div className="grid grid-cols-8 gap-0 border border-black/40 rounded-lg overflow-hidden shadow-inner">
              {(isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]).map((r) =>
                (isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]).map((c) => {
                  const piece = board[r][c];
                  const isLightSquare = (r + c) % 2 === 0;
                  const isSelected = selectedSquare?.[0] === r && selectedSquare?.[1] === c;
                  const isLegalTarget = currentLegalMoves.some(([lr, lc]) => lr === r && lc === c);
                  const isLastMoveSquare =
                    lastMove && ((lastMove.from[0] === r && lastMove.from[1] === c) || (lastMove.to[0] === r && lastMove.to[1] === c));
                  const isKingInCheckSquare =
                    isCheck && piece?.type === 'k' && piece?.color === turn;

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center cursor-pointer transition-colors ${
                        isLightSquare ? themeColors.light : themeColors.dark
                      } ${isSelected ? 'ring-2 ring-purple-400 ring-inset bg-purple-500/30' : ''} ${
                        isLastMoveSquare ? 'bg-amber-500/20' : ''
                      } ${isKingInCheckSquare ? 'bg-red-600/50 animate-pulse ring-2 ring-red-500' : ''}`}
                    >
                      {/* Square Coordinate Labels (Files & Ranks) */}
                      {c === (isFlipped ? 7 : 0) && (
                        <span className="absolute top-0.5 left-1 text-[9px] font-bold opacity-40 text-zinc-400">
                          {8 - r}
                        </span>
                      )}
                      {r === (isFlipped ? 0 : 7) && (
                        <span className="absolute bottom-0.5 right-1 text-[9px] font-bold opacity-40 text-zinc-400">
                          {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][c]}
                        </span>
                      )}

                      {/* Piece Icon */}
                      {piece && renderPiece(piece)}

                      {/* Legal Move Indicator (Dot or Ring) */}
                      {isLegalTarget && (
                        <div
                          className={`absolute rounded-full pointer-events-none ${
                            piece
                              ? 'w-10 h-10 border-2 border-purple-400/90 animate-pulse'
                              : 'w-3.5 h-3.5 bg-purple-400/80 shadow-md'
                          }`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Player Profile Bar */}
          <div className="w-full max-w-[420px] flex items-center justify-between py-1.5 px-3 mt-2 rounded-xl bg-[#12121c] border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center p-0.5 bg-white border border-zinc-200 shadow-sm">
                <ChessPieceSvg type="k" color={isFlipped ? 'b' : 'w'} className="w-4 h-4" />
              </div>
              <span className="font-semibold text-zinc-300">
                {gameMode === 'ai' ? (isFlipped ? 'Obsidian KI (Schwarz)' : 'Du (Weiß)') : isFlipped ? 'Spieler 2' : 'Spieler 1'}
              </span>
              {turn === (isFlipped ? 'b' : 'w') && !isCheckmate && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Am Zug
                </span>
              )}
            </div>

            {/* Captured Pieces by Player */}
            <div className="flex items-center gap-0.5 overflow-x-auto max-w-[150px]">
              {(isFlipped ? capturedBlack : capturedWhite).map((p, i) => (
                <span key={i} className="inline-block">
                  <ChessPieceSvg type={p.type} color={p.color} className="w-3.5 h-3.5" />
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Move History & Game Details Panel */}
        <div className="w-full md:w-64 flex flex-col gap-3 bg-[#111118] border border-[#27272a]/70 rounded-2xl p-4 shrink-0 max-h-[460px]">
          {/* Status Alert Banner */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Status</span>
              <span className="font-bold text-white">
                {isCheckmate
                  ? 'Schachmatt!'
                  : isStalemate
                  ? 'Patt (Remis)'
                  : isCheck
                  ? 'Schach!'
                  : `${turn === 'w' ? 'Weiß' : 'Schwarz'} am Zug`}
              </span>
            </div>

            {/* Live Position Eval Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span>Vorteil: {evalScore > 0 ? `+${(evalScore / 100).toFixed(1)} Weiß` : evalScore < 0 ? `+${(-evalScore / 100).toFixed(1)} Schwarz` : 'Ausgeglichen'}</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  className="bg-white transition-all duration-300"
                  style={{ width: `${Math.max(10, Math.min(90, 50 + evalScore / 20))}%` }}
                />
                <div className="flex-1 bg-zinc-900" />
              </div>
            </div>
          </div>

          {/* Move History List */}
          <div className="flex-1 border border-white/5 rounded-xl p-2 bg-[#0c0c12] overflow-y-auto min-h-[140px] text-xs font-mono space-y-1">
            {moveHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-zinc-600">
                Keine Züge gespielt.
              </div>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-white/5">
                  <span className="text-zinc-500 w-6">{i + 1}.</span>
                  <span className="text-zinc-200 flex-1">{moveHistory[i * 2]?.notation}</span>
                  <span className="text-zinc-400 flex-1">{moveHistory[i * 2 + 1]?.notation || ''}</span>
                </div>
              ))
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleUndo}
              disabled={moveHistory.length === 0 || isAiThinking}
              className="py-1.5 px-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-xs font-semibold text-zinc-300 transition-all"
            >
              Zug zurück
            </button>
            <button
              onClick={resetGame}
              className="py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-semibold border border-purple-500/30 transition-all"
            >
              Aufgeben / Neu
            </button>
          </div>

          {/* Board Themes Selector */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">Thema</span>
            <div className="flex gap-1">
              {(['obsidian', 'cyber', 'wood', 'emerald'] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => setBoardTheme(th)}
                  className={`w-4 h-4 rounded-full border transition-all ${
                    boardTheme === th ? 'scale-125 border-white ring-1 ring-purple-400' : 'border-transparent opacity-60'
                  } ${
                    th === 'obsidian'
                      ? 'bg-purple-600'
                      : th === 'cyber'
                      ? 'bg-cyan-500'
                      : th === 'wood'
                      ? 'bg-amber-700'
                      : 'bg-emerald-600'
                  }`}
                  title={th}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Promotion Choice Modal */}
      <AnimatePresence>
        {promotionPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-[#161622] border border-purple-500/40 rounded-2xl p-5 max-w-xs w-full shadow-2xl text-center space-y-4">
              <h3 className="text-sm font-bold text-white">Bauer umwandeln in:</h3>
              <div className="grid grid-cols-4 gap-2">
                {(['q', 'r', 'b', 'n'] as PieceType[]).map((pType) => (
                  <button
                    key={pType}
                    onClick={() => {
                      makeMove(promotionPending.from, promotionPending.to, pType);
                      setPromotionPending(null);
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-600/30 border border-white/10 hover:border-purple-400 flex items-center justify-center transition-all"
                  >
                    <ChessPieceSvg type={pType} color={promotionPending.piece.color} className="w-8 h-8" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
