/**
 * Khmer TTS Audio Player with server proxy and browser Web Speech fallback.
 */

let currentAudio: HTMLAudioElement | null = null;

export async function speakKhmerTts(
  text: string,
  options: {
    volume?: number;
    rate?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  } = {}
): Promise<void> {
  const { volume = 1.0, onStart, onEnd, onError } = options;

  if (!text || text.trim().length === 0) {
    onEnd?.();
    return;
  }

  // Stop any currently playing TTS
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    } catch {
      // ignore
    }
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  try {
    // 1. Primary: Use the server-side Khmer TTS proxy (native Google Khmer voice)
    const ttsUrl = `/api/tts?text=${encodeURIComponent(text)}&lang=km`;
    const audio = new Audio(ttsUrl);
    currentAudio = audio;
    audio.volume = Math.max(0, Math.min(1, volume));

    const playPromise = new Promise<void>((resolve, reject) => {
      audio.onplay = () => {
        onStart?.();
      };
      audio.onended = () => {
        currentAudio = null;
        onEnd?.();
        resolve();
      };
      audio.onerror = (e) => {
        currentAudio = null;
        reject(e);
      };
    });

    await audio.play();
    await playPromise;
  } catch (serverErr) {
    console.warn('Server Khmer TTS failed, falling back to Web Speech API:', serverErr);

    // 2. Fallback: Browser Web Speech API
    if ('speechSynthesis' in window) {
      try {
        await new Promise<void>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = 'km-KH';
          utterance.volume = volume;
          utterance.rate = options.rate || 0.95;

          // Try to pick a Khmer or Southeast Asian voice if available
          const voices = window.speechSynthesis.getVoices();
          const khmerVoice = voices.find(v => v.lang.includes('km') || v.lang.includes('KH'));
          if (khmerVoice) {
            utterance.voice = khmerVoice;
          }

          utterance.onstart = () => onStart?.();
          utterance.onend = () => {
            onEnd?.();
            resolve();
          };
          utterance.onerror = (e) => {
            onError?.(e);
            onEnd?.();
            resolve();
          };

          window.speechSynthesis.speak(utterance);
        });
      } catch (synthErr) {
        onError?.(synthErr);
        onEnd?.();
      }
    } else {
      onError?.(serverErr);
      onEnd?.();
    }
  }
}

export function stopTts() {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    } catch {
      // ignore
    }
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
