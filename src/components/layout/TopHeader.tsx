import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Menu,
  Plus,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NavRoute } from '../../types/finance';
import { formatBRL, formatDateBR, getMonthLabel } from '../../utils/formatters';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewTransaction: () => void;
  onOpenExportReport: () => void;
}

const ROUTE_TITLES: Record<NavRoute, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Olá, {name}!',
    subtitle: 'Aqui está o resumo da sua vida financeira.',
  },
  transacoes: {
    title: 'Transações',
    subtitle: 'Todas as suas receitas e despesas.',
  },
  contas: {
    title: 'Contas Bancárias',
    subtitle: 'Gerencie seus saldos e movimentações entre contas.',
  },
  metas: {
    title: 'Metas Financeiras',
    subtitle: 'Acompanhe seus objetivos e realize novos aportes.',
  },
  investimentos: {
    title: 'Investimentos',
    subtitle: 'Alocação da carteira, rentabilidade e ativos.',
  },
  cartoes: {
    title: 'Cartões de Crédito',
    subtitle: 'Controle faturas, limites disponíveis e vencimentos.',
  },
  calendario: {
    title: 'Calendário Financeiro',
    subtitle: 'Visualize seus compromissos e vencimentos.',
  },
  relatorios: {
    title: 'Relatórios',
    subtitle: 'Análise completa da sua vida financeira.',
  },
  planejamento: {
    title: 'Planejamento Mensal',
    subtitle: 'Defina tetos de gastos por categoria e acompanhe desvios.',
  },
  configuracoes: {
    title: 'Configurações',
    subtitle: 'Preferências da conta, alertas de vencimento e backup.',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewTransaction,
  onOpenExportReport,
}) => {
  const {
    activeRoute,
    setActiveRoute,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    settings,
    notifications,
    unreadNotificationsCount,
    toggleCommitmentPaid,
    markAllNotificationsRead,
  } = useFinance();

  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const firstName = settings.name.split(' ')[0] || 'João';
  const meta = ROUTE_TITLES[activeRoute];
  const displayTitle = meta.title.replace('{name}', firstName);

  const overdueCount = notifications.filter((n) => n.urgency === 'vencido').length;
  const dueSoonCount = notifications.filter(
    (n) => n.urgency === 'hoje' || n.urgency === 'proximo'
  ).length;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#070B14]/95 backdrop-blur-md px-4 sm:px-6 py-4 no-print">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Menu button + Contextual Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg border border-slate-800 bg-[#0F172A] p-2 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
              {displayTitle}
            </h1>
            <p className="text-xs text-slate-400 truncate">{meta.subtitle}</p>
          </div>
        </div>

        {/* Right: Month Selector + Notification Bell + Export + Primary Action */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Month Selector */}
          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              aria-label="Selecionar mês de referência"
              className="h-9 rounded-lg border border-slate-800 bg-[#0F172A] pl-8 pr-7 text-xs font-medium text-slate-200 focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-[#0F172A] text-slate-100">
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Payments Notification Center */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((prev) => !prev)}
              aria-label="Notificações de pagamentos pendentes"
              className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
                bellOpen
                  ? 'border-blue-500/50 bg-[#172542] text-blue-400'
                  : 'border-slate-800 bg-[#0F172A] text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span
                  className={`absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white font-mono-nums ${
                    overdueCount > 0 ? 'bg-red-600' : 'bg-amber-600'
                  }`}
                >
                  {unreadNotificationsCount > 0 ? unreadNotificationsCount : notifications.length}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[390px] rounded-xl border border-slate-800 bg-[#0D1526] shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                  <div>
                    <h2 className="text-xs font-bold text-white">
                      Notificações de Pagamentos Pendentes
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {overdueCount} vencido(s) · {dueSoonCount} próximo(s) · {notifications.length}{' '}
                      pendente(s)
                    </p>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap"
                    >
                      Marcar lidas
                    </button>
                  )}
                </div>

                <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-800/80">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                      <p className="text-xs font-semibold text-slate-200">
                        Nenhum pagamento pendente!
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Todos os compromissos do período estão em dia.
                      </p>
                    </div>
                  ) : (
                    notifications.map((alert) => {
                      const isOverdue = alert.urgency === 'vencido';
                      const isToday = alert.urgency === 'hoje';
                      const isSoon = alert.urgency === 'proximo';

                      const statusText = isOverdue
                        ? `Vencido há ${Math.abs(alert.daysDiff)} dia(s)`
                        : isToday
                          ? 'Vence hoje'
                          : isSoon
                            ? `Vence em ${alert.daysDiff} dia(s)`
                            : `Vencimento em ${formatDateBR(alert.dueDate)}`;

                      return (
                        <div
                          key={alert.id}
                          className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                isOverdue
                                  ? 'bg-red-500/15 text-red-400'
                                  : isToday || isSoon
                                    ? 'bg-amber-500/15 text-amber-400'
                                    : 'bg-blue-500/15 text-blue-400'
                              }`}
                            >
                              {isOverdue ? (
                                <AlertTriangle className="h-3.5 w-3.5" />
                              ) : (
                                <Clock className="h-3.5 w-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-100 truncate">
                                {alert.title}
                              </p>
                              <p
                                className={`text-[11px] font-medium ${
                                  isOverdue
                                    ? 'text-red-400'
                                    : isToday || isSoon
                                      ? 'text-amber-400'
                                      : 'text-slate-400'
                                }`}
                              >
                                {statusText} · {formatDateBR(alert.dueDate)}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {alert.accountName} ·{' '}
                                <span className="font-mono-nums font-semibold text-slate-200">
                                  {formatBRL(alert.amount)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCommitmentPaid(alert.commitmentId, true)}
                            className="shrink-0 rounded-md bg-emerald-600/20 border border-emerald-500/30 px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-colors whitespace-nowrap"
                          >
                            Pagar
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-slate-800 bg-[#0B1120] px-4 py-2.5 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setBellOpen(false);
                      setActiveRoute('calendario');
                    }}
                    className="text-xs font-medium text-blue-400 hover:text-blue-300"
                  >
                    Ver Calendário Financeiro →
                  </button>
                  <button
                    onClick={() => {
                      setBellOpen(false);
                      setActiveRoute('configuracoes');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Configurar alertas
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export Monthly Report shortcut */}
          <button
            onClick={onOpenExportReport}
            className="hidden sm:flex h-9 items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0F172A] px-3 text-xs font-medium text-slate-200 hover:border-slate-700 hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Exportar Relatório</span>
          </button>

          {/* Primary CTA */}
          <button
            onClick={onOpenNewTransaction}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Transação</span>
          </button>
        </div>
      </div>
    </header>
  );
};
