import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Tv, 
  Settings, 
  Volume2, 
  Radio, 
  History, 
  BookOpen, 
  Sparkles, 
  Send,
  AlertCircle,
  RefreshCw,
  Sliders,
  DollarSign,
  MessageSquare,
  Music,
  Bell,
  Coins,
  Trophy,
  Link2,
  VolumeX,
  AudioWaveform,
  Layers,
  Sparkle,
  Code2,
  Terminal,
  ShieldAlert,
  ArrowRight,
  Zap
} from 'lucide-react';
import { ObsOverlay } from './ObsOverlay';
import { SetupGuide } from './SetupGuide';
import { ParsedDonation, DEFAULT_REMARK } from '../utils/abaParser';
import { speakKhmerTts } from '../utils/ttsHelper';
import { 
  BUILTIN_SOUND_PRESETS, 
  SoundPresetId, 
  playPresetSound, 
  playAlertSound 
} from '../utils/soundHelper';
import { AlertTheme, AlertAnimation } from '../utils/alertManager';

interface TelegramLogItem {
  id: string;
  timestamp: number;
  chatId: string;
  chatTitle: string;
  sender: string;
  text: string;
  isAbaDonation: boolean;
  status: string;
}

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'guide' | 'telegram' | 'history' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  
  // App Config
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('-5214008501');
  const [thankPrefix, setThankPrefix] = useState('អរគុណ មេ');
  const [verb, setVerb] = useState('បានឧបត្ថម្ភ');
  const [glowColor, setGlowColor] = useState('#00d68f');
  const [fontSize, setFontSize] = useState(1);
  const [theme, setTheme] = useState<AlertTheme>('neon');
  const [animation, setAnimation] = useState<AlertAnimation>('slide');
  
  // Alert Sound Config
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundType, setSoundType] = useState<'preset' | 'custom'>('preset');
  const [soundPreset, setSoundPreset] = useState<SoundPresetId>('chime');
  const [customSoundUrl, setCustomSoundUrl] = useState('');
  const [soundVolume, setSoundVolume] = useState(0.8);
  const [soundStatusMsg, setSoundStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  // Khmer TTS Config
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoRefreshOnComplete, setAutoRefreshOnComplete] = useState(true);
  
  // Status & Data
  const [listenerRunning, setListenerRunning] = useState(false);
  const [listenerError, setListenerError] = useState('');
  const [donations, setDonations] = useState<ParsedDonation[]>([]);
  const [telegramLogs, setTelegramLogs] = useState<TelegramLogItem[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [customTestModal, setCustomTestModal] = useState(false);
  const [customName, setCustomName] = useState('zaion');
  const [customAmount, setCustomAmount] = useState('1.00');
  const [customCurrency, setCustomCurrency] = useState<'USD' | 'KHR'>('USD');
  const [customRemark, setCustomRemark] = useState('នេះលុយ');
  const [testAnimation, setTestAnimation] = useState<AlertAnimation>('slide');
  const [testTriggerSuccess, setTestTriggerSuccess] = useState<{
    donorName: string;
    formattedAmount: string;
    ttsScript: string;
    time: string;
  } | null>(null);
  const [clearingWebhook, setClearingWebhook] = useState(false);
  const [webhookMsg, setWebhookMsg] = useState('');
  
  // Raw message test input
  const [rawInput, setRawInput] = useState('$1.00 paid by zaion (*123) on Oct 27, 01:41 PM via ABA PAY.');
  const [parseResult, setParseResult] = useState<ParsedDonation | null>(null);

  // Fetch initial config and donation history
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setBotToken(data.config.botToken || '');
          setChatId(data.config.chatId || '-5214008501');
          setThankPrefix(data.config.thankPrefix || 'អរគុណ មេ');
          setVerb(data.config.verb || 'បានឧបត្ថម្ភ');
          setGlowColor(data.config.glowColor || '#00d68f');
          setSoundEnabled(data.config.soundEnabled !== false);
          setSoundType(data.config.soundType || 'preset');
          setSoundPreset(data.config.soundPreset || 'chime');
          setCustomSoundUrl(data.config.customSoundUrl || '');
          if (typeof data.config.soundVolume === 'number') {
            setSoundVolume(data.config.soundVolume);
          }
          setTtsEnabled(data.config.ttsEnabled !== false);
          setAutoRefreshOnComplete(data.config.autoRefreshOnComplete !== false);
          if (data.config.theme) setTheme(data.config.theme);
          if (data.config.animation) setAnimation(data.config.animation);
        }
        if (data.listenerStatus) {
          setListenerRunning(data.listenerStatus.running);
          setListenerError(data.listenerStatus.lastError || '');
        }
      })
      .catch(err => console.warn('Config fetch error:', err));

    fetch('/api/donations')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDonations(data);
      })
      .catch(err => console.warn('Donations fetch error:', err));

    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/telegram/logs');
      const data = await res.json();
      if (Array.isArray(data.logs)) {
        setTelegramLogs(data.logs);
      }
      if (data.status) {
        setListenerRunning(data.status.running);
        setListenerError(data.status.lastError || '');
      }
    } catch {
      // ignore
    }
  };

  const overlayUrl = `${window.location.origin}/?view=overlay`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(overlayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveConfig = async (overrides?: Partial<{
    botToken: string;
    chatId: string;
    thankPrefix: string;
    verb: string;
    glowColor: string;
    soundEnabled: boolean;
    soundType: 'preset' | 'custom';
    soundPreset: SoundPresetId;
    customSoundUrl: string;
    soundVolume: number;
    ttsEnabled: boolean;
    autoRefreshOnComplete: boolean;
    theme: AlertTheme;
    animation: AlertAnimation;
  }>) => {
    const payload = {
      botToken,
      chatId,
      thankPrefix,
      verb,
      glowColor,
      soundEnabled,
      soundType,
      soundPreset,
      customSoundUrl,
      soundVolume,
      ttsEnabled,
      autoRefreshOnComplete,
      theme,
      animation,
      ...overrides,
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.listenerStatus) {
        setListenerRunning(data.listenerStatus.running);
        setListenerError(data.listenerStatus.lastError || '');
      }
    } catch (err) {
      console.error('Save config error:', err);
    }
  };

  const handleToggleListener = async () => {
    const nextAction = listenerRunning ? 'stop' : 'start';
    try {
      const res = await fetch('/api/telegram/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: nextAction }),
      });
      const data = await res.json();
      if (data.listenerStatus) {
        setListenerRunning(data.listenerStatus.running);
        setListenerError(data.listenerStatus.lastError || '');
      }
      fetchLogs();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleClearWebhook = async () => {
    setClearingWebhook(true);
    setWebhookMsg('');
    try {
      const res = await fetch('/api/telegram/clear-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setWebhookMsg('✓ Successfully removed conflicting webhooks! The bot is ready to poll messages.');
      } else {
        setWebhookMsg(`Notice: ${data.description || 'Unknown result'}`);
      }
      fetchLogs();
    } catch (err) {
      setWebhookMsg(`Failed: ${err}`);
    } finally {
      setClearingWebhook(false);
    }
  };

  const triggerTestAlert = async (
    name: string, 
    amount: number, 
    remark?: string, 
    currency: 'USD' | 'KHR' = 'USD',
    customTheme?: AlertTheme,
    customAnim?: AlertAnimation
  ) => {
    setIsTriggering(true);
    try {
      const res = await fetch('/api/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: name,
          amount,
          currency,
          remark: (remark && remark.trim().length > 0) ? remark.trim() : DEFAULT_REMARK,
          theme: customTheme || theme,
          animation: customAnim || animation,
        }),
      });
      const data = await res.json();
      if (data.donation) {
        setDonations(prev => [data.donation, ...prev]);
        setTestTriggerSuccess({
          donorName: data.donation.donorName,
          formattedAmount: data.donation.formattedAmount,
          ttsScript: data.donation.ttsScript,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      }
    } catch (err) {
      console.error('Trigger test alert error:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleTriggerCustomSimulator = async () => {
    const amt = parseFloat(customAmount) || 1.00;
    const finalRemark = (customRemark && customRemark.trim().length > 0) ? customRemark.trim() : DEFAULT_REMARK;
    await triggerTestAlert(customName || 'zaion', amt, finalRemark, customCurrency, theme, testAnimation);
  };

  const handleTestSimulatorVoiceOnly = () => {
    const amt = parseFloat(customAmount) || 1.00;
    const amountStr = customCurrency === 'KHR' ? `${amt.toLocaleString()} រៀល` : `${amt} ដុល្លារ`;
    const finalRemark = (customRemark && customRemark.trim().length > 0) ? customRemark.trim() : DEFAULT_REMARK;
    const phrase = `${thankPrefix} ${customName || 'zaion'} ${verb} ${amountStr} ${finalRemark}`;
    speakKhmerTts(phrase, { volume: 1.0 });
  };

  const testKhmerVoiceOnly = () => {
    const phrase = `${thankPrefix} zaion ${verb} 1 ដុល្លារ ${DEFAULT_REMARK}`;
    speakKhmerTts(phrase, { volume: 1.0 });
  };

  const handlePreviewPreset = (presetId: SoundPresetId) => {
    playPresetSound(presetId, soundVolume);
    setSoundStatusMsg({ text: `Playing: ${BUILTIN_SOUND_PRESETS.find(p => p.id === presetId)?.name}` });
    setTimeout(() => setSoundStatusMsg(null), 2500);
  };

  const handleTestCustomUrl = async () => {
    if (!customSoundUrl.trim()) {
      setSoundStatusMsg({ text: 'Please enter a sound URL first (MP3/WAV/OGG).', isError: true });
      return;
    }

    setSoundStatusMsg({ text: 'Testing custom audio stream...' });
    try {
      const audio = new Audio(customSoundUrl.trim());
      audio.volume = Math.max(0, Math.min(1, soundVolume));
      await audio.play();
      setSoundStatusMsg({ text: 'Audio loaded & playing successfully!' });
      setTimeout(() => setSoundStatusMsg(null), 3500);
    } catch (err) {
      console.error('Custom sound error:', err);
      setSoundStatusMsg({ 
        text: 'Failed to play custom URL. Make sure it is a direct audio file and allows CORS.', 
        isError: true 
      });
    }
  };

  const handleParseRawText = async (trigger: boolean = false) => {
    try {
      const res = await fetch('/api/parse-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawInput, triggerAlert: trigger }),
      });
      const data = await res.json();
      setParseResult(data.parsed);
      if (trigger && data.parsed) {
        setDonations(prev => [data.parsed, ...prev]);
      }
    } catch (err) {
      console.error('Parse error:', err);
    }
  };

  const getPresetIcon = (presetId: SoundPresetId) => {
    switch (presetId) {
      case 'chime': return <Bell className="w-4 h-4 text-emerald-400" />;
      case 'cash_register': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'coin': return <Coins className="w-4 h-4 text-emerald-400" />;
      case 'level_up': return <Trophy className="w-4 h-4 text-emerald-400" />;
      case 'ping': return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'marimba': return <Music className="w-4 h-4 text-emerald-400" />;
      default: return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Tv className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-tight text-white">
                  ABA PayWay OBS Alert
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE OVERLAY
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Telegram ABA Reader • Khmer TTS Voice • Themes & Refresh
              </p>
            </div>
          </div>

          {/* Quick Browser Source Link */}
          <div className="w-full md:w-auto flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline truncate max-w-[240px]">
              {overlayUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
              title="Copy OBS Browser Source URL"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy OBS URL'}</span>
            </button>
            <a
              href="/?view=overlay"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open Overlay in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Quick Action Test Bar */}
      <section className="bg-slate-900/50 border-b border-slate-800/80 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Quick Test Alerts:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTriggerCustomSimulator}
              disabled={isTriggering}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              title="Simulate custom donation alert to OBS and test TTS & visual animations"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>⚡ Test Trigger Alert</span>
            </button>

            <button
              onClick={() => triggerTestAlert('zaion', 1.00)}
              disabled={isTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Test $1.00 (zaion)</span>
            </button>

            <button
              onClick={() => triggerTestAlert('HUN CHHING CHHING', 0.50, 'នេះលុយ')}
              disabled={isTriggering}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 transition-colors"
            >
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Test $0.50 (HUN CHHING CHHING)</span>
            </button>

            <button
              onClick={handleTestSimulatorVoiceOnly}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              title="Test current custom voice sentence"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Test Voice</span>
            </button>

            <button
              onClick={() => setCustomTestModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Custom Popup...</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'preview'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Theme & Live Preview</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('telegram');
              fetchLogs();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'telegram'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Telegram Bot & Live Debugger</span>
            {listenerRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Setup Instructions</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'code'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Alert API & Webhooks</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Donations ({donations.length})</span>
          </button>
        </div>

        {/* TAB 1: Live Preview & Theme Selector */}
        {activeTab === 'preview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Preview Frame */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
                <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-xs font-mono text-slate-400">
                      OBS Canvas Preview ({theme.toUpperCase()} Theme)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Transparent Background
                  </span>
                </div>

                {/* Simulated OBS Canvas */}
                <div 
                  className="relative w-full aspect-video bg-black flex items-center justify-center p-6 border-b border-slate-800 select-none overflow-hidden"
                  style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(15, 23, 42, 0.4) 0%, #000 100%)',
                  }}
                >
                  <ObsOverlay
                    isStandalone={false}
                    glowColor={glowColor}
                    fontSize={fontSize}
                    showSampleIfIdle={true}
                    theme={theme}
                    animation={animation}
                    soundConfig={{
                      soundEnabled,
                      soundType,
                      soundPreset,
                      customSoundUrl,
                      soundVolume,
                    }}
                  />
                </div>

                <div className="p-4 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Overlay refreshes automatically every time TTS reading ends</span>
                  </div>
                  <button
                    onClick={() => triggerTestAlert('zaion', 1.00)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm"
                  >
                    Test Alert & Sound
                  </button>
                </div>
              </div>

              {/* Quick Sound Status Toast if active */}
              {soundStatusMsg && (
                <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                  soundStatusMsg.isError 
                    ? 'bg-red-500/10 border-red-500/30 text-red-300' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <AudioWaveform className="w-4 h-4 shrink-0" />
                  <span>{soundStatusMsg.text}</span>
                </div>
              )}

              {/* Interactive Test Trigger Simulator Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>Test Trigger Simulator</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Live Animation & TTS
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        Simulate custom donation alerts with custom text & amounts before going live
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Simulation Presets */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Simulation Presets:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName('zaion');
                        setCustomAmount('1.00');
                        setCustomCurrency('USD');
                        setCustomRemark('អរគុណច្រើនមេ');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
                    >
                      zaion ($1.00)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName('HUN CHHING CHHING');
                        setCustomAmount('0.50');
                        setCustomCurrency('USD');
                        setCustomRemark('នេះលុយ');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
                    >
                      HUN CHHING CHHING ($0.50)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName('Sokha');
                        setCustomAmount('10000');
                        setCustomCurrency('KHR');
                        setCustomRemark('ជូនពរហេងៗមេ!');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
                    >
                      Sokha (10,000 ៛)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName('VIP Fan');
                        setCustomAmount('25.00');
                        setCustomCurrency('USD');
                        setCustomRemark('Keep streaming! 🔥');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
                    >
                      VIP Fan ($25.00)
                    </button>
                  </div>
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Donor Name */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Donor Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. zaion, HUN CHHING CHHING"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Donation Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="1.00"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Currency */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Currency
                    </label>
                    <select
                      value={customCurrency}
                      onChange={(e) => setCustomCurrency(e.target.value as 'USD' | 'KHR')}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="KHR">KHR (៛)</option>
                    </select>
                  </div>
                </div>

                {/* Entrance Animation Selector for Test */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Entrance Animation Style:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['slide', 'bounce', 'fade', 'zoom'] as AlertAnimation[]).map((anim) => (
                      <button
                        key={anim}
                        type="button"
                        onClick={() => setTestAnimation(anim)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all text-center ${
                          testAnimation === anim
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Remark */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Custom Remark / Message
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Defaults to "អរគុណច្រើនមេ" if empty
                    </span>
                  </div>
                  <input
                    type="text"
                    value={customRemark}
                    onChange={(e) => setCustomRemark(e.target.value)}
                    placeholder="e.g. នេះលុយ or អរគុណច្រើនមេ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-khmer placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    {[
                      'អរគុណច្រើនមេ',
                      'នេះលុយ',
                      'ជូនពរហេងៗមេ!',
                      'Keep streaming! 🔥'
                    ].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setCustomRemark(chip)}
                        className="px-2 py-0.5 rounded text-[11px] font-khmer bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Speech Preview Card */}
                <div className="p-3 bg-slate-950/70 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Khmer Voice TTS Speech Preview:</span>
                  </div>
                  <p className="text-xs text-slate-200 font-khmer font-medium leading-relaxed">
                    «{thankPrefix} {customName || 'zaion'} {verb} {customCurrency === 'KHR' ? `${(parseFloat(customAmount) || 0).toLocaleString()} រៀល` : `${parseFloat(customAmount) || 0} ដុល្លារ`} {(customRemark && customRemark.trim().length > 0) ? customRemark.trim() : DEFAULT_REMARK}»
                  </p>
                </div>

                {/* Primary Action Buttons Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleTriggerCustomSimulator}
                    disabled={isTriggering}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4 fill-current" />
                    <span>{isTriggering ? 'Dispatching to OBS...' : '⚡ Test Trigger Alert (Visual + Sound + TTS)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestSimulatorVoiceOnly}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    title="Test Khmer voice synthesis only"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Test Voice</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => playPresetSound(soundPreset, soundVolume)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                    title="Test alert sound effect"
                  >
                    <Bell className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Test Sound</span>
                  </button>
                </div>

                {/* Live Confirmation Alert */}
                {testTriggerSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start justify-between gap-3 text-emerald-300">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Alert Dispatched at {testTriggerSuccess.time}!</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Sent to OBS Browser Source • Donor: <strong className="text-white">{testTriggerSuccess.donorName}</strong> ({testTriggerSuccess.formattedAmount})
                      </p>
                      <p className="text-[11px] text-emerald-400/90 font-khmer">
                        Speech: «{testTriggerSuccess.ttsScript}»
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTestTriggerSuccess(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Customization Controls & Theme Picker */}
            <div className="lg:col-span-5 space-y-4">
              {/* Theme Selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Overlay Theme Style</span>
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">
                    Active: {theme}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {/* Theme 1: Neon */}
                  <button
                    onClick={() => {
                      setTheme('neon');
                      handleSaveConfig({ theme: 'neon' });
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      theme === 'neon'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(0,214,143,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sparkle className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-bold text-emerald-400 font-mono">$ 1.00</span>
                    </div>
                    <div className="font-bold text-xs">Neon Glow</div>
                    <div className="text-[10px] text-slate-500">Image 3 style</div>
                  </button>

                  {/* Theme 2: Minimal */}
                  <button
                    onClick={() => {
                      setTheme('minimal');
                      handleSaveConfig({ theme: 'minimal' });
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      theme === 'minimal'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(0,214,143,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sliders className="w-4 h-4 text-teal-400" />
                      <span className="text-[10px] bg-slate-800 px-1 rounded font-mono text-white">$1.00</span>
                    </div>
                    <div className="font-bold text-xs">Minimal</div>
                    <div className="text-[10px] text-slate-500">Clean streamer pill</div>
                  </button>

                  {/* Theme 3: Glassmorphism */}
                  <button
                    onClick={() => {
                      setTheme('glassmorphism');
                      handleSaveConfig({ theme: 'glassmorphism' });
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      theme === 'glassmorphism'
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(0,214,143,0.2)]'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Tv className="w-4 h-4 text-blue-400" />
                      <span className="text-[10px] font-mono text-blue-300">Glass</span>
                    </div>
                    <div className="font-bold text-xs">Glassmorphism</div>
                    <div className="text-[10px] text-slate-500">Frosted blur & card</div>
                  </button>
                </div>

                {/* Animation Style Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Entrance Animation
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['slide', 'bounce', 'fade', 'zoom'] as AlertAnimation[]).map((anim) => (
                      <button
                        key={anim}
                        onClick={() => {
                          setAnimation(anim);
                          handleSaveConfig({ animation: anim });
                        }}
                        className={`py-1.5 px-2 rounded-lg border text-xs capitalize font-medium transition-all ${
                          animation === anim
                            ? 'bg-slate-800 border-white text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {anim}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alert Sound Configuration Box */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-bold text-white text-sm">Alert Sound Effect</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </span>
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setSoundEnabled(val);
                        handleSaveConfig({ soundEnabled: val });
                      }}
                      className="accent-emerald-500 w-4 h-4 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {soundEnabled && (
                  <div className="space-y-4">
                    {/* Sound Mode Switch */}
                    <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => {
                          setSoundType('preset');
                          handleSaveConfig({ soundType: 'preset' });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                          soundType === 'preset'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>Built-in Library</span>
                      </button>

                      <button
                        onClick={() => {
                          setSoundType('custom');
                          handleSaveConfig({ soundType: 'custom' });
                        }}
                        className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all ${
                          soundType === 'custom'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Custom Audio URL</span>
                      </button>
                    </div>

                    {soundType === 'preset' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {BUILTIN_SOUND_PRESETS.map((preset) => {
                            const isSelected = soundPreset === preset.id;
                            return (
                              <div
                                key={preset.id}
                                onClick={() => {
                                  setSoundPreset(preset.id);
                                  handleSaveConfig({ soundPreset: preset.id });
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getPresetIcon(preset.id)}
                                  <div className="truncate font-semibold">
                                    {preset.name}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewPreset(preset.id);
                                  }}
                                  className="shrink-0 p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 transition-colors ml-2"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="url"
                            value={customSoundUrl}
                            onChange={(e) => setCustomSoundUrl(e.target.value)}
                            onBlur={() => handleSaveConfig()}
                            placeholder="https://example.com/alerts/sound.mp3"
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={handleTestCustomUrl}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3" />
                            <span>Test</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sound Volume Slider */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Sound Volume</span>
                        <span className="font-mono text-emerald-400">{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                        onMouseUp={() => handleSaveConfig()}
                        className="w-full accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Styling & Words */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <h3 className="font-bold text-white text-sm flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Overlay Words & Behavior</span>
                </h3>

                {/* Glow Color Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Emerald', hex: '#00d68f' },
                      { name: 'Cyan', hex: '#00f0ff' },
                      { name: 'Golden', hex: '#f59e0b' },
                      { name: 'Purple', hex: '#a855f7' },
                    ].map(c => (
                      <button
                        key={c.hex}
                        onClick={() => {
                          setGlowColor(c.hex);
                          handleSaveConfig({ glowColor: c.hex });
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                          glowColor === c.hex
                            ? 'bg-slate-800 border-white text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-md"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-[10px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-refresh Overlay Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      Auto-Refresh Overlay After TTS Ends
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Refreshes the OBS browser source link as soon as voice reading finishes
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRefreshOnComplete}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setAutoRefreshOnComplete(val);
                      handleSaveConfig({ autoRefreshOnComplete: val });
                    }}
                    className="accent-emerald-500 w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                </div>

                <button
                  onClick={() => handleSaveConfig()}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Telegram Bot & Live Debugger */}
        {activeTab === 'telegram' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    <span>Telegram Bot Configuration & Fixes</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Troubleshoot why the bot didn't receive messages and monitor live Telegram updates.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    listenerRunning
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${listenerRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                    <span>{listenerRunning ? 'Polling Active' : 'Polling Idle'}</span>
                  </span>

                  <button
                    onClick={handleToggleListener}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      listenerRunning
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                    }`}
                  >
                    {listenerRunning ? 'Stop Polling' : 'Start Polling'}
                  </button>
                </div>
              </div>

              {/* Bot Privacy Notice & Why Bot Might Miss Messages */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Why Telegram bots don't receive group messages by default:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-200/90 leading-relaxed">
                  <li>
                    <strong>Bot Privacy Mode:</strong> In @BotFather, Telegram defaults privacy mode to ON. Run <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300">/setprivacy</code> &rarr; choose your bot &rarr; click <strong>Disable</strong>!
                  </li>
                  <li>
                    <strong>Group Administrator:</strong> Promote your bot to Admin in the ABA Telegram Group with "Read All Messages" enabled.
                  </li>
                  <li>
                    <strong>Bot-to-Bot Restriction:</strong> Telegram's Bot API servers officially do not forward messages sent by another bot (<code className="text-amber-300">@PayWayByABA_bot</code>) to bots in standard groups to avoid message loops. If standard groups block it, use a <strong>Telegram Channel</strong> (where bots see everything) or user client API!
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telegram Bot Token (from @BotFather)
                  </label>
                  <input
                    type="password"
                    placeholder="e.g. 7123456789:AAH..."
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Telegram Group ID
                  </label>
                  <input
                    type="text"
                    placeholder="-5214008501 or -1005214008501"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Normalized matching automatically handles both <code className="text-emerald-400">-5214008501</code> and supergroup <code className="text-emerald-400">-1005214008501</code>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClearWebhook}
                    disabled={clearingWebhook}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${clearingWebhook ? 'animate-spin' : ''}`} />
                    <span>Clear Webhook Conflict</span>
                  </button>
                  {webhookMsg && (
                    <span className="text-xs text-emerald-400 font-mono">{webhookMsg}</span>
                  )}
                </div>

                <button
                  onClick={() => handleSaveConfig()}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md"
                >
                  Save & Apply Token
                </button>
              </div>
            </div>

            {/* Live Message Activity Stream & Debug Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Live Telegram Message Stream & Inspector</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Every message Telegram's servers deliver to your bot will show up here in real time.
                  </p>
                </div>
                <button
                  onClick={fetchLogs}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Log</span>
                </button>
              </div>

              {telegramLogs.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs space-y-2">
                  <p>No messages received from Telegram yet.</p>
                  <p className="text-[11px] text-slate-600">
                    If you already sent messages in your group but nothing appears here, check that your bot has <strong>Privacy Mode Disabled</strong> in @BotFather and is an <strong>Admin</strong> in the group!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {telegramLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        log.isAbaDonation
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{new Date(log.timestamp).toLocaleTimeString()} • Chat: {log.chatTitle} ({log.chatId})</span>
                        <span className={`font-bold ${log.isAbaDonation ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-white truncate">
                        <span className="text-slate-500">Sender: {log.sender} &rarr; </span>
                        {log.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Setup Guide */}
        {activeTab === 'guide' && (
          <SetupGuide />
        )}

        {/* TAB 4: Alert API & Webhooks Code Reference */}
        {activeTab === 'code' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                <span>Stream Alert Overlay Architecture & Webhook API</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Modular AlertManager class, triggerAlert function, and webhook endpoints for OBS Studio, Streamlabs, and custom bots.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-emerald-400 font-bold">1. Direct Ingestion Webhook</div>
                <p className="text-slate-400 font-sans text-xs">
                  Any bot or script can send donation data directly to OBS:
                </p>
                <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-[11px] text-slate-200">
{`POST /api/test-alert
Content-Type: application/json

{
  "donorName": "zaion",
  "amount": 1.00,
  "currency": "USD",
  "remark": "អរគុណច្រើនមេ"
}`}
                </pre>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="text-emerald-400 font-bold">2. Pure JS / TypeScript Call</div>
                <p className="text-slate-400 font-sans text-xs">
                  Calling the reusable triggerAlert function:
                </p>
                <pre className="bg-slate-900 p-3 rounded-lg overflow-x-auto text-[11px] text-slate-200">
{`import { triggerAlert } from './utils/alertManager';

triggerAlert({
  username: 'zaion',
  amount: 1.00,
  currency: 'USD',
  message: 'អរគុណច្រើនមេ',
  theme: 'neon',
  animation: 'slide'
});`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Donation History */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                <span>Recent Donation Activity</span>
              </h3>
              <span className="text-xs text-slate-400">
                {donations.length} total captured
              </span>
            </div>

            {donations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No donations received yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {donations.map((d) => (
                  <div key={d.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{d.donorName}</span>
                        <span className="font-khmer text-slate-400">បានឧបត្ថម្ភ</span>
                        <span className="font-black text-emerald-400 font-mono text-sm">{d.formattedAmount}</span>
                      </div>
                      <p className="text-slate-300 text-xs font-khmer">
                        "{d.remark || DEFAULT_REMARK}"
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {d.dateStr || new Date(d.timestamp).toLocaleTimeString()} {d.trxId ? `• Trx: ${d.trxId}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => triggerTestAlert(d.donorName, d.amount, d.remark)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <Play className="w-3 h-3 text-emerald-400" />
                        <span>Replay on OBS</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Custom Test Modal */}
      {customTestModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Simulate Custom Donation Alert</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Donor Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Currency
                  </label>
                  <select
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value as 'USD' | 'KHR')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="KHR">KHR (៛)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Remark / Message (Defaults to អរគុណច្រើនមេ)
                </label>
                <textarea
                  rows={2}
                  value={customRemark}
                  onChange={(e) => setCustomRemark(e.target.value)}
                  placeholder="Defaults to អរគុណច្រើនមេ if left empty"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-khmer focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomTestModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerTestAlert(customName, parseFloat(customAmount) || 1, customRemark);
                  setCustomTestModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md"
              >
                Send Alert Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
