import React from 'react';
import { PieceColor, PieceType } from './ChessApp';

interface ChessPieceSvgProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const ChessPieceSvg: React.FC<ChessPieceSvgProps> = ({ type, color, className = 'w-9 h-9' }) => {
  const isWhite = color === 'w';

  // High contrast palette:
  // White piece: pure white body + crisp black outline & drop shadow
  // Black piece: obsidian dark body + crisp white outline & glow
  const mainFill = isWhite ? '#ffffff' : '#181824';
  const strokeColor = isWhite ? '#09090b' : '#ffffff';
  const detailStroke = isWhite ? '#27272a' : '#e4e4e7';
  const accentFill = isWhite ? '#f4f4f5' : '#272738';

  const filterStyle = isWhite
    ? { filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.65))' }
    : { filter: 'drop-shadow(0px 1px 3px rgba(255, 255, 255, 0.4))' };

  switch (type) {
    case 'k': // King
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          {/* King Crown & Cross */}
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Cross */}
            <path d="M22.5 5v7M19 8.5h7" stroke={strokeColor} strokeWidth="1.8" />
            {/* Crown Base & Ribs */}
            <path
              d="M22.5 12.5c-4.5 0-9.5 3-10.5 8.5 2.5 1 4.5.5 6.5-1 1.5 3.5 4.5 5 4.5 5s3-1.5 4.5-5c2 1.5 4 2 6.5 1-1-5.5-6-8.5-10.5-8.5z"
              fill={mainFill}
            />
            {/* Base Pedestal */}
            <path
              d="M12 21c0 7 2.5 9 4.5 13.5h12c2-4.5 4.5-6.5 4.5-13.5-3 .5-5.5-.5-7-2-1 2-4 2-5 0-1.5 1.5-4 2.5-7 2z"
              fill={accentFill}
            />
            <path
              d="M11 36.5c0 1.5 2 3.5 4.5 3.5h14c2.5 0 4.5-2 4.5-3.5 0-1.5-2-2-4.5-2h-14c-2.5 0-4.5.5-4.5 2z"
              fill={mainFill}
            />
            {/* Detail Lines */}
            <circle cx="22.5" cy="20" r="2.5" fill={strokeColor} stroke="none" />
            <path d="M16 34.5h13" stroke={detailStroke} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* 5 Crown Jewels */}
            <circle cx="6" cy="12" r="2" fill={strokeColor} />
            <circle cx="14" cy="9" r="2" fill={strokeColor} />
            <circle cx="22.5" cy="8" r="2" fill={strokeColor} />
            <circle cx="31" cy="9" r="2" fill={strokeColor} />
            <circle cx="39" cy="12" r="2" fill={strokeColor} />
            {/* Body */}
            <path
              d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7.5-15-7.5 15-7-11 2 12z"
              fill={mainFill}
            />
            <path
              d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"
              fill={accentFill}
            />
            {/* Base Rim */}
            <path
              d="M11 38.5c0 1 1.5 2 3.5 2h16c2 0 3.5-1 3.5-2 0-1-1.5-1.5-3.5-1.5h-16c-2 0-3.5.5-3.5 1.5z"
              fill={mainFill}
            />
            <path d="M13 35.5h19" stroke={detailStroke} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Castle Crenellations */}
            <path
              d="M9 39h27v-3H9v3zm3-3v-11.5l2-2.5h17l2 2.5V36H12zm0-15h21v-3.5h-3.5v-3h-3.5v3h-7v-3h-3.5v3H12V21z"
              fill={mainFill}
            />
            {/* Waist band */}
            <path d="M14 26.5h17M12 33h21" stroke={detailStroke} strokeWidth="1.2" />
            <path
              d="M11 39.5c0 1.5 1.5 2.5 4 2.5h15c2.5 0 4-1 4-2.5s-1.5-2-4-2H15c-2.5 0-4 .5-4 2z"
              fill={accentFill}
            />
          </g>
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Top Mitre Bulb */}
            <circle cx="22.5" cy="7.5" r="2" fill={strokeColor} />
            <path
              d="M17.5 26c0 4.5 2 7.5 5 7.5s5-3 5-7.5c0-4-3-12-5-15-2 3-5 11-5 15z"
              fill={mainFill}
            />
            {/* Mitre Slash */}
            <path d="M22.5 13.5l4 4.5m-5.5-2.5l5.5 3" stroke={strokeColor} strokeWidth="1.5" />
            {/* Base */}
            <path
              d="M13 37.5c0 1.5 2 2.5 4.5 2.5h10c2.5 0 4.5-1 4.5-2.5 0-1-1.5-2-3-2H16c-1.5 0-3 1-3 2z"
              fill={accentFill}
            />
            <path d="M16 34.5h13" stroke={detailStroke} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'n': // Knight
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Horse Mane, Snout & Body */}
            <path
              d="M22 10c-3 1-5 3.5-5 7 0 2.5 1 4 2 5-3 .5-6 1.5-8 4-2.5 3-2.5 7.5-1 10.5 1 2 2.5 3 4.5 3h16c1.5-4 1.5-8-1-12.5-2-3.5-3.5-5.5-2-9 1.5-3 0-6-2.5-7.5-1.5-1-3-1-4-.5z"
              fill={mainFill}
            />
            {/* Mane Tufts */}
            <path
              d="M24 8.5c1.5 1 2.5 3 2.5 5m-5.5-4c1.5 1 2.5 2.5 2 4.5"
              stroke={detailStroke}
              strokeWidth="1.4"
            />
            {/* Eye */}
            <circle cx="16" cy="18" r="1.5" fill={strokeColor} stroke="none" />
            {/* Base */}
            <path
              d="M12 39.5c0 1.5 2 2.5 4.5 2.5h13c2.5 0 4.5-1 4.5-2.5s-2-2-4.5-2h-13c-2.5 0-4.5.5-4.5 2z"
              fill={accentFill}
            />
          </g>
        </svg>
      );

    case 'p': // Pawn
    default:
      return (
        <svg
          viewBox="0 0 45 45"
          className={`${className} select-none pointer-events-none transition-transform duration-100`}
          style={filterStyle}
        >
          <g
            fill="none"
            fillRule="evenodd"
            stroke={strokeColor}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Pawn Head */}
            <circle cx="22.5" cy="13" r="5.5" fill={mainFill} />
            {/* Neck Ring */}
            <path d="M18.5 19.5h8" stroke={strokeColor} strokeWidth="1.8" />
            {/* Body */}
            <path
              d="M20 20c-3 4-4.5 8-5.5 14h16c-1-6-2.5-10-5.5-14h-5z"
              fill={accentFill}
            />
            {/* Base */}
            <path
              d="M13 38.5c0 1.5 2 2.5 4.5 2.5h10c2.5 0 4.5-1 4.5-2.5s-2-2-4.5-2h-10c-2.5 0-4.5.5-4.5 2z"
              fill={mainFill}
            />
            <path d="M15 35h15" stroke={detailStroke} strokeWidth="1.2" />
          </g>
        </svg>
      );
  }
};
