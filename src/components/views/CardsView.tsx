import React, { useState } from 'react';
import { CheckCircle2, CreditCard, Plus, Trash2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { CreditCardItem } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';

export const CardsView: React.FC = () => {
  const { cards, accounts, addCard, payCardInvoice, deleteCard } = useFinance();

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState<CreditCardItem['brand']>('Mastercard');
  const [lastFour, setLastFour] = useState('8420');
  const [limit, setLimit] = useState('5000');
  const [usedAmount, setUsedAmount] = useState('0');
  const [dueDay, setDueDay] = useState('15');
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');

  const totalUsed = cards.reduce((acc, c) => acc + c.usedAmount, 0);
  const totalLimit = cards.reduce((acc, c) => acc + c.limit, 0);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numLimit = parseFloat(limit.replace(',', '.')) || 5000;
    const numUsed = parseFloat(usedAmount.replace(',', '.')) || 0;
    const numDue = Math.min(28, Math.max(1, parseInt(dueDay, 10) || 15));
    if (!name.trim()) return;

    addCard({
      name: name.trim(),
      brand,
      lastFour: lastFour.slice(0, 4).padStart(4, '0'),
      limit: numLimit,
      usedAmount: numUsed,
      closingDay: Math.max(1, numDue - 7),
      dueDay: numDue,
      color: '#2563EB',
      invoicePaid: numUsed === 0,
    });
    setName('');
    setShowNew(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800/90 bg-[#0F172A] p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <span className="text-xs text-slate-400">Faturas em Aberto</span>
            <div className="mt-1 text-2xl font-bold text-white font-mono-nums">
              {formatBRL(totalUsed)}
            </div>
          </div>
          <div className="h-9 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-xs text-slate-400">Limite Total Disponível</span>
            <div className="mt-1 text-2xl font-bold text-emerald-400 font-mono-nums">
              {formatBRL(Math.max(0, totalLimit - totalUsed))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={payAccountId}
            onChange={(e) => setPayAccountId(e.target.value)}
            aria-label="Conta padrão para pagamento de fatura"
            className="h-9 rounded-lg border border-slate-800 bg-[#070B14] px-3 text-xs text-slate-200"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                Pagar com: {a.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNew((s) => !s)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Novo Cartão</span>
          </button>
        </div>
      </div>

      {showNew && (
        <form
          onSubmit={handleAdd}
          className="rounded-xl border border-slate-800 bg-[#0D1526] p-5 grid grid-cols-1 sm:grid-cols-6 gap-3"
        >
          <input
            type="text"
            required
            placeholder="Nome do Cartão"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
          />
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value as CreditCardItem['brand'])}
            className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white"
          >
            <option value="Mastercard">Mastercard</option>
            <option value="Visa">Visa</option>
            <option value="Elo">Elo</option>
          </select>
          <input
            type="text"
            maxLength={4}
            placeholder="Final (4 dígitos)"
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
          />
          <input
            type="number"
            placeholder="Limite (R$)"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
          />
          <input
            type="number"
            placeholder="Dia Vencimento"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            className="rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white font-mono-nums"
          />
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
          >
            Adicionar Cartão
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => {
          const pct = Math.min(100, Math.round((card.usedAmount / card.limit) * 100));
          const available = Math.max(0, card.limit - card.usedAmount);

          return (
            <div
              key={card.id}
              className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-5 flex flex-col justify-between"
            >
              <div>
                {/* Card Visual Header */}
                <div
                  className="rounded-xl p-4 text-white relative overflow-hidden border border-white/10"
                  style={{
                    background: `linear-gradient(135deg, ${card.color}CC, #0B1120)`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wide">{card.name}</span>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="rounded p-1 text-white/60 hover:bg-black/20 hover:text-white cursor-pointer"
                      title="Excluir cartão"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-5 font-mono-nums text-sm tracking-widest text-white/90">
                    •••• •••• •••• {card.lastFour}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-white/75">
                    <span>{card.brand}</span>
                    <span>Fecha dia {card.closingDay} · Vence dia {card.dueDay}</span>
                  </div>
                </div>

                {/* Limit Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Fatura Atual</span>
                    <span className="font-bold text-white font-mono-nums">
                      {formatBRL(card.usedAmount)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 80 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono-nums">
                    <span>Disponível: {formatBRL(available)}</span>
                    <span>Limite: {formatBRL(card.limit)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {card.usedAmount <= 0 || card.invoicePaid ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Fatura Quitada
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
                      <CreditCard className="h-3.5 w-3.5" />
                      Em aberto
                    </span>
                    <button
                      onClick={() => payCardInvoice(card.id, payAccountId)}
                      className="rounded-lg bg-emerald-600/20 border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-600/30 cursor-pointer"
                    >
                      Pagar Fatura
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
