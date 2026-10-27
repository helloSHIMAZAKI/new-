import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseAbaMessage, ParsedDonation, DEFAULT_REMARK } from './src/utils/abaParser.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration store
export type AlertTheme = 'neon' | 'minimal' | 'glassmorphism';
export type AlertAnimation = 'slide' | 'fade' | 'bounce' | 'zoom';

interface AppConfig {
  botToken: string;
  chatId: string;
  apiId: string;
  apiHash: string;
  thankPrefix: string;
  verb: string;
  alertDuration: number; // in seconds
  soundEnabled: boolean;
  soundType: 'preset' | 'custom';
  soundPreset: 'chime' | 'cash_register' | 'coin' | 'level_up' | 'ping' | 'marimba';
  customSoundUrl: string;
  soundVolume: number;
  ttsEnabled: boolean;
  ttsVolume: number;
  glowColor: string;
  autoRefreshOnComplete: boolean;
  theme: AlertTheme;
  animation: AlertAnimation;
}

const config: AppConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '-5214008501', // Pre-fill with detected group from user's screenshot
  apiId: process.env.TELEGRAM_API_ID || '36414234',
  apiHash: process.env.TELEGRAM_API_HASH || 'ce2196bb071d9fa4efaf16b75e3c318f',
  thankPrefix: 'អរគុណ មេ',
  verb: 'បានឧបត្ថម្ភ',
  alertDuration: 8,
  soundEnabled: true,
  soundType: 'preset',
  soundPreset: 'chime',
  customSoundUrl: '',
  soundVolume: 0.8,
  ttsEnabled: true,
  ttsVolume: 1.0,
  glowColor: '#00d68f',
  autoRefreshOnComplete: true,
  theme: 'neon',
  animation: 'slide',
};

// Donation history store (in memory)
const donationHistory: ParsedDonation[] = [
  {
    id: 'demo_1',
    donorName: 'zaion',
    amount: 1.00,
    formattedAmount: '$ 1.00',
    currency: 'USD',
    remark: DEFAULT_REMARK,
    trxId: '179308331516889',
    apv: '718415',
    dateStr: 'Oct 27, 01:41 PM',
    rawText: '$1.00 paid by zaion (*123) on Oct 27, 01:41 PM via ABA PAY.',
    timestamp: Date.now() - 3600000,
    ttsScript: `អរគុណ មេ zaion បានឧបត្ថម្ភ 1 ដុល្លារ ${DEFAULT_REMARK}`,
  },
  {
    id: 'demo_2',
    donorName: 'HUN CHHING CHHING',
    amount: 0.50,
    formattedAmount: '$ 0.50',
    currency: 'USD',
    remark: DEFAULT_REMARK,
    trxId: '179308280412746',
    apv: '809453',
    dateStr: 'Oct 27, 01:33 PM',
    rawText: '$0.50 paid by HUN CHHING CHHING (*280) on Oct 27, 01:33 PM via ABA PAY at HUN CHHING CHHING. Trx. ID: 179308280412746, APV: 809453.',
    timestamp: Date.now() - 7200000,
    ttsScript: `អរគុណ មេ HUN CHHING CHHING បានឧបត្ថម្ភ 0.5 ដុល្លារ ${DEFAULT_REMARK}`,
  }
];

// Live Telegram Activity Buffer (helps streamer diagnose why messages aren't arriving)
export interface TelegramActivityItem {
  id: string;
  timestamp: number;
  chatId: string;
  chatTitle: string;
  sender: string;
  text: string;
  isAbaDonation: boolean;
  status: string;
}
const telegramActivityLogs: TelegramActivityItem[] = [];

function cleanChatId(raw: string | number | undefined): string {
  if (!raw) return '';
  return String(raw).trim().replace(/^-100/, '').replace(/^-/, '');
}

