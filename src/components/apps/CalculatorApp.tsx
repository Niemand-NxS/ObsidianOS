import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { CalculatorHistoryItem } from '../../types';
import { History, Delete, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import { sounds } from '../../services/soundService';

export const CalculatorApp: React.FC = () => {
  const { accentConfig } = useOS();

  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [history, setHistory] = useState<CalculatorHistoryItem[]>([
    {
      id: 'calc-1',
      expression: '128 * 64',
      result: '8192',
      timestamp: Date.now() - 60000 * 5,
    },
    {
      id: 'calc-2',
      expression: 'sqrt(65536)',
      result: '256',
      timestamp: Date.now() - 60000 * 2,
    },
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Safe evaluation of mathematical expression
  const calculateResult = useCallback(() => {
    try {
      if (!expression && display === '0') return;

      const fullExpr = expression + display;
      // Sanitize input
      let sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/\^/g, '**');

      // Disallow illegal characters
      if (/[^0-9+\-*/().,% MathPIEsincolgqrt*]/.test(sanitized)) {
        setDisplay('Fehler');
        return;
      }

      // eslint-disable-next-line no-eval
      const evaluated = Function(`"use strict"; return (${sanitized})`)();

      if (isNaN(evaluated) || !isFinite(evaluated)) {
        setDisplay('Fehler');
        return;
      }

      const resStr = String(Math.round(evaluated * 100000000) / 100000000);

      const newItem: CalculatorHistoryItem = {
        id: 'calc-' + Date.now(),
        expression: fullExpr,
        result: resStr,
        timestamp: Date.now(),
      };

      setHistory((prev) => [newItem, ...prev.slice(0, 19)]);
      setDisplay(resStr);
      setExpression('');
      sounds.playClick();
    } catch (err) {
      setDisplay('Fehler');
    }
  }, [expression, display]);

  const handleNumber = (num: string) => {
    sounds.playClick();
    if (display === '0' || display === 'Fehler') {
      setDisplay(num);
    } else {
      setDisplay((prev) => prev + num);
    }
  };

  const handleOperator = (op: string) => {
    sounds.playClick();
    if (display === 'Fehler') return;
    setExpression((prev) => prev + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleClear = () => {
    sounds.playClick();
    setDisplay('0');
    setExpression('');
  };

  const handleBackspace = () => {
    sounds.playClick();
    if (display.length > 1 && display !== 'Fehler') {
      setDisplay((prev) => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleScientificFunc = (funcName: string) => {
    sounds.playClick();
    if (funcName === 'sqrt') {
      setExpression((prev) => prev + 'sqrt(');
      setDisplay('0');
    } else if (funcName === 'pow2') {
      const num = parseFloat(display) || 0;
      setDisplay(String(num * num));
    } else if (funcName === 'sin') {
      setExpression((prev) => prev + 'sin(');
      setDisplay('0');
    } else if (funcName === 'cos') {
      setExpression((prev) => prev + 'cos(');
      setDisplay('0');
    } else if (funcName === 'pi') {
      setDisplay(String(Math.PI));
    } else if (funcName === 'e') {
      setDisplay(String(Math.E));
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'].includes(e.key)) {
        e.preventDefault();
        handleNumber(e.key);
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        calculateResult();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calculateResult, display, expression]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div id="calculator-app" className="flex flex-col h-full w-full bg-[#0a0a0e] text-[#f4f4f5] select-none p-3 relative">
      {/* Top bar with mode toggle and history button */}
      <div className="flex items-center justify-between pb-2 border-b border-[#27272a]/50">
        <button
          onClick={() => setIsScientific(!isScientific)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#181822] text-zinc-300 hover:text-white border border-[#27272a] transition-all"
        >
          {isScientific ? 'Standard' : 'Wissenschaftlich'}
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded-lg border transition-all ${
            showHistory
              ? 'bg-purple-600 text-white border-purple-500'
              : 'bg-[#181822] text-zinc-400 hover:text-white border-[#27272a]'
          }`}
          title="Verlauf"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Screen / Display */}
      <div className="py-4 px-3 flex flex-col items-end justify-end min-h-[90px] bg-[#121218] rounded-2xl border border-[#22222a] my-2">
        <span className="text-xs font-mono text-zinc-500 h-5 truncate max-w-full">
          {expression}
        </span>
        <span className="text-3xl font-bold font-mono text-white tracking-tight break-all">
          {display}
        </span>
      </div>

      {/* Keypad Grid */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Scientific Row if enabled */}
        {isScientific && (
          <div className="grid grid-cols-6 gap-1.5">
            <button
              onClick={() => handleScientificFunc('sin')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              sin
            </button>
            <button
              onClick={() => handleScientificFunc('cos')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              cos
            </button>
            <button
              onClick={() => handleScientificFunc('sqrt')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              √
            </button>
            <button
              onClick={() => handleScientificFunc('pow2')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              x²
            </button>
            <button
              onClick={() => handleScientificFunc('pi')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              π
            </button>
            <button
              onClick={() => handleScientificFunc('e')}
              className="py-1.5 rounded-xl bg-[#1a1a24] text-xs font-mono text-zinc-300 hover:bg-[#222230] border border-[#27272a]"
            >
              e
            </button>
          </div>
        )}

        {/* Standard Numpad Grid */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="rounded-2xl bg-[#221c2c] text-purple-300 font-bold hover:bg-[#2e243d] border border-purple-900/40 text-sm transition-all"
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className="rounded-2xl bg-[#181822] text-zinc-300 hover:bg-[#22222e] border border-[#27272a] flex items-center justify-center transition-all"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOperator('%')}
            className="rounded-2xl bg-[#181822] text-zinc-300 hover:bg-[#22222e] border border-[#27272a] font-bold text-sm transition-all"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all"
            style={{ backgroundColor: accentConfig.primary }}
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all"
            style={{ backgroundColor: accentConfig.primary }}
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all"
            style={{ backgroundColor: accentConfig.primary }}
          >
            −
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all"
            style={{ backgroundColor: accentConfig.primary }}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber('0')}
            className="col-span-2 rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-semibold text-lg transition-all"
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className="rounded-2xl bg-[#161620] text-white hover:bg-[#20202c] border border-[#27272a] font-bold text-lg transition-all"
          >
            .
          </button>
          <button
            onClick={calculateResult}
            className="rounded-2xl font-bold text-xl text-white shadow-xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: accentConfig.secondary, borderColor: accentConfig.border }}
          >
            =
          </button>
        </div>
      </div>

      {/* History Drawer Overlay */}
      {showHistory && (
        <div className="absolute inset-x-0 bottom-0 top-12 bg-[#121218]/95 backdrop-blur-xl z-20 p-4 flex flex-col border-t border-[#27272a]">
          <div className="flex items-center justify-between pb-2 border-b border-[#27272a]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-400" /> Berechnungsverlauf
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Löschen
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-2">
            {history.length === 0 ? (
              <p className="text-center text-xs text-zinc-500 py-8">Keine Einträge im Verlauf</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setDisplay(item.result);
                    setShowHistory(false);
                  }}
                  className="p-2.5 rounded-xl bg-[#181824] border border-[#27272a] hover:border-purple-500 cursor-pointer flex items-center justify-between transition-all"
                >
                  <div>
                    <p className="text-[11px] font-mono text-zinc-400">{item.expression}</p>
                    <p className="text-sm font-bold font-mono text-white">{item.result}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(item.result, item.id);
                    }}
                    className="p-1.5 rounded-lg bg-[#222230] text-zinc-300 hover:text-white"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
