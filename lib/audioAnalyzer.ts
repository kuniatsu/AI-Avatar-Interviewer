/**
 * Audio Manager - Web Audio API の音声入力・出力・解析
 * リアルタイム音量レベル解析でリップシンクに対応
 * FFT による周波数解析で音韻ベースのリップシンク対応
 */

export interface AudioAnalyzerState {
  isListening: boolean;
  isSpeaking: boolean;
  volume: number; // 0-1 (正規化)
  frequency: number[];
}

export interface FrequencyBands {
  O: number; // 低周波 0-500 Hz (お行)
  A: number; // 中低周波 500-1500 Hz (あ行)
  E: number; // 中周波 1500-3000 Hz (え行)
  I: number; // 中高周波 3000-5000 Hz (い行)
  U: number; // 高周波 5000-8000 Hz (う行)
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array | null = null;
  private onVolumeChange: ((volume: number) => void) | null = null;
  private onFrequencyChange: ((bands: FrequencyBands) => void) | null = null;
  private isListening: boolean = false;
  private sampleRate: number = 44100; // デフォルトサンプルレート

  async initialize(): Promise<void> {
    if (this.audioContext) return;

    // AudioContext の初期化
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();

    // Analyser ノードの作成
    if (this.audioContext) {
      this.sampleRate = this.audioContext.sampleRate;
      this.analyser = this.audioContext.createAnalyser();
      if (this.analyser) {
        // 2048 を使用して周波数解析精度を向上（最大 ~10Hz の周波数解析精度）
        this.analyser.fftSize = 2048;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    }
  }

  async startListening(
    onVolumeChange?: (volume: number) => void,
    onFrequencyChange?: (bands: FrequencyBands) => void
  ): Promise<void> {
    await this.initialize();

    if (!this.audioContext || !this.analyser) {
      throw new Error('AudioContext not initialized');
    }

    try {
      // マイク入力の取得
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      if (!this.microphone && this.audioContext) {
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.microphone.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
      }

      this.isListening = true;
      this.onVolumeChange = onVolumeChange || null;
      this.onFrequencyChange = onFrequencyChange || null;
      this.analyzeAudio();
    } catch (error) {
      console.error('Failed to access microphone:', error);
      throw error;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
  }

  /**
   * 周波数帯のインデックス範囲を計算
   */
  private getFrequencyBinRange(
    minFreq: number,
    maxFreq: number
  ): { start: number; end: number } {
    if (!this.analyser) {
      return { start: 0, end: 0 };
    }
    const nyquist = this.sampleRate / 2;
    const start = Math.floor((minFreq / nyquist) * this.analyser.frequencyBinCount);
    const end = Math.floor((maxFreq / nyquist) * this.analyser.frequencyBinCount);
    return { start, end };
  }

  /**
   * 周波数帯域の平均エネルギーを計算
   */
  private getFrequencyBandEnergy(
    minFreq: number,
    maxFreq: number
  ): number {
    if (!this.analyser || !this.dataArray) {
      return 0;
    }

    const { start, end } = this.getFrequencyBinRange(minFreq, maxFreq);
    let sum = 0;
    let count = 0;

    for (let i = start; i < end && i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
      count++;
    }

    return count > 0 ? sum / count / 255 : 0;
  }

  /**
   * 周波数帯ごとのエネルギーを計算（音韻ベース）
   */
  private extractFrequencyBands(): FrequencyBands {
    return {
      O: this.getFrequencyBandEnergy(0, 500),
      A: this.getFrequencyBandEnergy(500, 1500),
      E: this.getFrequencyBandEnergy(1500, 3000),
      I: this.getFrequencyBandEnergy(3000, 5000),
      U: this.getFrequencyBandEnergy(5000, 8000),
    };
  }

  /**
   * 音声データを解析（音量と周波数）
   */
  private analyzeAudio(): void {
    if (!this.isListening || !this.analyser || !this.dataArray) return;

    // 周波数データを取得
    this.analyser.getByteFrequencyData(this.dataArray as any);

    // 平均音量を計算（0-255 → 0-1に正規化）
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length / 255;

    // 音量変化をコールバック
    if (this.onVolumeChange) {
      this.onVolumeChange(average);
    }

    // 周波数帯域を抽出してコールバック
    if (this.onFrequencyChange) {
      const bands = this.extractFrequencyBands();
      this.onFrequencyChange(bands);
    }

    // 次のフレームをスケジュール
    this.animationFrameId = requestAnimationFrame(() => this.analyzeAudio());
  }

  async playAudio(audioUrl: string): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) {
      throw new Error('AudioContext not initialized');
    }

    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start(0);
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  async synthesizeAndPlay(text: string): Promise<void> {
    // Web Speech API を使用して音声合成・再生
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech Synthesis API is not supported');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  dispose(): void {
    this.stopListening();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// シングルトンインスタンス
let audioAnalyzerInstance: AudioAnalyzer | null = null;

export function getAudioAnalyzer(): AudioAnalyzer {
  if (!audioAnalyzerInstance) {
    audioAnalyzerInstance = new AudioAnalyzer();
  }
  return audioAnalyzerInstance;
}
