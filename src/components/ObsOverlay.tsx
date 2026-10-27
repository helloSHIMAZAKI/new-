import React, { useEffect, useState, useRef } from 'react';
import { ParsedDonation, DEFAULT_REMARK } from '../utils/abaParser';
import { playAlertSound, SoundConfig, SoundPresetId } from '../utils/soundHelper';
import { speakKhmerTts } from '../utils/ttsHelper';
import { AlertTheme, AlertAnimation } from '../utils/alertManager';

interface ExtendedDonation extends ParsedDonation {
  soundConfig?: Partial<SoundConfig>;
  theme?: AlertTheme;
  animation?: AlertAnimation;
}

interface ObsOverlayProps {
  isStandalone?: boolean;
  previewDonation?: ParsedDonation | null;
  glowColor?: string;
  fontSize?: number;
  showSampleIfIdle?: boolean;
  soundConfig?: Partial<SoundConfig>;
  theme?: AlertTheme;
  animation?: AlertAnimation;
}

export const ObsOverlay: React.FC<ObsOverlayProps> = ({
  isStandalone = true,
  previewDonation = null,
  glowColor = '#00d68f',
  fontSize = 1,
  showSampleIfIdle = false,
  soundConfig: propSoundConfig,
  theme: propTheme,
  animation: propAnimation,
}) => {
  const [currentAlert, setCurrentAlert] = useState<ExtendedDonation | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const [queue, setQueue] = useState<ExtendedDonation[]>([]);
  const [activeTheme, setActiveTheme] = useState<AlertTheme>('neon');
  const [activeAnimation, setActiveAnimation] = useState<AlertAnimation>('slide');
  const [activeGlowColor, setActiveGlowColor] = useState('#00d68f');
  const [activeSoundConfig, setActiveSoundConfig] = useState<SoundConfig>({
    soundEnabled: true,
    soundType: 'preset',
    soundPreset: 'chime',
    customSoundUrl: '',
    soundVolume: 0.8,
  });
  const [autoRefreshOnComplete, setAutoRefreshOnComplete] = useState(true);
  const isPlayingRef = useRef(false);

  // Sync prop theme / animation if provided (e.g. from Dashboard preview)
  useEffect(() => {
    if (propTheme) setActiveTheme(propTheme);
  }, [propTheme]);

  useEffect(() => {
    if (propAnimation) setActiveAnimation(propAnimation);
  }, [propAnimation]);

  useEffect(() => {
    if (glowColor) setActiveGlowColor(glowColor);
  }, [glowColor]);

  useEffect(() => {
    if (propSoundConfig) {
      setActiveSoundConfig(prev => ({ ...prev, ...propSoundConfig }));
    }
  }, [propSoundConfig]);

  // Check URL query parameters (e.g. ?theme=glassmorphism&refresh=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme') as AlertTheme | null;
    if (themeParam && ['neon', 'minimal', 'glassmorphism'].includes(themeParam)) {
      setActiveTheme(themeParam);
    }
    const animParam = params.get('anim') as AlertAnimation | null;
    if (animParam && ['slide', 'fade', 'bounce', 'zoom'].includes(animParam)) {
      setActiveAnimation(animParam);
    }
    if (params.get('refresh') === '0' || params.get('autoRefresh') === '0') {
      setAutoRefreshOnComplete(false);
    } else if (params.get('refresh') === '1' || params.get('autoRefresh') === '1') {
      setAutoRefreshOnComplete(true);
    }
  }, []);

  // Fetch initial server config
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          if (!propTheme && data.config.theme) setActiveTheme(data.config.theme);
          if (!propAnimation && data.config.animation) setActiveAnimation(data.config.animation);
          if (data.config.glowColor) setActiveGlowColor(data.config.glowColor);
          setAutoRefreshOnComplete(data.config.autoRefreshOnComplete !== false);
          setActiveSoundConfig({
            soundEnabled: data.config.soundEnabled !== false,
            soundType: data.config.soundType || 'preset',
            soundPreset: (data.config.soundPreset as SoundPresetId) || 'chime',
            customSoundUrl: data.config.customSoundUrl || '',
            soundVolume: typeof data.config.soundVolume === 'number' ? data.config.soundVolume : 0.8,
          });
        }
      })
      .catch(err => console.warn('Overlay config load error:', err));
  }, [propTheme, propAnimation]);

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource('/api/alerts/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'connected') {
          console.log('[OBS Overlay] Connected to alert stream:', data.clientId);
          if (data.config) {
            if (data.config.theme) setActiveTheme(data.config.theme);
            if (data.config.animation) setActiveAnimation(data.config.animation);
            if (data.config.glowColor) setActiveGlowColor(data.config.glowColor);
            if (data.config.soundConfig) setActiveSoundConfig(prev => ({ ...prev, ...data.config.soundConfig }));
          }
          return;
        }
        if (data.id && data.donorName) {
          if (data.theme) setActiveTheme(data.theme);
          if (data.animation) setActiveAnimation(data.animation);
          if (data.soundConfig) setActiveSoundConfig(prev => ({ ...prev, ...data.soundConfig }));
          setQueue(prev => [...prev, data as ExtendedDonation]);
        }
      } catch (e) {
        console.error('[OBS Overlay] Parse error:', e);
      }
    };

    eventSource.onerror = () => {
      console.warn('[OBS Overlay] Stream error, retrying...');
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // If external preview donation passed (from dashboard)
  useEffect(() => {
    if (previewDonation) {
      setQueue((prev) => [...prev, previewDonation]);
    }
  }, [previewDonation]);

  // Process alert queue & lifecycle
  useEffect(() => {
    if (isPlayingRef.current || queue.length === 0) return;

    isPlayingRef.current = true;
    let isCancelled = false;

    const [nextAlert, ...remaining] = queue;
    setQueue(remaining);
    setCurrentAlert(nextAlert);
    setIsExiting(false);

    async function handleAlertLifecycle() {
      try {
        // 1. Play configured alert sound (from URL or built-in library preset)
        const alertSound = nextAlert.soundConfig || activeSoundConfig;
        playAlertSound(alertSound).catch(e => console.warn('Sound play error:', e));

        // 2. Wait 300ms so sound effect introduces the alert
        await new Promise(r => setTimeout(r, 300));
        if (isCancelled) return;

        // 3. Play Khmer TTS and wait until reading finishes!
        if (nextAlert.ttsScript) {
          try {
            await speakKhmerTts(nextAlert.ttsScript, {
              volume: 1.0,
              rate: 0.95,
            });
          } catch (e) {
            console.warn('TTS playback issue:', e);
            await new Promise(r => setTimeout(r, 4000));
          }
        } else {
          await new Promise(r => setTimeout(r, 4000));
        }
        if (isCancelled) return;

        // 4. Brief 400ms transition after TTS ends
        await new Promise(r => setTimeout(r, 400));
        if (isCancelled) return;

        // 5. Exit animation
        setIsExiting(true);
        await new Promise(r => setTimeout(r, 400));
        if (isCancelled) return;

        setCurrentAlert(null);
        setIsExiting(false);
        isPlayingRef.current = false;

        // 6. Refresh the web overlay every time TTS ends!
        if (isStandalone && autoRefreshOnComplete) {
          console.log('[OBS Overlay] TTS ended. Refreshing web overlay page now...');
          window.location.reload();
        }
      } catch (err) {
        console.warn('Alert lifecycle error:', err);
        setCurrentAlert(null);
        setIsExiting(false);
        isPlayingRef.current = false;
      }
    }

    handleAlertLifecycle();

    return () => {
      isCancelled = true;
    };
  }, [queue, activeSoundConfig, isStandalone, autoRefreshOnComplete]);

  const activeAlert = currentAlert || (showSampleIfIdle ? {
    id: 'sample_idle',
    donorName: 'zaion',
    amount: 1.00,
    formattedAmount: '$ 1.00',
    currency: 'USD' as const,
    remark: DEFAULT_REMARK,
    rawText: '',
    timestamp: Date.now(),
    ttsScript: `អរគុណ មេ zaion បានឧបត្ថម្ភ 1 ដុល្លារ ${DEFAULT_REMARK}`,
  } : null);

  const containerClasses = isStandalone
    ? 'fixed inset-0 w-screen h-screen flex items-center justify-center pointer-events-none select-none bg-transparent overflow-hidden'
    : 'w-full h-full flex items-center justify-center select-none overflow-hidden';

  // Animation class mappings
  const getAnimationClass = () => {
    if (isExiting) return 'animate-alert-exit';
    switch (activeAnimation) {
      case 'bounce': return 'animate-[bounce_0.6s_ease-out]';
      case 'fade': return 'animate-[fadeIn_0.5s_ease-out]';
      case 'zoom': return 'animate-[zoomIn_0.5s_cubic-bezier(0.16,1,0.3,1)]';
      case 'slide':
      default:
        return 'animate-alert-enter';
    }
  };

  if (!activeAlert) return <div className={containerClasses} />;

  return (
    <div className={containerClasses}>
      {/* THEME 1: NEON (Exact Image 3 match with radiant emerald glow) */}
      {activeTheme === 'neon' && (
        <div
          className={`flex flex-col items-center justify-center text-center px-8 py-6 max-w-4xl transition-all duration-400 ${getAnimationClass()}`}
          style={{ transform: `scale(${fontSize})` }}
        >
          {/* Top Line: [DonorName] [បានឧបត្ថម្ភ] [$ Amount] */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-bold text-5xl md:text-6xl tracking-normal text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
            <span className="text-white font-extrabold tracking-wide">
              {activeAlert.donorName}
            </span>
            <span className="text-white font-bold font-khmer">
              បានឧបត្ថម្ភ
            </span>
            <span
              className="font-black tracking-tight"
              style={{
                color: activeGlowColor,
                textShadow: `0 0 18px ${activeGlowColor}, 0 0 38px ${activeGlowColor}80, 0 0 70px ${activeGlowColor}40`,
              }}
            >
              {activeAlert.formattedAmount.startsWith('$') && !activeAlert.formattedAmount.startsWith('$ ')
                ? `$ ${activeAlert.formattedAmount.slice(1)}`
                : activeAlert.formattedAmount}
            </span>
          </div>

          {/* Bottom Line: [Remark] */}
          {activeAlert.remark && (
            <div className="mt-4 text-slate-100 font-semibold text-2xl md:text-3xl max-w-3xl leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] break-words font-khmer">
              {activeAlert.remark}
            </div>
          )}
        </div>
      )}

      {/* THEME 2: MINIMAL (Modern streamer sleek floating pill) */}
      {activeTheme === 'minimal' && (
        <div
          className={`bg-slate-950/90 border border-slate-700/80 rounded-3xl px-8 py-5 shadow-2xl flex flex-col items-center justify-center text-center max-w-3xl transition-all duration-400 ${getAnimationClass()}`}
          style={{ transform: `scale(${fontSize})` }}
        >
          <div className="flex items-center gap-3 text-3xl md:text-4xl font-extrabold tracking-tight">
            <span className="text-white">{activeAlert.donorName}</span>
            <span className="text-slate-400 font-normal font-khmer text-2xl md:text-3xl">
              បានឧបត្ថម្ភ
            </span>
            <span 
              className="px-3 py-1 rounded-xl font-black text-slate-950 text-2xl md:text-3xl"
              style={{ backgroundColor: activeGlowColor }}
            >
              {activeAlert.formattedAmount}
            </span>
          </div>

          {activeAlert.remark && (
            <div className="mt-2.5 text-slate-300 font-medium text-lg md:text-xl font-khmer">
              {activeAlert.remark}
            </div>
          )}
        </div>
      )}

      {/* THEME 3: GLASSMORPHISM (Frosted glass blur & luxury glow) */}
      {activeTheme === 'glassmorphism' && (
        <div
          className={`backdrop-blur-2xl bg-slate-900/60 border border-white/20 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center text-center max-w-3xl transition-all duration-400 relative overflow-hidden ${getAnimationClass()}`}
          style={{ transform: `scale(${fontSize})` }}
        >
          {/* Subtle gradient shimmer overlay */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-4xl md:text-5xl font-black text-white">
            <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {activeAlert.donorName}
            </span>
            <span className="text-slate-300 font-semibold font-khmer text-3xl md:text-4xl">
              បានឧបត្ថម្ភ
            </span>
            <span
              className="font-black drop-shadow-[0_0_20px_rgba(0,214,143,0.6)]"
              style={{ color: activeGlowColor }}
            >
              {activeAlert.formattedAmount}
            </span>
          </div>

          {activeAlert.remark && (
            <div className="relative z-10 mt-3 text-slate-200 font-medium text-xl md:text-2xl font-khmer max-w-2xl">
              {activeAlert.remark}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
