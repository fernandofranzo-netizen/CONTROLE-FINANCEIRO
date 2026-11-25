import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CreditCard,
  Crown,
  Landmark,
  LayoutDashboard,
  PieChart,
  Settings,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NavRoute } from '../../types/finance';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenUpgradeModal: () => void;
}

const NAV_ITEMS: { id: NavRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
  { id: 'contas', label: 'Contas', icon: Landmark },
  { id: 'metas', label: 'Metas', icon: Target },
  { id: 'investimentos', label: 'Investimentos', icon: TrendingUp },
  { id: 'cartoes', label: 'Cartões', icon: CreditCard },
  { id: 'calendario', label: 'Calendário', icon: CalendarDays },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'planejamento', label: 'Planejamento', icon: PieChart },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen,
  onCloseMobile,
  onOpenUpgradeModal,
}) => {
  const { activeRoute, setActiveRoute, settings, monthCommitments } = useFinance();

  const pendingInMonthCount = monthCommitments.filter((c) => c.status === 'pendente').length;

  const initials = settings.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  const handleSelect = (id: NavRoute) => {
    setActiveRoute(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <aside className="flex h-full w-[240px] flex-col justify-between border-r border-slate-800/80 bg-[#0B1120] px-3 py-4 select-none">
      <div>
        {/* Brand Logo matching screenshots */}
        <div className="mb-6 flex items-center justify-between px-2">
          <button
            onClick={() => handleSelect('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-extrabold tracking-wide text-white">CONTROLE</div>
              <div className="text-[11px] font-bold tracking-wider text-blue-400">
                FINANCEIRO PRO
              </div>
            </div>
          </button>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Menu principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isActive
                    ? 'bg-[#172542] text-blue-400 border border-blue-500/25'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </span>
                {item.id === 'calendario' && pendingInMonthCount > 0 && (
                  <span className="text-[11px] font-mono-nums font-semibold text-amber-400">
                    {pendingInMonthCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Plan & Profile */}
      <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            onOpenUpgradeModal();
          }}
          className="group w-full rounded-xl border border-slate-800 bg-[#10182B] px-3 py-2.5 text-left transition-colors hover:border-blue-500/45 hover:bg-[#142038] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">Plano Atual</div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {settings.planName}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500">
            Próxima renovação: {settings.renewalDate}
          </div>
          <div className="mt-1 text-[10px] font-semibold text-blue-400 group-hover:text-blue-300">
            Fazer upgrade ou alterar plano
          </div>
        </button>

        <button
          onClick={() => handleSelect('configuracoes')}
          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20 border border-blue-500/30 text-xs font-bold text-blue-400">
            {initials || 'JS'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-100">{settings.name}</div>
            <div className="truncate text-[11px] text-slate-400">{settings.email}</div>
          </div>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden lg:block shrink-0 h-screen sticky top-0 no-print">
        {sidebarContent}
      </div>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden no-print">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
