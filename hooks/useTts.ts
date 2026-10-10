import { useState, useCallback, useEffect } from 'react';
import { ttsService } from '../services/tts';
import type { TtsState } from '../types';

export function useTts() {
  const [state, setState] = useState<TtsState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSentences, setTotalSentences] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [rate, setRateState] = useState(1.0);

  useEffect(() => {
    ttsService.onStateChange((s) => setState(s));
    ttsService.onProgress((idx, total, text) => {
      setCurrentIndex(idx);
      setTotalSentences(total);
      setCurrentText(text);
    });
    return () => {
      ttsService.stop();
    };
  }, []);

  const play = useCallback(async (text: string) => {
    setCurrentIndex(0);
    await ttsService.speak(text);
  }, []);

  const pause = useCallback(async () => {
    await ttsService.pause();
  }, []);

  const resume = useCallback(async () => {
    await ttsService.resume();
  }, []);

  const stop = useCallback(async () => {
    await ttsService.stop();
    setCurrentIndex(0);
    setCurrentText('');
  }, []);

  const setRate = useCallback((r: number) => {
    setRateState(r);
    ttsService.setRate(r);
  }, []);

  const setLanguage = useCallback((lang: string) => {
    ttsService.setLanguage(lang);
  }, []);

  return {
    state,
    currentIndex,
    totalSentences,
    currentText,
    rate,
    play,
    pause,
    resume,
    stop,
    setRate,
    setLanguage,
  };
}
