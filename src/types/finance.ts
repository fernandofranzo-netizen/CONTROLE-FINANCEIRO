export type NavRoute =
  | 'dashboard'
  | 'transacoes'
  | 'contas'
  | 'metas'
  | 'investimentos'
  | 'cartoes'
  | 'calendario'
  | 'relatorios'
  | 'planejamento'
  | 'configuracoes';

export type TransactionType = 'receita' | 'despesa';

export type CategoryName =
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Saúde'
  | 'Lazer'
  | 'Salário'
  | 'Trabalho'
  | 'Investimentos'
  | 'Outros';

export interface Account {
  id: string;
  name: string;
  institution: string;
  type: 'corrente' | 'poupanca' | 'digital' | 'carteira';
  balance: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  category: CategoryName;
  accountId: string;
  accountName: string;
  type: TransactionType;
  amount: number;
  notes?: string;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  currentAmount: number;
  targetAmount: number;
  deadline: string; // YYYY-MM-DD
  color: string;
  icon: 'plane' | 'shield' | 'graduation' | 'home' | 'car' | 'target';
}

export interface Investment {
  id: string;
  name: string;
  type: 'Tesouro Direto' | 'CDB' | 'Fundos' | 'Ações' | 'FIIs';
  amount: number;
  profitabilityPercent: number;
  institution: string;
  color: string;
}

export interface CreditCardItem {
  id: string;
  name: string;
  brand: 'Mastercard' | 'Visa' | 'Elo';
  lastFour: string;
  limit: number;
  usedAmount: number;
  closingDay: number;
  dueDay: number;
  color: string;
  invoicePaid: boolean;
}

export type CommitmentStatus = 'pago' | 'pendente';

export interface Commitment {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  category: CategoryName;
  accountId: string;
  accountName: string;
  status: CommitmentStatus;
  recurring?: boolean;
  type: TransactionType;
}

export interface BudgetLimit {
  category: CategoryName;
  limit: number;
  color: string;
}

export type PlanId = 'gratuito' | 'mensal' | 'semestral' | 'anual';
export type WebhookPlatform = 'hotmart' | 'kiwify' | 'mercadopago';

export interface CheckoutLinks {
  mensal: string;
  semestral: string;
  anual: string;
}

export interface WebhookEventLog {
  id: string;
  platform: WebhookPlatform;
  event: string;
  email: string;
  planId: PlanId;
  status: 'aprovado' | 'cancelado' | 'ignorado';
  receivedAt: string;
}

export interface UserSettings {
  name: string;
  email: string;
  planId: PlanId;
  planName: string;
  planPlatform?: WebhookPlatform | 'manual';
  renewalDate: string;
  notifyDaysBefore: number;
  notifyOverdue: boolean;
  notifyDesktop: boolean;
  currency: 'BRL';
}

export interface NotificationAlert {
  id: string;
  commitmentId: string;
  title: string;
  dueDate: string;
  amount: number;
  accountName: string;
  category: CategoryName;
  urgency: 'vencido' | 'hoje' | 'proximo' | 'pendente';
  daysDiff: number;
  read: boolean;
}
