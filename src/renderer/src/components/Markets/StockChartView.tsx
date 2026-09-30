import React, { useState, useMemo } from 'react';
import { StockCandle } from '@shared/types';

interface StockChartViewProps {
  candles: StockCandle[];
  currentPrice: number;
  currency?: string;
  activeRange: string;
  onRangeChange: (range: string) => void;
}

const RANGES = ['1D', '1W', '1M', '6M', '1Y', '5Y'];

export const StockChartView: React.FC<StockChartViewProps> = ({
  candles,
  currentPrice,
  currency = '$',
  activeRange,
  onRangeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compute boundaries for chart
  const { minPrice, maxPrice, maxVolume, pricePoints, volumeBars } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return { minPrice: 0, maxPrice: 100, maxVolume: 1, pricePoints: '', volumeBars: [] };
    }

    const prices = candles.map((c) => c.close);
    let min = Math.min(...prices);
    let max = Math.max(...prices);
    const maxVol = Math.max(...candles.map((c) => c.volume), 1);

    // Padding
    const rangeDiff = max - min || 1;
    min = Math.max(0, min - rangeDiff * 0.05);
    max = max + rangeDiff * 0.05;

    const width = 640;
    const height = 220;
    const volumeHeight = 45;
    const priceChartHeight = height - volumeHeight - 15;

    const points = candles.map((c, index) => {
      const x = (index / (candles.length - 1 || 1)) * width;
      const y = priceChartHeight - ((c.close - min) / (max - min)) * priceChartHeight + 10;
      return { x, y, candle: c };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}` : `${acc} L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }, '');

    // Area fill
    const areaD = `${pathD} L ${width} ${priceChartHeight + 10} L 0 ${priceChartHeight + 10} Z`;

    const vBars = candles.map((c, index) => {
      const x = (index / (candles.length - 1 || 1)) * width;
      const barHeight = (c.volume / maxVol) * volumeHeight;
      const y = height - barHeight;
      const isUp = c.close >= c.open;
      return { x, y, height: barHeight, isUp };
    });

    return {
      minPrice: min,
      maxPrice: max,
      maxVolume: maxVol,
      pricePoints: pathD,
      areaD,
      points,
      volumeBars: vBars,
      width,
      height,
    };
  }, [candles]);

  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : null;
  const isUpTrend = candles.length > 1 ? candles[candles.length - 1].close >= candles[0].close : true;
  const strokeColor = isUpTrend ? '#10b981' : '#f43f5e';
  const fillColor = isUpTrend ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!candles || candles.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(ratio * (candles.length - 1));
    setHoveredIndex(index);
  };

  return (
    <div className="stock-chart-view space-y-3">
      {/* Range Selectors & Current Hovered Data */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-2">
        <div className="flex items-center gap-1 bg-surface p-0.5 rounded border border-subtle">
          {RANGES.map((r) => (
            <button
              key={r}
              className={`px-2.5 py-1 text-2xs font-semibold rounded transition-colors ${
                activeRange.toUpperCase() === r
                  ? 'bg-primary text-background font-bold shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-surface/80'
              }`}
              onClick={() => onRangeChange(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="text-2xs font-mono text-secondary flex items-center gap-3">
          {activeCandle ? (
            <>
              <span className="text-primary font-semibold">
                {new Date(activeCandle.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>
                Close: <strong className="text-primary">{currency}{activeCandle.close.toFixed(2)}</strong>
              </span>
              <span>
                Vol: <strong>{activeCandle.volume.toLocaleString()}</strong>
              </span>
            </>
          ) : (
            <>
              <span>High: {currency}{maxPrice.toFixed(2)}</span>
              <span>Low: {currency}{minPrice.toFixed(2)}</span>
              <span className="text-2xs text-muted-foreground">(Hover to inspect)</span>
            </>
          )}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[21/9] min-h-[220px] bg-surface/30 rounded border border-subtle overflow-hidden">
        {candles.length > 0 ? (
          <svg
            className="w-full h-full cursor-crosshair select-none"
            viewBox="0 0 640 220"
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Guides */}
            <line x1="0" y1="30" x2="640" y2="30" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
            <line x1="0" y1="90" x2="640" y2="90" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />
            <line x1="0" y1="150" x2="640" y2="150" stroke="currentColor" strokeOpacity="0.06" strokeDasharray="3 3" />

            {/* Volume Separator */}
            <line x1="0" y1="165" x2="640" y2="165" stroke="currentColor" strokeOpacity="0.1" />

            {/* Volume Bars */}
            {volumeBars.map((b, idx) => (
              <rect
                key={idx}
                x={b.x - 1.5}
                y={b.y}
                width={3}
                height={Math.max(1, b.height)}
                fill={b.isUp ? '#10b981' : '#f43f5e'}
                opacity={hoveredIndex === idx ? 0.9 : 0.35}
              />
            ))}

            {/* Price Area Fill */}
            {pricePoints && (
              <path
                d={`${pricePoints} L 640 160 L 0 160 Z`}
                fill="url(#chartGradient)"
              />
            )}

            {/* Price Trend Line */}
            {pricePoints && (
              <path
                d={pricePoints}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover Indicator Crosshair */}
            {hoveredIndex !== null && candles[hoveredIndex] && (
              <g>
                <line
                  x1={(hoveredIndex / (candles.length - 1 || 1)) * 640}
                  y1={0}
                  x2={(hoveredIndex / (candles.length - 1 || 1)) * 640}
                  y2={220}
                  stroke="currentColor"
                  strokeOpacity="0.3"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={(hoveredIndex / (candles.length - 1 || 1)) * 640}
                  cy={150 - ((candles[hoveredIndex].close - minPrice) / (maxPrice - minPrice || 1)) * 140}
                  r="4.5"
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              </g>
            )}
          </svg>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-secondary">
            No chart data available for this range.
          </div>
        )}
      </div>
    </div>
  );
};
