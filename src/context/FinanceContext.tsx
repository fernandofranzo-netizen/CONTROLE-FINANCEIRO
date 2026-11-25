import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ACCOUNTS,
  INITIAL_BUDGETS,
  INITIAL_CARDS,
  INITIAL_COMMITMENTS,
  INITIAL_GOALS,
  INITIAL_INVESTMENTS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';
import {
  Account,
  BudgetLimit,
  CategoryName,
  CheckoutLinks,
  Commitment,
  CreditCardItem,
  Goal,
  Investment,
  NavRoute,
  NotificationAlert,
  PlanId,
  Transaction,
  UserSettings,
  WebhookEventLog,
  WebhookPlatform,
} from '../types/finance';

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning' | 'error';
}

interface FinanceContextValue {
  activeRoute: NavRoute;
  setActiveRoute: (route: NavRoute) => void;
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  availableMonths: string[];
  accounts: Account[];
  transactions: Transaction[];
  monthTransactions: Transaction[];
  goals: Goal[];
  investments: Investment[];
  cards: CreditCardItem[];
  commitments: Commitment[];
  monthCommitments: Commitment[];
  budgets: BudgetLimit[];
  settings: UserSettings;
  notifications: NotificationAlert[];
  unreadNotificationsCount: number;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;

  // Derived Totals
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  totalInvestments: number;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;

  addAccount: (acc: Omit<Account, 'id'>) => void;
  updateAccount: (acc: Account) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number) => void;

  addGoal: (goal: Omit<Goal, 'id'>) => void;
  contributeGoal: (goalId: string, amount: number, accountId?: string) => void;
  deleteGoal: (id: string) => void;

  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestment: (inv: Investment) => void;
  deleteInvestment: (id: string) => void;

  addCard: (card: Omit<CreditCardItem, 'id'>) => void;
  payCardInvoice: (cardId: string, accountId: string) => void;
  deleteCard: (id: string) => void;

  addCommitment: (com: Omit<Commitment, 'id'>) => void;
  updateCommitment: (com: Commitment) => void;
  toggleCommitmentPaid: (id: string, recordTransaction?: boolean) => void;
  deleteCommitment: (id: string) => void;

  updateBudgetLimit: (category: CategoryName, limit: number) => void;
  updateSettings: (next: Partial<UserSettings>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllData: () => void;
  importAllData: (jsonText: string) => boolean;

  // Subscription & Webhooks
  checkoutLinks: CheckoutLinks;
  webhookEvents: WebhookEventLog[];
  hasWebhookSecret: boolean;
  refreshSubscriptionAndWebhooks: () => Promise<void>;
  saveCheckoutLinks: (links: CheckoutLinks) => Promise<boolean>;
  triggerWebhookUpgrade: (
    platform: WebhookPlatform,
    planId: PlanId,
    webhookToken?: string
  ) => Promise<boolean>;
}

const STORAGE_KEY = 'controle_financeiro_pro_v1';

