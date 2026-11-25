import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  GraduationCap,
  Plane,
  Printer,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PATRIMONY_12_MONTHS } from '../../data/initialData';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName } from '../../types/finance';
import {
  CATEGORY_COLORS,
  downloadMonthlyCSV,
  formatBRL,
  formatDateBR,
  getMonthLabel,
} from '../../utils/formatters';
import { DonutChart, DonutSegment } from '../charts/DonutChart';
import { PatrimonyChart } from '../charts/PatrimonyChart';

interface ReportsViewProps {
  onOpenExportModal: () => void;
}

type ReportTab = 'geral' | 'receitas' | 'despesas' | 'investimentos' | 'metas';

export const ReportsView: React.FC<ReportsViewProps> = ({ onOpenExportModal }) => {
  const {
    selectedMonth,
    settings,
    monthIncome,
    monthExpense,
    monthNet,
    totalBalance,
    totalInvestments,
    monthTransactions,
    monthCommitments,
    investments,
    goals,
    pushToast,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<ReportTab>('geral');
  const [periodRange, setPeriodRange] = useState<'6m' | '12m'>('12m');

  const patrimonySeries = useMemo(
    () => (periodRange === '6m' ? PATRIMONY_12_MONTHS.slice(6) : PATRIMONY_12_MONTHS),
    [periodRange]
  );

  const initialPatrimony = patrimonySeries[0]?.value || 12450;
  const finalPatrimony = totalBalance;
  const variationPct = ((finalPatrimony - initialPatrimony) / initialPatrimony) * 100;

  const expenseSegments = useMemo<DonutSegment[]>(() => {
    const map = new Map<CategoryName, number>();
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => map.set(t.category, (map.get(t.category) || 0) + t.amount));
    const total = monthExpense || 1;
    return Array.from(map.entries())
      .map(([cat, val]) => ({
        label: cat,
        value: val,
        percent: (val / total) * 100,
        color: CATEGORY_COLORS[cat] || '#64748B',
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions, monthExpense]);

  const investmentSegments = useMemo<DonutSegment[]>(() => {
    const map = new Map<string, { val: number; color: string }>();
    investments.forEach((inv) => {
      const curr = map.get(inv.type) || { val: 0, color: inv.color };
      map.set(inv.type, { val: curr.val + inv.amount, color: curr.color });
    });
    const total = totalInvestments || 1;
    return Array.from(map.entries()).map(([label, obj]) => ({
      label,
      value: obj.val,
      percent: (obj.val / total) * 100,
      color: obj.color,
    }));
  }, [investments, totalInvestments]);

  const handleQuickCSV = () => {
    downloadMonthlyCSV({
      monthKey: selectedMonth,
      userName: settings.name,
      userEmail: settings.email,
      totalBalance,
      totalIncome: monthIncome,
      totalExpense: monthExpense,
      netPeriod: monthNet,
      totalInvestments,
      transactions: monthTransactions,
      commitments: monthCommitments,
      categoryBreakdown: expenseSegments.map((s) => ({
        category: s.label,
        amount: s.value,
        percent: s.percent,
      })),
    });
    pushToast({
      title: 'Relatório CSV exportado',
      description: getMonthLabel(selectedMonth),
      tone: 'success',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Sub-tabs + Monthly Report Export Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-800/90 bg-[#0F172A] p-1 text-xs">
          {(
            [
              { id: 'geral', label: 'Visão Geral' },
              { id: 'receitas', label: 'Receitas' },
              { id: 'despesas', label: 'Despesas' },
              { id: 'investimentos', label: 'Investimentos' },
              { id: 'metas', label: 'Metas' },
            ] as { id: ReportTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#172542] text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleQuickCSV}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-600/15 px-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/25 cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={onOpenExportModal}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Relatório Mensal Detalhado (PDF)</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Cards matching Image 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Receitas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(monthIncome)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">+12,5% vs mês anterior</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Despesas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(monthExpense)}
          </div>
          <div className="mt-1 text-[11px] text-red-400">+8,3% vs mês anterior</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saldo Total</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(totalBalance)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">+9,2% vs mês anterior</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Investimentos</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(totalInvestments)}
          </div>
          <div className="mt-1 text-[11px] text-emerald-400">+15,4% vs mês anterior</div>
        </div>
      </div>

      {activeTab === 'geral' && (
        <>
          {/* Evolução do Patrimônio + Resumo do Período */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Evolução do Patrimônio</h2>
                  <p className="text-[11px] text-slate-400">
                    Resumo dos últimos {periodRange === '12m' ? '12' : '6'} meses
                  </p>
                </div>
                <select
                  value={periodRange}
                  onChange={(e) => setPeriodRange(e.target.value as '6m' | '12m')}
                  aria-label="Selecionar período do patrimônio"
                  className="h-8 rounded-lg border border-slate-800 bg-[#070B14] px-2.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="12m">12 meses</option>
                  <option value="6m">6 meses</option>
                </select>
              </div>
              <PatrimonyChart data={patrimonySeries} />
            </div>

            <div className="lg:col-span-4 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white mb-4">Resumo do Período</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
                    <span className="text-slate-400">Patrimônio Inicial</span>
                    <span className="font-semibold text-slate-100 font-mono-nums">
                      {formatBRL(initialPatrimony)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
                    <span className="text-slate-400">Patrimônio Final</span>
                    <span className="font-semibold text-slate-100 font-mono-nums">
                      {formatBRL(finalPatrimony)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
                    <span className="text-slate-400">Variação</span>
                    <span className="font-bold text-emerald-400 font-mono-nums">
                      +{variationPct.toFixed(1).replace('.', ',')}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Saldo Líquido ({getMonthLabel(selectedMonth)})</span>
                    <span
                      className={`font-bold font-mono-nums ${
                        monthNet >= 0 ? 'text-blue-400' : 'text-red-400'
                      }`}
                    >
                      {formatBRL(monthNet)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={onOpenExportModal}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/30 bg-blue-600/15 py-2 text-xs font-semibold text-blue-400 hover:bg-blue-600/25 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar Relatório Completo</span>
              </button>
            </div>
          </div>

          {/* Bottom 3 Cards matching Image 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
              <h2 className="text-sm font-bold text-white mb-4">Despesas por Categoria</h2>
              <DonutChart
                segments={expenseSegments}
                centerLabel="Despesas"
                centerValue={formatBRL(monthExpense)}
                size={140}
              />
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
              <h2 className="text-sm font-bold text-white mb-4">Alocação de Investimentos</h2>
              <DonutChart
                segments={investmentSegments}
                centerLabel="Carteira"
                centerValue={formatBRL(totalInvestments)}
                size={140}
              />
            </div>

            <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
              <h2 className="text-sm font-bold text-white mb-4">Metas em Andamento</h2>
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const pct = Math.min(
                    100,
                    Math.round((goal.currentAmount / goal.targetAmount) * 100)
                  );
                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-medium text-slate-200 truncate">
                          {goal.icon === 'plane' ? (
                            <Plane className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          ) : goal.icon === 'shield' ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <GraduationCap className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          )}
                          <span className="truncate">{goal.title}</span>
                        </span>
                        <span className="font-mono-nums font-semibold text-slate-200">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono-nums">
                        {formatBRL(goal.currentAmount)} / {formatBRL(goal.targetAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {(activeTab === 'receitas' || activeTab === 'despesas') && (
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">
              Detalhamento de {activeTab === 'receitas' ? 'Receitas' : 'Despesas'} —{' '}
              {getMonthLabel(selectedMonth)}
            </h2>
            <span className="text-xs font-mono-nums font-bold text-slate-200">
              Total: {formatBRL(activeTab === 'receitas' ? monthIncome : monthExpense)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3">Conta</th>
                  <th className="py-2.5 px-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {monthTransactions
                  .filter((t) =>
                    activeTab === 'receitas' ? t.type === 'receita' : t.type === 'despesa'
                  )
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono-nums text-slate-300">
                        {formatDateBR(t.date)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-100">{t.description}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.category}</td>
                      <td className="py-2.5 px-3 text-slate-300">{t.accountName}</td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono-nums font-semibold ${
                          t.type === 'receita' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {formatBRL(t.amount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'investimentos' && (
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
          <h2 className="text-sm font-bold text-white mb-4">Posição Consolidada de Investimentos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Ativo</th>
                  <th className="py-2.5 px-3">Classe</th>
                  <th className="py-2.5 px-3">Instituição</th>
                  <th className="py-2.5 px-3 text-right">Rentabilidade a.a.</th>
                  <th className="py-2.5 px-3 text-right">Saldo Aplicado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {investments.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-semibold text-slate-100">{inv.name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{inv.type}</td>
                    <td className="py-2.5 px-3 text-slate-300">{inv.institution}</td>
                    <td className="py-2.5 px-3 text-right font-mono-nums text-emerald-400">
                      +{inv.profitabilityPercent.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-nums font-semibold text-white">
                      {formatBRL(inv.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'metas' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div key={g.id} className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
                <div className="flex items-center justify-between text-sm font-bold text-white">
                  <span>{g.title}</span>
                  <span className="font-mono-nums text-emerald-400">{pct}%</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {g.category} · Prazo {formatDateBR(g.deadline)}
                </p>
                <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-xs font-mono-nums text-slate-300">
                  <span>{formatBRL(g.currentAmount)}</span>
                  <span className="text-slate-400">Meta: {formatBRL(g.targetAmount)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Security & Export Notice Banner matching Image 3 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-[#0C191E] px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-100">
              Seus dados financeiros salvos localmente com segurança
            </div>
            <div className="text-[11px] text-slate-400">
              Exporte relatórios mensais detalhados em PDF, CSV ou JSON a qualquer momento.
            </div>
          </div>
        </div>
        <button
          onClick={onOpenExportModal}
          className="rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
        >
          Exportar agora →
        </button>
      </div>
    </div>
  );
};
