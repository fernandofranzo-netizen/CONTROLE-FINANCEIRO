import { CategoryName, Commitment, Transaction } from '../types/finance';

export function formatBRL(value: number, showSign = false): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (value < 0) {
    return `- ${formatted}`;
  }
  if (showSign && value > 0) {
    return `+ ${formatted}`;
  }
  return formatted;
}

export function formatDateBR(isoDate: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export function formatShortDayMonth(isoDate: string): { day: string; month: string } {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [, m, d] = isoDate.split('-');
  const monthIdx = Math.max(0, Math.min(11, parseInt(m, 10) - 1));
  return {
    day: d || '01',
    month: months[monthIdx] || 'Mai',
  };
}

export function getMonthLabel(monthKey: string): string {
  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  const [y, m] = monthKey.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || 'Maio'} / ${y}`;
}

export function getShortMonthLabel(monthKey: string): string {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const [y, m] = monthKey.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${monthNames[idx] || 'Mai'}/${y}`;
}

export const CATEGORY_COLORS: Record<CategoryName, string> = {
  Moradia: '#3B82F6',
  Alimentação: '#10B981',
  Transporte: '#F59E0B',
  Saúde: '#EF4444',
  Lazer: '#8B5CF6',
  Salário: '#22C55E',
  Trabalho: '#14B8A6',
  Investimentos: '#6366F1',
  Outros: '#06B6D4',
};

export interface MonthlyReportExportData {
  monthKey: string;
  userName: string;
  userEmail: string;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netPeriod: number;
  totalInvestments: number;
  transactions: Transaction[];
  commitments: Commitment[];
  categoryBreakdown: { category: string; amount: number; percent: number }[];
}

export function downloadMonthlyCSV(report: MonthlyReportExportData): void {
  const monthLabel = getMonthLabel(report.monthKey);
  const lines: string[] = [];

  lines.push(`CONTROLE FINANCEIRO PRO - RELATORIO MENSAL DETALHADO`);
  lines.push(`Periodo;${monthLabel}`);
  lines.push(`Titular;${report.userName} (${report.userEmail})`);
  lines.push(`Gerado em;${new Date().toLocaleString('pt-BR')}`);
  lines.push('');
  lines.push('RESUMO EXECUTIVO');
  lines.push(`Indicador;Valor`);
  lines.push(`Saldo Total em Contas;${formatBRL(report.totalBalance)}`);
  lines.push(`Total de Receitas;${formatBRL(report.totalIncome)}`);
  lines.push(`Total de Despesas;${formatBRL(report.totalExpense)}`);
  lines.push(`Saldo Liquido do Periodo;${formatBRL(report.netPeriod)}`);
  lines.push(`Total Investido;${formatBRL(report.totalInvestments)}`);
  lines.push('');
  lines.push('DESPESAS POR CATEGORIA');
  lines.push('Categoria;Valor;Participacao');
  report.categoryBreakdown.forEach((c) => {
    lines.push(`${c.category};${formatBRL(c.amount)};${c.percent.toFixed(1)}%`);
  });
  lines.push('');
  lines.push('COMPROMISSOS E VENCIMENTOS DO MES');
  lines.push('Vencimento;Descricao;Categoria;Conta;Status;Valor');
  report.commitments.forEach((c) => {
    lines.push(
      `${formatDateBR(c.dueDate)};"${c.title}";${c.category};${c.accountName};${
        c.status === 'pago' ? 'Pago' : 'Pendente'
      };${formatBRL(c.amount)}`
    );
  });
  lines.push('');
  lines.push('EXTRATO DETALHADO DE TRANSACOES');
  lines.push('Data;Descricao;Categoria;Conta;Tipo;Valor');
  report.transactions.forEach((t) => {
    const signed = t.type === 'despesa' ? -t.amount : t.amount;
    lines.push(
      `${formatDateBR(t.date)};"${t.description}";${t.category};${t.accountName};${
        t.type === 'receita' ? 'Receita' : 'Despesa'
      };${formatBRL(signed)}`
    );
  });

  // Add UTF-8 BOM for proper accent handling in Excel
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `relatorio-financeiro-${report.monthKey}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadMonthlyJSON(report: MonthlyReportExportData): void {
  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `relatorio-financeiro-${report.monthKey}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
