/**
 * Alert Sound Library & Synthesizer for OBS Overlay
 * Supports a rich built-in sound library (Web Audio API presets) and custom audio URLs.
 */

export type SoundPresetId = 'chime' | 'cash_register' | 'coin' | 'level_up' | 'ping' | 'marimba';

export interface SoundPresetInfo {
  id: SoundPresetId;
  name: string;
  description: string;
  iconName: string;
}

export const BUILTIN_SOUND_PRESETS: SoundPresetInfo[] = [
  {
    id: 'chime',
    name: 'Classic Chime',
    description: 'Modern 4-note melodic bell chime (clean & smooth)',
    iconName: 'Bell',
  },
  {
    id: 'cash_register',
    name: 'Cash Register (Cha-Ching)',
    description: 'Metallic drawer slide with bright coin bell ring',
    iconName: 'DollarSign',
  },
  {
    id: 'coin',
    name: 'Arcade Coin',
    description: 'Retro game 8-bit double beep coin pickup',
    iconName: 'Coins',
  },
  {
    id: 'level_up',
    name: 'Streamer Level-Up',
    description: 'Triumphant ascending victory fanfare',
    iconName: 'Trophy',
  },
  {
    id: 'ping',
    name: 'Crystal Glass Ping',
    description: 'Crisp, minimalist high-frequency glass notification',
    iconName: 'Sparkles',
  },
  {
    id: 'marimba',
    name: 'Warm Marimba',
    description: 'Rich organic wooden percussion resonance',
    iconName: 'Music',
  },
];

export interface SoundConfig {
  soundEnabled: boolean;
  soundType: 'preset' | 'custom';
  soundPreset: SoundPresetId;
  customSoundUrl?: string;
  soundVolume: number; // 0 to 1
}

/**
 * Pure logic helper to determine which sound source to play with validation
 */
export function resolveSoundSource(config: Partial<SoundConfig>): {
  type: 'preset' | 'custom';
  preset: SoundPresetId;
  url?: string;
  volume: number;
} {
  const volume = typeof config.soundVolume === 'number' 
    ? Math.max(0, Math.min(1, config.soundVolume)) 
    : 0.8;

  const preset: SoundPresetId = config.soundPreset && BUILTIN_SOUND_PRESETS.some(p => p.id === config.soundPreset)
    ? config.soundPreset
    : 'chime';

  const customUrl = config.customSoundUrl?.trim();
  const isValidUrl = customUrl && (customUrl.startsWith('http://') || customUrl.startsWith('https://') || customUrl.startsWith('/'));

  if (config.soundType === 'custom' && isValidUrl) {
    return {
      type: 'custom',
      preset,
      url: customUrl,
      volume,
    };
  }

  return {
    type: 'preset',
    preset,
    volume,
  };
}

/**
 * Synthesizes built-in sound presets using the Web Audio API
 */
export function playPresetSound(preset: SoundPresetId = 'chime', volume: number = 0.8) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)) * 0.45, now);
    masterGain.connect(ctx.destination);

    if (preset === 'chime') {
      // 4-note bell chime (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);

        const start = now + i * 0.09;
        const dur = 0.65;
        noteGain.gain.setValueAtTime(0.001, start);
        noteGain.gain.linearRampToValueAtTime(0.35, start + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(start);
        osc.stop(start + dur + 0.05);
      });
    } else if (preset === 'coin') {
      // 8-bit coin sound: B5 (987Hz) then fast jump to E6 (1318Hz)
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);

      noteGain.gain.setValueAtTime(0.25, now);
      noteGain.gain.setValueAtTime(0.3, now + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (preset === 'cash_register') {
      // Metal ratchet click + high bell ring
      // Noise burst for mechanical drawer
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1200, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);

      // Cha-Ching ring (2093Hz C7 + 2637Hz E7 harmonics)
      [2093, 2637, 3135].forEach((freq) => {
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(freq, now + 0.06);

        bellGain.gain.setValueAtTime(0.001, now + 0.06);
        bellGain.gain.linearRampToValueAtTime(0.28, now + 0.08);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

        bell.connect(bellGain);
        bellGain.connect(masterGain);
        bell.start(now + 0.06);
        bell.stop(now + 0.9);
      });
    } else if (preset === 'level_up') {
      // Ascending hero fanfare: C5 (523), G5 (784), C6 (1046), E6 (1318), G6 (1568)
      const fanfare = [523.25, 783.99, 1046.50, 1318.51, 1567.98];
      fanfare.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === fanfare.length - 1 ? 'triangle' : 'sine';
        const st = now + idx * 0.08;
        const dur = idx === fanfare.length - 1 ? 0.7 : 0.25;

        osc.frequency.setValueAtTime(freq, st);
        g.gain.setValueAtTime(0.001, st);
        g.gain.linearRampToValueAtTime(0.3, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + dur);

        osc.connect(g);
        g.connect(masterGain);
        osc.start(st);
        osc.stop(st + dur + 0.05);
      });
    } else if (preset === 'ping') {
      // High clean crystal ping
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const pingGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, now); // A6
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(3520, now); // A7

      pingGain.gain.setValueAtTime(0.001, now);
      pingGain.gain.linearRampToValueAtTime(0.4, now + 0.01);
      pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(pingGain);
      osc2.connect(pingGain);
      pingGain.connect(masterGain);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } else if (preset === 'marimba') {
      // Rich wooden strike
      const notes = [440, 659.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = 'triangle';
        const st = now + i * 0.07;
        osc.frequency.setValueAtTime(freq, st);

        noteGain.gain.setValueAtTime(0.001, st);
        noteGain.gain.linearRampToValueAtTime(0.35, st + 0.008);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, st + 0.5);

        osc.connect(noteGain);
        noteGain.connect(masterGain);
        osc.start(st);
        osc.stop(st + 0.55);
      });
    }

    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 2000);
  } catch (err) {
    console.warn('Preset sound error:', err);
  }
}

/**
 * Plays the configured alert sound (either from a custom URL or built-in preset)
 */
export async function playAlertSound(config: Partial<SoundConfig>): Promise<void> {
  if (config.soundEnabled === false) return;

  const resolved = resolveSoundSource(config);

  if (resolved.type === 'custom' && resolved.url) {
    try {
      const audio = new Audio(resolved.url);
      audio.volume = resolved.volume;
      await audio.play();
      return;
    } catch (e) {
      console.warn('Custom alert sound URL failed, falling back to preset sound:', e);
      // Fallback to preset
      playPresetSound(resolved.preset, resolved.volume);
    }
  } else {
    playPresetSound(resolved.preset, resolved.volume);
  }
}
