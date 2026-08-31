import React, { useState, useRef } from 'react';
import { useOS } from '../../context/OSContext';
import { Volume2, Music, Sparkles, Sliders } from 'lucide-react';

const NOTES = [
  { note: 'C4', freq: 261.63, isBlack: false, key: 'A' },
  { note: 'C#4', freq: 277.18, isBlack: true, key: 'W' },
  { note: 'D4', freq: 293.66, isBlack: false, key: 'S' },
  { note: 'D#4', freq: 311.13, isBlack: true, key: 'E' },
  { note: 'E4', freq: 329.63, isBlack: false, key: 'D' },
  { note: 'F4', freq: 349.23, isBlack: false, key: 'F' },
  { note: 'F#4', freq: 369.99, isBlack: true, key: 'T' },
  { note: 'G4', freq: 392.0, isBlack: false, key: 'G' },
  { note: 'G#4', freq: 415.3, isBlack: true, key: 'Y' },
  { note: 'A4', freq: 440.0, isBlack: false, key: 'H' },
  { note: 'A#4', freq: 466.16, isBlack: true, key: 'U' },
  { note: 'B4', freq: 493.88, isBlack: false, key: 'J' },
  { note: 'C5', freq: 523.25, isBlack: false, key: 'K' },
];

export const AudioSynthApp: React.FC = () => {
  const { accentConfig } = useOS();
  const [waveform, setWaveform] = useState<OscillatorType>('sine');
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [detune, setDetune] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq: number, noteName: string) => {
    setActiveNote(noteName);
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.detune.setValueAtTime(detune, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.warn('Audio play error:', e);
    }

    setTimeout(() => {
      setActiveNote((prev) => (prev === noteName ? null : prev));
    }, 300);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0f] text-[#f4f4f5] select-none p-5 justify-between font-sans overflow-hidden">
      {/* Top Synth Controls */}
      <div className="p-4 rounded-2xl bg-[#14141d] border border-[#27272a] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Obsidian Synthesizer</h2>
          </div>
          <span className="text-xs text-zinc-400 font-mono">Web Audio API</span>
        </div>

        {/* Waveform Selector */}
        <div className="grid grid-cols-4 gap-2">
          {(['sine', 'sawtooth', 'square', 'triangle'] as OscillatorType[]).map((wave) => (
            <button
              key={wave}
              onClick={() => setWaveform(wave)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                waveform === wave
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-[#1a1a24] text-zinc-400 hover:text-white border border-[#27272a]'
              }`}
            >
              {wave}
            </button>
          ))}
        </div>

        {/* Detune Slider */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Pitch Detune</span>
          <span className="font-mono">{detune} cents</span>
          <input
            type="range"
            min={-100}
            max={100}
            value={detune}
            onChange={(e) => setDetune(Number(e.target.value))}
            className="w-36 accent-purple-500"
          />
        </div>
      </div>

      {/* Interactive Piano Keys */}
      <div className="relative h-44 w-full flex justify-center bg-[#101016] p-2 rounded-2xl border border-[#27272a] shadow-inner select-none">
        <div className="flex h-full w-full max-w-lg relative">
          {NOTES.filter((n) => !n.isBlack).map((whiteKey) => {
            const isActive = activeNote === whiteKey.note;
            return (
              <button
                key={whiteKey.note}
                onClick={() => playTone(whiteKey.freq, whiteKey.note)}
                className={`flex-1 h-full rounded-b-xl border flex flex-col justify-end pb-3 items-center transition-all ${
                  isActive
                    ? 'bg-purple-300 border-purple-400 shadow-md translate-y-1'
                    : 'bg-white hover:bg-zinc-100 border-zinc-300'
                }`}
              >
                <span className="text-[10px] font-bold text-zinc-800 font-mono">{whiteKey.note}</span>
                <span className="text-[9px] text-zinc-500 font-mono font-semibold">[{whiteKey.key}]</span>
              </button>
            );
          })}

          {/* Black Keys Overlay */}
          <div className="absolute inset-0 flex pointer-events-none">
            <div className="w-[7%]" />
            <button
              onClick={() => playTone(277.18, 'C#4')}
              className={`pointer-events-auto w-[9%] h-[60%] rounded-b-lg border border-black flex flex-col justify-end pb-2 items-center transition-all ${
                activeNote === 'C#4' ? 'bg-purple-600' : 'bg-[#181822] hover:bg-[#282836]'
              }`}
            >
              <span className="text-[9px] text-zinc-300 font-mono">[W]</span>
            </button>
            <div className="w-[5%]" />
            <button
              onClick={() => playTone(311.13, 'D#4')}
              className={`pointer-events-auto w-[9%] h-[60%] rounded-b-lg border border-black flex flex-col justify-end pb-2 items-center transition-all ${
                activeNote === 'D#4' ? 'bg-purple-600' : 'bg-[#181822] hover:bg-[#282836]'
              }`}
            >
              <span className="text-[9px] text-zinc-300 font-mono">[E]</span>
            </button>
            <div className="w-[19%]" />
            <button
              onClick={() => playTone(369.99, 'F#4')}
              className={`pointer-events-auto w-[9%] h-[60%] rounded-b-lg border border-black flex flex-col justify-end pb-2 items-center transition-all ${
                activeNote === 'F#4' ? 'bg-purple-600' : 'bg-[#181822] hover:bg-[#282836]'
              }`}
            >
              <span className="text-[9px] text-zinc-300 font-mono">[T]</span>
            </button>
            <div className="w-[5%]" />
            <button
              onClick={() => playTone(415.3, 'G#4')}
              className={`pointer-events-auto w-[9%] h-[60%] rounded-b-lg border border-black flex flex-col justify-end pb-2 items-center transition-all ${
                activeNote === 'G#4' ? 'bg-purple-600' : 'bg-[#181822] hover:bg-[#282836]'
              }`}
            >
              <span className="text-[9px] text-zinc-300 font-mono">[Y]</span>
            </button>
            <div className="w-[5%]" />
            <button
              onClick={() => playTone(466.16, 'A#4')}
              className={`pointer-events-auto w-[9%] h-[60%] rounded-b-lg border border-black flex flex-col justify-end pb-2 items-center transition-all ${
                activeNote === 'A#4' ? 'bg-purple-600' : 'bg-[#181822] hover:bg-[#282836]'
              }`}
            >
              <span className="text-[9px] text-zinc-300 font-mono">[U]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
