import React, { useMemo, useState } from 'react';
import { Transaction } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';

interface CashFlowChartProps {
  transactions: Transaction[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ transactions }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series = useMemo(() => {
    const days = [1, 5, 10, 15, 20, 25, 30, 31];
    return days.map((day) => {
      const receitas = transactions
        .filter((t) => t.type === 'receita' && parseInt(t.date.slice(8, 10), 10) <= day)
        .reduce((acc, t) => acc + t.amount, 0);
      const despesas = transactions
        .filter((t) => t.type === 'despesa' && parseInt(t.date.slice(8, 10), 10) <= day)
        .reduce((acc, t) => acc + t.amount, 0);
      return {
        label: String(day).padStart(2, '0'),
        receitas,
        despesas,
      };
    });
  }, [transactions]);

  const maxVal = useMemo(() => {
    const highest = Math.max(
      10000,
      ...series.map((s) => Math.max(s.receitas, s.despesas))
    );
    return Math.ceil(highest / 2000) * 2000;
  }, [series]);

  const width = 620;
  const height = 225;
  const padLeft = 52;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / Math.max(1, series.length - 1)) * plotW;
  const getY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

  const incomePoints = series.map((s, i) => `${getX(i)},${getY(s.receitas)}`).join(' ');
  const expensePoints = series.map((s, i) => `${getX(i)},${getY(s.despesas)}`).join(' ');

  const incomeArea = `${getX(0)},${padTop + plotH} ${incomePoints} ${getX(series.length - 1)},${padTop + plotH}`;

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => Math.round(maxVal * ratio));

  return (
    <div className="relative w-full select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[225px] overflow-visible"
        role="img"
        aria-label="Gráfico de Fluxo de Caixa"
      >
        <defs>
          <linearGradient id="cashflowIncomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
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
                strokeDasharray={tick === 0 ? undefined : '3 3'}
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

        {/* Hover guide line */}
        {hoveredIdx !== null && (
          <line
            x1={getX(hoveredIdx)}
            y1={padTop}
            x2={getX(hoveredIdx)}
            y2={padTop + plotH}
            stroke="#334155"
            strokeWidth="1"
          />
        )}

        {/* Area under Receitas */}
        <polygon points={incomeArea} fill="url(#cashflowIncomeGrad)" />

        {/* Lines */}
        <polyline
          fill="none"
          stroke="#22C55E"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={incomePoints}
        />
        <polyline
          fill="none"
          stroke="#EF4444"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={expensePoints}
        />

        {/* Points + X labels + Invisible hover hitboxes */}
        {series.map((s, idx) => {
          const cx = getX(idx);
          const cyInc = getY(s.receitas);
          const cyExp = getY(s.despesas);
          const isHovered = hoveredIdx === idx;
          return (
            <g key={s.label}>
              <circle
                cx={cx}
                cy={cyInc}
                r={isHovered ? 4.5 : 3}
                fill="#22C55E"
                stroke="#0B1120"
                strokeWidth="1.5"
              />
              <circle
                cx={cx}
                cy={cyExp}
                r={isHovered ? 4.5 : 3}
                fill="#EF4444"
                stroke="#0B1120"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={height - 6}
                textAnchor="middle"
                className={`text-[10px] font-mono-nums ${
                  isHovered ? 'fill-slate-100 font-semibold' : 'fill-slate-400'
                }`}
              >
                {s.label}
              </text>
              <rect
                x={cx - plotW / (series.length * 2)}
                y={padTop}
                width={plotW / series.length}
                height={plotH + 20}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          );
        })}
      </svg>

      {hoveredIdx !== null && series[hoveredIdx] && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-lg border border-slate-700 bg-[#0D1526]/95 px-3 py-2 text-xs shadow-lg backdrop-blur-sm"
          style={{
            left: `${Math.min(72, Math.max(8, (hoveredIdx / (series.length - 1)) * 80))}%`,
          }}
        >
          <p className="mb-1 font-semibold text-slate-200">Dia {series[hoveredIdx].label}</p>
          <p className="flex items-center justify-between gap-4 text-emerald-400 font-mono-nums">
            <span>Receitas:</span>
            <span>{formatBRL(series[hoveredIdx].receitas)}</span>
          </p>
          <p className="flex items-center justify-between gap-4 text-red-400 font-mono-nums">
            <span>Despesas:</span>
            <span>{formatBRL(series[hoveredIdx].despesas)}</span>
          </p>
        </div>
      )}
    </div>
  );
};
