import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Webhook,
  X,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { PlanId, WebhookPlatform } from '../../types/finance';

interface PlanUpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlanTier {
  id: Exclude<PlanId, 'gratuito'>;
  name: string;
  audience: string;
  price: string;
  periodLabel: string;
  equivalent: string;
  savings?: string;
  recommended?: boolean;
  features: string[];
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: 'mensal',
    name: 'Mensal',
    audience: 'Para uso flexível',
    price: 'R$ 19,90',
    periodLabel: '/ mês',
    equivalent: 'Cobrança a cada 30 dias',
    features: [
      'Contas, cartões e metas ilimitados',
      'Exportação mensal em PDF, CSV e JSON',
      'Notificações de pagamentos pendentes',
      'Ativação automática via webhook',
    ],
  },
  {
    id: 'semestral',
    name: 'Semestral',
    audience: 'Para controle contínuo',
    price: 'R$ 89,90',
    periodLabel: '/ semestre',
    equivalent: 'Equivale a R$ 14,98/mês',
    savings: 'Economia de 25%',
    features: [
      'Todos os recursos do plano Mensal',
      'Renovação automática a cada 180 dias',
      'Relatórios comparativos de patrimônio',
      'Suporte prioritário por e-mail',
    ],
  },
  {
    id: 'anual',
    name: 'Anual',
    audience: 'Para máxima economia',
    price: 'R$ 149,90',
    periodLabel: '/ ano',
    equivalent: 'Equivale a R$ 12,49/mês',
    savings: 'Economia de 37%',
    recommended: true,
    features: [
      'Todos os recursos liberados por 365 dias',
      'Maior desconto por período contratado',
      'Backup completo e relatórios ilimitados',
      'Atualizações contínuas incluídas',
    ],
  },
];

function sanitizeCheckoutUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol === 'https:' || u.protocol === 'http:') {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export const PlanUpgradeModal: React.FC<PlanUpgradeModalProps> = ({ open, onClose }) => {
  const {
    settings,
    checkoutLinks,
    hasWebhookSecret,
    triggerWebhookUpgrade,
    pushToast,
    setActiveRoute,
  } = useFinance();

  const [selectedPlatform, setSelectedPlatform] = useState<WebhookPlatform>('hotmart');
  const [showWebhookPanel, setShowWebhookPanel] = useState(false);
  const [webhookToken, setWebhookToken] = useState('');
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  if (!open) return null;

  const currentPlanId = settings.planId || 'anual';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const webhookUrl = `${origin}/api/webhooks/${selectedPlatform}`;

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      pushToast({
        title: 'URL do webhook copiada',
        description: webhookUrl,
        tone: 'info',
      });
    } catch {
      pushToast({ title: 'Copie a URL manualmente', tone: 'info' });
    }
  };

  const handleSimulatePurchase = async (planId: Exclude<PlanId, 'gratuito'>) => {
    setLoadingPlan(planId);
    await triggerWebhookUpgrade(selectedPlatform, planId, webhookToken);
    setLoadingPlan(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs no-print">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-slate-800 bg-[#0D1526] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Gerenciar Assinatura e Upgrade de Plano
              </h2>
              <p className="text-xs text-slate-400">
                Plano atual: <strong className="text-slate-200">{settings.planName}</strong> ·
                Renovação em{' '}
                <span className="font-mono-nums text-slate-200">{settings.renewalDate}</span> ·
                E-mail vinculado: <span className="text-slate-300">{settings.email}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 bg-[#070B14]">
          {/* 3-Tier Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLAN_TIERS.map((tier) => {
              const isCurrent = currentPlanId === tier.id;
              const safeUrl = sanitizeCheckoutUrl(checkoutLinks[tier.id]);
              const isBusy = loadingPlan === tier.id;

              return (
                <div
                  key={tier.id}
                  className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                    tier.recommended
                      ? 'border-blue-500/60 bg-[#0F182D]'
                      : 'border-slate-800 bg-[#0F172A]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-400">{tier.audience}</span>
                      {tier.recommended ? (
                        <span className="text-[11px] font-semibold text-blue-400">
                          Mais vantajoso
                        </span>
                      ) : tier.savings ? (
                        <span className="text-[11px] font-semibold text-emerald-400">
                          {tier.savings}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-1.5 text-lg font-bold text-white">Plano {tier.name}</h3>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-white font-mono-nums">
                        {tier.price}
                      </span>
                      <span className="text-xs text-slate-400">{tier.periodLabel}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {tier.equivalent}
                      {tier.recommended && tier.savings ? ` · ${tier.savings}` : ''}
                    </p>

                    <ul className="mt-5 space-y-2.5 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 space-y-2">
                    {safeUrl ? (
                      <a
                        href={safeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                          isCurrent
                            ? 'border border-emerald-500/40 bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/25'
                            : tier.recommended
                              ? 'bg-blue-600 text-white hover:bg-blue-500'
                              : 'border border-slate-700 bg-[#172542] text-blue-300 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        <span>{isCurrent ? 'Plano Atual · Renovar' : `Assinar ${tier.name}`}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setActiveRoute('configuracoes');
                        }}
                        className="flex h-9 w-full items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                      >
                        Configurar Link de Checkout
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSimulatePurchase(tier.id)}
                      className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-[#0B1120] text-[11px] font-medium text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3 w-3 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>
                        {isBusy
                          ? 'Processando...'
                          : `Simular Webhook (${selectedPlatform.toUpperCase()})`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Webhook Endpoint & Platform Selector Box */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Webhook className="h-4 w-4 text-blue-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Integração Automática por Webhook (Hotmart · Kiwify · Mercado Pago)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Ao receber a confirmação de compra no webhook, o plano e a renovação são
                    atualizados automaticamente para o e-mail do cliente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowWebhookPanel((v) => !v)}
                className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
              >
                {showWebhookPanel ? 'Ocultar Detalhes' : 'Ver Endpoints e Testar'}
              </button>
            </div>

            {showWebhookPanel && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1">Plataforma:</span>
                  {(['hotmart', 'kiwify', 'mercadopago'] as WebhookPlatform[]).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setSelectedPlatform(plat)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        selectedPlatform === plat
                          ? 'bg-blue-600 text-white'
                          : 'border border-slate-800 bg-[#070B14] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {plat === 'mercadopago' ? 'Mercado Pago' : plat}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    aria-label="URL do Webhook"
                    className="flex-1 min-w-[240px] rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-slate-200 font-mono-nums"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 cursor-pointer"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar URL</span>
                  </button>
                </div>

                {hasWebhookSecret && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="password"
                      placeholder="Token secreto (WEBHOOK_SECRET) para testes"
                      value={webhookToken}
                      onChange={(e) => setWebhookToken(e.target.value)}
                      className="flex-1 min-w-[220px] rounded-lg border border-slate-800 bg-[#070B14] px-3 py-1.5 text-xs text-white placeholder-slate-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    {hasWebhookSecret
                      ? 'Protegido por WEBHOOK_SECRET no servidor'
                      : 'Configure WEBHOOK_SECRET nas variáveis de ambiente para validar tokens em produção'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      setActiveRoute('configuracoes');
                    }}
                    className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    Editar links de checkout →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