// Server-Sent Events subscribers for real-time OBS overlays
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastDonation(donation: ParsedDonation) {
  donationHistory.unshift(donation);
  if (donationHistory.length > 200) {
    donationHistory.pop();
  }

  const payload = `data: ${JSON.stringify({
    ...donation,
    theme: config.theme,
    animation: config.animation,
    soundConfig: {
      soundEnabled: config.soundEnabled,
      soundType: config.soundType,
      soundPreset: config.soundPreset,
      customSoundUrl: config.customSoundUrl,
      soundVolume: config.soundVolume,
    },
  })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// Telegram Polling Engine
let isPolling = false;
let pollAbortController: AbortController | null = null;
let lastUpdateId = 0;
let telegramListenerStatus = {
  running: false,
  lastPollTime: 0,
  lastError: '',
  messagesReceived: 0,
  donationsDetected: 0,
  webhookCleared: false,
};

async function startTelegramPolling() {
  if (isPolling) return;
  const token = config.botToken.trim();
  if (!token) {
    telegramListenerStatus.lastError = 'No Telegram Bot Token provided.';
    return;
  }

  isPolling = true;
  pollAbortController = new AbortController();
  telegramListenerStatus.running = true;
  telegramListenerStatus.lastError = '';

  console.log('[Telegram Poller] Starting polling service for token prefix:', token.slice(0, 6) + '...');

  // Automatically delete any conflicting webhook so getUpdates works reliably!
  try {
    const clearUrl = `https://api.telegram.org/bot${encodeURIComponent(token)}/deleteWebhook?drop_pending_updates=false`;
    const clearRes = await fetch(clearUrl);
    const clearData = await clearRes.json() as { ok: boolean; description?: string };
    if (clearData.ok) {
      telegramListenerStatus.webhookCleared = true;
      console.log('[Telegram Poller] Verified and cleared conflicting webhooks.');
    } else {
      console.warn('[Telegram Poller] Webhook clear response:', clearData.description);
    }
  } catch (err) {
    console.warn('[Telegram Poller] Webhook clear check error:', err);
  }

  (async () => {
    while (isPolling) {
      try {
        telegramListenerStatus.lastPollTime = Date.now();
        const url = `https://api.telegram.org/bot${encodeURIComponent(config.botToken.trim())}/getUpdates?offset=${lastUpdateId + 1}&timeout=15`;
        const res = await fetch(url, { signal: pollAbortController?.signal });

        if (!res.ok) {
          const errText = await res.text();
          telegramListenerStatus.lastError = `Telegram API Error (${res.status}): ${errText}`;
          await new Promise(r => setTimeout(r, 4000));
          continue;
        }

        const data = await res.json() as {
          ok: boolean;
          result?: Array<{
            update_id: number;
            message?: { chat?: { id: number | string; title?: string }; from?: { first_name?: string }; text?: string; caption?: string };
            channel_post?: { chat?: { id: number | string; title?: string }; from?: { first_name?: string }; text?: string; caption?: string };
            edited_message?: { chat?: { id: number | string; title?: string }; from?: { first_name?: string }; text?: string; caption?: string };
            edited_channel_post?: { chat?: { id: number | string; title?: string }; from?: { first_name?: string }; text?: string; caption?: string };
          }>;
        };

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            telegramListenerStatus.messagesReceived++;

            const msg = update.message || update.channel_post || update.edited_message || update.edited_channel_post;
            if (!msg) continue;

            const text = msg.text || msg.caption || '';
            const incomingChatRaw = String(msg.chat?.id || '');
            const targetChatClean = cleanChatId(config.chatId);
            const incomingChatClean = cleanChatId(incomingChatRaw);

            // Permissive chat matching: matches if no chat ID specified OR normalized ID matches
            const chatMatch = !targetChatClean || 
              incomingChatClean === targetChatClean || 
              incomingChatClean.includes(targetChatClean) ||
              targetChatClean.includes(incomingChatClean);

            let isDonation = false;
            let donationObj: ParsedDonation | null = null;

            if (text) {
              donationObj = parseAbaMessage(text, {
                thankPrefix: config.thankPrefix,
                verb: config.verb,
              });

              if (donationObj && chatMatch) {
                isDonation = true;
                telegramListenerStatus.donationsDetected++;
                console.log('[Telegram Poller] ABA Donation detected:', donationObj.donorName, donationObj.formattedAmount);
                broadcastDonation(donationObj);
              }
            }

            // Record to live activity logs
            telegramActivityLogs.unshift({
              id: `up_${update.update_id}`,
              timestamp: Date.now(),
              chatId: incomingChatRaw,
              chatTitle: msg.chat?.title || 'Direct Chat',
              sender: msg.from?.first_name || 'Bot',
              text: text.slice(0, 160) || '[No text]',
              isAbaDonation: isDonation,
              status: isDonation 
                ? '✓ Processed & Triggered OBS Alert' 
                : (!chatMatch ? `Ignored (Chat ${incomingChatRaw} ≠ ${config.chatId})` : 'Ignored (Not an ABA payment format)'),
            });
            if (telegramActivityLogs.length > 50) telegramActivityLogs.pop();
          }
        }
      } catch (err: unknown) {
        if (!isPolling) break;
        telegramListenerStatus.lastError = err instanceof Error ? err.message : String(err);
        await new Promise(r => setTimeout(r, 4000));
      }
    }
    telegramListenerStatus.running = false;
  })();
}

function stopTelegramPolling() {
  isPolling = false;
  if (pollAbortController) {
    pollAbortController.abort();
    pollAbortController = null;
  }
  telegramListenerStatus.running = false;
}

// REST APIs
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    config,
    listenerStatus: telegramListenerStatus,
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const prevToken = config.botToken;
  Object.assign(config, req.body);

  if (config.botToken !== prevToken) {
    stopTelegramPolling();
    if (config.botToken.trim()) {
      startTelegramPolling();
    }
  }

  res.json({ success: true, config, listenerStatus: telegramListenerStatus });
});

