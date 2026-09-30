import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowRight,
  RotateCcw,
  RotateCw,
  Trash2,
  Check,
  X,
  PieChart,
  BarChart2,
  Activity,
  Layers,
} from 'lucide-react';

export type DrawingTool =
  | 'pen'
  | 'pencil'
  | 'marker'
  | 'highlighter'
  | 'eraser'
  | 'rect'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'flowchart-node'
  | 'chart-bar'
  | 'chart-pie';

interface SketchCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertDrawing: (dataUrl: string) => void;
  initialDataUrl?: string | null;
}

export const SketchCanvasModal: React.FC<SketchCanvasModalProps> = ({
  isOpen,
  onClose,
  onInsertDrawing,
  initialDataUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState('#A78BFA'); // Default violet, matches NEXUS
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  // Undo / Redo stacks
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Mode preset colors
  const presetColors = [
    '#A78BFA', // Violet
    '#F5C542', // Golden
    '#F02D43', // Redline
    '#38BDF8', // Cyan
    '#34D399', // Emerald
    '#FB923C', // Amber
    '#FFFFFF', // White
    '#94A3B8', // Gray
    '#0B0D12', // Dark Obsidian
  ];

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 500;

    // Fill transparent or white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        saveState();
      };
      img.src = initialDataUrl;
    } else {
      saveState();
    }
  }, [isOpen]);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const truncated = prev.slice(0, historyIndex + 1);
      return [...truncated, currentImg];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prevIndex = historyIndex - 1;
    ctx.putImageData(history[prevIndex], 0, 0);
    setHistoryIndex(prevIndex);
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const nextIndex = historyIndex + 1;
    ctx.putImageData(history[nextIndex], 0, 0);
    setHistoryIndex(nextIndex);
  }, [history, historyIndex]);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const configureContext = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (tool) {
      case 'pencil':
        ctx.lineWidth = Math.max(1, strokeWidth - 1);
        ctx.globalAlpha = 0.65;
        break;
      case 'marker':
        ctx.lineWidth = strokeWidth * 2.5;
        ctx.globalAlpha = 0.5;
        break;
      case 'highlighter':
        ctx.lineWidth = strokeWidth * 4.5;
        ctx.globalAlpha = 0.35;
        ctx.lineCap = 'square';
        break;
      case 'eraser':
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#ffffff';
        ctx.lineWidth = strokeWidth * 3.5;
        ctx.globalAlpha = 1;
        break;
      default:
        ctx.lineWidth = strokeWidth;
        ctx.globalAlpha = opacity;
        break;
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartX(x);
    setStartY(y);
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));

    configureContext(ctx);

    if (['pen', 'pencil', 'marker', 'highlighter', 'eraser'].includes(tool)) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'flowchart-node') {
      drawFlowchartNode(ctx, x, y, 'Process Node');
      setIsDrawing(false);
      saveState();
    } else if (tool === 'chart-bar') {
      drawSampleBarChart(ctx, x, y);
      setIsDrawing(false);
      saveState();
    } else if (tool === 'chart-pie') {
      drawSamplePieChart(ctx, x, y);
      setIsDrawing(false);
      saveState();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (['pen', 'pencil', 'marker', 'highlighter', 'eraser'].includes(tool)) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      // Restore snapshot for clean shape dragging
      ctx.putImageData(snapshot, 0, 0);
      configureContext(ctx);

      const width = x - startX;
      const height = y - startY;

      if (tool === 'rect') {
        ctx.strokeRect(startX, startY, width, height);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(width * width + height * height);
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        drawArrow(ctx, startX, startY, x, y);
      }
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setSnapshot(null);
    saveState();
  };

  // Shape helpers
  const drawArrow = (
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number
  ) => {
    const headLength = 15;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawFlowchartNode = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    label: string
  ) => {
    const w = 140;
    const h = 50;
    const rx = x - w / 2;
    const ry = y - h / 2;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = '#f8fafc';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.roundRect(rx, ry, w, h, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.restore();
  };

  const drawSampleBarChart = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const data = [45, 80, 60, 100, 75];
    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'FY'];
    const barWidth = 28;
    const gap = 12;

    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.fillRect(x - 20, y - 130, 220, 160);
    ctx.strokeRect(x - 20, y - 130, 220, 160);

    data.forEach((val, i) => {
      const bx = x + i * (barWidth + gap);
      const by = y - val;
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, barWidth, val);

      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], bx + barWidth / 2, y + 14);
    });
    ctx.restore();
  };

  const drawSamplePieChart = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const slices = [
      { val: 40, col: color },
      { val: 30, col: '#38BDF8' },
      { val: 20, col: '#34D399' },
      { val: 10, col: '#FB923C' },
    ];
    const radius = 55;
    let currentAngle = 0;

    ctx.save();
    slices.forEach((slice) => {
      const sliceAngle = (slice.val / 100) * 2 * Math.PI;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = slice.col;
      ctx.fill();
      currentAngle += sliceAngle;
    });
    ctx.restore();
  };

  const handleFinish = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onInsertDrawing(dataUrl);
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleUndo, handleRedo, onClose]);

  if (!isOpen) return null;

  return (
    <div className="sketch-modal-overlay">
      <div className="sketch-modal-content">
        {/* Header */}
        <div className="sketch-header">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-accent" />
            <h3 className="sketch-title">NEXUS Visual Notes &amp; Sketch Canvas</h3>
          </div>
          <button className="nexus-icon-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="sketch-toolbar">
          {/* Drawing Tools */}
          <div className="sketch-tool-group">
            <button
              className={`sketch-btn ${tool === 'pen' ? 'active' : ''}`}
              onClick={() => setTool('pen')}
              title="Pen (Normal)"
            >
              <Pen size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'pencil' ? 'active' : ''}`}
              onClick={() => setTool('pencil')}
              title="Pencil (Textured)"
            >
              <Activity size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'highlighter' ? 'active' : ''}`}
              onClick={() => setTool('highlighter')}
              title="Highlighter"
            >
              <Highlighter size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Eraser"
            >
              <Eraser size={16} />
            </button>
          </div>

          <div className="sketch-divider" />

          {/* Geometric Shapes */}
          <div className="sketch-tool-group">
            <button
              className={`sketch-btn ${tool === 'rect' ? 'active' : ''}`}
              onClick={() => setTool('rect')}
              title="Rectangle"
            >
              <Square size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => setTool('circle')}
              title="Circle / Ellipse"
            >
              <Circle size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'line' ? 'active' : ''}`}
              onClick={() => setTool('line')}
              title="Straight Line"
            >
              <Minus size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'arrow' ? 'active' : ''}`}
              onClick={() => setTool('arrow')}
              title="Arrow"
            >
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="sketch-divider" />

          {/* Diagrams & Charts */}
          <div className="sketch-tool-group">
            <button
              className={`sketch-btn ${tool === 'flowchart-node' ? 'active' : ''}`}
              onClick={() => setTool('flowchart-node')}
              title="Insert Flowchart Node"
            >
              <span style={{ fontSize: '11px', fontWeight: 600 }}>[Node]</span>
            </button>
            <button
              className={`sketch-btn ${tool === 'chart-bar' ? 'active' : ''}`}
              onClick={() => setTool('chart-bar')}
              title="Insert Bar Chart"
            >
              <BarChart2 size={16} />
            </button>
            <button
              className={`sketch-btn ${tool === 'chart-pie' ? 'active' : ''}`}
              onClick={() => setTool('chart-pie')}
              title="Insert Pie Chart"
            >
              <PieChart size={16} />
            </button>
          </div>

          <div className="sketch-divider" />

          {/* Stroke Width Slider */}
          <div className="sketch-slider-group" title={`Stroke Width: ${strokeWidth}px`}>
            <span className="sketch-label">Size:</span>
            <input
              type="range"
              min="1"
              max="24"
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="sketch-range"
            />
            <span className="sketch-val">{strokeWidth}px</span>
          </div>

          <div className="sketch-divider" />

          {/* Palette Colors */}
          <div className="sketch-palette">
            {presetColors.map((c) => (
              <button
                key={c}
                className={`sketch-color-swatch ${color === c ? 'active' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                title={c}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="sketch-color-picker"
              title="Custom Color"
            />
          </div>

          <div className="sketch-spacer" />

          {/* Undo / Redo / Clear */}
          <div className="sketch-actions">
            <button
              className="sketch-btn"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="sketch-btn"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
            >
              <RotateCw size={15} />
            </button>
            <button className="sketch-btn text-danger" onClick={handleClear} title="Clear Canvas">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="sketch-canvas-container">
          <canvas
            ref={canvasRef}
            className="sketch-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>

        {/* Footer */}
        <div className="sketch-footer">
          <div className="sketch-footer-tip">
            Tip: Select any tool or shape, then drag to draw. Click Insert to embed into your note.
          </div>
          <div className="flex gap-2">
            <button className="nexus-btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="nexus-btn btn-primary" onClick={handleFinish}>
              <Check size={16} />
              Insert into Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
