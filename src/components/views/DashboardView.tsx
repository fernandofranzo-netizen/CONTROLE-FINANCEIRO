import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Plane,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PATRIMONY_12_MONTHS } from '../../data/initialData';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName } from '../../types/finance';
import {
  CATEGORY_COLORS,
  formatBRL,
  formatShortDayMonth,
} from '../../utils/formatters';
import { CashFlowChart } from '../charts/CashFlowChart';
import { DonutChart, DonutSegment } from '../charts/DonutChart';
import { PatrimonyChart } from '../charts/PatrimonyChart';

export const DashboardView: React.FC = () => {
  const {
    setActiveRoute,
    totalBalance,
    monthIncome,
    monthExpense,
    totalInvestments,
    monthTransactions,
    accounts,
    goals,
    monthCommitments,
    notifications,
    toggleCommitmentPaid,
  } = useFinance();

  const [chartMode, setChartMode] = useState<'fluxo' | 'patrimonio'>('fluxo');

  const expenseSegments = useMemo<DonutSegment[]>(() => {
    const totals = new Map<CategoryName, number>();
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        totals.set(t.category, (totals.get(t.category) || 0) + t.amount);
      });

    const total = monthExpense || 1;
    const order: CategoryName[] = [
      'Moradia',
      'Alimentação',
      'Transporte',
      'Saúde',
      'Lazer',
      'Outros',
    ];

    const list: DonutSegment[] = [];
    order.forEach((cat) => {
      const val = totals.get(cat) || 0;
      if (val > 0) {
        list.push({
          label: cat,
          value: val,
          percent: (val / total) * 100,
          color: CATEGORY_COLORS[cat],
        });
      }
    });

    // Include any extra categories if added dynamically
    totals.forEach((val, cat) => {
      if (!order.includes(cat) && val > 0) {
        list.push({
          label: cat,
          value: val,
          percent: (val / total) * 100,
          color: CATEGORY_COLORS[cat] || '#64748B',
        });
      }
    });

    return list;
  }, [monthTransactions, monthExpense]);

  const upcomingCommitments = useMemo(() => {
    const pending = monthCommitments.filter((c) => c.status === 'pendente');
    return (pending.length > 0 ? pending : monthCommitments).slice(0, 3);
  }, [monthCommitments]);

  const urgentNotifications = useMemo(
    () =>
      notifications.filter(
        (n) => n.urgency === 'vencido' || n.urgency === 'hoje' || n.urgency === 'proximo'
      ),
    [notifications]
  );

  return (
    <div className="space-y-5">
      {/* Pending Payment Alert Strip when urgent/overdue commitments exist */}
      {urgentNotifications.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-[#141A29] px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              {urgentNotifications.some((n) => n.urgency === 'vencido') ? (
                <AlertTriangle className="h-4 w-4 text-red-400" />
              ) : (
                <BellRing className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-100">
                Você possui {urgentNotifications.length} pagamento(s) pendente(s) próximo(s) do
                vencimento
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                Próximo: {urgentNotifications[0].title} ·{' '}
                <span className="font-mono-nums text-slate-200">
                  {formatBRL(urgentNotifications[0].amount)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleCommitmentPaid(urgentNotifications[0].commitmentId, true)}
              className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-colors cursor-pointer"
            >
              Confirmar Pagamento
            </button>
            <button
              onClick={() => setActiveRoute('calendario')}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Ver Todos
            </button>
          </div>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Saldo Total */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Saldo Total</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-nums">
            {formatBRL(totalBalance)}
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400">Total em contas</div>
        </div>

        {/* Receitas */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Receitas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-nums">
            {formatBRL(monthIncome)}
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-emerald-400">
            +12,5% vs mês anterior
          </div>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Despesas</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-nums">
            {formatBRL(monthExpense)}
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-red-400">+8,3% vs mês anterior</div>
        </div>

        {/* Investimentos */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Investimentos</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono-nums">
            {formatBRL(totalInvestments)}
          </div>
          <div className="mt-1.5 text-[11px] font-medium text-emerald-400">
            +6,2% vs mês anterior
          </div>
        </div>
      </section>

      {/* Middle Row: Fluxo de Caixa / Evolução do Patrimônio + Despesas por Categoria */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">
                {chartMode === 'fluxo' ? 'Fluxo de Caixa' : 'Evolução do Patrimônio'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {chartMode === 'fluxo'
                  ? 'Comparativo acumulado de receitas e despesas no mês'
                  : 'Crescimento patrimonial nos últimos 12 meses'}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {chartMode === 'fluxo' && (
                <div className="hidden sm:flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-0.5 w-3 bg-emerald-500 inline-block" />
                    Receitas
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-0.5 w-3 bg-red-500 inline-block" />
                    Despesas
                  </span>
                </div>
              )}

              <div className="flex items-center rounded-lg border border-slate-800 bg-[#070B14] p-0.5 text-[11px]">
                <button
                  onClick={() => setChartMode('fluxo')}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                    chartMode === 'fluxo'
                      ? 'bg-[#172542] text-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Fluxo
                </button>
                <button
                  onClick={() => setChartMode('patrimonio')}
                  className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                    chartMode === 'patrimonio'
                      ? 'bg-[#172542] text-blue-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Patrimônio
                </button>
              </div>
            </div>
          </div>

          {chartMode === 'fluxo' ? (
            <CashFlowChart transactions={monthTransactions} />
          ) : (
            <PatrimonyChart data={PATRIMONY_12_MONTHS} />
          )}
        </div>

        <div className="lg:col-span-5 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Despesas por Categoria</h2>
              <p className="text-[11px] text-slate-400">Distribuição dos gastos do período</p>
            </div>
            <button
              onClick={() => setActiveRoute('relatorios')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
            >
              Detalhes
            </button>
          </div>

          {expenseSegments.length > 0 ? (
            <DonutChart
              segments={expenseSegments}
              centerLabel="Despesas"
              centerValue={formatBRL(monthExpense)}
            />
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Nenhuma despesa registrada neste mês.
            </div>
          )}
        </div>
      </section>

      {/* Bottom Row: Contas + Metas + Próximos Compromissos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Contas */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Contas</h2>
              <button
                onClick={() => setActiveRoute('contas')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-3">
              {accounts.slice(0, 4).map((acc) => (
                <div key={acc.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="text-slate-300 truncate">{acc.name}</span>
                  </div>
                  <span className="font-semibold text-slate-100 font-mono-nums">
                    {formatBRL(acc.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total consolidado</span>
            <span className="font-bold text-blue-400 font-mono-nums">{formatBRL(totalBalance)}</span>
          </div>
        </div>

        {/* Metas */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Metas</h2>
              <button
                onClick={() => setActiveRoute('metas')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Ver todas
              </button>
            </div>

            <div className="space-y-4">
              {goals.slice(0, 2).map((goal) => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 font-medium text-slate-200 truncate">
                        {goal.icon === 'plane' ? (
                          <Plane className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        ) : goal.icon === 'shield' ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <Target className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        )}
                        <span className="truncate">{goal.title}</span>
                      </span>
                      <span className="font-semibold text-slate-200 font-mono-nums">{pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
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

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{goals.length} metas ativas</span>
            <button
              onClick={() => setActiveRoute('metas')}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Fazer aporte →
            </button>
          </div>
        </div>

        {/* Próximos Compromissos */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Próximos Compromissos</h2>
              <button
                onClick={() => setActiveRoute('calendario')}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-3">
              {upcomingCommitments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhum compromisso neste mês.
                </div>
              ) : (
                upcomingCommitments.map((item) => {
                  const { day, month } = formatShortDayMonth(item.dueDate);
                  const isPaid = item.status === 'pago';
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-800/70 bg-[#0B1120] px-3 py-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[#172542] text-blue-400 leading-none">
                          <span className="text-xs font-bold font-mono-nums">{day}</span>
                          <span className="text-[9px] uppercase mt-0.5">{month}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 truncate">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.accountName} · {isPaid ? 'Pago' : 'Pendente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-slate-100 font-mono-nums">
                          {formatBRL(item.amount)}
                        </span>
                        {!isPaid ? (
                          <button
                            onClick={() => toggleCommitmentPaid(item.id, true)}
                            title="Marcar como pago"
                            className="rounded-md p-1 text-slate-400 hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {monthCommitments.filter((c) => c.status === 'pendente').length} pendente(s) no mês
            </span>
            <button
              onClick={() => setActiveRoute('calendario')}
              className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            >
              Abrir calendário →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