app.get('/api/telegram/logs', (_req: Request, res: Response) => {
  res.json({
    status: telegramListenerStatus,
    logs: telegramActivityLogs,
  });
});

app.post('/api/telegram/clear-webhook', async (_req: Request, res: Response) => {
  if (!config.botToken.trim()) {
    res.status(400).json({ error: 'No Bot Token configured' });
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${encodeURIComponent(config.botToken.trim())}/deleteWebhook?drop_pending_updates=false`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post('/api/telegram/toggle', (req: Request, res: Response) => {
  const { action } = req.body;
  if (action === 'start') {
    startTelegramPolling();
  } else {
    stopTelegramPolling();
  }
  res.json({ success: true, listenerStatus: telegramListenerStatus });
});

app.get('/api/donations', (_req: Request, res: Response) => {
  res.json(donationHistory);
});

// SSE endpoint for OBS browser source
app.get('/api/alerts/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  // Send initial handshake with current theme & sound config
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    clientId, 
    config: {
      theme: config.theme,
      animation: config.animation,
      glowColor: config.glowColor,
      autoRefreshOnComplete: config.autoRefreshOnComplete,
      soundConfig: {
        soundEnabled: config.soundEnabled,
        soundType: config.soundType,
        soundPreset: config.soundPreset,
        customSoundUrl: config.customSoundUrl,
        soundVolume: config.soundVolume,
      }
    } 
  })}\n\n`);

  // Heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Test trigger alert
app.post('/api/test-alert', (req: Request, res: Response) => {
  const { 
    donorName = 'zaion', 
    amount = 1.00, 
    currency = 'USD', 
    remark = DEFAULT_REMARK,
    theme = config.theme,
    animation = config.animation,
  } = req.body;

  const numAmount = parseFloat(String(amount)) || 1.00;
  const curr = currency === 'KHR' ? 'KHR' : 'USD';
  const formattedAmount = curr === 'KHR' ? `${numAmount.toLocaleString()} ៛` : `$ ${numAmount.toFixed(2)}`;
  const finalRemark = (remark && remark.trim().length > 0) ? remark.trim() : DEFAULT_REMARK;

  const testDonation: ParsedDonation & { theme?: AlertTheme; animation?: AlertAnimation } = {
    id: `test_${Date.now()}`,
    donorName: donorName || 'zaion',
    amount: numAmount,
    formattedAmount,
    currency: curr,
    remark: finalRemark,
    trxId: `TEST${Math.floor(100000 + Math.random() * 900000)}`,
    apv: `${Math.floor(100000 + Math.random() * 900000)}`,
    dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rawText: `Manual test: ${formattedAmount} by ${donorName}`,
    timestamp: Date.now(),
    ttsScript: `${config.thankPrefix} ${donorName} ${config.verb} ${curr === 'KHR' ? `${numAmount.toLocaleString()} រៀល` : `${numAmount} ដុល្លារ`} ${finalRemark}`.trim(),
    theme,
    animation,
  };

  broadcastDonation(testDonation);
  res.json({ success: true, donation: testDonation });
});

// Parse raw telegram message
app.post('/api/parse-text', (req: Request, res: Response) => {
  const { text, triggerAlert = false } = req.body;
  const parsed = parseAbaMessage(text, {
    thankPrefix: config.thankPrefix,
    verb: config.verb,
  });

  if (parsed && triggerAlert) {
    broadcastDonation(parsed);
  }

  res.json({ success: true, parsed });
});

// Telegram Webhook endpoint (if user sets webhook instead of long polling)
app.post('/api/webhook/telegram', (req: Request, res: Response) => {
  const update = req.body;
  const msg = update?.message || update?.channel_post;
  if (msg) {
    const text = msg.text || msg.caption || '';
    const parsed = parseAbaMessage(text, {
      thankPrefix: config.thankPrefix,
      verb: config.verb,
    });
    if (parsed) {
      broadcastDonation(parsed);
    }
  }
  res.json({ ok: true });
});

// Direct Khmer TTS Proxy
app.get('/api/tts', async (req: Request, res: Response) => {
  const text = (req.query.text as string) || '';
  const lang = (req.query.lang as string) || 'km';

  if (!text.trim()) {
    res.status(400).send('Text query required');
    return;
  }

  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(text)}`;
    const ttsRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!ttsRes.ok) {
      res.status(ttsRes.status).send('TTS upstream error');
      return;
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    const arrayBuffer = await ttsRes.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).send('TTS error');
  }
});

// Start Express and integrate Vite
async function startServer() {
  if (config.botToken.trim()) {
    startTelegramPolling();
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] ABA OBS Donation Alert running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
});
