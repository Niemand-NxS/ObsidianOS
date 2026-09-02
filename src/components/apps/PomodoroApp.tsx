import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { Play, Pause, RotateCcw, Check, Plus, Trash2, Bell, Coffee, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<Mode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PomodoroApp: React.FC = () => {
  const { sounds, accentConfig, addNotification, isLight, effectiveGlassContrast } = useOS();
  const isLightMode = isLight || effectiveGlassContrast === 'dark';

  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);

  // Todo / Task List inside Pomodoro
  const [tasks, setTasks] = useState<{ id: string; text: string; done: boolean }[]>([
    { id: '1', text: 'ObsidianOS Dokumentation lesen', done: true },
    { id: '2', text: 'Neues Theme konfigurieren', done: false },
    { id: '3', text: 'Deep Focus Arbeitsphase', done: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            sounds.playNotification();

            if (mode === 'work') {
              const newCycles = completedCycles + 1;
              setCompletedCycles(newCycles);
              const nextMode = newCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
              setMode(nextMode);
              setTimeLeft(MODE_TIMES[nextMode]);
              addNotification(
                'Fokuszeit beendet!',
                `Zeit für eine ${nextMode === 'longBreak' ? 'lange' : 'kurze'} Pause.`,
                'success',
                'Pomodoro'
              );
            } else {
              setMode('work');
              setTimeLeft(MODE_TIMES.work);
              addNotification('Pause beendet!', 'Bereit für die nächste Fokus-Runde?', 'info', 'Pomodoro');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedCycles, sounds, addNotification]);

  const handleModeSwitch = (newMode: Mode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODE_TIMES[newMode]);
    sounds.playClick();
  };

  const toggleRunning = () => {
    sounds.playClick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    sounds.playClick();
    setIsRunning(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), text: newTaskInput.trim(), done: false }]);
    setNewTaskInput('');
    sounds.playClick();
  };

  const toggleTask = (id: string) => {
    sounds.playClick();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const deleteTask = (id: string) => {
    sounds.playClose();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const totalTime = MODE_TIMES[mode];
  const progressPercent = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div
      className={`flex flex-col md:flex-row h-full w-full select-none font-sans overflow-hidden transition-colors ${
        isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0e] text-[#f4f4f5]'
      }`}
    >
      {/* Left Column: Timer Dial & Controls */}
      <div
        className={`flex-1 flex flex-col items-center justify-between p-6 border-b md:border-b-0 md:border-r transition-colors ${
          isLightMode ? 'border-slate-200' : 'border-[#27272a]/60'
        }`}
      >
        {/* Mode Selector Tabs */}
        <div
          className={`flex p-1 rounded-2xl border gap-1 relative transition-colors ${
            isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-[#14141d] border-[#27272a]'
          }`}
        >
          <button
            onClick={() => handleModeSwitch('work')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all z-10 ${
              mode === 'work'
                ? isLightMode
                  ? 'text-slate-900 font-bold'
                  : 'text-white font-bold'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {mode === 'work' && (
              <motion.div
                layoutId="pomo-mode-bubble"
                className={`absolute inset-0 rounded-xl shadow-xs ${
                  isLightMode ? 'bg-white border border-slate-200/90' : 'bg-[#222230] border border-white/10'
                }`}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Target className="w-3.5 h-3.5 text-purple-500 relative z-10" />
            <span className="relative z-10">Fokus (25m)</span>
          </button>
          <button
            onClick={() => handleModeSwitch('shortBreak')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all z-10 ${
              mode === 'shortBreak'
                ? isLightMode
                  ? 'text-slate-900 font-bold'
                  : 'text-white font-bold'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {mode === 'shortBreak' && (
              <motion.div
                layoutId="pomo-mode-bubble"
                className={`absolute inset-0 rounded-xl shadow-xs ${
                  isLightMode ? 'bg-white border border-slate-200/90' : 'bg-[#222230] border border-white/10'
                }`}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Coffee className="w-3.5 h-3.5 text-emerald-500 relative z-10" />
            <span className="relative z-10">Kurze Pause (5m)</span>
          </button>
          <button
            onClick={() => handleModeSwitch('longBreak')}
            className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all z-10 ${
              mode === 'longBreak'
                ? isLightMode
                  ? 'text-slate-900 font-bold'
                  : 'text-white font-bold'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {mode === 'longBreak' && (
              <motion.div
                layoutId="pomo-mode-bubble"
                className={`absolute inset-0 rounded-xl shadow-xs ${
                  isLightMode ? 'bg-white border border-slate-200/90' : 'bg-[#222230] border border-white/10'
                }`}
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              />
            )}
            <Coffee className="w-3.5 h-3.5 text-blue-500 relative z-10" />
            <span className="relative z-10">Lange Pause (15m)</span>
          </button>
        </div>

        {/* Circular Dial Timer Display */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className={isLightMode ? 'stroke-slate-200' : 'stroke-zinc-800'}
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke={accentConfig.primary}
              strokeWidth="5"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className={`text-5xl font-extrabold font-mono tracking-tight drop-shadow-sm ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
              {formattedTime}
            </span>
            <span className={`text-xs font-semibold mt-1 uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              {mode === 'work' ? 'Fokusphase' : 'Erholung'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRunning}
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white shadow-xl flex items-center gap-2 transition-transform active:scale-95"
            style={{ backgroundColor: accentConfig.primary }}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{isRunning ? 'Pausieren' : 'Starten'}</span>
          </button>

          <button
            onClick={handleReset}
            className={`p-3 rounded-2xl border transition-colors ${
              isLightMode
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                : 'bg-[#14141d] hover:bg-[#1e1e2b] border-[#27272a] text-zinc-300 hover:text-white'
            }`}
            title="Zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Completed Cycles Counter */}
        <div className={`mt-3 text-xs font-mono ${isLightMode ? 'text-slate-600' : 'text-zinc-400'}`}>
          Abgeschlossene Zyklen: <span className="font-bold text-purple-600 dark:text-purple-300">{completedCycles} 🍅</span>
        </div>
      </div>

      {/* Right Column: Mini Task Checklist */}
      <div
        className={`w-full md:w-80 flex flex-col justify-between p-5 overflow-y-auto transition-colors ${
          isLightMode ? 'bg-white border-slate-200' : 'bg-[#0e0e14]'
        }`}
      >
        <div className="space-y-4">
          <div className={`flex items-center justify-between border-b pb-2 ${isLightMode ? 'border-slate-200' : 'border-[#27272a]/60'}`}>
            <h3 className={`text-sm font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Fokus-Aufgaben</h3>
            <span className={`text-[11px] font-mono ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              {tasks.filter((t) => t.done).length}/{tasks.length}
            </span>
          </div>

          {/* New Task Form */}
          <form onSubmit={handleAddTask} className="flex gap-1.5">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Neue Aufgabe..."
              className={`flex-1 border rounded-xl px-3 py-1.5 text-xs focus:outline-none transition-colors ${
                isLightMode
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:bg-white'
                  : 'bg-[#14141d] border-[#27272a] text-white placeholder-zinc-500 focus:border-purple-500'
              }`}
            />
            <button
              type="submit"
              className="p-2 rounded-xl text-white shadow-sm transition-all"
              style={{ backgroundColor: accentConfig.primary }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Task List */}
          <motion.div layout className="space-y-2">
            <AnimatePresence>
              {tasks.map((task) => (
                <motion.div
                  layout
                  layoutId={`pomodoro-task-${task.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    task.done
                      ? isLightMode
                        ? 'bg-slate-100/70 border-slate-200 text-slate-400 line-through'
                        : 'bg-[#12121a]/60 border-zinc-800 text-zinc-500 line-through'
                      : isLightMode
                      ? 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 shadow-xs'
                      : 'bg-[#14141d] border-[#27272a] text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        task.done
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : isLightMode
                          ? 'border-slate-300 bg-white'
                          : 'border-zinc-600 bg-[#0d0d12]'
                      }`}
                    >
                      {task.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs truncate">{task.text}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className={`p-1 rounded-lg transition-colors ${
                      isLightMode
                        ? 'text-slate-400 hover:text-red-500 hover:bg-slate-200'
                        : 'text-zinc-500 hover:text-red-400 hover:bg-white/5 opacity-40 hover:opacity-100'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
