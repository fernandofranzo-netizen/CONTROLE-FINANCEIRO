import React, { useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { CommitmentModal } from './components/modals/CommitmentModal';
import { PlanUpgradeModal } from './components/modals/PlanUpgradeModal';
import { ReportExportModal } from './components/modals/ReportExportModal';
import { TransactionModal } from './components/modals/TransactionModal';
import { AccountsView } from './components/views/AccountsView';
import { CalendarView } from './components/views/CalendarView';
import { CardsView } from './components/views/CardsView';
import { DashboardView } from './components/views/DashboardView';
import { GoalsView } from './components/views/GoalsView';
import { InvestmentsView } from './components/views/InvestmentsView';
import { PlanningView } from './components/views/PlanningView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { TransactionsView } from './components/views/TransactionsView';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Commitment, Transaction } from './types/finance';

const AppShell: React.FC = () => {
  const { activeRoute, toasts, dismissToast } = useFinance();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [commitmentDefaultDate, setCommitmentDefaultDate] = useState<string | undefined>(undefined);

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const handleNewTransaction = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalOpen(true);
  };

  const handleNewCommitment = (defaultDate?: string) => {
    setEditingCommitment(null);
    setCommitmentDefaultDate(defaultDate);
    setCommitmentModalOpen(true);
  };

  const handleEditCommitment = (item: Commitment) => {
    setEditingCommitment(item);
    setCommitmentDefaultDate(undefined);
    setCommitmentModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#070B14] text-slate-100">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenUpgradeModal={() => setUpgradeModalOpen(true)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <TopHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenNewTransaction={handleNewTransaction}
          onOpenExportReport={() => setExportModalOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto no-print">
          {activeRoute === 'dashboard' && <DashboardView />}
          {activeRoute === 'transacoes' && (
            <TransactionsView
              onNewTransaction={handleNewTransaction}
              onEditTransaction={handleEditTransaction}
            />
          )}
          {activeRoute === 'contas' && <AccountsView />}
          {activeRoute === 'metas' && <GoalsView />}
          {activeRoute === 'investimentos' && <InvestmentsView />}
          {activeRoute === 'cartoes' && <CardsView />}
          {activeRoute === 'calendario' && (
            <CalendarView
              onNewCommitment={handleNewCommitment}
              onEditCommitment={handleEditCommitment}
            />
          )}
          {activeRoute === 'relatorios' && (
            <ReportsView onOpenExportModal={() => setExportModalOpen(true)} />
          )}
          {activeRoute === 'planejamento' && <PlanningView />}
          {activeRoute === 'configuracoes' && <SettingsView />}
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        open={txModalOpen}
        editing={editingTx}
        onClose={() => setTxModalOpen(false)}
      />
      <CommitmentModal
        open={commitmentModalOpen}
        editing={editingCommitment}
        defaultDate={commitmentDefaultDate}
        onClose={() => setCommitmentModalOpen(false)}
      />
      <ReportExportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
      <PlanUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />

      {/* Toast Stack */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] no-print">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-700/80 bg-[#0D1526]/95 p-3.5 shadow-xl backdrop-blur-md"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {t.tone === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : t.tone === 'warning' || t.tone === 'error' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{t.title}</p>
                  {t.description && (
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{t.description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-500 hover:text-slate-200 cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppShell />
    </FinanceProvider>
  );
}