const FinanceContext = createContext<FinanceContextValue | null>(null);

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const persisted = useMemo(() => loadPersistedState(), []);

  const [activeRoute, setActiveRoute] = useState<NavRoute>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(persisted?.selectedMonth || '2025-05');
  const [accounts, setAccounts] = useState<Account[]>(persisted?.accounts || INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(
    persisted?.transactions || INITIAL_TRANSACTIONS
  );
  const [goals, setGoals] = useState<Goal[]>(persisted?.goals || INITIAL_GOALS);
  const [investments, setInvestments] = useState<Investment[]>(
    persisted?.investments || INITIAL_INVESTMENTS
  );
  const [cards, setCards] = useState<CreditCardItem[]>(persisted?.cards || INITIAL_CARDS);
  const [commitments, setCommitments] = useState<Commitment[]>(
    persisted?.commitments || INITIAL_COMMITMENTS
  );
  const [budgets, setBudgets] = useState<BudgetLimit[]>(persisted?.budgets || INITIAL_BUDGETS);
  const [settings, setSettings] = useState<UserSettings>(persisted?.settings || INITIAL_SETTINGS);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(persisted?.readAlertIds || []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [checkoutLinks, setCheckoutLinks] = useState<CheckoutLinks>({
    mensal: 'https://pay.kiwify.com.br/exemplo-plano-mensal',
    semestral: 'https://pay.kiwify.com.br/exemplo-plano-semestral',
    anual: 'https://pay.kiwify.com.br/exemplo-plano-anual',
  });
  const [webhookEvents, setWebhookEvents] = useState<WebhookEventLog[]>([]);
  const [hasWebhookSecret, setHasWebhookSecret] = useState(false);

  const refreshSubscriptionAndWebhooks = async () => {
    try {
      const [subRes, cfgRes] = await Promise.all([
        fetch(`/api/subscription?email=${encodeURIComponent(settings.email)}`),
        fetch('/api/webhooks/config'),
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.subscription && subData.subscription.status === 'ativo') {
          setSettings((prev) => ({
            ...prev,
            planId: subData.subscription.planId,
            planName: subData.subscription.planName,
            planPlatform: subData.subscription.platform,
            renewalDate: subData.subscription.renewalDate,
          }));
        }
        if (subData.checkoutLinks) {
          setCheckoutLinks(subData.checkoutLinks);
        }
      }
      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        setHasWebhookSecret(Boolean(cfgData.hasSecretConfigured));
        if (Array.isArray(cfgData.events)) {
          setWebhookEvents(cfgData.events);
        }
        if (cfgData.checkoutLinks) {
          setCheckoutLinks(cfgData.checkoutLinks);
        }
      }
    } catch {
      // Offline or standalone build fallback
    }
  };

  useEffect(() => {
    refreshSubscriptionAndWebhooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.email]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedMonth,
          accounts,
          transactions,
          goals,
          investments,
          cards,
          commitments,
          budgets,
          settings,
          readAlertIds,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [
    selectedMonth,
    accounts,
    transactions,
    goals,
    investments,
    cards,
    commitments,
    budgets,
    settings,
    readAlertIds,
  ]);

  const pushToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const availableMonths = useMemo(() => {
    const base = new Set<string>(['2025-04', '2025-05', '2025-06', '2026-11', selectedMonth]);
    transactions.forEach((t) => base.add(t.date.slice(0, 7)));
    commitments.forEach((c) => base.add(c.dueDate.slice(0, 7)));
    return Array.from(base).sort();
  }, [transactions, commitments, selectedMonth]);

  const monthTransactions = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, selectedMonth]
  );

  const monthCommitments = useMemo(
    () =>
      commitments
        .filter((c) => c.dueDate.startsWith(selectedMonth))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [commitments, selectedMonth]
  );

  const totalBalance = useMemo(
    () => accounts.reduce((acc, item) => acc + item.balance, 0),
    [accounts]
  );

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'receita')
        .reduce((acc, item) => acc + item.amount, 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((t) => t.type === 'despesa')
        .reduce((acc, item) => acc + item.amount, 0),
    [monthTransactions]
  );

  const monthNet = monthIncome - monthExpense;

  const totalInvestments = useMemo(
    () => investments.reduce((acc, item) => acc + item.amount, 0),
    [investments]
  );

  // Pending Payments Notification Engine
  const notifications = useMemo<NotificationAlert[]>(() => {
    // Use selectedMonth reference or real today (2026-11-25) for intuitive alerts:
    // If viewing 2025-05, anchor reference day at 2025-05-19 so Maio 2025 bills show realistic overdue/upcoming alerts,
    // plus any real overdue/upcoming pending commitments in the active month.
    const refDateStr =
      selectedMonth === '2025-05'
        ? '2025-05-19'
        : selectedMonth === '2026-11'
          ? '2026-11-25'
          : `${selectedMonth}-15`;

    const refTime = new Date(`${refDateStr}T12:00:00`).getTime();

    const pendingInMonth = commitments.filter(
      (c) => c.status === 'pendente' && c.dueDate.startsWith(selectedMonth)
    );

    // Also surface any urgent pending items from today's real month (2026-11) if not already in list
    const pendingUrgentGlobal =
      selectedMonth === '2026-11'
        ? []
        : commitments.filter(
            (c) => c.status === 'pendente' && c.dueDate.startsWith('2026-11')
          );

    const combined = [...pendingInMonth, ...pendingUrgentGlobal];

    return combined
      .map((c): NotificationAlert => {
        const dueTime = new Date(`${c.dueDate}T12:00:00`).getTime();
        const daysDiff = Math.round((dueTime - refTime) / (1000 * 60 * 60 * 24));
        let urgency: NotificationAlert['urgency'] = 'pendente';
        if (daysDiff < 0) urgency = 'vencido';
        else if (daysDiff === 0) urgency = 'hoje';
        else if (daysDiff <= settings.notifyDaysBefore) urgency = 'proximo';

        return {
          id: `alert-${c.id}`,
          commitmentId: c.id,
          title: c.title,
          dueDate: c.dueDate,
          amount: c.amount,
          accountName: c.accountName,
          category: c.category,
          urgency,
          daysDiff,
          read: readAlertIds.includes(`alert-${c.id}`),
        };
      })
      .sort((a, b) => a.daysDiff - b.daysDiff);
  }, [commitments, selectedMonth, settings.notifyDaysBefore, readAlertIds]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // CRUD Handlers
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
    };
    setTransactions((prev) => [newTx, ...prev]);
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== tx.accountId) return acc;
        const delta = tx.type === 'receita' ? tx.amount : -tx.amount;
        return { ...acc, balance: Number((acc.balance + delta).toFixed(2)) };
      })
    );
    pushToast({
      title: 'Transação registrada',
      description: `${tx.description} (${tx.type === 'receita' ? '+' : '-'} R$ ${tx.amount.toFixed(2)})`,
      tone: 'success',
    });
  };

  const updateTransaction = (updated: Transaction) => {
    const existing = transactions.find((t) => t.id === updated.id);
    if (existing) {
      setAccounts((prev) =>
        prev.map((acc) => {
          let nextBalance = acc.balance;
          if (acc.id === existing.accountId) {
            nextBalance -= existing.type === 'receita' ? existing.amount : -existing.amount;
          }
          if (acc.id === updated.accountId) {
            nextBalance += updated.type === 'receita' ? updated.amount : -updated.amount;
          }
          return { ...acc, balance: Number(nextBalance.toFixed(2)) };
        })
      );
    }
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    pushToast({ title: 'Transação atualizada', tone: 'info' });
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (target) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id !== target.accountId) return acc;
          const revert = target.type === 'receita' ? -target.amount : target.amount;
          return { ...acc, balance: Number((acc.balance + revert).toFixed(2)) };
        })
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    pushToast({ title: 'Transação removida', tone: 'warning' });
  };

  const addAccount = (acc: Omit<Account, 'id'>) => {
    setAccounts((prev) => [...prev, { ...acc, id: `acc-${Date.now()}` }]);
    pushToast({ title: 'Conta adicionada', description: acc.name, tone: 'success' });
  };

  const updateAccount = (acc: Account) => {
    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? acc : a)));
    pushToast({ title: 'Conta atualizada', tone: 'info' });
  };

  const deleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    pushToast({ title: 'Conta removida', tone: 'warning' });
  };

  const transferBetweenAccounts = (fromId: string, toId: string, amount: number) => {
    if (fromId === toId || amount <= 0) return;
    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc) return;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === fromId) return { ...a, balance: Number((a.balance - amount).toFixed(2)) };
        if (a.id === toId) return { ...a, balance: Number((a.balance + amount).toFixed(2)) };
        return a;
      })
    );

    const today = `${selectedMonth}-20`;
    setTransactions((prev) => [
      {
        id: `tx-tr-out-${Date.now()}`,
        date: today,
        description: `Transferência para ${toAcc.name}`,
        category: 'Outros',
        accountId: fromId,
        accountName: fromAcc.name,
        type: 'despesa',
        amount,
      },
      {
        id: `tx-tr-in-${Date.now() + 1}`,
        date: today,
        description: `Transferência de ${fromAcc.name}`,
        category: 'Outros',
        accountId: toId,
        accountName: toAcc.name,
        type: 'receita',
        amount,
      },
      ...prev,
    ]);

    pushToast({
      title: 'Transferência realizada',
      description: `${fromAcc.name} → ${toAcc.name}`,
      tone: 'success',
    });
  };

  const addGoal = (goal: Omit<Goal, 'id'>) => {
    setGoals((prev) => [...prev, { ...goal, id: `goal-${Date.now()}` }]);
    pushToast({ title: 'Meta criada', description: goal.title, tone: 'success' });
  };

  const contributeGoal = (goalId: string, amount: number, accountId?: string) => {
    if (amount <= 0) return;
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, currentAmount: Number((g.currentAmount + amount).toFixed(2)) }
          : g
      )
    );

    if (accountId) {
      const acc = accounts.find((a) => a.id === accountId);
      if (acc) {
        addTransaction({
          date: `${selectedMonth}-20`,
          description: `Aporte Meta: ${goal.title}`,
          category: 'Investimentos',
          accountId: acc.id,
          accountName: acc.name,
          type: 'despesa',
          amount,
        });
        return;
      }
    }

    pushToast({
      title: 'Aporte registrado',
      description: `${goal.title} atualizado`,
      tone: 'success',
    });
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    pushToast({ title: 'Meta removida', tone: 'warning' });
  };

  const addInvestment = (inv: Omit<Investment, 'id'>) => {
    setInvestments((prev) => [...prev, { ...inv, id: `inv-${Date.now()}` }]);
    pushToast({ title: 'Investimento adicionado', description: inv.name, tone: 'success' });
  };

  const updateInvestment = (inv: Investment) => {
    setInvestments((prev) => prev.map((i) => (i.id === inv.id ? inv : i)));
    pushToast({ title: 'Investimento atualizado', tone: 'info' });
  };

  const deleteInvestment = (id: string) => {
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    pushToast({ title: 'Ativo removido', tone: 'warning' });
  };

  const addCard = (card: Omit<CreditCardItem, 'id'>) => {
    setCards((prev) => [...prev, { ...card, id: `card-${Date.now()}` }]);
    pushToast({ title: 'Cartão adicionado', description: card.name, tone: 'success' });
  };

  const payCardInvoice = (cardId: string, accountId: string) => {
    const card = cards.find((c) => c.id === cardId);
    const acc = accounts.find((a) => a.id === accountId);
    if (!card || !acc || card.usedAmount <= 0) return;

    const amount = card.usedAmount;
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, usedAmount: 0, invoicePaid: true } : c))
    );
    addTransaction({
      date: `${selectedMonth}-${String(card.dueDay).padStart(2, '0')}`,
      description: `Pagamento Fatura ${card.name}`,
      category: 'Outros',
      accountId: acc.id,
      accountName: acc.name,
      type: 'despesa',
      amount,
    });
  };

  const deleteCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    pushToast({ title: 'Cartão removido', tone: 'warning' });
  };

  const addCommitment = (com: Omit<Commitment, 'id'>) => {
    setCommitments((prev) => [...prev, { ...com, id: `com-${Date.now()}` }]);
    pushToast({
      title: 'Compromisso agendado',
      description: `${com.title} · Vencimento ${com.dueDate.split('-').reverse().join('/')}`,
      tone: 'success',
    });
  };

  const updateCommitment = (com: Commitment) => {
    setCommitments((prev) => prev.map((c) => (c.id === com.id ? com : c)));
    pushToast({ title: 'Compromisso atualizado', tone: 'info' });
  };

  const toggleCommitmentPaid = (id: string, recordTransaction = true) => {
    const target = commitments.find((c) => c.id === id);
    if (!target) return;
    const nextStatus = target.status === 'pago' ? 'pendente' : 'pago';

    setCommitments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );

    if (nextStatus === 'pago' && recordTransaction) {
      addTransaction({
        date: target.dueDate,
        description: `Pgto: ${target.title}`,
        category: target.category,
        accountId: target.accountId,
        accountName: target.accountName,
        type: target.type,
        amount: target.amount,
      });
    } else {
      pushToast({
        title: nextStatus === 'pago' ? 'Pagamento confirmado' : 'Marcado como pendente',
        description: target.title,
        tone: nextStatus === 'pago' ? 'success' : 'warning',
      });
    }
  };

  const deleteCommitment = (id: string) => {
    setCommitments((prev) => prev.filter((c) => c.id !== id));
    pushToast({ title: 'Compromisso excluído', tone: 'warning' });
  };

  const updateBudgetLimit = (category: CategoryName, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.category === category ? { ...b, limit } : b))
    );
    pushToast({ title: `Orçamento de ${category} atualizado`, tone: 'success' });
  };

  const updateSettings = (next: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
    pushToast({ title: 'Configurações salvas', tone: 'success' });
  };

  const markNotificationRead = (id: string) => {
    setReadAlertIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllNotificationsRead = () => {
    setReadAlertIds(notifications.map((n) => n.id));
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedMonth('2025-05');
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setGoals(INITIAL_GOALS);
    setInvestments(INITIAL_INVESTMENTS);
    setCards(INITIAL_CARDS);
    setCommitments(INITIAL_COMMITMENTS);
    setBudgets(INITIAL_BUDGETS);
    setSettings(INITIAL_SETTINGS);
    setReadAlertIds([]);
    pushToast({ title: 'Dados restaurados para o padrão inicial', tone: 'info' });
  };

  const importAllData = (jsonText: string): boolean => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.accounts) setAccounts(parsed.accounts);
      if (parsed.transactions) setTransactions(parsed.transactions);
      if (parsed.goals) setGoals(parsed.goals);
      if (parsed.investments) setInvestments(parsed.investments);
      if (parsed.cards) setCards(parsed.cards);
      if (parsed.commitments) setCommitments(parsed.commitments);
      if (parsed.budgets) setBudgets(parsed.budgets);
      if (parsed.settings) setSettings(parsed.settings);
      pushToast({ title: 'Backup importado com sucesso', tone: 'success' });
      return true;
    } catch {
      pushToast({ title: 'Erro ao importar arquivo JSON', tone: 'error' });
      return false;
    }
  };

  const saveCheckoutLinks = async (links: CheckoutLinks): Promise<boolean> => {
    try {
      const res = await fetch('/api/webhooks/checkout-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(links),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        pushToast({
          title: 'URL inválida',
          description: err.error || 'Use URLs válidas iniciando com https://',
          tone: 'error',
        });
        return false;
      }
      const data = await res.json();
      setCheckoutLinks(data.checkoutLinks);
      pushToast({ title: 'Links de checkout salvos', tone: 'success' });
      return true;
    } catch {
      pushToast({ title: 'Erro ao salvar links de checkout', tone: 'error' });
      return false;
    }
  };

  const triggerWebhookUpgrade = async (
    platform: WebhookPlatform,
    planId: PlanId,
    webhookToken?: string
  ): Promise<boolean> => {
    const planLabel =
      planId === 'mensal' ? 'Mensal' : planId === 'semestral' ? 'Semestral' : 'Anual';

    const payload =
      platform === 'hotmart'
        ? {
            event: 'PURCHASE_APPROVED',
            data: {
              buyer: { email: settings.email, name: settings.name },
              product: { name: `Controle Financeiro Pro - Plano ${planLabel}` },
              subscription: { plan: { name: planLabel } },
            },
          }
        : platform === 'kiwify'
          ? {
              order_status: 'paid',
              Customer: { email: settings.email, full_name: settings.name },
              Product: { product_name: `Controle Financeiro Pro - ${planLabel}` },
              Subscription: { plan_frequency: planLabel },
            }
          : {
              action: 'payment.approved',
              type: 'payment',
              payer: { email: settings.email },
              description: `Controle Financeiro Pro - Plano ${planLabel}`,
              planId,
            };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (webhookToken?.trim()) {
        headers['x-webhook-token'] = webhookToken.trim();
      }
      const res = await fetch(`/api/webhooks/${platform}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        pushToast({
          title: 'Falha ao processar webhook',
          description: data.error || 'Verifique o token de segurança',
          tone: 'error',
        });
        return false;
      }
      await refreshSubscriptionAndWebhooks();
      pushToast({
        title: `Plano ${planLabel} ativado via ${platform.toUpperCase()}`,
        description: `Renovação atualizada para ${data.subscription?.renewalDate || ''}`,
        tone: 'success',
      });
      return true;
    } catch {
      pushToast({ title: 'Erro de comunicação com o servidor', tone: 'error' });
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        activeRoute,
        setActiveRoute,
        selectedMonth,
        setSelectedMonth,
        availableMonths,
        accounts,
        transactions,
        monthTransactions,
        goals,
        investments,
        cards,
        commitments,
        monthCommitments,
        budgets,
        settings,
        notifications,
        unreadNotificationsCount,
        toasts,
        dismissToast,
        pushToast,
        totalBalance,
        monthIncome,
        monthExpense,
        monthNet,
        totalInvestments,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        addGoal,
        contributeGoal,
        deleteGoal,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        addCard,
        payCardInvoice,
        deleteCard,
        addCommitment,
        updateCommitment,
        toggleCommitmentPaid,
        deleteCommitment,
        updateBudgetLimit,
        updateSettings,
        markNotificationRead,
        markAllNotificationsRead,
        resetAllData,
        importAllData,
        checkoutLinks,
        webhookEvents,
        hasWebhookSecret,
        refreshSubscriptionAndWebhooks,
        saveCheckoutLinks,
        triggerWebhookUpgrade,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used inside FinanceProvider');
  return ctx;
}
