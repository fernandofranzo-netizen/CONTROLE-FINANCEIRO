import React, { useMemo } from 'react';
import { FileJson, FileSpreadsheet, Printer, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import {
  downloadMonthlyCSV,
  downloadMonthlyJSON,
  formatBRL,
  formatDateBR,
  getMonthLabel,
  MonthlyReportExportData,
} from '../../utils/formatters';

interface ReportExportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ open, onClose }) => {
  const {
    selectedMonth,
    settings,
    totalBalance,
    monthIncome,
    monthExpense,
    monthNet,
    totalInvestments,
    monthTransactions,
    monthCommitments,
    accounts,
    goals,
    pushToast,
  } = useFinance();

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'despesa')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    const total = monthExpense || 1;
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percent: (amount / total) * 100,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [monthTransactions, monthExpense]);

  if (!open) return null;

  const reportPayload: MonthlyReportExportData = {
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
    categoryBreakdown,
  };

  const handlePrintPDF = () => {
    window.print();
    pushToast({
      title: 'Relatório preparado para PDF / Impressão',
      description: getMonthLabel(selectedMonth),
      tone: 'success',
    });
  };

  const handleCSV = () => {
    downloadMonthlyCSV(reportPayload);
    pushToast({
      title: 'Planilha CSV exportada',
      description: `relatorio-financeiro-${selectedMonth}.csv`,
      tone: 'success',
    });
  };

  const handleJSON = () => {
    downloadMonthlyJSON(reportPayload);
    pushToast({
      title: 'Arquivo JSON exportado',
      description: `relatorio-financeiro-${selectedMonth}.json`,
      tone: 'success',
    });
  };

  const monthLabel = getMonthLabel(selectedMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-[#0D1526] shadow-2xl print-container">
        {/* Modal Header (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-6 py-4 no-print">
          <div>
            <h2 className="text-base font-bold text-white">
              Exportação de Relatório Mensal Detalhado
            </h2>
            <p className="text-xs text-slate-400">
              Competência: {monthLabel} · {monthTransactions.length} transações ·{' '}
              {monthCommitments.length} compromissos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCSV}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-600/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/25 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Exportar CSV (Excel)</span>
            </button>
            <button
              onClick={handleJSON}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Preview */}
        <div className="overflow-y-auto p-6 space-y-6 bg-[#070B14] print:bg-white print:text-slate-900">
          {/* Report Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 pb-4 print:border-slate-300">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-400 print:text-blue-700">
                Controle Financeiro Pro
              </div>
              <h3 className="text-xl font-bold text-white print:text-slate-900 mt-0.5">
                Relatório Mensal Detalhado — {monthLabel}
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                Titular: {settings.name} ({settings.email}) · Gerado em{' '}
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-400 print:text-slate-600">
                Resultado Líquido do Mês
              </div>
              <div
                className={`text-lg font-bold font-mono-nums ${
                  monthNet >= 0
                    ? 'text-emerald-400 print:text-emerald-700'
                    : 'text-red-400 print:text-red-700'
                }`}
              >
                {formatBRL(monthNet, true)}
              </div>
            </div>
          </div>

          {/* 4 Executive KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-3 print:border-slate-300 print:bg-slate-50">
              <div className="text-[11px] text-slate-400 print:text-slate-600">Receitas</div>
              <div className="mt-1 text-base font-bold text-emerald-400 print:text-emerald-700 font-mono-nums">
                {formatBRL(monthIncome)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-3 print:border-slate-300 print:bg-slate-50">
              <div className="text-[11px] text-slate-400 print:text-slate-600">Despesas</div>
              <div className="mt-1 text-base font-bold text-red-400 print:text-red-700 font-mono-nums">
                {formatBRL(monthExpense)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-3 print:border-slate-300 print:bg-slate-50">
              <div className="text-[11px] text-slate-400 print:text-slate-600">Saldo em Contas</div>
              <div className="mt-1 text-base font-bold text-blue-400 print:text-blue-700 font-mono-nums">
                {formatBRL(totalBalance)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-3 print:border-slate-300 print:bg-slate-50">
              <div className="text-[11px] text-slate-400 print:text-slate-600">Investimentos</div>
              <div className="mt-1 text-base font-bold text-purple-400 print:text-purple-700 font-mono-nums">
                {formatBRL(totalInvestments)}
              </div>
            </div>
          </div>

          {/* Despesas por Categoria & Saldos em Contas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4 print:border-slate-300 print:bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
                Despesas por Categoria
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:text-slate-600">
                    <th className="py-1.5 text-left font-medium">Categoria</th>
                    <th className="py-1.5 text-right font-medium">Valor</th>
                    <th className="py-1.5 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {categoryBreakdown.map((c) => (
                    <tr key={c.category}>
                      <td className="py-2 text-slate-200 print:text-slate-800">{c.category}</td>
                      <td className="py-2 text-right font-mono-nums text-slate-200 print:text-slate-800">
                        {formatBRL(c.amount)}
                      </td>
                      <td className="py-2 text-right font-mono-nums text-slate-400 print:text-slate-600">
                        {c.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4 print:border-slate-300 print:bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
                Posição de Contas & Metas
              </h4>
              <table className="w-full text-xs mb-4">
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td className="py-1.5 text-slate-200 print:text-slate-800">{acc.name}</td>
                      <td className="py-1.5 text-right font-mono-nums font-semibold text-slate-100 print:text-slate-900">
                        {formatBRL(acc.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h5 className="text-[11px] font-semibold text-slate-400 print:text-slate-600 mb-2">
                Progresso das Metas
              </h5>
              <div className="space-y-1.5 text-xs">
                {goals.map((g) => (
                  <div key={g.id} className="flex justify-between">
                    <span className="text-slate-300 print:text-slate-700">{g.title}</span>
                    <span className="font-mono-nums text-emerald-400 print:text-emerald-700">
                      {Math.round((g.currentAmount / g.targetAmount) * 100)}% (
                      {formatBRL(g.currentAmount)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compromissos do Mês */}
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4 print:border-slate-300 print:bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
              Compromissos e Vencimentos ({monthCommitments.length})
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:text-slate-600">
                  <th className="py-1.5 text-left font-medium">Vencimento</th>
                  <th className="py-1.5 text-left font-medium">Descrição</th>
                  <th className="py-1.5 text-left font-medium">Conta</th>
                  <th className="py-1.5 text-left font-medium">Status</th>
                  <th className="py-1.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {monthCommitments.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 font-mono-nums text-slate-300 print:text-slate-700">
                      {formatDateBR(c.dueDate)}
                    </td>
                    <td className="py-2 text-slate-200 print:text-slate-800">{c.title}</td>
                    <td className="py-2 text-slate-400 print:text-slate-600">{c.accountName}</td>
                    <td
                      className={`py-2 font-semibold ${
                        c.status === 'pago'
                          ? 'text-emerald-400 print:text-emerald-700'
                          : 'text-amber-400 print:text-amber-700'
                      }`}
                    >
                      {c.status === 'pago' ? 'Pago' : 'Pendente'}
                    </td>
                    <td className="py-2 text-right font-mono-nums text-slate-100 print:text-slate-900">
                      {formatBRL(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Extrato Completo de Transações */}
          <div className="rounded-lg border border-slate-800 bg-[#0D1526] p-4 print:border-slate-300 print:bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-3">
              Extrato Completo de Transações ({monthTransactions.length})
            </h4>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 print:border-slate-300 print:text-slate-600">
                  <th className="py-1.5 text-left font-medium">Data</th>
                  <th className="py-1.5 text-left font-medium">Descrição</th>
                  <th className="py-1.5 text-left font-medium">Categoria</th>
                  <th className="py-1.5 text-left font-medium">Conta</th>
                  <th className="py-1.5 text-left font-medium">Tipo</th>
                  <th className="py-1.5 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                {monthTransactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 font-mono-nums text-slate-300 print:text-slate-700">
                      {formatDateBR(t.date)}
                    </td>
                    <td className="py-2 text-slate-200 print:text-slate-800">{t.description}</td>
                    <td className="py-2 text-slate-400 print:text-slate-600">{t.category}</td>
                    <td className="py-2 text-slate-400 print:text-slate-600">{t.accountName}</td>
                    <td
                      className={`py-2 font-medium ${
                        t.type === 'receita'
                          ? 'text-emerald-400 print:text-emerald-700'
                          : 'text-red-400 print:text-red-700'
                      }`}
                    >
                      {t.type === 'receita' ? 'Receita' : 'Despesa'}
                    </td>
                    <td
                      className={`py-2 text-right font-mono-nums font-semibold ${
                        t.type === 'receita'
                          ? 'text-emerald-400 print:text-emerald-700'
                          : 'text-red-400 print:text-red-700'
                      }`}
                    >
                      {t.type === 'receita' ? formatBRL(t.amount) : formatBRL(-t.amount)}
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
