import React, { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Edit3 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName } from '../../types/finance';
import { formatBRL, getMonthLabel } from '../../utils/formatters';

export const PlanningView: React.FC = () => {
  const { budgets, monthTransactions, selectedMonth, updateBudgetLimit } = useFinance();

  const [editingCat, setEditingCat] = useState<CategoryName | null>(null);
  const [editValue, setEditValue] = useState('');

  const spendingByCat = useMemo(() => {
    const map = new Map<CategoryName, number>();
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });
    return map;
  }, [monthTransactions]);

  const totalBudget = budgets.reduce((acc, b) => acc + b.limit, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + (spendingByCat.get(b.category) || 0), 0);
  const overallPct = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const handleSaveLimit = (category: CategoryName) => {
    const num = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      updateBudgetLimit(category, Number(num.toFixed(2)));
    }
    setEditingCat(null);
  };

  return (
    <div className="space-y-5">
      {/* Summary Header */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h2 className="text-sm font-bold text-white">
              Orçamento Mensal — {getMonthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-slate-400">
              Acompanhamento do previsto versus realizado por categoria de despesa
            </p>
          </div>
          <div className="text-right font-mono-nums">
            <div className="text-lg font-bold text-white">
              {formatBRL(totalSpent)}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {formatBRL(totalBudget)}
              </span>
            </div>
            <div className="text-[11px] text-emerald-400">{overallPct}% do orçamento utilizado</div>
          </div>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              totalSpent > totalBudget ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Category Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((item) => {
          const spent = spendingByCat.get(item.category) || 0;
          const pct = item.limit > 0 ? Math.round((spent / item.limit) * 100) : 0;
          const isOver = spent > item.limit;
          const isWarn = !isOver && pct >= 85;

          return (
            <div
              key={item.category}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <h3 className="text-sm font-bold text-white">{item.category}</h3>
                  </div>

                  {isOver ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Excedido
                    </span>
                  ) : isWarn ? (
                    <span className="text-[11px] font-semibold text-amber-400">Atenção ({pct}%)</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      No limite
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-mono-nums">
                    <span className="text-slate-200 font-semibold">
                      Gasto: {formatBRL(spent)}
                    </span>
                    <span className="text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOver ? 'bg-red-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                {editingCat === item.category ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      step="10"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-slate-700 bg-[#070B14] px-2.5 text-xs text-white font-mono-nums"
                    />
                    <button
                      onClick={() => handleSaveLimit(item.category)}
                      className="h-8 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white cursor-pointer"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-slate-400 font-mono-nums">
                      Teto: <strong className="text-slate-200">{formatBRL(item.limit)}</strong>
                    </span>
                    <button
                      onClick={() => {
                        setEditingCat(item.category);
                        setEditValue(String(item.limit));
                      }}
                      className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Ajustar teto</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
