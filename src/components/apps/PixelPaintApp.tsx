import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Download, Trash2, Undo, Eraser, Palette, Paintbrush, Square } from 'lucide-react';

const COLORS = [
  '#ffffff',
  '#a855f7',
  '#3b82f6',
  '#06b6d4',
  '#10b981',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#000000',
];

export const PixelPaintApp: React.FC = () => {
  const { sounds, accentConfig, addNotification } = useOS();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#a855f7');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#101017';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#101017' : selectedColor;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.closePath();
      }
      setIsDrawing(false);
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#101017';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sounds.playClose();
    addNotification('Leinwand geleert', 'Die Zeichenfläche wurde zurückgesetzt.', 'info', 'Pixel Paint');
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sounds.playSuccess();
    const image = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = image;
    a.download = `obsidian-artwork-${Date.now()}.png`;
    a.click();
    addNotification('Bild exportiert', 'Dein Kunstwerk wurde als PNG gespeichert.', 'success', 'Pixel Paint');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0a0a0e] text-[#f4f4f5] select-none p-4 gap-3 font-sans">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#14141d] border border-[#27272a]">
        {/* Tools: Brush & Eraser */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsEraser(false);
              sounds.playClick();
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isEraser ? 'bg-[#222232] text-white border border-purple-500/50 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Paintbrush className="w-4 h-4 text-purple-400" />
            <span>Pinsel</span>
          </button>
          <button
            onClick={() => {
              setIsEraser(true);
              sounds.playClick();
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isEraser ? 'bg-[#222232] text-white border border-purple-500/50 shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4 text-pink-400" />
            <span>Radierer</span>
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setSelectedColor(c);
                setIsEraser(false);
                sounds.playClick();
              }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                selectedColor === c && !isEraser ? 'scale-125 border-white shadow-md' : 'border-zinc-700'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-mono">{brushSize}px</span>
          <input
            type="range"
            min={1}
            max={30}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-purple-500"
          />
        </div>

        {/* Clear & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-[#1a1a24] hover:bg-[#262638] border border-[#27272a] text-zinc-300 hover:text-red-400 transition-colors"
            title="Leinwand leeren"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Speichern</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 rounded-2xl border border-[#27272a] bg-[#101017] shadow-inner flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="cursor-crosshair w-full h-full max-w-full max-h-full"
        />
      </div>
    </div>
  );
};
