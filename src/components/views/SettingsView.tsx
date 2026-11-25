import React, { useEffect, useRef, useState } from 'react';
import { BellRing, Copy, Download, Link2, RotateCcw, Save, Upload, User, Webhook } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    accounts,
    transactions,
    goals,
    investments,
    cards,
    commitments,
    budgets,
    resetAllData,
    importAllData,
    pushToast,
    checkoutLinks,
    saveCheckoutLinks,
    webhookEvents,
  } = useFinance();

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState(settings.notifyDaysBefore);
  const [notifyOverdue, setNotifyOverdue] = useState(settings.notifyOverdue);
  const [notifyDesktop, setNotifyDesktop] = useState(settings.notifyDesktop);

  const [mensalUrl, setMensalUrl] = useState(checkoutLinks.mensal);
  const [semestralUrl, setSemestralUrl] = useState(checkoutLinks.semestral);
  const [anualUrl, setAnualUrl] = useState(checkoutLinks.anual);

  useEffect(() => {
    setMensalUrl(checkoutLinks.mensal);
    setSemestralUrl(checkoutLinks.semestral);
    setAnualUrl(checkoutLinks.anual);
  }, [checkoutLinks]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim() || 'João Silva',
      email: email.trim() || 'joao@email.com',
      notifyDaysBefore,
      notifyOverdue,
      notifyDesktop,
    });
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings,
      accounts,
      transactions,
      goals,
      investments,
      cards,
      commitments,
      budgets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup-controle-financeiro-pro.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    pushToast({ title: 'Backup completo exportado', tone: 'success' });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importAllData(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleTestNotification = () => {
    pushToast({
      title: 'Alerta de Vencimento Ativo',
      description: `Notificações configuradas para avisar ${notifyDaysBefore} dia(s) antes do vencimento.`,
      tone: 'warning',
    });
  };

  return (
    <div className="max-w-4xl space-y-5">
      <form onSubmit={handleSaveProfile} className="space-y-5">
        {/* Profile Card */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
            <User className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Perfil do Titular</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pending Payment Notification Settings */}
        <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <BellRing className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">
                Sistema de Notificações de Pagamentos Pendentes
              </h2>
            </div>
            <button
              type="button"
              onClick={handleTestNotification}
              className="rounded-lg border border-slate-700 bg-[#070B14] px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 cursor-pointer"
            >
              Testar Alerta
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Antecedência do alerta de vencimento
              </label>
              <select
                value={notifyDaysBefore}
                onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value={1}>1 dia antes do vencimento</option>
                <option value={3}>3 dias antes do vencimento</option>
                <option value={5}>5 dias antes do vencimento</option>
                <option value={7}>7 dias antes do vencimento</option>
              </select>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyOverdue}
                  onChange={(e) => setNotifyOverdue(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-[#070B14] text-blue-600"
                />
                <span>Destacar contas vencidas no topo do Dashboard</span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyDesktop}
                  onChange={(e) => setNotifyDesktop(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-[#070B14] text-blue-600"
                />
                <span>Exibir resumo automático ao abrir o aplicativo</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </div>
      </form>

      {/* Vendas, Checkout e Webhooks */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-6 space-y-5">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Webhook className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white">
            Vendas, Links de Checkout e Webhooks (Hotmart · Kiwify · Mercado Pago)
          </h2>
        </div>

        {/* Webhook Endpoints */}
        <div className="space-y-2.5">
          <p className="text-xs text-slate-400">
            Cadastre uma das URLs abaixo na área de Webhooks da sua plataforma de pagamento:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {(['hotmart', 'kiwify', 'mercadopago'] as const).map((plat) => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const url = `${origin}/api/webhooks/${plat}`;
              return (
                <div
                  key={plat}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-semibold capitalize text-blue-400 w-24 shrink-0">
                      {plat === 'mercadopago' ? 'Mercado Pago' : plat}
                    </span>
                    <span className="truncate font-mono-nums text-slate-300">{url}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(url);
                      pushToast({ title: `URL ${plat} copiada`, tone: 'info' });
                    }}
                    className="flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 cursor-pointer"
                  >
                    <Copy className="h-3 w-3" />
                    <span>Copiar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Checkout Links Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveCheckoutLinks({
              mensal: mensalUrl,
              semestral: semestralUrl,
              anual: anualUrl,
            });
          }}
          className="space-y-3 pt-2 border-t border-slate-800"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Link2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Links de Checkout dos Planos (abertos quando o cliente clica em Assinar)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Checkout Mensal</label>
              <input
                type="url"
                placeholder="https://pay.kiwify.com.br/..."
                value={mensalUrl}
                onChange={(e) => setMensalUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Checkout Semestral</label>
              <input
                type="url"
                placeholder="https://pay.kiwify.com.br/..."
                value={semestralUrl}
                onChange={(e) => setSemestralUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">Checkout Anual</label>
              <input
                type="url"
                placeholder="https://pay.kiwify.com.br/..."
                value={anualUrl}
                onChange={(e) => setAnualUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-[#070B14] px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar Links de Checkout</span>
            </button>
          </div>
        </form>

        {/* Recent Webhook Logs */}
        {webhookEvents.length > 0 && (
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <h3 className="text-xs font-semibold text-slate-300">
              Últimos Eventos Recebidos ({webhookEvents.length})
            </h3>
            <div className="max-h-40 overflow-y-auto divide-y divide-slate-800/70 rounded-lg border border-slate-800 bg-[#070B14]">
              {webhookEvents.slice(0, 8).map((ev) => (
                <div
                  key={ev.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[11px]"
                >
                  <span className="font-semibold uppercase text-blue-400">{ev.platform}</span>
                  <span className="text-slate-200">{ev.email}</span>
                  <span className="capitalize text-slate-300">Plano {ev.planId}</span>
                  <span
                    className={`font-semibold ${
                      ev.status === 'aprovado' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {ev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Backup & Reset */}
      <div className="rounded-xl border border-slate-800/90 bg-[#0F172A] p-6 space-y-4">
        <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
          Backup e Gerenciamento de Dados
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#070B14] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-blue-400" />
            <span>Exportar Backup Completo (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-[#070B14] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-400" />
            <span>Restaurar Backup (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={resetAllData}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 cursor-pointer ml-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Dados Padrão</span>
          </button>
        </div>
      </div>
    </div>
  );
};
