import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CategoryName, Transaction, TransactionType } from '../../types/finance';

interface TransactionModalProps {
  open: boolean;
  editing?: Transaction | null;
  onClose: () => void;
}

const CATEGORIES: CategoryName[] = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Salário',
  'Trabalho',
  'Investimentos',
  'Outros',
];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  open,
  editing,
  onClose,
}) => {
  const { accounts, selectedMonth, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('despesa');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<CategoryName>('Alimentação');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(`${selectedMonth}-20`);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editing) {
      setType(editing.type);
      setDescription(editing.description);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setAccountId(editing.accountId);
      setDate(editing.date);
      setNotes(editing.notes || '');
    } else {
      setType('despesa');
      setDescription('');
      setAmount('');
      setCategory('Alimentação');
      setAccountId(accounts[0]?.id || '');
      setDate(`${selectedMonth}-20`);
      setNotes('');
    }
  }, [editing, open, accounts, selectedMonth]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim() || isNaN(numericAmount) || numericAmount <= 0) return;

    const acc = accounts.find((a) => a.id === accountId) || accounts[0];
    if (!acc) return;

    const payload = {
      type,
      description: description.trim(),
      amount: Number(numericAmount.toFixed(2)),
      category,
      accountId: acc.id,
      accountName: acc.name,
      date,
      notes: notes.trim() || undefined,
    };

    if (editing) {
      updateTransaction({ ...payload, id: editing.id });
    } else {
      addTransaction(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs no-print">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0D1526] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-base font-bold text-white">
            {editing ? 'Editar Transação' : 'Nova Transação'}
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
          {/* Segmented Type Selector */}
          <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#070B14] p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setType('despesa')}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                type === 'despesa'
                  ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => {
                setType('receita');
                if (category === 'Alimentação') setCategory('Salário');
              }}
              className={`rounded-md py-2 text-xs font-semibold transition-colors ${
                type === 'receita'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Descrição</label>
            <input
              type="text"
              required
              placeholder="Ex: Supermercado, Salário, Aluguel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
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

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">
              Observações (opcional)
            </label>
            <input
              type="text"
              placeholder="Detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-transparent px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {editing ? 'Salvar Alterações' : 'Adicionar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
