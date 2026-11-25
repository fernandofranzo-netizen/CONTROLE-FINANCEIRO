import React, { useState } from 'react';
import { ArrowRightLeft, Landmark, Plus, Trash2, Wallet } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Account } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';

export const AccountsView: React.FC = () => {
  const {
    accounts,
    totalBalance,
    transactions,
    addAccount,
    deleteAccount,
    transferBetweenAccounts,
  } = useFinance();

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [type, setType] = useState<Account['type']>('corrente');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');

  const [showTransfer, setShowTransfer] = useState(false);
  const [fromId, setFromId] = useState(accounts[0]?.id || '');
  const [toId, setToId] = useState(accounts[1]?.id || accounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balance.replace(',', '.')) || 0;
    if (!name.trim() || !institution.trim()) return;
    addAccount({
      name: name.trim(),
      institution: institution.trim(),
      type,
      balance: Number(val.toFixed(2)),
      color,
    });
    setName('');
    setInstitution('');
    setBalance('');
    setShowNew(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(transferAmount.replace(',', '.'));
    if (!fromId || !toId || fromId === toId || isNaN(val) || val <= 0) return;
    transferBetweenAccounts(fromId, toId, val);
    setTransferAmount('');
    setShowTransfer(false);
  };

  return (
    <div className="space-y-5">
      {/* Top Summary & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
        <div>
          <span className="text-xs text-slate-400">Saldo Consolidado em Contas</span>
          <div className="mt-1 text-2xl font-bold text-white font-mono-nums">
            {formatBRL(totalBalance)}
          </div>
          <span className="text-[11px] text-slate-400">
            {accounts.length} contas cadastradas
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowTransfer((s) => !s)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-700 bg-[#070B14] px-3.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
            <span>Transferir entre Contas</span>
          </button>
          <button
            onClick={() => setShowNew((s) => !s)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* Inline Transfer Form */}
      {showTransfer && (
        <form
          onSubmit={handleTransfer}
          className="rounded-xl border border-blue-500/30 bg-[#0D1526] p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-white">Transferência entre Contas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Conta Origem</label>
              <select
                value={fromId}
                onChange={(e) => setFromId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatBRL(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Conta Destino</label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatBRL(a.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="h-9 flex-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Confirmar
              </button>
              <button
                type="button"
                onClick={() => setShowTransfer(false)}
                className="h-9 rounded-lg border border-slate-700 px-3 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Inline New Account Form */}
      {showNew && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-slate-800 bg-[#0D1526] p-5 space-y-4"
        >
          <h3 className="text-sm font-bold text-white">Cadastrar Nova Conta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              required
              placeholder="Nome (ex: Santander)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              required
              placeholder="Instituição"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Account['type'])}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
            >
              <option value="corrente">Conta Corrente</option>
              <option value="digital">Conta Digital</option>
              <option value="poupanca">Poupança</option>
              <option value="carteira">Carteira</option>
            </select>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Saldo Inicial"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-10 rounded border border-slate-800 bg-[#070B14] p-0.5 cursor-pointer"
                title="Cor da conta"
              />
              <button
                type="submit"
                className="h-9 flex-1 rounded-lg bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {accounts.map((acc) => {
          const txCount = transactions.filter((t) => t.accountId === acc.id).length;
          return (
            <div
              key={acc.id}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${acc.color}20`, color: acc.color }}
                    >
                      {acc.type === 'carteira' ? (
                        <Wallet className="h-4 w-4" />
                      ) : (
                        <Landmark className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{acc.name}</h3>
                      <p className="text-[11px] text-slate-400">{acc.institution}</p>
                    </div>
                  </div>
                  {accounts.length > 1 && (
                    <button
                      onClick={() => deleteAccount(acc.id)}
                      className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-red-400 cursor-pointer"
                      title="Remover conta"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-5">
                  <div className="text-[11px] text-slate-400">Saldo Atual</div>
                  <div className="mt-0.5 text-xl font-bold text-white font-mono-nums">
                    {formatBRL(acc.balance)}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="capitalize">{acc.type}</span>
                <span>{txCount} movimentações</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
