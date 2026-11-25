import React, { useState } from 'react';
import { formatBRL } from '../../utils/formatters';

interface Point {
  month: string;
  fullLabel: string;
  value: number;
}

interface PatrimonyChartProps {
  data: Point[];
}

export const PatrimonyChart: React.FC<PatrimonyChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number>(data.length - 1);

  const width = 680;
  const height = 225;
  const padLeft = 52;
  const padRight = 22;
  const padTop = 22;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxVal = Math.max(30000, ...data.map((d) => Math.ceil(d.value / 10000) * 10000));
  const yTicks = [0, 10000, 20000, 30000];

  const getX = (idx: number) => padLeft + (idx / Math.max(1, data.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const linePoints = data.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const areaPoints = `${getX(0)},${padTop + plotH} ${linePoints} ${getX(data.length - 1)},${padTop + plotH}`;

  const activePoint = data[hoveredIdx] || data[data.length - 1];
  const activeX = getX(hoveredIdx);
  const activeY = getY(activePoint.value);

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[225px] overflow-visible"
        role="img"
        aria-label="Evolução do Patrimônio"
      >
        <defs>
          <linearGradient id="patrimonyAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#1E293B"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-slate-400 text-[10px] font-mono-nums"
              >
                {tick === 0 ? 'R$ 0' : `R$ ${Math.round(tick / 1000)}k`}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill="url(#patrimonyAreaGrad)" />
        <polyline
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={linePoints}
        />

        {/* Active vertical guide */}
        <line
          x1={activeX}
          y1={padTop}
          x2={activeX}
          y2={padTop + plotH}
          stroke="#22C55E"
          strokeOpacity="0.35"
          strokeDasharray="3 3"
        />

        {data.map((d, idx) => {
          const cx = getX(idx);
          const cy = getY(d.value);
          const isActive = idx === hoveredIdx;
          return (
            <g key={d.fullLabel}>
              <circle
                cx={cx}
                cy={cy}
                r={isActive ? 5 : 3}
                fill={isActive ? '#4ADE80' : '#22C55E'}
                stroke="#0B1120"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                className={`text-[10px] ${
                  isActive ? 'fill-slate-100 font-semibold' : 'fill-slate-400'
                }`}
              >
                {d.month}
              </text>
              <rect
                x={cx - plotW / (data.length * 2)}
                y={padTop}
                width={plotW / data.length}
                height={plotH + 20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
            </g>
          );
        })}
      </svg>

      {/* Floating readout pill matching screenshot 3 & 6 */}
      <div
        className="pointer-events-none absolute top-3 rounded-lg border border-slate-700/90 bg-[#0D1526]/95 px-2.5 py-1.5 text-right shadow-md"
        style={{
          left: `${Math.min(76, Math.max(10, (activeX / width) * 100 - 10))}%`,
          top: `${Math.max(8, (activeY / height) * 100 - 16)}%`,
        }}
      >
        <div className="text-xs font-bold text-slate-100 font-mono-nums">
          {formatBRL(activePoint.value)}
        </div>
        <div className="text-[10px] text-slate-400">{activePoint.fullLabel}</div>
      </div>
    </div>
  );
};
