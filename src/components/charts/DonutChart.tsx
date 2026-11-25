import React, { useState } from 'react';
import { formatBRL } from '../../utils/formatters';

export interface DonutSegment {
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  segments,
  centerLabel,
  centerValue,
  size = 164,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const radius = 56;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const activeSegment = hoveredIdx !== null ? segments[hoveredIdx] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90">
          <circle
            cx="75"
            cy="75"
            r={radius}
            fill="transparent"
            stroke="#1E293B"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, idx) => {
            const dashLength = (seg.percent / 100) * circumference;
            const dashOffset = -(cumulativePercent / 100) * circumference;
            cumulativePercent += seg.percent;
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={seg.label}
                cx="75"
                cy="75"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${Math.max(0, dashLength - 1.5)} ${circumference}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          <span className="text-[10px] font-medium text-slate-400 truncate max-w-[90px]">
            {activeSegment ? activeSegment.label : centerLabel || 'Total'}
          </span>
          <span className="text-xs font-bold text-slate-100 font-mono-nums mt-0.5">
            {activeSegment
              ? `${activeSegment.percent.toFixed(0)}%`
              : centerValue || ''}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((seg, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={seg.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between text-xs rounded-md px-2 py-1 transition-colors cursor-pointer ${
                isHovered ? 'bg-slate-800/70' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-300 truncate">{seg.label}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono-nums">
                {isHovered && (
                  <span className="text-slate-400 text-[11px]">{formatBRL(seg.value)}</span>
                )}
                <span className="font-semibold text-slate-100 w-9 text-right">
                  {Math.round(seg.percent)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
