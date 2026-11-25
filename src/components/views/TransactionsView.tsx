import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName, Transaction } from '../../types/finance';
import { CATEGORY_COLORS, formatBRL, formatDateBR } from '../../utils/formatters';

interface TransactionsViewProps {
  onNewTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

const CATEGORIES: ('Todas' | CategoryName)[] = [
  'Todas',
  'Salário',
  'Trabalho',
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Investimentos',
  'Outros',
];

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onNewTransaction,
  onEditTransaction,
}) => {
  const { monthTransactions, accounts, deleteTransaction } = useFinance();

  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState<'Todas' | CategoryName>('Todas');
  const [typeFilter, setTypeFilter] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return monthTransactions.filter((t) => {
      if (accountFilter !== 'Todas' && t.accountId !== accountFilter) return false;
      if (categoryFilter !== 'Todas' && t.category !== categoryFilter) return false;
      if (typeFilter !== 'todos' && t.type !== typeFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.accountName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [monthTransactions, accountFilter, categoryFilter, typeFilter, search]);

  const totalReceitas = useMemo(
    () => filtered.filter((t) => t.type === 'receita').reduce((a, b) => a + b.amount, 0),
    [filtered]
  );
  const totalDespesas = useMemo(
    () => filtered.filter((t) => t.type === 'despesa').reduce((a, b) => a + b.amount, 0),
    [filtered]
  );
  const saldoPeriodo = totalReceitas - totalDespesas;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-5">
      {/* Filter Toolbar matching Image 4 & 5 */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800/90 bg-[#0F172A] p-3.5">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar transação..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-lg border border-slate-800 bg-[#070B14] pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filtrar por conta"
            className="h-9 rounded-lg border border-slate-800 bg-[#070B14] px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="Todas">Todas as contas</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as 'Todas' | CategoryName);
              setPage(1);
            }}
            aria-label="Filtrar por categoria"
            className="h-9 rounded-lg border border-slate-800 bg-[#070B14] px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todas' ? 'Todas as categorias' : cat}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as 'todos' | 'receita' | 'despesa');
              setPage(1);
            }}
            aria-label="Filtrar por tipo"
            className="h-9 rounded-lg border border-slate-800 bg-[#070B14] px-3 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="todos">Tipo: Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        <button
          onClick={onNewTransaction}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors whitespace-nowrap cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Nova Transação</span>
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="text-[11px] font-medium text-slate-400">Total de Receitas</div>
          <div className="mt-1.5 text-xl font-bold text-emerald-400 font-mono-nums">
            {formatBRL(totalReceitas)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="text-[11px] font-medium text-slate-400">Total de Despesas</div>
          <div className="mt-1.5 text-xl font-bold text-red-400 font-mono-nums">
            {formatBRL(totalDespesas)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="text-[11px] font-medium text-slate-400">Saldo do Período</div>
          <div
            className={`mt-1.5 text-xl font-bold font-mono-nums ${
              saldoPeriodo >= 0 ? 'text-blue-400' : 'text-red-400'
            }`}
          >
            {formatBRL(saldoPeriodo)}
          </div>
        </div>
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-4">
          <div className="text-[11px] font-medium text-slate-400">Quantidade</div>
          <div className="mt-1.5 text-xl font-bold text-white font-mono-nums">
            {filtered.length} transações
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800/90 bg-[#0F172A]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0B1120] text-slate-400">
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Descrição</th>
                <th className="px-4 py-3 font-semibold">Categoria</th>
                <th className="px-4 py-3 font-semibold">Conta</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Nenhuma transação encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const isIncome = tx.type === 'receita';
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono-nums text-slate-300 whitespace-nowrap">
                        {formatDateBR(tx.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-100">
                        <div>{tx.description}</div>
                        {tx.notes && (
                          <div className="text-[11px] text-slate-500">{tx.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: CATEGORY_COLORS[tx.category] || '#64748B' }}
                          />
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {tx.accountName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            isIncome ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {isIncome ? 'Receita' : 'Despesa'}
                        </span>
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-mono-nums font-semibold whitespace-nowrap ${
                          isIncome ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isIncome ? formatBRL(tx.amount) : formatBRL(-tx.amount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditTransaction(tx)}
                            title="Editar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-blue-400 cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteTransaction(tx.id)}
                            title="Excluir"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
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

        {/* Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-[#0B1120] px-4 py-3 text-xs text-slate-400">
          <span>
            Mostrando {filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1} a{' '}
            {Math.min(safePage * pageSize, filtered.length)} de {filtered.length} transações
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-[#0F172A] text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-7 min-w-[28px] rounded-md px-2 font-mono-nums font-medium cursor-pointer ${
                  p === safePage
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-800 bg-[#0F172A] text-slate-300 hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 bg-[#0F172A] text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
