/**
 * Reusable OBS Donation Alert Overlay Manager
 * Designed for OBS Browser Sources, Streamlabs, StreamElements, Twitch PubSub, and Custom Webhooks.
 */

export type AlertTheme = 'neon' | 'minimal' | 'glassmorphism';
export type AlertAnimation = 'fade' | 'slide' | 'bounce' | 'zoom';

export interface AlertData {
  id: string;
  username: string;
  amount: number;
  currency?: 'USD' | 'KHR' | string;
  formattedAmount?: string;
  message?: string;
  userAvatar?: string;
  alertSoundUrl?: string;
  theme?: AlertTheme;
  animation?: AlertAnimation;
  displayDurationMs?: number;
  customStyles?: {
    accentColor?: string;
    textColor?: string;
    fontSize?: string;
  };
}

export type AlertEventListener = (alert: AlertData) => void;

/**
 * AlertManager Class
 * Manages an asynchronous alert queue, sequential lifecycle (Entrance -> Display -> Exit),
 * sound playback, and TTS coordination.
 */
export class AlertManager {
  private queue: AlertData[] = [];
  private isProcessing = false;
  private currentAlert: AlertData | null = null;
  private listeners: {
    start: AlertEventListener[];
    end: AlertEventListener[];
  } = {
    start: [],
    end: [],
  };

  /**
   * Enqueue a new donation alert
   */
  public enqueue(alert: AlertData): void {
    this.queue.push(alert);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * Register event listeners for alert start / end
   */
  public on(event: 'start' | 'end', callback: AlertEventListener): () => void {
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  public getCurrentAlert(): AlertData | null {
    return this.currentAlert;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      this.currentAlert = null;
      return;
    }

    this.isProcessing = true;
    const nextAlert = this.queue.shift()!;
    this.currentAlert = nextAlert;

    // Trigger start listeners
    this.listeners.start.forEach(cb => cb(nextAlert));

    const duration = nextAlert.displayDurationMs || 6000;

    await new Promise(resolve => setTimeout(resolve, duration));

    // Trigger end listeners
    this.listeners.end.forEach(cb => cb(nextAlert));

    this.processQueue();
  }

  /**
   * Clear all pending alerts in queue
   */
  public clearQueue(): void {
    this.queue = [];
  }
}

/**
 * Standalone triggerAlert helper function
 * Can be called anywhere in JavaScript or WebSocket event listeners
 */
export function triggerAlert(
  data: Partial<AlertData>,
  manager?: AlertManager
): AlertData {
  const alert: AlertData = {
    id: data.id || `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username: data.username || 'មិត្តអ្នកគាំទ្រ',
    amount: typeof data.amount === 'number' ? data.amount : 1.00,
    currency: data.currency || 'USD',
    formattedAmount: data.formattedAmount || `$ ${(typeof data.amount === 'number' ? data.amount : 1).toFixed(2)}`,
    message: data.message || 'អរគុណច្រើនមេ',
    userAvatar: data.userAvatar,
    alertSoundUrl: data.alertSoundUrl,
    theme: data.theme || 'neon',
    animation: data.animation || 'slide',
    displayDurationMs: data.displayDurationMs || 6500,
    customStyles: data.customStyles,
  };

  if (manager) {
    manager.enqueue(alert);
  }

  return alert;
}
