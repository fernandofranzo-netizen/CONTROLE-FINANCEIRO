import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

type PlanId = 'gratuito' | 'mensal' | 'semestral' | 'anual';
type WebhookPlatform = 'hotmart' | 'kiwify' | 'mercadopago';

interface SubscriptionRecord {
  email: string;
  planId: PlanId;
  planName: string;
  status: 'ativo' | 'cancelado' | 'expirado';
  platform: WebhookPlatform | 'manual';
  renewalDate: string; // DD/MM/YYYY
  renewalIso: string; // YYYY-MM-DD
  updatedAt: string;
}

interface WebhookEventLog {
  id: string;
  platform: WebhookPlatform;
  event: string;
  email: string;
  planId: PlanId;
  status: 'aprovado' | 'cancelado' | 'ignorado';
  receivedAt: string;
}

interface CheckoutLinks {
  mensal: string;
  semestral: string;
  anual: string;
}

interface StoreState {
  subscriptions: Record<string, SubscriptionRecord>;
  events: WebhookEventLog[];
  checkoutLinks: CheckoutLinks;
}

const PLAN_LABELS: Record<PlanId, string> = {
  gratuito: 'Gratuito',
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
};

const PLAN_DAYS: Record<PlanId, number> = {
  gratuito: 0,
  mensal: 30,
  semestral: 180,
  anual: 365,
};

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_FILE = path.resolve(DATA_DIR, 'subscriptions.json');

function ensureStoreFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!STORE_FILE.startsWith(DATA_DIR + path.sep)) {
    throw new Error('Invalid store path');
  }
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreState = {
      subscriptions: {
        'joao@email.com': {
          email: 'joao@email.com',
          planId: 'anual',
          planName: 'Anual',
          status: 'ativo',
          platform: 'hotmart',
          renewalDate: '15/06/2026',
          renewalIso: '2026-06-15',
          updatedAt: new Date().toISOString(),
        },
      },
      events: [],
      checkoutLinks: {
        mensal: 'https://pay.kiwify.com.br/exemplo-plano-mensal',
        semestral: 'https://pay.kiwify.com.br/exemplo-plano-semestral',
        anual: 'https://pay.kiwify.com.br/exemplo-plano-anual',
      },
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
  }
}

function readStore(): StoreState {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    return JSON.parse(raw) as StoreState;
  } catch {
    return {
      subscriptions: {},
      events: [],
      checkoutLinks: {
        mensal: '',
        semestral: '',
        anual: '',
      },
    };
  }
}

