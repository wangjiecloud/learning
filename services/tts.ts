/**
 * TTS 语音服务
 * Android: expo-speech 不支持 pause/resume，改用句子分段+索引恢复方案
 * Web/iOS: 支持 pause/resume
 */
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

const isAndroid = Platform.OS === 'android';

// 将文本按句子分割（中英文均支持）
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[。！？\n.!?])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export class TtsService {
  private sentences: string[] = [];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private rate: number = 1.0;
  private language: string = 'zh-CN';
  private onProgressCallback?: (index: number, total: number, text: string) => void;
  private onStateChangeCallback?: (state: 'idle' | 'speaking' | 'paused') => void;

  setLanguage(lang: string) {
    this.language = lang;
  }

  setRate(rate: number) {
    this.rate = Math.max(0.1, Math.min(2.0, rate));
  }

  onProgress(cb: (index: number, total: number, text: string) => void) {
    this.onProgressCallback = cb;
  }

  onStateChange(cb: (state: 'idle' | 'speaking' | 'paused') => void) {
    this.onStateChangeCallback = cb;
  }

  async speak(text: string, startFrom: number = 0) {
    await Speech.stop();
    this.sentences = splitIntoSentences(text);
    this.currentIndex = startFrom;
    this.isPlaying = true;
    this.isPaused = false;
    this.onStateChangeCallback?.('speaking');
    this._speakNext();
  }

  private _speakNext() {
    if (!this.isPlaying || this.isPaused) return;
    if (this.currentIndex >= this.sentences.length) {
      this._onFinish();
      return;
    }

    const sentence = this.sentences[this.currentIndex];
    this.onProgressCallback?.(this.currentIndex, this.sentences.length, sentence);

    Speech.speak(sentence, {
      language: this.language,
      rate: this.rate,
      onDone: () => {
        if (this.isPlaying && !this.isPaused) {
          this.currentIndex++;
          this._speakNext();
        }
      },
      onError: () => {
        this.currentIndex++;
        this._speakNext();
      },
    });
  }

  async pause() {
    if (!this.isPlaying || this.isPaused) return;

    if (isAndroid) {
      // Android 不支持 pause，stop 后记录当前索引
      await Speech.stop();
      this.isPaused = true;
      this.onStateChangeCallback?.('paused');
    } else {
      // Web / iOS 原生支持 pause
      await Speech.pause();
      this.isPaused = true;
      this.onStateChangeCallback?.('paused');
    }
  }

  async resume() {
    if (!this.isPlaying || !this.isPaused) return;

    this.isPaused = false;
    this.onStateChangeCallback?.('speaking');

    if (isAndroid) {
      // Android: 从记录的索引重新 speak
      this._speakNext();
    } else {
      await Speech.resume();
    }
  }

  async stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    await Speech.stop();
    this.onStateChangeCallback?.('idle');
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalSentences(): number {
    return this.sentences.length;
  }

  private _onFinish() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentIndex = 0;
    this.onStateChangeCallback?.('idle');
  }

  async getAvailableVoices() {
    return Speech.getAvailableVoicesAsync();
  }
}

export const ttsService = new TtsService();
