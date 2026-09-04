import React, { useRef, useState, useEffect } from 'react';
import { useOS } from '../../context/OSContext';
import { Download, Trash2, Undo, Eraser, Paintbrush } from 'lucide-react';

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
  const { sounds, accentConfig, addNotification, effectiveTheme, effectiveGlassContrast } = useOS();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedColor, setSelectedColor] = useState('#a855f7');
  const [brushSize, setBrushSize] = useState(6);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  const isLightMode = effectiveTheme === 'light' || (effectiveTheme === 'glassy' && effectiveGlassContrast === 'dark');

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#101017';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), snapshot]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    const previous = newHistory.pop();
    setHistory(newHistory);

    if (previous) {
      ctx.putImageData(previous, 0, 0);
      sounds.playClick();
    }
  };

  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveHistory();
    const { x, y } = getCanvasCoords(clientX, clientY);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isEraser ? '#101017' : selectedColor;
    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();

    setIsDrawing(true);
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(clientX, clientY);
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

  // Pointer event handlers (works for Mouse, Touch, and Stylus/Apple Pencil)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    startDrawing(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    draw(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
    stopDrawing();
  };

  // Native touch fallback for older iOS Safari
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      startDrawing(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      draw(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    saveHistory();
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
    <div className={`flex flex-col h-full w-full select-none p-3 sm:p-4 gap-3 font-sans transition-colors ${
      isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-[#0a0a0e] text-[#f4f4f5]'
    }`}>
      {/* Top Toolbar */}
      <div className={`flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl border transition-colors ${
        isLightMode ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#14141d] border-[#27272a]'
      }`}>
        {/* Tools: Brush & Eraser & Undo */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setIsEraser(false);
              sounds.playClick();
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              !isEraser
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Paintbrush className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Pinsel</span>
          </button>
          <button
            onClick={() => {
              setIsEraser(true);
              sounds.playClick();
            }}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isEraser
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/50 shadow'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eraser className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Radierer</span>
          </button>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
              history.length > 0
                ? isLightMode
                  ? 'text-slate-700 hover:bg-slate-100'
                  : 'text-zinc-300 hover:text-white hover:bg-white/10'
                : 'opacity-40 cursor-not-allowed'
            }`}
            title="Rückgängig"
          >
            <Undo className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setIsEraser(false);
                sounds.playClick();
              }}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                selectedColor === color && !isEraser ? 'scale-125 ring-2 ring-purple-500 ring-offset-2 ring-offset-black' : 'hover:scale-110'
              }`}
              style={{
                backgroundColor: color,
                borderColor: color === '#ffffff' ? '#d4d4d8' : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>

        {/* Brush Size Slider */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium hidden sm:inline ${isLightMode ? 'text-slate-500' : 'text-zinc-400'}`}>
            {brushSize}px
          </span>
          <input
            type="range"
            min={2}
            max={32}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-16 sm:w-20 accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Clear & Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleClear}
            className={`p-2 rounded-xl border transition-colors ${
              isLightMode
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-red-500'
                : 'bg-[#1a1a24] hover:bg-[#262638] border-[#27272a] text-zinc-300 hover:text-red-400'
            }`}
            title="Leinwand leeren"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow flex items-center gap-1.5 active:scale-95 transition-transform"
            style={{ backgroundColor: accentConfig.primary }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportieren</span>
          </button>
        </div>
      </div>

      {/* Canvas Area with touch-none for complete gesture isolation */}
      <div className="flex-1 rounded-2xl border border-[#27272a] bg-[#101017] shadow-inner flex items-center justify-center overflow-hidden touch-none relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ touchAction: 'none' }}
          className="cursor-crosshair w-full h-full object-contain select-none"
        />
      </div>
    </div>
  );
};
