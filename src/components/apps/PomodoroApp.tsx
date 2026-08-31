import React, { useState, useEffect, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { Play, Pause, RotateCcw, Check, Plus, Trash2, Bell, Coffee, Target } from 'lucide-react';
import { motion } from 'motion/react';

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<Mode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export const PomodoroApp: React.FC = () => {
  const { sounds, accentConfig, addNotification } = useOS();

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
    <div className="flex flex-col md:flex-row h-full w-full bg-[#0a0a0e] text-[#f4f4f5] select-none font-sans overflow-hidden">
      {/* Left Column: Timer Dial & Controls */}
      <div className="flex-1 flex flex-col items-center justify-between p-6 border-b md:border-b-0 md:border-r border-[#27272a]/60">
        {/* Mode Selector Tabs */}
        <div className="flex bg-[#14141d] p-1 rounded-2xl border border-[#27272a] gap-1">
          <button
            onClick={() => handleModeSwitch('work')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'work' ? 'bg-[#222230] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-purple-400" />
            <span>Fokus (25m)</span>
          </button>
          <button
            onClick={() => handleModeSwitch('shortBreak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'shortBreak' ? 'bg-[#222230] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-emerald-400" />
            <span>Kurze Pause (5m)</span>
          </button>
          <button
            onClick={() => handleModeSwitch('longBreak')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              mode === 'longBreak' ? 'bg-[#222230] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-blue-400" />
            <span>Lange Pause (15m)</span>
          </button>
        </div>

        {/* Circular Dial Timer Display */}
        <div className="relative w-56 h-56 flex items-center justify-center my-4">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-zinc-800"
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
            <span className="text-5xl font-extrabold font-mono tracking-tight text-white drop-shadow-md">
              {formattedTime}
            </span>
            <span className="text-xs text-zinc-400 font-medium mt-1 uppercase tracking-wider">
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
            className="p-3 rounded-2xl bg-[#14141d] hover:bg-[#1e1e2b] border border-[#27272a] text-zinc-300 hover:text-white transition-colors"
            title="Zurücksetzen"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Completed Cycles Counter */}
        <div className="mt-3 text-xs text-zinc-400 font-mono">
          Abgeschlossene Zyklen: <span className="text-purple-300 font-bold">{completedCycles} 🍅</span>
        </div>
      </div>

      {/* Right Column: Mini Task Checklist */}
      <div className="w-full md:w-80 flex flex-col justify-between p-5 bg-[#0e0e14] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-2">
            <h3 className="text-sm font-bold text-white">Fokus-Aufgaben</h3>
            <span className="text-[11px] text-zinc-400 font-mono">
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
              className="flex-1 bg-[#14141d] border border-[#27272a] focus:border-purple-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              className="p-2 rounded-xl text-white shadow-sm"
              style={{ backgroundColor: accentConfig.primary }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Task List */}
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  task.done
                    ? 'bg-[#12121a]/60 border-zinc-800 text-zinc-500 line-through'
                    : 'bg-[#14141d] border-[#27272a] text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                      task.done
                        ? 'bg-purple-600 border-purple-500 text-white'
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
                  className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 opacity-40 hover:opacity-100"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
