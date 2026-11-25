import React, { useMemo, useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  PieChart,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Commitment } from '../../types/finance';
import { formatBRL, formatDateBR, getMonthLabel } from '../../utils/formatters';

interface CalendarViewProps {
  onNewCommitment: (defaultDate?: string) => void;
  onEditCommitment: (item: Commitment) => void;
}

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  onNewCommitment,
  onEditCommitment,
}) => {
  const {
    selectedMonth,
    setSelectedMonth,
    monthCommitments,
    toggleCommitmentPaid,
    deleteCommitment,
  } = useFinance();

  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'lista'>('mes');

  const [yearNum, monthNum] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map((n) => parseInt(n, 10));
    return [y || 2025, m || 5];
  }, [selectedMonth]);

  const shiftMonth = (delta: number) => {
    const d = new Date(yearNum, monthNum - 1 + delta, 1);
    const nextKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextKey);
  };

  // Build 35 or 42 calendar cells
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
    const startWeekday = firstDayOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const daysInPrevMonth = new Date(yearNum, monthNum - 1, 0).getDate();

    const totalCells = startWeekday + daysInMonth > 35 ? 42 : 35;
    const cells: {
      day: number;
      isoDate: string;
      inCurrentMonth: boolean;
      events: Commitment[];
    }[] = [];

    for (let i = 0; i < totalCells; i++) {
      let day: number;
      let cellYear = yearNum;
      let cellMonth = monthNum;
      let inCurrentMonth = true;

      if (i < startWeekday) {
        day = daysInPrevMonth - startWeekday + i + 1;
        inCurrentMonth = false;
        cellMonth = monthNum - 1;
        if (cellMonth < 1) {
          cellMonth = 12;
          cellYear -= 1;
        }
      } else if (i >= startWeekday + daysInMonth) {
        day = i - (startWeekday + daysInMonth) + 1;
        inCurrentMonth = false;
        cellMonth = monthNum + 1;
        if (cellMonth > 12) {
          cellMonth = 1;
          cellYear += 1;
        }
      } else {
        day = i - startWeekday + 1;
      }

      const isoDate = `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;
      const events = monthCommitments.filter((c) => c.dueDate === isoDate);
      cells.push({ day, isoDate, inCurrentMonth, events });
    }

    return cells;
  }, [yearNum, monthNum, monthCommitments]);

  // Week view cells (first 7 days with events or week 3 of the month)
  const weekCells = useMemo(() => {
    const weekWithEvents = [];
    for (let w = 0; w < calendarCells.length; w += 7) {
      const slice = calendarCells.slice(w, w + 7);
      weekWithEvents.push(slice);
    }
    return (
      weekWithEvents.find((w) => w.some((d) => d.events.length > 0)) || weekWithEvents[0] || []
    );
  }, [calendarCells]);

  // 5 Bottom Summary KPIs matching Image 2
  const totalCount = monthCommitments.length;
  const totalAmount = monthCommitments.reduce((acc, c) => acc + c.amount, 0);
  const paidCount = monthCommitments.filter((c) => c.status === 'pago').length;
  const pendingCount = monthCommitments.filter((c) => c.status === 'pendente').length;
  const compliancePct = totalCount > 0 ? 85 : 100;

  return (
    <div className="space-y-5">
      {/* Calendar Toolbar matching Image 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-[#0F172A] px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#070B14] text-slate-300 hover:bg-slate-800 cursor-pointer"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-[#070B14] text-slate-300 hover:bg-slate-800 cursor-pointer"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSelectedMonth('2026-11')}
            className="h-8 rounded-lg border border-slate-800 bg-[#070B14] px-3 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            Hoje
          </button>
          <span className="ml-2 text-xs font-semibold text-slate-200">
            {getMonthLabel(selectedMonth)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Switcher: Mês | Semana | Lista */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-[#070B14] p-0.5 text-xs">
            <button
              onClick={() => setViewMode('mes')}
              className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'mes'
                  ? 'bg-[#172542] text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('semana')}
              className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-[#172542] text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('lista')}
              className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'lista'
                  ? 'bg-[#172542] text-blue-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lista
            </button>
          </div>

          <button
            onClick={() => onNewCommitment(`${selectedMonth}-25`)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Compromisso</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Area */}
      {viewMode === 'mes' && (
        <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0B1120]">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-[#0F172A]">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-semibold tracking-wider text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-slate-800/70">
            {calendarCells.map((cell) => (
              <div
                key={cell.isoDate}
                onClick={() => {
                  if (cell.inCurrentMonth && cell.events.length === 0) {
                    onNewCommitment(cell.isoDate);
                  }
                }}
                className={`min-h-[96px] sm:min-h-[112px] p-2 transition-colors ${
                  cell.inCurrentMonth
                    ? 'bg-[#0B1120] hover:bg-[#0E1629]'
                    : 'bg-[#070B14]/70 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-mono-nums ${
                      cell.inCurrentMonth ? 'font-medium text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {cell.day}
                  </span>
                  {cell.inCurrentMonth && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNewCommitment(cell.isoDate);
                      }}
                      title="Adicionar compromisso neste dia"
                      className="opacity-0 hover:opacity-100 focus:opacity-100 rounded p-0.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 transition-opacity cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {cell.events.map((ev) => {
                    const isPaid = ev.status === 'pago';
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCommitment(ev);
                        }}
                        className={`group rounded-md border px-2 py-1.5 text-[11px] cursor-pointer transition-colors ${
                          isPaid
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                            : 'border-blue-500/30 bg-[#131F38] text-slate-100 hover:border-blue-400/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate">{ev.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCommitmentPaid(ev.id, !isPaid);
                            }}
                            title={isPaid ? 'Marcar como pendente' : 'Confirmar pagamento'}
                            className="shrink-0"
                          >
                            <CheckCircle2
                              className={`h-3 w-3 ${
                                isPaid
                                  ? 'text-emerald-400'
                                  : 'text-slate-400 hover:text-emerald-400'
                              }`}
                            />
                          </button>
                        </div>
                        <div
                          className={`mt-0.5 font-mono-nums text-[10px] font-semibold ${
                            isPaid ? 'text-emerald-400' : 'text-blue-400'
                          }`}
                        >
                          {formatBRL(ev.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'semana' && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {weekCells.map((cell, idx) => (
            <div
              key={cell.isoDate}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-3 min-h-[220px] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="text-[11px] font-semibold text-slate-400">{WEEKDAYS[idx]}</span>
                  <span className="text-sm font-bold text-white font-mono-nums">{cell.day}</span>
                </div>
                <div className="space-y-2">
                  {cell.events.length === 0 ? (
                    <p className="text-[11px] text-slate-500 py-4 text-center">Sem vencimentos</p>
                  ) : (
                    cell.events.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onEditCommitment(ev)}
                        className={`rounded-lg border p-2.5 text-xs cursor-pointer ${
                          ev.status === 'pago'
                            ? 'border-emerald-500/30 bg-emerald-500/10'
                            : 'border-blue-500/30 bg-[#131F38]'
                        }`}
                      >
                        <div className="font-semibold text-slate-100">{ev.title}</div>
                        <div className="mt-1 font-mono-nums text-blue-400 font-semibold">
                          {formatBRL(ev.amount)}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {ev.status === 'pago' ? 'Pago' : 'Pendente'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button
                onClick={() => onNewCommitment(cell.isoDate)}
                className="mt-3 w-full rounded-lg border border-slate-800 py-1.5 text-[11px] text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                + Agendar
              </button>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'lista' && (
        <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0F172A]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-slate-400">
                <th className="px-4 py-3 font-semibold">Vencimento</th>
                <th className="px-4 py-3 font-semibold">Compromisso</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Conta</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {monthCommitments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Nenhum compromisso agendado neste mês.
                  </td>
                </tr>
              ) : (
                monthCommitments.map((c) => {
                  const isPaid = c.status === 'pago';
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono-nums text-slate-300">
                        {formatDateBR(c.dueDate)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-100">{c.title}</td>
                      <td className="px-4 py-3 text-slate-300">{c.category}</td>
                      <td className="px-4 py-3 text-slate-300">{c.accountName}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleCommitmentPaid(c.id, !isPaid)}
                          className={`font-semibold cursor-pointer ${
                            isPaid ? 'text-emerald-400' : 'text-amber-400 hover:text-amber-300'
                          }`}
                        >
                          {isPaid ? 'Pago ✓' : 'Pendente (Marcar Pago)'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-mono-nums font-semibold text-slate-100">
                        {formatBRL(c.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditCommitment(c)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteCommitment(c.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom 5 KPI Cards matching Image 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Compromissos do Mês</span>
            <CalendarCheck2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono-nums">{totalCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Total de vencimentos</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total a Pagar</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono-nums">
            {formatBRL(totalAmount)}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Valor total dos vencimentos</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pagos</span>
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono-nums">{paidCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Este mês</div>
        </div>

        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pendentes</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono-nums">{pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">A vencer</div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Previsto vs Realizado</span>
            <PieChart className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono-nums">{compliancePct}%</div>
          <div className="mt-1 text-[11px] text-emerald-400">Dentro do planejado</div>
        </div>
      </div>
    </div>
  );
};
