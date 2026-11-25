import React, { useMemo, useState } from 'react';
import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Investment } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';
import { DonutChart, DonutSegment } from '../charts/DonutChart';

const TYPE_COLORS: Record<Investment['type'], string> = {
  'Tesouro Direto': '#3B82F6',
  CDB: '#10B981',
  Fundos: '#8B5CF6',
  Ações: '#F59E0B',
  FIIs: '#06B6D4',
};

export const InvestmentsView: React.FC = () => {
  const { investments, totalInvestments, addInvestment, deleteInvestment } = useFinance();

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('Tesouro Direto');
  const [amount, setAmount] = useState('');
  const [profitability, setProfitability] = useState('12.0');
  const [institution, setInstitution] = useState('XP Investimentos');

  const segments = useMemo<DonutSegment[]>(() => {
    const map = new Map<Investment['type'], number>();
    investments.forEach((inv) => {
      map.set(inv.type, (map.get(inv.type) || 0) + inv.amount);
    });
    const total = totalInvestments || 1;
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
      percent: (value / total) * 100,
      color: TYPE_COLORS[label] || '#3B82F6',
    }));
  }, [investments, totalInvestments]);

  const weightedReturn = useMemo(() => {
    if (!totalInvestments) return 0;
    const sum = investments.reduce((acc, inv) => acc + inv.amount * inv.profitabilityPercent, 0);
    return sum / totalInvestments;
  }, [investments, totalInvestments]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    const prof = parseFloat(profitability.replace(',', '.')) || 10;
    if (!name.trim() || isNaN(val) || val <= 0) return;

    addInvestment({
      name: name.trim(),
      type,
      amount: Number(val.toFixed(2)),
      profitabilityPercent: prof,
      institution: institution.trim() || 'Corretora',
      color: TYPE_COLORS[type],
    });
    setName('');
    setAmount('');
    setShowNew(false);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Alocação da Carteira</h2>
                <p className="text-[11px] text-slate-400">Distribuição por classe de ativo</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <DonutChart
              segments={segments}
              centerLabel="Investido"
              centerValue={formatBRL(totalInvestments)}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Rentabilidade Média Ponderada</span>
            <span className="font-bold text-emerald-400 font-mono-nums">
              +{weightedReturn.toFixed(2)}% a.a.
            </span>
          </div>
        </div>

        <div className="lg:col-span-7 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Ativos em Carteira</h2>
              <p className="text-[11px] text-slate-400">
                Patrimônio aplicado: {formatBRL(totalInvestments)}
              </p>
            </div>
            <button
              onClick={() => setShowNew((s) => !s)}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Aporte</span>
            </button>
          </div>

          {showNew && (
            <form
              onSubmit={handleAdd}
              className="mb-4 rounded-lg border border-slate-800 bg-[#070B14] p-3.5 grid grid-cols-1 sm:grid-cols-5 gap-2.5"
            >
              <input
                type="text"
                required
                placeholder="Nome do ativo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-slate-800 bg-[#0D1526] px-2.5 py-1.5 text-xs text-white"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as Investment['type'])}
                className="rounded-lg border border-slate-800 bg-[#0D1526] px-2.5 py-1.5 text-xs text-white"
              >
                <option value="Tesouro Direto">Tesouro Direto</option>
                <option value="CDB">CDB</option>
                <option value="Fundos">Fundos</option>
                <option value="Ações">Ações</option>
                <option value="FIIs">FIIs</option>
              </select>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Valor (R$)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-lg border border-slate-800 bg-[#0D1526] px-2.5 py-1.5 text-xs text-white font-mono-nums"
              />
              <input
                type="text"
                placeholder="Instituição"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="rounded-lg border border-slate-800 bg-[#0D1526] px-2.5 py-1.5 text-xs text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Ativo</th>
                  <th className="py-2.5 px-3 font-semibold">Tipo</th>
                  <th className="py-2.5 px-3 font-semibold">Instituição</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Retorno a.a.</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Saldo</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-semibold text-slate-100">{inv.name}</td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: inv.color }}
                        />
                        {inv.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">{inv.institution}</td>
                    <td className="py-3 px-3 text-right font-mono-nums text-emerald-400">
                      +{inv.profitabilityPercent.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right font-mono-nums font-semibold text-white">
                      {formatBRL(inv.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => deleteInvestment(inv.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                        title="Remover ativo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