function writeStore(state: StoreState): void {
  ensureStoreFile();
  fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function isValidHttpUrl(value: string): boolean {
  if (!value) return true; // allow empty string to clear link
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function detectPlanFromText(text: string, amount?: number): PlanId {
  const lower = text.toLowerCase();
  if (lower.includes('anual') || lower.includes('annual') || lower.includes('year')) {
    return 'anual';
  }
  if (lower.includes('semestral') || lower.includes('semiannual') || lower.includes('6m')) {
    return 'semestral';
  }
  if (lower.includes('mensal') || lower.includes('monthly')) {
    return 'mensal';
  }
  if (typeof amount === 'number') {
    if (amount >= 120) return 'anual';
    if (amount >= 60) return 'semestral';
    if (amount > 0) return 'mensal';
  }
  return 'anual';
}

function calculateRenewal(planId: PlanId): { renewalDate: string; renewalIso: string } {
  const days = PLAN_DAYS[planId] || 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return {
    renewalDate: `${dd}/${mm}/${yyyy}`,
    renewalIso: `${yyyy}-${mm}-${dd}`,
  };
}

function normalizeEmail(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseWebhookPayload(
  platform: WebhookPlatform,
  body: Record<string, unknown>
): { email: string; event: string; approved: boolean; canceled: boolean; planId: PlanId } {
  if (platform === 'hotmart') {
    const data = (body.data as Record<string, unknown>) || {};
    const buyer = (data.buyer as Record<string, unknown>) || {};
    const product = (data.product as Record<string, unknown>) || {};
    const subscription = (data.subscription as Record<string, unknown>) || {};
    const plan = (subscription.plan as Record<string, unknown>) || {};
    const purchase = (data.purchase as Record<string, unknown>) || {};
    const price = (purchase.price as Record<string, unknown>) || {};

    const event = String(body.event || body.status || 'PURCHASE_APPROVED');
    const email = normalizeEmail(buyer.email || body.email);
    const planHint = `${String(plan.name || '')} ${String(product.name || '')} ${String(
      body.planId || ''
    )}`;
    const amount = typeof price.value === 'number' ? price.value : undefined;
    const planId = detectPlanFromText(planHint, amount);

    const upperEvent = event.toUpperCase();
    const approved =
      upperEvent.includes('APPROVED') ||
      upperEvent.includes('COMPLETE') ||
      upperEvent === 'PAID';
    const canceled =
      upperEvent.includes('CANCEL') ||
      upperEvent.includes('REFUND') ||
      upperEvent.includes('CHARGEBACK') ||
      upperEvent.includes('EXPIRED');

    return { email, event, approved, canceled, planId };
  }

  if (platform === 'kiwify') {
    const customer = (body.Customer as Record<string, unknown>) || {};
    const product = (body.Product as Record<string, unknown>) || {};
    const subscription = (body.Subscription as Record<string, unknown>) || {};
    const commissions = (body.Commissions as Record<string, unknown>) || {};

    const event = String(body.order_status || body.webhook_event_type || 'paid');
    const email = normalizeEmail(customer.email || body.email);
    const planHint = `${String(subscription.plan_frequency || '')} ${String(
      product.product_name || ''
    )} ${String(body.planId || '')}`;
    const amount =
      typeof commissions.charge_amount === 'number'
        ? commissions.charge_amount / 100
        : undefined;
    const planId = detectPlanFromText(planHint, amount);

    const lowerEvent = event.toLowerCase();
    const approved =
      lowerEvent === 'paid' ||
      lowerEvent === 'approved' ||
      lowerEvent === 'order_approved' ||
      lowerEvent === 'subscription_renewed';
    const canceled =
      lowerEvent === 'refunded' ||
      lowerEvent === 'chargedback' ||
      lowerEvent === 'subscription_canceled';

    return { email, event, approved, canceled, planId };
  }

  // Mercado Pago
  const data = (body.data as Record<string, unknown>) || {};
  const payer = (body.payer as Record<string, unknown>) || {};
  const event = String(body.action || body.status || body.type || 'payment.approved');
  const email = normalizeEmail(payer.email || body.email);
  const planHint = `${String(body.description || '')} ${String(body.planId || '')} ${String(
    data.id || ''
  )}`;
  const amount =
    typeof body.transaction_amount === 'number' ? body.transaction_amount : undefined;
  const planId = detectPlanFromText(planHint, amount);

  const lowerEvent = event.toLowerCase();
  const approved =
    lowerEvent.includes('approved') ||
    lowerEvent.includes('paid') ||
    lowerEvent === 'payment.created' ||
    lowerEvent === 'payment.updated';
  const canceled =
    lowerEvent.includes('cancel') ||
    lowerEvent.includes('refund') ||
    lowerEvent.includes('rejected');

  return { email, event, approved, canceled, planId };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  // Health / Webhook Config
  app.get('/api/webhooks/config', (_req: Request, res: Response) => {
    const store = readStore();
    res.json({
      hasSecretConfigured: Boolean(process.env.WEBHOOK_SECRET?.trim()),
      checkoutLinks: store.checkoutLinks,
      events: store.events.slice(0, 20),
    });
  });

  // Update checkout links (validates HTTP/HTTPS URLs)
  app.post('/api/webhooks/checkout-links', (req: Request, res: Response) => {
    const body = (req.body || {}) as Partial<CheckoutLinks>;
    const mensal = typeof body.mensal === 'string' ? body.mensal.trim() : '';
    const semestral = typeof body.semestral === 'string' ? body.semestral.trim() : '';
    const anual = typeof body.anual === 'string' ? body.anual.trim() : '';

    if (!isValidHttpUrl(mensal) || !isValidHttpUrl(semestral) || !isValidHttpUrl(anual)) {
      res.status(400).json({ error: 'URLs de checkout devem começar com https:// ou http://' });
      return;
    }

    const store = readStore();
    store.checkoutLinks = { mensal, semestral, anual };
    writeStore(store);
    res.json({ ok: true, checkoutLinks: store.checkoutLinks });
  });

  // Fetch subscription status by buyer email
  app.get('/api/subscription', (req: Request, res: Response) => {
    const email = normalizeEmail(req.query.email);
    const store = readStore();
    const record = email ? store.subscriptions[email] || null : null;
    res.json({
      subscription: record,
      checkoutLinks: store.checkoutLinks,
    });
  });

  // Real Webhook Endpoint: /api/webhooks/hotmart | /api/webhooks/kiwify | /api/webhooks/mercadopago
  app.post('/api/webhooks/:platform', (req: Request, res: Response) => {
    const rawPlatform = String(req.params.platform || '').toLowerCase();
    if (
      rawPlatform !== 'hotmart' &&
      rawPlatform !== 'kiwify' &&
      rawPlatform !== 'mercadopago'
    ) {
      res.status(404).json({ error: 'Plataforma de webhook não suportada.' });
      return;
    }
    const platform = rawPlatform as WebhookPlatform;

    const configuredSecret = process.env.WEBHOOK_SECRET?.trim() || '';

    if (configuredSecret) {
      const providedToken = String(
        req.headers['x-hotmart-hottok'] ||
          req.headers['x-kiwify-signature'] ||
          req.headers['x-webhook-token'] ||
          req.headers['x-signature'] ||
          ''
      ).trim();

      if (!providedToken || !safeEqual(providedToken, configuredSecret)) {
        res.status(401).json({ error: 'Assinatura/Token de webhook inválido.' });
        return;
      }
    }

    const body = (req.body || {}) as Record<string, unknown>;
    const parsed = parseWebhookPayload(platform, body);

    if (!isValidEmail(parsed.email)) {
      res.status(400).json({ error: 'E-mail do comprador inválido ou ausente no payload.' });
      return;
    }

    const store = readStore();
    let logStatus: WebhookEventLog['status'] = 'ignorado';

    if (parsed.approved) {
      const { renewalDate, renewalIso } = calculateRenewal(parsed.planId);
      const record: SubscriptionRecord = {
        email: parsed.email,
        planId: parsed.planId,
        planName: PLAN_LABELS[parsed.planId],
        status: 'ativo',
        platform,
        renewalDate,
        renewalIso,
        updatedAt: new Date().toISOString(),
      };
      store.subscriptions[parsed.email] = record;
      logStatus = 'aprovado';
    } else if (parsed.canceled) {
      const existing = store.subscriptions[parsed.email];
      if (existing) {
        existing.status = 'cancelado';
        existing.updatedAt = new Date().toISOString();
      }
      logStatus = 'cancelado';
    }

    const logEntry: WebhookEventLog = {
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      platform,
      event: parsed.event,
      email: parsed.email,
      planId: parsed.planId,
      status: logStatus,
      receivedAt: new Date().toISOString(),
    };

    store.events = [logEntry, ...store.events].slice(0, 50);
    writeStore(store);

    res.status(200).json({
      received: true,
      platform,
      status: logStatus,
      subscription: store.subscriptions[parsed.email] || null,
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Controle Financeiro Pro server running on http://0.0.0.0:${port}`);
  });
}

startServer();
