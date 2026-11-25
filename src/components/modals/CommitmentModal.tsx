import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName, Commitment, CommitmentStatus } from '../../types/finance';

interface CommitmentModalProps {
  open: boolean;
  editing?: Commitment | null;
  defaultDate?: string;
  onClose: () => void;
}

const CATEGORIES: CategoryName[] = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Investimentos',
  'Outros',
];

export const CommitmentModal: React.FC<CommitmentModalProps> = ({
  open,
  editing,
  defaultDate,
  onClose,
}) => {
  const { accounts, selectedMonth, addCommitment, updateCommitment } = useFinance();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(defaultDate || `${selectedMonth}-25`);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryName>('Moradia');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [status, setStatus] = useState<CommitmentStatus>('pendente');
  const [recurring, setRecurring] = useState(true);

  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setDueDate(editing.dueDate);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setAccountId(editing.accountId);
      setStatus(editing.status);
      setRecurring(Boolean(editing.recurring));
    } else {
      setTitle('');
      setDueDate(defaultDate || `${selectedMonth}-25`);
      setAmount('');
      setCategory('Moradia');
      setAccountId(accounts[0]?.id || '');
      setStatus('pendente');
      setRecurring(true);
    }
  }, [editing, defaultDate, open, accounts, selectedMonth]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!title.trim() || isNaN(numericAmount) || numericAmount <= 0) return;

    const acc = accounts.find((a) => a.id === accountId) || accounts[0];
    if (!acc) return;

    const payload = {
      title: title.trim(),
      dueDate,
      amount: Number(numericAmount.toFixed(2)),
      category,
      accountId: acc.id,
      accountName: acc.name,
      status,
      recurring,
      type: 'despesa' as const,
    };

    if (editing) {
      updateCommitment({ ...payload, id: editing.id });
    } else {
      addCommitment(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs no-print">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0D1526] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-bold text-white">
            {editing ? 'Editar Compromisso' : 'Novo Compromisso Financeiro'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Título do Compromisso
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Aluguel, Internet, Cartão de Crédito..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white font-mono-nums placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Vencimento</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Conta</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CommitmentStatus)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-[#070B14] text-blue-600 focus:ring-blue-500"
              />
              <span>Compromisso mensal</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {editing ? 'Salvar Compromisso' : 'Agendar Compromisso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
