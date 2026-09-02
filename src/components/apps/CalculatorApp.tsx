import React, { useState, useEffect, useCallback } from 'react';
import { useOS } from '../../context/OSContext';
import { CalculatorHistoryItem } from '../../types';
import { History, Delete, RotateCcw, Copy, Check, Sparkles } from 'lucide-react';
import { sounds } from '../../services/soundService';
import { motion, AnimatePresence } from 'motion/react';

export const CalculatorApp: React.FC = () => {
  const { accentConfig, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

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
    <div
      id="calculator-app"
      className={`flex flex-col h-full w-full select-none p-3 relative transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0e] text-[#f4f4f5]'
      }`}
    >
      {/* Top bar with mode toggle and history button */}
      <div
        className={`flex items-center justify-between pb-2 border-b transition-colors ${
          isLightMode ? 'border-slate-200' : 'border-[#27272a]/50'
        }`}
      >
        <button
          onClick={() => setIsScientific(!isScientific)}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            isLightMode
              ? isScientific
                ? 'bg-white text-purple-700 border-purple-300 shadow-sm'
                : 'bg-slate-200/80 text-slate-700 hover:text-slate-900 border-slate-300'
              : isScientific
              ? 'bg-purple-900/40 text-purple-300 border-purple-600/50'
              : 'bg-[#181822] text-zinc-300 hover:text-white border-[#27272a]'
          }`}
        >
          {isScientific ? 'Standard' : 'Wissenschaftlich'}
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1.5 rounded-lg border transition-all ${
            showHistory
              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
              : isLightMode
              ? 'bg-white text-slate-600 hover:text-slate-900 border-slate-300'
              : 'bg-[#181822] text-zinc-400 hover:text-white border-[#27272a]'
          }`}
          title="Verlauf"
        >
          <History className="w-4 h-4" />
        </button>
      </div>

      {/* Screen / Display */}
      <motion.div
        layout
        className={`py-4 px-3 flex flex-col items-end justify-end min-h-[90px] rounded-2xl border my-2 transition-colors ${
          isLightMode ? 'bg-white border-slate-200 shadow-inner' : 'bg-[#121218] border-[#22222a]'
        }`}
      >
        <span
          className={`text-xs font-mono h-5 truncate max-w-full ${
            isLightMode ? 'text-slate-400' : 'text-zinc-500'
          }`}
        >
          {expression}
        </span>
        <span
          className={`text-3xl font-bold font-mono tracking-tight break-all ${
            isLightMode ? 'text-slate-900' : 'text-white'
          }`}
        >
          {display}
        </span>
      </motion.div>

      {/* Keypad Grid */}
      <motion.div layout className="flex-1 flex flex-col gap-2">
        {/* Scientific Row if enabled */}
        <AnimatePresence>
          {isScientific && (
            <motion.div
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-6 gap-1.5 overflow-hidden"
            >
              {['sin', 'cos', 'sqrt', 'pow2', 'pi', 'e'].map((func) => {
                const label = func === 'sqrt' ? '√' : func === 'pow2' ? 'x²' : func === 'pi' ? 'π' : func;
                return (
                  <button
                    key={func}
                    onClick={() => handleScientificFunc(func)}
                    className={`py-1.5 rounded-xl text-xs font-mono border transition-all ${
                      isLightMode
                        ? 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm'
                        : 'bg-[#1a1a24] text-zinc-300 hover:bg-[#222230] border-[#27272a]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Standard Numpad Grid */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className={`rounded-2xl font-bold text-sm transition-all border ${
              isLightMode
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-200 shadow-sm'
                : 'bg-[#221c2c] text-purple-300 hover:bg-[#2e243d] border-purple-900/40'
            }`}
          >
            AC
          </button>
          <button
            onClick={handleBackspace}
            className={`rounded-2xl border flex items-center justify-center transition-all ${
              isLightMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-[#181822] text-zinc-300 hover:bg-[#22222e] border-[#27272a]'
            }`}
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOperator('%')}
            className={`rounded-2xl border font-bold text-sm transition-all ${
              isLightMode
                ? 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-[#181822] text-zinc-300 hover:bg-[#22222e] border-[#27272a]'
            }`}
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: accentConfig.primary }}
          >
            ÷
          </button>

          {/* Row 2 */}
          {['7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className={`rounded-2xl border font-semibold text-lg transition-all ${
                isLightMode
                  ? 'bg-white text-slate-900 hover:bg-slate-100 border-slate-300 shadow-sm'
                  : 'bg-[#161620] text-white hover:bg-[#20202c] border-[#27272a]'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('×')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: accentConfig.primary }}
          >
            ×
          </button>

          {/* Row 3 */}
          {['4', '5', '6'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className={`rounded-2xl border font-semibold text-lg transition-all ${
                isLightMode
                  ? 'bg-white text-slate-900 hover:bg-slate-100 border-slate-300 shadow-sm'
                  : 'bg-[#161620] text-white hover:bg-[#20202c] border-[#27272a]'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('-')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: accentConfig.primary }}
          >
            −
          </button>

          {/* Row 4 */}
          {['1', '2', '3'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className={`rounded-2xl border font-semibold text-lg transition-all ${
                isLightMode
                  ? 'bg-white text-slate-900 hover:bg-slate-100 border-slate-300 shadow-sm'
                  : 'bg-[#161620] text-white hover:bg-[#20202c] border-[#27272a]'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleOperator('+')}
            className="rounded-2xl font-bold text-lg text-white shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: accentConfig.primary }}
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleNumber('0')}
            className={`col-span-2 rounded-2xl border font-semibold text-lg transition-all ${
              isLightMode
                ? 'bg-white text-slate-900 hover:bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-[#161620] text-white hover:bg-[#20202c] border-[#27272a]'
            }`}
          >
            0
          </button>
          <button
            onClick={() => handleNumber('.')}
            className={`rounded-2xl border font-bold text-lg transition-all ${
              isLightMode
                ? 'bg-white text-slate-900 hover:bg-slate-100 border-slate-300 shadow-sm'
                : 'bg-[#161620] text-white hover:bg-[#20202c] border-[#27272a]'
            }`}
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
      </motion.div>

      {/* History Drawer Overlay with AnimatePresence */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`absolute inset-x-0 bottom-0 top-12 backdrop-blur-xl z-20 p-4 flex flex-col border-t transition-colors ${
              isLightMode
                ? 'bg-white/95 border-slate-200 text-slate-900 shadow-2xl'
                : 'bg-[#121218]/95 border-[#27272a] text-white'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-2 border-b ${
                isLightMode ? 'border-slate-200' : 'border-[#27272a]'
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-purple-500" /> Berechnungsverlauf
              </span>
              <button
                onClick={() => setHistory([])}
                className={`text-[11px] flex items-center gap-1 transition-colors ${
                  isLightMode ? 'text-slate-500 hover:text-red-600' : 'text-zinc-400 hover:text-red-400'
                }`}
              >
                <RotateCcw className="w-3 h-3" /> Löschen
              </button>
            </div>

            <motion.div layout className="flex-1 overflow-y-auto py-2 space-y-2">
              {history.length === 0 ? (
                <p className={`text-center text-xs py-8 ${isLightMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  Keine Einträge im Verlauf
                </p>
              ) : (
                history.map((item) => (
                  <motion.div
                    layout
                    layoutId={`history-calc-${item.id}`}
                    key={item.id}
                    onClick={() => {
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      isLightMode
                        ? 'bg-slate-50 border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 shadow-sm'
                        : 'bg-[#181824] border-[#27272a] hover:border-purple-500'
                    }`}
                  >
                    <div>
                      <p className={`text-[11px] font-mono ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                        {item.expression}
                      </p>
                      <p className={`text-sm font-bold font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {item.result}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.result, item.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isLightMode
                          ? 'bg-slate-200/80 text-slate-700 hover:text-slate-900'
                          : 'bg-[#222230] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </motion.div>
                ))
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
