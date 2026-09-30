import React, { useState, useMemo } from 'react';
import { StockCandle } from '@shared/types';

interface StockChartViewProps {
  candles: StockCandle[];
  currentPrice: number;
  currency?: string;
  activeRange: string;
  onRangeChange: (range: string) => void;
}

export const StockChartView: React.FC<StockChartViewProps> = ({
  candles,
  currentPrice,
  currency = '$',
  activeRange,
  onRangeChange,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const ranges = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

  const stats = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { min: 0, max: 0, first: 0, last: 0, maxVol: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    for (const c of candles) {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    }
    return {
      min: Number((min * 0.995).toFixed(2)),
      max: Number((max * 1.005).toFixed(2)),
      first: candles[0].close,
      last: candles[candles.length - 1].close,
      maxVol: Math.max(1, maxVol),
    };
  }, [candles]);

  const isPositive = stats.last >= stats.first;
  const strokeColor = isPositive ? 'var(--accent-primary, #10b981)' : '#ef4444';

  const chartW = 700;
  const chartH = 240;
  const volH = 50;

  const points = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    const count = candles.length;
    const rangeY = stats.max - stats.min || 1;

    return candles.map((c, i) => {
      const x = (i / (count - 1 || 1)) * chartW;
      const y = chartH - ((c.close - stats.min) / rangeY) * (chartH - 20) - 10;
      const volBarH = (c.volume / stats.maxVol) * volH;
      return { x, y, candle: c, volBarH };
    });
  }, [candles, stats]);

  const svgPath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, idx) => {
      return `${acc} ${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }, '');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${svgPath} L ${lastX.toFixed(1)},${chartH} L ${firstX.toFixed(1)},${chartH} Z`;
  }, [points, svgPath]);

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;
  const displayPrice = hoveredPoint ? hoveredPoint.candle.close : currentPrice;
  const displayDate = hoveredPoint
    ? new Date(hoveredPoint.candle.timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: activeRange === '1D' ? '2-digit' : undefined,
        minute: activeRange === '1D' ? '2-digit' : undefined,
      })
    : '';

  return (
    <div className="markets-chart-container">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-primary">
            {currency}{displayPrice.toFixed(2)}
          </div>
          <div className="text-xs text-secondary">
            {displayDate ? displayDate : `Range: ${activeRange}`}
          </div>
        </div>

        {/* Time Ranges */}
        <div className="markets-range-selector">
          {ranges.map((r) => (
            <button
              key={r}
              className={`range-pill ${activeRange === r ? 'active' : ''}`}
              onClick={() => onRangeChange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="markets-svg-wrapper">
        <svg
          viewBox={`0 0 ${chartW} ${chartH + volH}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, mouseX / rect.width));
            const idx = Math.round(ratio * (points.length - 1));
            setHoverIndex(idx);
          }}
        >
          <defs>
            <linearGradient id="marketsAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={chartH * 0.25} x2={chartW} y2={chartH * 0.25} stroke="var(--border-subtle, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
          <line x1="0" y1={chartH * 0.5} x2={chartW} y2={chartH * 0.5} stroke="var(--border-subtle, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
          <line x1="0" y1={chartH * 0.75} x2={chartW} y2={chartH * 0.75} stroke="var(--border-subtle, rgba(255,255,255,0.06))" strokeDasharray="3 3" />
          <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="var(--border-subtle, rgba(255,255,255,0.15))" />

          {/* Volume Bars */}
          {points.map((p, idx) => (
            <rect
              key={idx}
              x={p.x - 2}
              y={chartH + volH - p.volBarH}
              width={Math.max(2, chartW / points.length - 1)}
              height={p.volBarH}
              fill="var(--accent-primary, #6366f1)"
              opacity={hoverIndex === idx ? 0.6 : 0.2}
            />
          ))}

          {/* Filled Area */}
          <path d={areaPath} fill="url(#marketsAreaGradient)" />

          {/* Price Stroke */}
          <path
            d={svgPath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair & Point */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={0}
                x2={hoveredPoint.x}
                y2={chartH + volH}
                stroke="var(--text-secondary, #94a3b8)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4.5"
                fill={strokeColor}
                stroke="var(--bg-app, #0f172a)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Low & High Range Metadata */}
      <div className="flex justify-between text-2xs text-secondary mt-1 px-1">
        <span>Low: {currency}{stats.min.toFixed(2)}</span>
        <span>High: {currency}{stats.max.toFixed(2)}</span>
      </div>
    </div>
  );
};
