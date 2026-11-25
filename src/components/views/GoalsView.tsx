import React, { useState } from 'react';
import { GraduationCap, Plane, Plus, ShieldCheck, Target, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types/finance';
import { formatBRL, formatDateBR } from '../../utils/formatters';

export const GoalsView: React.FC = () => {
  const { goals, accounts, addGoal, contributeGoal, deleteGoal } = useFinance();

  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Objetivos Pessoais');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [icon, setIcon] = useState<Goal['icon']>('target');

  const [aporteGoalId, setAporteGoalId] = useState<string | null>(null);
  const [aporteValue, setAporteValue] = useState('');
  const [aporteAccountId, setAporteAccountId] = useState(accounts[0]?.id || '');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount.replace(',', '.'));
    const current = parseFloat(currentAmount.replace(',', '.')) || 0;
    if (!title.trim() || isNaN(target) || target <= 0) return;
    addGoal({
      title: title.trim(),
      category: category.trim(),
      currentAmount: current,
      targetAmount: target,
      deadline,
      color: '#22C55E',
      icon,
    });
    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setShowNew(false);
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aporteGoalId) return;
    const val = parseFloat(aporteValue.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    contributeGoal(aporteGoalId, val, aporteAccountId);
    setAporteGoalId(null);
    setAporteValue('');
  };

  const totalAccumulated = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
        <div>
          <span className="text-xs text-slate-400">Progresso Total em Metas</span>
          <div className="mt-1 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(totalAccumulated)}{' '}
            <span className="text-sm font-normal text-slate-400">
              / {formatBRL(totalTarget)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Meta</span>
        </button>
      </div>

      {showNew && (
        <form
          onSubmit={handleCreateGoal}
          className="rounded-xl border border-slate-800 bg-[#0D1526] p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-white">Criar Nova Meta Financeira</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              required
              placeholder="Título da Meta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              required
              placeholder="Valor Alvo (R$)"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Já guardado (R$)"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
            />
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
            />
            <div className="flex items-center gap-2">
              <select
                value={icon}
                onChange={(e) => setIcon(e.target.value as Goal['icon'])}
                className="h-9 rounded-lg border border-slate-800 bg-[#070B14] px-2 text-xs text-white"
              >
                <option value="target">Objetivo</option>
                <option value="plane">Viagem</option>
                <option value="shield">Reserva</option>
                <option value="graduation">Estudos</option>
              </select>
              <button
                type="submit"
                className="h-9 flex-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Criar
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                      {goal.icon === 'plane' ? (
                        <Plane className="h-4 w-4 text-blue-400" />
                      ) : goal.icon === 'shield' ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      ) : goal.icon === 'graduation' ? (
                        <GraduationCap className="h-4 w-4 text-purple-400" />
                      ) : (
                        <Target className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{goal.title}</h3>
                      <p className="text-[11px] text-slate-400">
                        {goal.category} · Prazo {formatDateBR(goal.deadline)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progresso</span>
                    <span className="font-bold text-emerald-400 font-mono-nums">{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-mono-nums">
                    <span className="font-semibold text-white">{formatBRL(goal.currentAmount)}</span>
                    <span className="text-slate-400">Alvo: {formatBRL(goal.targetAmount)}</span>
                  </div>
                </div>
              </div>

              {aporteGoalId === goal.id ? (
                <form onSubmit={handleContribute} className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      placeholder="Valor R$"
                      value={aporteValue}
                      onChange={(e) => setAporteValue(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-[#070B14] px-2.5 py-1.5 text-xs text-white font-mono-nums"
                    />
                    <select
                      value={aporteAccountId}
                      onChange={(e) => setAporteAccountId(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-[#070B14] px-2 py-1.5 text-xs text-white"
                    >
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                    >
                      Confirmar Aporte
                    </button>
                    <button
                      type="button"
                      onClick={() => setAporteGoalId(null)}
                      className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    Faltam <span className="font-mono-nums text-slate-200">{formatBRL(remaining)}</span>
                  </span>
                  <button
                    onClick={() => setAporteGoalId(goal.id)}
                    className="rounded-lg bg-blue-600/15 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-400 hover:bg-blue-600/25 cursor-pointer"
                  >
                    + Aportar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
